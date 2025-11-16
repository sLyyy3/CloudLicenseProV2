// src/pages/KeyValidator.tsx - CUSTOMERS VALIDATE KEYS
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { FaKey, FaSearch, FaCheck, FaTimes } from "react-icons/fa";

type ValidatedKey = {
  key_code: string;
  product_name: string;
  reseller_name: string;
  status: string;
  created_at: string;
  expires_at?: string;
};

export default function KeyValidator() {
  const [searchKey, setSearchKey] = useState("");
  const [validatedKey, setValidatedKey] = useState<ValidatedKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleValidateKey() {
    if (!searchKey) {
      setError("Bitte gib einen Key ein!");
      return;
    }

    setLoading(true);
    setError("");
    setValidatedKey(null);

    try {
      console.log("🔍 Validating key:", searchKey);

      // 1. Finde Key in customer_keys
      const { data: keyData, error: keyError } = await supabase
        .from("customer_keys")
        .select("*, reseller_products(*, products(name))")
        .eq("key_code", searchKey)
        .single();

      if (keyError || !keyData) {
        throw new Error("❌ Key nicht gefunden oder ungültig!");
      }

      console.log("✅ Key found:", keyData);

      // 2. Finde Reseller Info
      const { data: resellerData } = await supabase
        .from("resellers")
        .select("shop_name")
        .eq("id", keyData.reseller_products.reseller_id)
        .single();

      const validated: ValidatedKey = {
        key_code: keyData.key_code,
        product_name: keyData.reseller_products.products.name,
        reseller_name: resellerData?.shop_name || "Unbekannter Shop",
        status: keyData.status,
        created_at: keyData.created_at,
        expires_at: keyData.expires_at,
      };

      console.log("✅ Validation successful!");
      setValidatedKey(validated);
    } catch (err: any) {
      console.error("❌ Validation failed:", err);
      setError(err.message || "Validierung fehlgeschlagen");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
      {/* HEADER */}
      <div className="bg-[#1A1A1F] border-b border-[#2C2C34] p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaKey className="text-[#00FF9C]" />
            Key Validierung
          </h1>
          <p className="text-gray-400 mt-1">Überprüfe deine gekaufte Key</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-8">
        {/* SEARCH */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Dein Key</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleValidateKey()}
                placeholder="z.B. XXXXX-YYYYY-ZZZZZ"
                className="flex-1 p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition font-mono"
              />
              <button
                onClick={handleValidateKey}
                disabled={loading}
                className="px-6 py-3 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] rounded font-bold disabled:opacity-50"
              >
                {loading ? "⏳" : <FaSearch />}
              </button>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-600/20 border border-red-600 rounded-lg p-4 mb-8">
            <p className="text-red-400 flex items-center gap-2">
              <FaTimes /> {error}
            </p>
          </div>
        )}

        {/* RESULT */}
        {validatedKey && (
          <div className="space-y-6">
            <div className="bg-green-600/20 border border-green-600 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaCheck className="text-3xl text-green-400" />
                <div>
                  <p className="text-lg font-bold text-green-400">✅ Key ist gültig!</p>
                  <p className="text-sm text-green-300">Status: {validatedKey.status}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Key Code</p>
                <p className="font-mono font-bold text-[#00FF9C] break-all">
                  {validatedKey.key_code}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Produkt</p>
                  <p className="font-bold">{validatedKey.product_name}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Shop</p>
                  <p className="font-bold text-[#00FF9C]">{validatedKey.reseller_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Gekauft am</p>
                  <p className="text-sm">
                    {new Date(validatedKey.created_at).toLocaleDateString("de-DE")}
                  </p>
                </div>

                {validatedKey.expires_at && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Gültig bis</p>
                    <p className="text-sm">
                      {new Date(validatedKey.expires_at).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setSearchKey("");
                setValidatedKey(null);
                setError("");
              }}
              className="w-full px-4 py-2 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] rounded font-bold"
            >
              Neuen Key prüfen
            </button>
          </div>
        )}

        {/* INFO */}
        <div className="mt-12 bg-blue-600/20 border border-blue-600 rounded-lg p-6">
          <h3 className="font-bold text-blue-400 mb-3">ℹ️ Wie funktioniert die Validierung?</h3>
          <ul className="text-sm text-blue-300 space-y-2">
            <li>✅ Gib deinen Key Code ein (Format: XXXXX-YYYYY-ZZZZZ)</li>
            <li>✅ System prüft Key in der Datenbank</li>
            <li>✅ Bei Erfolg: Produktname, Shop und Gültigkeitsdatum</li>
            <li>✅ Keys sind automatisch aktiviert nach dem Kauf</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
