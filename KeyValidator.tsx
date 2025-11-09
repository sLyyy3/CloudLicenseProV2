// src/pages/KeyValidator.tsx - UNIVERSAL KEY VALIDATOR
// Validates keys from ALL sources (licenses + customer_keys)
import { useState } from "react";
import { FaKey, FaSearch, FaCheck, FaTimes, FaInfoCircle, FaCheckCircle } from "react-icons/fa";
import { validateLicenseUniversal, ValidationResult } from "../lib/universalLicenseValidator";

export default function KeyValidator() {
  const [searchKey, setSearchKey] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleValidateKey() {
    if (!searchKey.trim()) {
      setValidationResult({
        valid: false,
        error: "Bitte gib einen License Key ein!"
      });
      return;
    }

    setLoading(true);
    setValidationResult(null);

    try {
      console.log("🔍 Validating key:", searchKey);
      const result = await validateLicenseUniversal(searchKey);
      setValidationResult(result);
    } catch (err: any) {
      console.error("❌ Validation failed:", err);
      setValidationResult({
        valid: false,
        error: err.message || "Validierung fehlgeschlagen"
      });
    }

    setLoading(false);
  }

  function getDaysRemaining(): number | null {
    if (!validationResult?.expires_at) return null;
    const expiryDate = new Date(validationResult.expires_at);
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E0E12] via-[#1A1A1F] to-[#0E0E12] text-[#E0E0E0]">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border-b border-[#3C3C44] shadow-xl p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-[#00FF9C]/20 p-4 rounded-xl">
              <FaKey className="text-[#00FF9C] text-3xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-[#00FF9C] to-green-400 bg-clip-text text-transparent">
                License Key Validator
              </h1>
              <p className="text-gray-400 mt-1">Überprüfe deinen License Key auf Gültigkeit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-8">
        {/* SEARCH */}
        <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-6 mb-8 shadow-xl">
          <label className="block text-sm font-bold text-gray-400 mb-3">
            🔑 Dein License Key
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === "Enter" && handleValidateKey()}
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              className="flex-1 p-4 rounded-xl bg-[#2C2C34] border-2 border-[#3C3C44] focus:border-[#00FF9C] outline-none transition font-mono text-lg"
            />
            <button
              onClick={handleValidateKey}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] hover:shadow-lg hover:shadow-[#00FF9C]/50 rounded-xl font-bold disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin">⏳</div>
                  Prüfe...
                </>
              ) : (
                <>
                  <FaSearch /> Validieren
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Alle gängigen Key-Formate werden unterstützt
          </p>
        </div>

        {/* RESULT */}
        {validationResult && (
          <div className="space-y-6">
            {/* SUCCESS */}
            {validationResult.valid ? (
              <>
                <div className="bg-gradient-to-br from-green-600/20 to-green-600/5 border-2 border-green-500 rounded-2xl p-8 shadow-2xl shadow-green-500/20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-green-500/20 p-4 rounded-xl">
                      <FaCheckCircle className="text-4xl text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-green-400 mb-2">
                        ✅ License Key ist gültig!
                      </h2>
                      <p className="text-green-300">
                        Status: <span className="font-bold">{validationResult.status}</span>
                      </p>
                      {validationResult.source && (
                        <p className="text-xs text-green-300/70 mt-1">
                          Gefunden in: {validationResult.source === 'licenses' ? 'Developer Lizenzen' : 'Reseller Keys'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* DETAILS */}
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-6 space-y-6 shadow-xl">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FaInfoCircle className="text-blue-400" />
                    License Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Key Code */}
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-2">License Key</p>
                      <div className="bg-[#2C2C34] rounded-xl p-4 border border-[#3C3C44]">
                        <p className="font-mono font-bold text-[#00FF9C] break-all text-sm">
                          {searchKey}
                        </p>
                      </div>
                    </div>

                    {/* Product */}
                    {validationResult.product && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Produkt</p>
                        <div className="bg-[#2C2C34] rounded-xl p-4 border border-[#3C3C44]">
                          <p className="font-bold text-blue-400">{validationResult.product.name}</p>
                        </div>
                      </div>
                    )}

                    {/* Type */}
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Lizenz Typ</p>
                      <div className="bg-[#2C2C34] rounded-xl p-4 border border-[#3C3C44]">
                        <p className="font-bold text-purple-400 capitalize">
                          {validationResult.type === 'single' && '👤 Single User'}
                          {validationResult.type === 'floating' && '🔄 Floating'}
                          {validationResult.type === 'concurrent' && '⚡ Concurrent'}
                          {!validationResult.type && 'Standard'}
                        </p>
                      </div>
                    </div>

                    {/* Customer */}
                    {validationResult.customer && validationResult.customer.name !== 'Unknown' && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Kunde</p>
                        <div className="bg-[#2C2C34] rounded-xl p-4 border border-[#3C3C44]">
                          <p className="font-bold">{validationResult.customer.name}</p>
                          {validationResult.customer.email && (
                            <p className="text-sm text-gray-400">{validationResult.customer.email}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Activations */}
                    {validationResult.activations && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Aktivierungen</p>
                        <div className="bg-[#2C2C34] rounded-xl p-4 border border-[#3C3C44]">
                          <p className="font-bold">
                            {validationResult.activations.current} / {validationResult.activations.max || '∞'}
                          </p>
                          <div className="w-full bg-[#3C3C44] rounded-full h-2 mt-2">
                            <div
                              className="bg-[#00FF9C] h-2 rounded-full transition-all"
                              style={{
                                width: validationResult.activations.max
                                  ? `${(validationResult.activations.current / validationResult.activations.max) * 100}%`
                                  : '0%'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expiry Date */}
                    {validationResult.expires_at && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400 mb-2">Gültig bis</p>
                        <div className="bg-[#2C2C34] rounded-xl p-4 border border-[#3C3C44]">
                          <p className="font-bold">
                            {new Date(validationResult.expires_at).toLocaleDateString("de-DE", {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          {(() => {
                            const days = getDaysRemaining();
                            if (days !== null) {
                              return (
                                <p className={`text-sm mt-1 ${
                                  days < 30 ? 'text-yellow-400' : 'text-green-400'
                                }`}>
                                  {days > 0 ? `Noch ${days} Tage gültig` : 'Heute ablaufend'}
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* ERROR */
              <div className="bg-gradient-to-br from-red-600/20 to-red-600/5 border-2 border-red-500 rounded-2xl p-8 shadow-2xl shadow-red-500/20">
                <div className="flex items-start gap-4">
                  <div className="bg-red-500/20 p-4 rounded-xl">
                    <FaTimes className="text-4xl text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-red-400 mb-2">
                      ❌ License Key ungültig
                    </h2>
                    <p className="text-red-300">
                      {validationResult.error || 'Dieser Key konnte nicht validiert werden.'}
                    </p>
                    {validationResult.status && (
                      <p className="text-sm text-red-300/70 mt-2">
                        Status: {validationResult.status}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* RESET BUTTON */}
            <button
              onClick={() => {
                setSearchKey("");
                setValidationResult(null);
              }}
              className="w-full px-6 py-4 bg-[#2C2C34] hover:bg-[#3C3C44] text-white rounded-xl font-bold transition"
            >
              Neuen Key prüfen
            </button>
          </div>
        )}

        {/* INFO BOX */}
        <div className="mt-12 bg-gradient-to-br from-blue-600/10 to-blue-600/5 border border-blue-600 rounded-2xl p-6 shadow-xl">
          <h3 className="font-bold text-blue-400 mb-4 flex items-center gap-2 text-xl">
            <FaInfoCircle /> Wie funktioniert die Validierung?
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-blue-300">
              <FaCheck className="text-blue-400 mt-1 flex-shrink-0" />
              <span>Gib deinen License Key ein (alle Formate werden unterstützt)</span>
            </li>
            <li className="flex items-start gap-3 text-blue-300">
              <FaCheck className="text-blue-400 mt-1 flex-shrink-0" />
              <span>System prüft automatisch in allen Datenbanken (Developer & Reseller)</span>
            </li>
            <li className="flex items-start gap-3 text-blue-300">
              <FaCheck className="text-blue-400 mt-1 flex-shrink-0" />
              <span>Bei Erfolg: Produktname, Typ, Gültigkeitsdatum und Aktivierungen</span>
            </li>
            <li className="flex items-start gap-3 text-blue-300">
              <FaCheck className="text-blue-400 mt-1 flex-shrink-0" />
              <span>Unterstützt: Single, Floating und Concurrent Lizenzen</span>
            </li>
          </ul>
        </div>

        {/* SUPPORTED FORMATS */}
        <div className="mt-6 bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-6">
          <h3 className="font-bold text-gray-400 mb-3">✨ Unterstützte Formate</h3>
          <div className="space-y-2 text-sm text-gray-500 font-mono">
            <p>• XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX (Professional)</p>
            <p>• KEY-XXXXXXXX-TIMESTAMP (Legacy)</p>
            <p>• Beliebiges Format mit min. 16 Zeichen</p>
          </div>
        </div>
      </div>
    </div>
  );
}
