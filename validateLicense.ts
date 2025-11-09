// src/api/validateLicense.ts
// Dieser Code kann als Supabase Edge Function oder separater API Server laufen

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ValidationRequest {
  license_key: string;
  product_id: string;
  machine_id?: string;
  app_version?: string;
}

interface ValidationResponse {
  valid: boolean;
  status?: string;
  type?: string;
  expires_at?: string;
  error?: string;
  product?: { id: string; name: string };
  customer?: { name: string; email: string };
  activations?: { current: number; max: number | null };
}

Deno.serve(async (req) => {
  // CORS Headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  try {
    const body: ValidationRequest = await req.json();
    const { license_key, product_id, machine_id, app_version } = body;

    // Validierung der Input-Parameter
    if (!license_key || !product_id) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'license_key und product_id sind erforderlich' 
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

    // Lizenz aus DB holen mit allen relevanten Daten
    const { data: license, error: fetchError } = await supabase
      .from('licenses')
      .select(`
        id, 
        license_key, 
        status, 
        type, 
        expires_at, 
        max_activations,
        organization_id,
        product:products(id, name),
        customer:customers(id, name, email),
        activations:license_activations(id, machine_id, activated_at, last_seen)
      `)
      .eq('license_key', license_key)
      .eq('product_id', product_id)
      .single();

    if (fetchError || !license) {
      // Log fehlgeschlagene Validierung
      await logValidation(null, machine_id, false, 'Lizenz nicht gefunden', req);
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Lizenz nicht gefunden' 
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

    // Status-Prüfung
    if (license.status !== 'active') {
      await logValidation(license.id, machine_id, false, `Lizenz ist ${license.status}`, req);
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          status: license.status,
          error: `Lizenz ist ${license.status}` 
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
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      // Auto-Expire setzen
      await supabase
        .from('licenses')
        .update({ status: 'expired' })
        .eq('id', license.id);

      await logValidation(license.id, machine_id, false, 'Lizenz ist abgelaufen', req);
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          status: 'expired',
          error: 'Lizenz ist abgelaufen',
          expires_at: license.expires_at
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

    // Hardware-Activation für Floating Licenses
    if (license.type === 'Floating' && machine_id) {
      const activations = license.activations || [];
      const existingActivation = activations.find((a: any) => a.machine_id === machine_id);

      if (existingActivation) {
        // Update last_seen
        await supabase
          .from('license_activations')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', existingActivation.id);
      } else {
        // Prüfe Max Activations
        if (license.max_activations && activations.length >= license.max_activations) {
          await logValidation(
            license.id, 
            machine_id, 
            false, 
            `Maximale Anzahl von ${license.max_activations} Aktivierungen erreicht`,
            req
          );
          
          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: `Maximale Anzahl von ${license.max_activations} Aktivierungen erreicht`,
              activations: {
                current: activations.length,
                max: license.max_activations
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
            license_id: license.id,
            machine_id,
            activated_at: new Date().toISOString(),
            last_seen: new Date().toISOString()
          });
      }
    }

    // Log erfolgreiche Validierung
    await logValidation(license.id, machine_id, true, null, req);

    // Erfolgreiche Response
    const response: ValidationResponse = {
      valid: true,
      status: license.status,
      type: license.type,
      expires_at: license.expires_at,
      product: {
        id: license.product.id,
        name: license.product.name
      },
      customer: {
        name: license.customer.name,
        email: license.customer.email
      },
      activations: {
        current: license.activations?.length || 0,
        max: license.max_activations || null
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
    console.error('Validation Error:', error);
    
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
  req: Request
) {
  try {
    await supabase.from('license_validations').insert({
      license_id,
      machine_id,
      success,
      error_message,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent'),
      validated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error logging validation:', err);
  }
}