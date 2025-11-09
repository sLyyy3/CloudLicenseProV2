// lib/universalLicenseValidator.ts
// UNIVERSAL LICENSE VALIDATOR - Works with all key formats and sources

import { supabase } from './supabase';

export interface ValidationResult {
  valid: boolean;
  status?: string;
  type?: string;
  source?: 'licenses' | 'customer_keys';
  expires_at?: string;
  error?: string;
  product?: { id: string; name: string };
  customer?: { name: string; email: string };
  activations?: { current: number; max: number | null };
  details?: any;
}

/**
 * Normalizes a license key for searching
 * - Removes whitespace
 * - Converts to uppercase
 * - Returns both original and normalized versions
 */
function normalizeKey(key: string): { original: string; normalized: string; withoutDashes: string } {
  const trimmed = key.trim().toUpperCase();
  const withoutDashes = trimmed.replace(/-/g, '');

  return {
    original: trimmed,
    normalized: trimmed,
    withoutDashes: withoutDashes
  };
}

/**
 * Validates a license key across all sources
 * Works with:
 * - licenses table (Developer licenses)
 * - customer_keys table (Reseller licenses)
 * - All key formats (professional, legacy, etc.)
 */
export async function validateLicenseUniversal(
  license_key: string,
  options?: {
    product_id?: string;
    machine_id?: string;
    app_version?: string;
  }
): Promise<ValidationResult> {
  try {
    if (!license_key || license_key.trim().length < 8) {
      return {
        valid: false,
        error: 'Ungültiger License Key Format'
      };
    }

    // Normalize key for searching
    const keyVariants = normalizeKey(license_key);
    console.log('🔍 Validating license key:', keyVariants.normalized.substring(0, 15) + '...');
    console.log('🔍 Key variants:', keyVariants);

    // ===== STRATEGIE 1: Suche in "licenses" Tabelle =====
    let licenseData = null;
    let source: 'licenses' | 'customer_keys' = 'licenses';

    // Helper function to search with key variants
    async function searchLicensesTable(productId?: string) {
      // Simplified select query without nested activations
      const selectQuery = `
        id,
        license_key,
        status,
        type,
        expires_at,
        max_activations,
        current_activations,
        organization_id,
        product_id,
        customer_id,
        product_name,
        customer_name,
        customer_email
      `;

      // Try with original key
      let query = supabase.from('licenses').select(selectQuery);
      if (productId) query = query.eq('product_id', productId);

      const { data: data1, error: error1 } = await query.eq('license_key', keyVariants.normalized).maybeSingle();
      if (data1) {
        console.log('✅ Found with normalized key');
        return data1;
      }
      if (error1) console.log('Search 1 error:', error1.message);

      // Try without dashes
      query = supabase.from('licenses').select(selectQuery);
      if (productId) query = query.eq('product_id', productId);
      const { data: data2, error: error2 } = await query.eq('license_key', keyVariants.withoutDashes).maybeSingle();
      if (data2) {
        console.log('✅ Found without dashes');
        return data2;
      }
      if (error2) console.log('Search 2 error:', error2.message);

      // Try case-insensitive search (ilike)
      query = supabase.from('licenses').select(selectQuery);
      if (productId) query = query.eq('product_id', productId);
      const { data: data3, error: error3 } = await query.ilike('license_key', keyVariants.normalized).maybeSingle();
      if (data3) {
        console.log('✅ Found with ilike search');
        return data3;
      }
      if (error3) console.log('Search 3 error:', error3.message);

      return null;
    }

    // Mit product_id falls vorhanden
    if (options?.product_id) {
      const data = await searchLicensesTable(options.product_id);
      if (data) {
        licenseData = data;
        console.log('✅ Found in licenses table (with product_id)');
      }
    }

    // Ohne product_id
    if (!licenseData) {
      const data = await searchLicensesTable();
      if (data) {
        licenseData = data;
        console.log('✅ Found in licenses table (without product_id)');
      }
    }

    // ===== STRATEGIE 2: Suche in "customer_keys" Tabelle =====
    if (!licenseData) {
      // Simplified select query - just basic fields
      const selectQuery = `
        id,
        key_code,
        status,
        created_at,
        expires_at,
        customer_email
      `;

      // Try with original key
      let { data, error: err1 } = await supabase
        .from('customer_keys')
        .select(selectQuery)
        .eq('key_code', keyVariants.normalized)
        .maybeSingle();

      if (err1) console.log('Customer keys search 1 error:', err1.message);

      // Try without dashes
      if (!data) {
        const result = await supabase
          .from('customer_keys')
          .select(selectQuery)
          .eq('key_code', keyVariants.withoutDashes)
          .maybeSingle();
        data = result.data;
        if (result.error) console.log('Customer keys search 2 error:', result.error.message);
      }

      // Try case-insensitive
      if (!data) {
        const result = await supabase
          .from('customer_keys')
          .select(selectQuery)
          .ilike('key_code', keyVariants.normalized)
          .maybeSingle();
        data = result.data;
        if (result.error) console.log('Customer keys search 3 error:', result.error.message);
      }

      if (data) {
        // Konvertiere customer_keys Format
        licenseData = {
          id: data.id,
          license_key: data.key_code,
          status: data.status,
          type: 'single',
          expires_at: data.expires_at,
          max_activations: 1,
          current_activations: 0,
          product_name: 'Reseller Product',
          customer_name: data.customer_email?.split('@')[0] || 'Customer',
          customer_email: data.customer_email || '',
          activations: [],
        };
        source = 'customer_keys';
        console.log('✅ Found in customer_keys table');
      }
    }

    // Nicht gefunden
    if (!licenseData) {
      console.log('❌ License key not found');
      return {
        valid: false,
        error: 'Lizenz nicht gefunden. Bitte überprüfe den Key.'
      };
    }

    // ===== VALIDIERUNG =====

    // Status Check
    if (licenseData.status !== 'active') {
      return {
        valid: false,
        status: licenseData.status,
        source,
        error: `Lizenz ist ${licenseData.status}. Bitte kontaktiere den Support.`
      };
    }

    // Expiry Check
    if (licenseData.expires_at) {
      const expiryDate = new Date(licenseData.expires_at);
      const now = new Date();

      if (expiryDate < now) {
        return {
          valid: false,
          status: 'expired',
          source,
          error: 'Lizenz ist abgelaufen.',
          expires_at: licenseData.expires_at
        };
      }
    }

    // ===== SUCCESS =====
    console.log('✅ License validation successful');

    return {
      valid: true,
      status: licenseData.status,
      type: licenseData.type || 'single',
      source,
      expires_at: licenseData.expires_at,
      product: licenseData.product
        ? {
            id: licenseData.product.id,
            name: licenseData.product.name
          }
        : licenseData.product_name
        ? {
            id: licenseData.product_id || '',
            name: licenseData.product_name
          }
        : undefined,
      customer: licenseData.customer
        ? {
            name: licenseData.customer.name || 'Unknown',
            email: licenseData.customer.email || ''
          }
        : licenseData.customer_name
        ? {
            name: licenseData.customer_name || 'Unknown',
            email: licenseData.customer_email || ''
          }
        : undefined,
      activations: {
        current: licenseData.current_activations || licenseData.activations?.length || 0,
        max: licenseData.max_activations || null
      },
      details: {
        found_in: source,
        license_id: licenseData.id,
        validated_at: new Date().toISOString()
      }
    };

  } catch (error: any) {
    console.error('❌ Validation Error:', error);
    return {
      valid: false,
      error: 'Serverfehler bei der Validierung: ' + error.message
    };
  }
}

/**
 * Quick validation check (returns only boolean)
 */
export async function isLicenseValid(license_key: string): Promise<boolean> {
  const result = await validateLicenseUniversal(license_key);
  return result.valid;
}

/**
 * Validates and formats the result for display
 */
export async function validateAndFormat(license_key: string): Promise<{
  isValid: boolean;
  message: string;
  details?: any;
}> {
  const result = await validateLicenseUniversal(license_key);

  if (result.valid) {
    return {
      isValid: true,
      message: `✅ Lizenz gültig! (${result.product?.name || 'Unknown Product'})`,
      details: result
    };
  } else {
    return {
      isValid: false,
      message: result.error || '❌ Lizenz ungültig',
      details: result
    };
  }
}
