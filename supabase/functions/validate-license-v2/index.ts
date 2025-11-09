// supabase/functions/validate-license-v2/index.ts
// VERBESSERTE LICENSE VALIDATION API
// Findet Keys aus allen Tabellen (licenses UND customer_keys)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ValidationRequest {
  license_key: string;
  product_id?: string; // Optional!
  machine_id?: string;
  app_version?: string;
}

interface ValidationResponse {
  valid: boolean;
  status?: string;
  type?: string;
  source?: 'licenses' | 'customer_keys'; // Welche Tabelle
  expires_at?: string;
  error?: string;
  product?: { id: string; name: string };
  customer?: { name: string; email: string };
  activations?: { current: number; max: number | null };
  details?: any;
}

Deno.serve(async (req) => {
  // CORS Headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  try {
    let body: ValidationRequest;

    // Support both POST and GET
    if (req.method === 'GET') {
      const url = new URL(req.url);
      body = {
        license_key: url.searchParams.get('license_key') || url.searchParams.get('key') || '',
        product_id: url.searchParams.get('product_id') || undefined,
        machine_id: url.searchParams.get('machine_id') || undefined,
        app_version: url.searchParams.get('app_version') || undefined,
      };
    } else {
      body = await req.json();
    }

    const { license_key, product_id, machine_id, app_version } = body;

    // Validierung der Input-Parameter
    if (!license_key) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'license_key ist erforderlich'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    console.log('🔍 Validating license key:', license_key);

    // ===== STRATEGIE 1: Suche in "licenses" Tabelle (Developer Lizenzen) =====
    let licenseData = null;
    let source: 'licenses' | 'customer_keys' = 'licenses';

    // Mit product_id falls vorhanden
    if (product_id) {
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
        .eq('product_id', product_id)
        .maybeSingle();

      if (data && !error) {
        licenseData = data;
        console.log('✅ Found in licenses table (with product_id)');
      }
    }

    // Ohne product_id (suche nur nach key)
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

    // ===== STRATEGIE 2: Suche in "customer_keys" Tabelle (Reseller Keys) =====
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
            products(id, name),
            resellers(id, shop_name)
          )
        `)
        .eq('key_code', license_key)
        .maybeSingle();

      if (data && !error) {
        // Konvertiere customer_keys Format zu licenses Format
        licenseData = {
          id: data.id,
          license_key: data.key_code,
          status: data.status,
          type: 'single', // customer_keys sind immer single use
          expires_at: data.expires_at,
          max_activations: 1,
          product: data.reseller_products?.products || { id: '', name: 'Unknown' },
          customer: { name: 'Reseller Customer', email: '' },
          activations: [],
        };
        source = 'customer_keys';
        console.log('✅ Found in customer_keys table');
      }
    }

    // Nicht gefunden
    if (!licenseData) {
      await logValidation(null, machine_id, false, 'Lizenz nicht gefunden', req, license_key);

      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Lizenz nicht gefunden. Bitte überprüfe den Key.'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // ===== VALIDIERUNG =====

    // Status-Prüfung
    if (licenseData.status !== 'active') {
      await logValidation(licenseData.id, machine_id, false, `Lizenz ist ${licenseData.status}`, req, license_key);

      return new Response(
        JSON.stringify({
          valid: false,
          status: licenseData.status,
          source,
          error: `Lizenz ist ${licenseData.status}. Bitte kontaktiere den Support.`
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Ablaufdatum prüfen
    if (licenseData.expires_at) {
      const expiryDate = new Date(licenseData.expires_at);
      const now = new Date();

      if (expiryDate < now) {
        // Auto-Expire setzen (nur für licenses Tabelle)
        if (source === 'licenses') {
          await supabase
            .from('licenses')
            .update({ status: 'expired' })
            .eq('id', licenseData.id);
        }

        await logValidation(licenseData.id, machine_id, false, 'Lizenz ist abgelaufen', req, license_key);

        return new Response(
          JSON.stringify({
            valid: false,
            status: 'expired',
            source,
            error: 'Lizenz ist abgelaufen.',
            expires_at: licenseData.expires_at
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
    }

    // Hardware-Activation für Floating Licenses (nur für licenses Tabelle)
    if (source === 'licenses' && licenseData.type === 'floating' && machine_id) {
      const activations = licenseData.activations || [];
      const existingActivation = activations.find((a: any) => a.machine_id === machine_id);

      if (existingActivation) {
        // Update last_seen
        await supabase
          .from('license_activations')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', existingActivation.id);
      } else {
        // Prüfe Max Activations
        if (licenseData.max_activations && activations.length >= licenseData.max_activations) {
          await logValidation(
            licenseData.id,
            machine_id,
            false,
            `Maximale Anzahl von ${licenseData.max_activations} Aktivierungen erreicht`,
            req,
            license_key
          );

          return new Response(
            JSON.stringify({
              valid: false,
              error: `Maximale Anzahl von ${licenseData.max_activations} Aktivierungen erreicht`,
              activations: {
                current: activations.length,
                max: licenseData.max_activations
              }
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        }

        // Neue Activation erstellen
        await supabase
          .from('license_activations')
          .insert({
            license_id: licenseData.id,
            machine_id,
            activated_at: new Date().toISOString(),
            last_seen: new Date().toISOString()
          });
      }
    }

    // Log erfolgreiche Validierung
    await logValidation(licenseData.id, machine_id, true, null, req, license_key);

    // Erfolgreiche Response
    const response: ValidationResponse = {
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

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('❌ Validation Error:', error);

    return new Response(
      JSON.stringify({
        valid: false,
        error: 'Serverfehler bei der Validierung'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});

// Hilfsfunktion zum Loggen von Validierungen
async function logValidation(
  license_id: string | null,
  machine_id: string | undefined,
  success: boolean,
  error_message: string | null,
  req: Request,
  license_key: string
) {
  try {
    await supabase.from('license_validations').insert({
      license_id,
      machine_id,
      success,
      error_message,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent'),
      validated_at: new Date().toISOString(),
      license_key: license_key.substring(0, 10) + '...', // Partial key for logging
    });
  } catch (err) {
    console.error('Error logging validation:', err);
  }
}
