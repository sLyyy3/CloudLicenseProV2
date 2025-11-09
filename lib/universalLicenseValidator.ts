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
    if (!license_key || license_key.length < 8) {
      return {
        valid: false,
        error: 'Ungültiger License Key Format'
      };
    }

    console.log('🔍 Validating license key:', license_key.substring(0, 10) + '...');

    // ===== STRATEGIE 1: Suche in "licenses" Tabelle =====
    let licenseData = null;
    let source: 'licenses' | 'customer_keys' = 'licenses';

    // Mit product_id falls vorhanden
    if (options?.product_id) {
      const { data, error } = await supabase
        .from('licenses')
        .select(`
          id,
          license_key,
          status,
          type,
          expires_at,
          max_activations,
          organization_id,
          product_id,
          customer_id,
          product:products(id, name),
          customer:customers(id, name, email),
          activations:license_activations(id, machine_id, activated_at, last_seen)
        `)
        .eq('license_key', license_key)
        .eq('product_id', options.product_id)
        .maybeSingle();

      if (data && !error) {
        licenseData = data;
        console.log('✅ Found in licenses table (with product_id)');
      }
    }

    // Ohne product_id
    if (!licenseData) {
      const { data, error } = await supabase
        .from('licenses')
        .select(`
          id,
          license_key,
          status,
          type,
          expires_at,
          max_activations,
          organization_id,
          product_id,
          customer_id,
          product:products(id, name),
          customer:customers(id, name, email),
          activations:license_activations(id, machine_id, activated_at, last_seen)
        `)
        .eq('license_key', license_key)
        .maybeSingle();

      if (data && !error) {
        licenseData = data;
        console.log('✅ Found in licenses table (without product_id)');
      }
    }

    // ===== STRATEGIE 2: Suche in "customer_keys" Tabelle =====
    if (!licenseData) {
      const { data, error } = await supabase
        .from('customer_keys')
        .select(`
          id,
          key_code,
          status,
          created_at,
          expires_at,
          reseller_products(
            id,
            product_id,
            reseller_id,
            products(id, name)
          )
        `)
        .eq('key_code', license_key)
        .maybeSingle();

      if (data && !error) {
        // Konvertiere customer_keys Format
        licenseData = {
          id: data.id,
          license_key: data.key_code,
          status: data.status,
          type: 'single',
          expires_at: data.expires_at,
          max_activations: 1,
          product: data.reseller_products?.products || null,
          customer: { name: 'Reseller Customer', email: '' },
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
        : undefined,
      customer: licenseData.customer
        ? {
            name: licenseData.customer.name || 'Unknown',
            email: licenseData.customer.email || ''
          }
        : undefined,
      activations: {
        current: licenseData.activations?.length || 0,
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
