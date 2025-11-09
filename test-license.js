#!/usr/bin/env node

// test-license.js
// ===== LICENSE VALIDATOR CLI =====
// Zum Testen von Lizenzschlüsseln von der Kommandozeile
//
// Verwendung:
// node test-license.js LIC-ABC123DEF
// oder
// npm run test-license LIC-ABC123DEF

const https = require("https");

// Deine Supabase Daten (aus .env oder ersetze hier)
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://dyozlmdxjreomzidzgyo.supabase.co";
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

// Farben für CLI Output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateLicense(licenseKey) {
  return new Promise((resolve, reject) => {
    if (!licenseKey || licenseKey.trim() === "") {
      reject(new Error("Lizenzschlüssel ist leer"));
      return;
    }

    if (!SUPABASE_ANON_KEY) {
      reject(new Error("SUPABASE_ANON_KEY ist nicht gesetzt"));
      return;
    }

    const query = `license_key=eq.${encodeURIComponent(licenseKey.trim())}&select=id,license_key,status,expires_at,type,max_activations,current_activations,product_id,customer_email,products(name),customers(name,email)`;

    const options = {
      hostname: SUPABASE_URL.replace("https://", ""),
      path: `/rest/v1/licenses?${query}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const licenses = JSON.parse(data);

          if (!licenses || licenses.length === 0) {
            resolve({
              valid: false,
              message: "Lizenzschlüssel nicht gefunden",
            });
            return;
          }

          const license = licenses[0];

          // Prüfe Status
          if (license.status !== "active") {
            resolve({
              valid: false,
              license_key: license.license_key,
              status: license.status,
              message: `Lizenz ist ${license.status}`,
            });
            return;
          }

          // Prüfe Ablaufdatum
          if (license.expires_at) {
            const expiryDate = new Date(license.expires_at);
            const now = new Date();

            if (now > expiryDate) {
              resolve({
                valid: false,
                license_key: license.license_key,
                expires_at: license.expires_at,
                message: "Lizenz ist abgelaufen",
              });
              return;
            }

            const daysLeft = Math.floor(
              (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysLeft < 30) {
              log(`  ⚠️ Lizenz läuft in ${daysLeft} Tagen ab`, "yellow");
            }
          }

          // Prüfe Aktivierungen
          if (license.max_activations && license.current_activations >= license.max_activations) {
            resolve({
              valid: false,
              license_key: license.license_key,
              message: "Max Aktivierungen erreicht",
            });
            return;
          }

          // ✅ GÜLTIG!
          resolve({
            valid: true,
            license_key: license.license_key,
            product_name: license.products?.name || "Unknown",
            customer_email:
              license.customers?.email || license.customer_email || "Unknown",
            status: license.status,
            type: license.type,
            max_activations: license.max_activations,
            current_activations: license.current_activations,
            expires_at: license.expires_at,
            message: "Lizenz ist gültig",
          });
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  const licenseKey = process.argv[2];

  if (!licenseKey) {
    log("\n🔐 LICENSE VALIDATOR CLI", "bright");
    log("════════════════════════════════════\n", "cyan");
    log("Verwendung:", "yellow");
    log("  node test-license.js <LICENSE_KEY>\n", "cyan");
    log("Beispiel:", "yellow");
    log("  node test-license.js LIC-ABC123DEF\n", "cyan");
    process.exit(1);
  }

  log("\n🔐 LICENSE VALIDATOR CLI", "bright");
  log("════════════════════════════════════\n", "cyan");
  log("🔍 Validierend Lizenzschlüssel...\n", "blue");

  try {
    const result = await validateLicense(licenseKey);

    if (result.valid) {
      log("✅ ERGEBNIS: GÜLTIG\n", "green");
    } else {
      log("❌ ERGEBNIS: UNGÜLTIG\n", "red");
    }

    log("Detailes:", "bright");
    log("────────────────────────────────────", "cyan");

    if (result.license_key) log(`  License Key: ${result.license_key}`, "cyan");
    if (result.product_name) log(`  Produkt: ${result.product_name}`, "cyan");
    if (result.customer_email) log(`  Kunde: ${result.customer_email}`, "cyan");
    if (result.status) log(`  Status: ${result.status}`, "cyan");
    if (result.type) log(`  Typ: ${result.type}`, "cyan");
    if (result.max_activations) {
      log(
        `  Aktivierungen: ${result.current_activations || 0}/${result.max_activations}`,
        "cyan"
      );
    }
    if (result.expires_at) {
      const expiry = new Date(result.expires_at).toLocaleDateString("de-DE");
      log(`  Läuft ab: ${expiry}`, "cyan");
    }

    log(`\n  Meldung: ${result.message}`, "cyan");
    log("────────────────────────────────────\n", "cyan");

    process.exit(result.valid ? 0 : 1);
  } catch (err) {
    log(`\n❌ FEHLER: ${err.message}\n`, "red");
    log("Tipps:", "yellow");
    log("  • Stelle sicher, dass SUPABASE_ANON_KEY gesetzt ist", "yellow");
    log("  • Prüfe die Netzwerkverbindung", "yellow");
    log("  • Versuche den Lizenzschlüssel noch einmal", "yellow");
    log("", "");
    process.exit(1);
  }
}

main();