// src/pages/ResellerKeyUpload.tsx - KEY UPLOAD/IMPORT SYSTEM FÜR RESELLER
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaUpload,
  FaFileAlt,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBox,
  FaDollarSign,
  FaKey,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

type ParsedKey = {
  key: string;
  valid: boolean;
  error?: string;
};

export default function ResellerKeyUpload() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [resellerId, setResellerId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(9.99);
  const [licenseDuration, setLicenseDuration] = useState<number>(30); // Days: 0=lifetime, 1=1day, 30=30days, 365=1year
  const [keysText, setKeysText] = useState("");
  const [parsedKeys, setParsedKeys] = useState<ParsedKey[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function init() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        navigate("/reseller-login", { replace: true });
        return;
      }

      // Check if user is reseller and get organization_id from user_metadata
      const isReseller = (data.user?.user_metadata as any)?.is_reseller;
      const orgId = (data.user?.user_metadata as any)?.organization_id;

      if (!isReseller || !orgId) {
        navigate("/reseller-login", { replace: true });
        return;
      }

      setOrganizationId(orgId);

      // Get reseller ID using organization_id
      const { data: resellerData } = await supabase
        .from("resellers")
        .select("id")
        .eq("organization_id", orgId)
        .single();

      if (!resellerData) {
        navigate("/", { replace: true });
        return;
      }

      setResellerId(resellerData.id);
    }
    init();
  }, []);

  function parseKeys() {
    if (!keysText.trim()) {
      openDialog({
        type: "warning",
        title: "⚠️ Keine Keys",
        message: "Bitte gib Keys ein (ein Key pro Zeile)",
        closeButton: "OK",
      });
      return;
    }

    const lines = keysText.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    const parsed: ParsedKey[] = [];

    for (const line of lines) {
      // Basic validation: Key should be at least 8 characters
      if (line.length < 8) {
        parsed.push({ key: line, valid: false, error: "Zu kurz (min. 8 Zeichen)" });
      } else if (line.includes(" ")) {
        parsed.push({ key: line, valid: false, error: "Enthält Leerzeichen" });
      } else {
        parsed.push({ key: line, valid: true });
      }
    }

    setParsedKeys(parsed);

    const validCount = parsed.filter((k) => k.valid).length;
    const invalidCount = parsed.filter((k) => !k.valid).length;

    openDialog({
      type: validCount > 0 ? "success" : "warning",
      title: "📊 Keys geparst",
      message: `${validCount} gültige Keys, ${invalidCount} ungültige Keys`,
      closeButton: "OK",
    });
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setKeysText(text);
    };
    reader.readAsText(file);
  }

  async function handleUploadKeys() {
    if (!resellerId || !productName.trim()) {
      openDialog({
        type: "warning",
        title: "⚠️ Fehler",
        message: "Bitte fülle alle Felder aus",
        closeButton: "OK",
      });
      return;
    }

    const validKeys = parsedKeys.filter((k) => k.valid);

    if (validKeys.length === 0) {
      openDialog({
        type: "warning",
        title: "⚠️ Keine gültigen Keys",
        message: "Bitte füge gültige Keys hinzu",
        closeButton: "OK",
      });
      return;
    }

    setUploading(true);

    try {
      // 1. Create or update reseller_product
      const { data: existingProduct } = await supabase
        .from("reseller_products")
        .select("id")
        .eq("reseller_id", resellerId)
        .eq("product_name", productName)
        .maybeSingle();

      let resellerProductId: string;

      if (existingProduct) {
        resellerProductId = existingProduct.id;
      } else {
        // Create new product
        const { data: newProduct, error: productError } = await supabase
          .from("reseller_products")
          .insert({
            reseller_id: resellerId,
            product_name: productName,
            description: description || null, // Optional description
            reseller_price: price,
            license_duration: licenseDuration, // License duration in days
            quantity_available: 0, // Will be calculated from keys
            quantity_sold: 0,
            status: "active",
          })
          .select()
          .single();

        if (productError) throw productError;
        resellerProductId = newProduct.id;
      }

      // 2. Insert keys into reseller_inventory_keys table
      // NOTE: We need to create this table first!
      // For now, let's store keys in a simple JSON structure in reseller_products

      // Get current keys
      const { data: currentProduct } = await supabase
        .from("reseller_products")
        .select("keys_pool")
        .eq("id", resellerProductId)
        .single();

      let currentKeys: string[] = [];
      try {
        if (currentProduct?.keys_pool) {
          currentKeys = JSON.parse(currentProduct.keys_pool);
        }
      } catch {
        currentKeys = [];
      }

      // Add new keys
      const newKeys = validKeys.map((k) => k.key);
      const allKeys = [...currentKeys, ...newKeys];

      // Update product with new keys and duration
      const { error: updateError } = await supabase
        .from("reseller_products")
        .update({
          keys_pool: JSON.stringify(allKeys),
          quantity_available: allKeys.length,
          license_duration: licenseDuration, // Update duration too
        })
        .eq("id", resellerProductId);

      if (updateError) throw updateError;

      openDialog({
        type: "success",
        title: "✅ Keys hochgeladen!",
        message: `${validKeys.length} Keys wurden erfolgreich hochgeladen und sind jetzt in deinem Shop verfügbar!`,
        closeButton: "OK",
      });

      // Reset form
      setProductName("");
      setDescription("");
      setPrice(9.99);
      setKeysText("");
      setParsedKeys([]);

      // Navigate to inventory
      setTimeout(() => {
        navigate("/reseller-inventory");
      }, 2000);
    } catch (err: any) {
      console.error("Error uploading keys:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message || "Fehler beim Hochladen der Keys",
        closeButton: "OK",
      });
    }

    setUploading(false);
  }

  const validKeysCount = parsedKeys.filter((k) => k.valid).length;
  const invalidKeysCount = parsedKeys.filter((k) => !k.valid).length;

  return (
    <>
      {DialogComponent}
      <div className="flex min-h-screen bg-gradient-to-br from-[#0E0E12] via-[#1A1A1F] to-[#0E0E12]">
        <Sidebar />

        <div className="flex-1 p-8 ml-64">
          {/* HEADER */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/reseller-inventory")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] mb-4 transition"
            >
              <FaArrowLeft /> Zurück zum Inventar
            </button>

            <div className="flex items-center gap-4 mb-2">
              <div className="bg-gradient-to-r from-green-600 to-cyan-600 p-3 rounded-xl">
                <FaUpload className="text-3xl text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-green-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
                  Keys hochladen
                </h1>
                <p className="text-gray-400">Lade Keys hoch die du von Developern bekommen hast</p>
              </div>
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: Product Info & Keys Input */}
            <div className="space-y-6">
              {/* Product Info */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3C3C44] rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <FaBox className="text-[#00FF9C]" />
                  Produkt Info
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-300">
                      Produkt Name *
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="z.B. CS2 Cheat Premium"
                      className="w-full p-3 rounded-lg bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-300">
                      Beschreibung (optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Beschreibe dein Produkt... z.B. Features, was enthalten ist, etc."
                      rows={3}
                      className="w-full p-3 rounded-lg bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-300">
                      Verkaufspreis *
                    </label>
                    <div className="relative">
                      <FaDollarSign className="absolute left-3 top-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 p-3 rounded-lg bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Preis pro Key in Euro</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-300">
                      ⏱️ Lizenz-Laufzeit *
                    </label>
                    <select
                      value={licenseDuration}
                      onChange={(e) => setLicenseDuration(parseInt(e.target.value))}
                      className="w-full p-3 rounded-lg bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                    >
                      <option value={1}>1 Tag</option>
                      <option value={7}>7 Tage</option>
                      <option value={14}>14 Tage</option>
                      <option value={30}>30 Tage (Empfohlen)</option>
                      <option value={60}>60 Tage</option>
                      <option value={90}>90 Tage</option>
                      <option value={180}>180 Tage (6 Monate)</option>
                      <option value={365}>1 Jahr (365 Tage)</option>
                      <option value={0}>♾️ Lifetime (Keine Ablaufdatum)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {licenseDuration === 0
                        ? "🔓 Lifetime - Keys laufen nie ab"
                        : `⏰ Keys sind ${licenseDuration} Tage gültig nach Kauf`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Keys Input */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3C3C44] rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <FaKey className="text-[#00FF9C]" />
                  Keys eingeben
                </h2>

                <div className="space-y-4">
                  {/* Text Area */}
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-300">
                      Keys (ein Key pro Zeile)
                    </label>
                    <textarea
                      value={keysText}
                      onChange={(e) => setKeysText(e.target.value)}
                      placeholder={`KEY-XXXX-XXXX-XXXX\nKEY-YYYY-YYYY-YYYY\nKEY-ZZZZ-ZZZZ-ZZZZ`}
                      rows={10}
                      className="w-full p-3 rounded-lg bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none font-mono text-sm resize-none"
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-300">
                      Oder Datei hochladen
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".txt,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-[#3C3C44] rounded-lg hover:border-[#00FF9C] cursor-pointer transition"
                      >
                        <FaFileAlt />
                        <span>Klicke um .txt oder .csv hochzuladen</span>
                      </label>
                    </div>
                  </div>

                  {/* Parse Button */}
                  <button
                    onClick={parseKeys}
                    disabled={!keysText.trim()}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Keys validieren
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: Preview & Upload */}
            <div className="space-y-6">
              {/* Stats */}
              {parsedKeys.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-600/10 to-green-600/5 border border-green-600 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green-300 mb-1">✅ Gültig</p>
                        <p className="text-3xl font-black text-green-400">{validKeysCount}</p>
                      </div>
                      <FaCheckCircle className="text-green-400 text-3xl opacity-30" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-600/10 to-red-600/5 border border-red-600 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-red-300 mb-1">❌ Ungültig</p>
                        <p className="text-3xl font-black text-red-400">{invalidKeysCount}</p>
                      </div>
                      <FaExclamationTriangle className="text-red-400 text-3xl opacity-30" />
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3C3C44] rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-6">Vorschau</h2>

                {parsedKeys.length === 0 ? (
                  <div className="text-center py-12">
                    <FaKey className="text-6xl text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Keine Keys eingegeben</p>
                    <p className="text-gray-600 text-sm mt-2">
                      Gib Keys ein und klicke auf "Validieren"
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-[#2C2C34] rounded-lg p-4 mb-4 max-h-[400px] overflow-y-auto">
                      <div className="space-y-2">
                        {parsedKeys.map((keyData, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-2 rounded-lg ${
                              keyData.valid ? "bg-green-600/10" : "bg-red-600/10"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {keyData.valid ? (
                                <FaCheckCircle className="text-green-400" />
                              ) : (
                                <FaExclamationTriangle className="text-red-400" />
                              )}
                              <span className="font-mono text-sm">{keyData.key}</span>
                            </div>
                            {keyData.error && (
                              <span className="text-xs text-red-400">{keyData.error}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upload Button */}
                    <button
                      onClick={handleUploadKeys}
                      disabled={uploading || validKeysCount === 0 || !productName.trim()}
                      className="w-full py-4 bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] font-black rounded-xl hover:shadow-2xl hover:shadow-[#00FF9C]/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        "Hochladen..."
                      ) : (
                        <>
                          <FaUpload /> {validKeysCount} Keys hochladen
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* INFO BOX */}
          <div className="mt-6 bg-gradient-to-r from-blue-600/10 to-blue-600/5 border border-blue-600 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-3 text-blue-400 flex items-center gap-2">
              <FaBox /> Wie funktioniert es?
            </h3>
            <ol className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                <span>Bekomme Keys von einem Developer (Discord, Telegram, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                <span>Fülle Produkt Info aus (Name, Beschreibung, Preis)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">3.</span>
                <span>Füge Keys ein (Text Area oder Datei hochladen)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">4.</span>
                <span>Klicke auf "Validieren" und dann "Hochladen"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">5.</span>
                <span>Keys sind jetzt in deinem Inventar und können verkauft werden!</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
