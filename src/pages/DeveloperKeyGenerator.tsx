// src/pages/DeveloperKeyGenerator.tsx - BULK KEY GENERATOR FÜR DEVELOPER
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaKey,
  FaDownload,
  FaCopy,
  FaRocket,
  FaArrowLeft,
  FaCheckCircle,
  FaBox,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

type Product = {
  id: string;
  name: string;
  description: string;
};

type GeneratedKey = {
  key: string;
  product_id: string;
  product_name: string;
};

export default function DeveloperKeyGenerator() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState(10);
  const [keyPrefix, setKeyPrefix] = useState("KEY");
  const [keyLength, setKeyLength] = useState(16);
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKey[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate("/login", { replace: true });
        return;
      }

      // Get organization
      const { data: orgData } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_email", data.user.email!)
        .single();

      if (!orgData) {
        navigate("/", { replace: true });
        return;
      }

      setOrganizationId(orgData.id);

      // Load products
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, description")
        .eq("organization_id", orgData.id)
        .order("created_at", { ascending: false });

      setProducts(productsData || []);
      if (productsData && productsData.length > 0) {
        setSelectedProduct(productsData[0].id);
      }
    }
    init();
  }, []);

  function generateRandomKey(prefix: string, length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = prefix + "-";

    // Generate key in blocks of 4
    const blocks = Math.ceil(length / 4);
    for (let i = 0; i < blocks; i++) {
      for (let j = 0; j < 4 && (i * 4 + j) < length; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < blocks - 1) key += "-";
    }

    return key;
  }

  async function handleGenerateKeys() {
    if (!selectedProduct || !organizationId) {
      openDialog({
        type: "warning",
        title: "⚠️ Fehler",
        message: "Bitte wähle ein Produkt aus",
        closeButton: "OK",
      });
      return;
    }

    if (quantity < 1 || quantity > 10000) {
      openDialog({
        type: "warning",
        title: "⚠️ Ungültige Menge",
        message: "Bitte wähle zwischen 1 und 10.000 Keys",
        closeButton: "OK",
      });
      return;
    }

    setLoading(true);

    try {
      const product = products.find((p) => p.id === selectedProduct);
      if (!product) throw new Error("Product not found");

      // Generate keys
      const keys: GeneratedKey[] = [];
      const keysToInsert = [];

      for (let i = 0; i < quantity; i++) {
        const key = generateRandomKey(keyPrefix, keyLength);
        keys.push({
          key: key,
          product_id: product.id,
          product_name: product.name,
        });

        keysToInsert.push({
          license_key: key,
          product_id: product.id,
          organization_id: organizationId,
          status: "active",
          type: "standard",
          product_name: product.name,
          max_activations: 1,
          current_activations: 0,
        });
      }

      // Insert into database
      const { error } = await supabase.from("licenses").insert(keysToInsert);

      if (error) throw error;

      setGeneratedKeys(keys);

      openDialog({
        type: "success",
        title: "✅ Keys generiert!",
        message: `${quantity} Keys wurden erfolgreich generiert und in der Datenbank gespeichert.`,
        closeButton: "OK",
      });
    } catch (err: any) {
      console.error("Error generating keys:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message || "Fehler beim Generieren der Keys",
        closeButton: "OK",
      });
    }

    setLoading(false);
  }

  function downloadKeys() {
    if (generatedKeys.length === 0) return;

    const content = generatedKeys.map((k) => k.key).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keys-${Date.now()}.txt`;
    a.click();
  }

  function downloadCSV() {
    if (generatedKeys.length === 0) return;

    const csv = [
      "Key,Product ID,Product Name",
      ...generatedKeys.map((k) => `${k.key},${k.product_id},${k.product_name}`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keys-${Date.now()}.csv`;
    a.click();
  }

  function copyAllKeys() {
    if (generatedKeys.length === 0) return;
    const content = generatedKeys.map((k) => k.key).join("\n");
    navigator.clipboard.writeText(content);
    openDialog({
      type: "success",
      title: "✅ Kopiert",
      message: "Alle Keys wurden in die Zwischenablage kopiert!",
      closeButton: "OK",
    });
  }

  return (
    <>
      {DialogComponent}
      <div className="flex min-h-screen bg-gradient-to-br from-[#0E0E12] via-[#1A1A1F] to-[#0E0E12]">
        <Sidebar />

        <div className="flex-1 p-8 ml-64">
          {/* HEADER */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/dev-dashboard")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] mb-4 transition"
            >
              <FaArrowLeft /> Zurück zum Dashboard
            </button>

            <div className="flex items-center gap-4 mb-2">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-xl">
                <FaKey className="text-3xl text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Bulk Key Generator
                </h1>
                <p className="text-gray-400">Generiere Keys für deine Reseller</p>
              </div>
            </div>
          </div>

          {/* GENERATOR FORM */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* LEFT: Configuration */}
            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3C3C44] rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <FaRocket className="text-[#00FF9C]" />
                Konfiguration
              </h2>

              <div className="space-y-4">
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">
                    Produkt auswählen
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">
                    Anzahl Keys
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max: 10.000 Keys</p>
                </div>

                {/* Key Prefix */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">
                    Key Prefix
                  </label>
                  <input
                    type="text"
                    value={keyPrefix}
                    onChange={(e) => setKeyPrefix(e.target.value.toUpperCase())}
                    maxLength={10}
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none font-mono"
                    placeholder="KEY"
                  />
                  <p className="text-xs text-gray-500 mt-1">Beispiel: KEY-XXXX-XXXX-XXXX</p>
                </div>

                {/* Key Length */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-300">
                    Key Länge (Zeichen nach Prefix)
                  </label>
                  <input
                    type="number"
                    min="8"
                    max="32"
                    value={keyLength}
                    onChange={(e) => setKeyLength(parseInt(e.target.value) || 16)}
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">8-32 Zeichen</p>
                </div>

                {/* Preview */}
                <div className="bg-[#2C2C34] rounded-lg p-4 border border-[#00FF9C]/20">
                  <p className="text-xs text-gray-400 mb-2">Vorschau:</p>
                  <p className="font-mono text-[#00FF9C] font-bold">
                    {generateRandomKey(keyPrefix, keyLength)}
                  </p>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateKeys}
                  disabled={loading || products.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] font-black rounded-xl hover:shadow-2xl hover:shadow-[#00FF9C]/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "Generiere Keys..."
                  ) : (
                    <>
                      <FaRocket /> {quantity} Keys generieren
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT: Generated Keys */}
            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3C3C44] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" />
                  Generierte Keys
                </h2>
                {generatedKeys.length > 0 && (
                  <span className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold">
                    {generatedKeys.length} Keys
                  </span>
                )}
              </div>

              {generatedKeys.length === 0 ? (
                <div className="text-center py-12">
                  <FaKey className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Noch keine Keys generiert</p>
                  <p className="text-gray-600 text-sm mt-2">
                    Konfiguriere links die Einstellungen und klicke auf "Generieren"
                  </p>
                </div>
              ) : (
                <>
                  {/* Action Buttons */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <button
                      onClick={downloadKeys}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition flex items-center justify-center gap-2"
                    >
                      <FaDownload /> Download .txt
                    </button>
                    <button
                      onClick={downloadCSV}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition flex items-center justify-center gap-2"
                    >
                      <FaDownload /> Download .csv
                    </button>
                    <button
                      onClick={copyAllKeys}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition flex items-center justify-center gap-2"
                    >
                      <FaCopy /> Alle kopieren
                    </button>
                  </div>

                  {/* Keys List */}
                  <div className="bg-[#2C2C34] rounded-lg p-4 max-h-[500px] overflow-y-auto">
                    <div className="space-y-2">
                      {generatedKeys.map((keyData, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-[#1A1A1F] p-3 rounded-lg hover:bg-[#252529] transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 font-mono text-sm">#{idx + 1}</span>
                            <span className="font-mono text-sm text-[#00FF9C]">{keyData.key}</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(keyData.key);
                              openDialog({
                                type: "success",
                                title: "✅ Kopiert",
                                message: "Key wurde kopiert!",
                                closeButton: "OK",
                              });
                            }}
                            className="text-gray-400 hover:text-[#00FF9C] transition"
                          >
                            <FaCopy />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* INFO BOX */}
          <div className="bg-gradient-to-r from-blue-600/10 to-blue-600/5 border border-blue-600 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-3 text-blue-400 flex items-center gap-2">
              <FaBox /> Nächste Schritte
            </h3>
            <ol className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                <span>Generiere Keys mit dem Generator oben</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                <span>Lade die Keys herunter (.txt oder .csv)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">3.</span>
                <span>Gib die Keys an deine Reseller weiter (Discord, Telegram, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">4.</span>
                <span>Reseller laden die Keys auf unserer Platform hoch und verkaufen sie</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
