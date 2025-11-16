// src/pages/CreateLicense.tsx - EINFACH KOPIEREN & EINFÜGEN!
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaKey, FaSync, FaCheck, FaCopy } from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import { generateLicenseKey } from "../lib/helpers.tsx";

export default function CreateLicense() {
  const { Dialog: DialogComponent, open: openDialog } = useDialog();
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [licenseKey, setLicenseKey] = useState("");
  const [status, setStatus] = useState("active");
  const [type, setType] = useState("single");
  const [productId, setProductId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [maxActivations, setMaxActivations] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Lade Organization ID
  useEffect(() => {
    async function fetchOrg() {
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;
      setOrganizationId(orgId);
    }
    fetchOrg();
  }, []);

  // Lade Products & Customers
  useEffect(() => {
    async function fetchData() {
      if (!organizationId) return;

      const { data: prod } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", organizationId);

      const { data: cust } = await supabase
        .from("customers")
        .select("*")
        .eq("organization_id", organizationId);

      setProducts(prod || []);
      setCustomers(cust || []);
    }
    fetchData();
  }, [organizationId]);

  // Auto-Generate Key
  useEffect(() => {
    if (autoGenerate && productId && customerId) {
      const productName = products.find(p => p.id === productId)?.name;
      const customerName = customers.find(c => c.id === customerId)?.name;
      const newKey = generateLicenseKey({
        productName: productName || "PROD",
        customerName: customerName || "CUST"
      });
      setLicenseKey(newKey);
    }
  }, [productId, customerId, autoGenerate, products, customers]);

  // Regenerate Key
  function handleRegenerateKey() {
    const newKey = generateLicenseKey();
    setLicenseKey(newKey);
    openDialog({
      type: "success",
      title: "✅ Neuer Key generiert",
      message: (
        <div className="text-left space-y-2">
          <p className="text-sm bg-[#2C2C34] p-2 rounded font-mono">
            {newKey}
          </p>
        </div>
      ),
      closeButton: "OK",
    });
  }

  // Copy to Clipboard
  function copyToClipboard() {
    navigator.clipboard.writeText(licenseKey);
    openDialog({
      type: "success",
      title: "✅ Kopiert!",
      message: "License Key wurde in die Zwischenablage kopiert",
      closeButton: "OK",
    });
  }

  // Create License
  async function handleCreate() {
    if (!licenseKey) {
      openDialog({
        type: "error",
        title: "❌ License Key erforderlich",
        message: "Bitte generiere oder gib einen License Key ein!",
        closeButton: "OK",
      });
      return;
    }

    if (!productId) {
      openDialog({
        type: "error",
        title: "❌ Produkt erforderlich",
        message: "Bitte wähle ein Produkt aus!",
        closeButton: "OK",
      });
      return;
    }

    if (!customerId) {
      openDialog({
        type: "error",
        title: "❌ Kunde erforderlich",
        message: "Bitte wähle einen Kunden aus!",
        closeButton: "OK",
      });
      return;
    }

    // Check duplicate
    const { data: existingKey } = await supabase
      .from("licenses")
      .select("id")
      .eq("license_key", licenseKey)
      .single();

    if (existingKey) {
      openDialog({
        type: "error",
        title: "❌ Duplicate Key",
        message: "Dieser License Key existiert bereits! Bitte generiere einen neuen.",
        closeButton: "OK",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("licenses").insert({
        license_key: licenseKey,
        status,
        type,
        product_id: productId,
        customer_id: customerId,
        organization_id: organizationId,
        max_activations: parseInt(maxActivations) || 1,
        expires_at: expiresAt || null,
      });

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Lizenz erstellt!",
        message: (
          <div className="text-left space-y-3">
            <div className="bg-green-600/20 border border-green-600 rounded p-3">
              <p className="font-bold text-green-400">License erfolgreich erstellt!</p>
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              <p><strong>Key:</strong> <code className="bg-[#2C2C34] px-1 rounded">{licenseKey}</code></p>
              <p><strong>Produkt:</strong> {products.find(p => p.id === productId)?.name}</p>
              <p><strong>Kunde:</strong> {customers.find(c => c.id === customerId)?.name}</p>
            </div>
          </div>
        ),
        closeButton: "OK",
      });

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 2500);

    } catch (err: any) {
      console.error(err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] p-8">
        <h1 className="text-4xl font-extrabold mb-2 flex items-center gap-2">
          <FaKey className="text-[#00FF9C]" />
          Neue Lizenz erstellen
        </h1>
        <p className="text-gray-400 mb-8">Erstelle eine neue License Key für einen Kunden</p>

        <div className="max-w-2xl">
          {/* LICENSE KEY SECTION */}
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">🔐 License Key</h2>

            <div className="space-y-4">
              {/* Auto-Generate Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoGenerate}
                  onChange={(e) => setAutoGenerate(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">🤖 Automatisch generieren</span>
              </label>

              {/* Key Input */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">License Key</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="PROD-CUST-ABC12345-XYZ1"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    disabled={autoGenerate}
                    className="flex-1 p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateKey}
                    className="px-4 py-3 bg-[#00FF9C] text-[#0E0E12] rounded font-bold hover:bg-[#00cc80] transition flex items-center gap-2"
                  >
                    <FaSync /> Neu
                  </button>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    disabled={!licenseKey}
                    className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <FaCopy /> Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Format: PROD-CUST-RANDOMHEX-TIMESTAMP
                </p>
              </div>
            </div>
          </div>

          {/* BASICS SECTION */}
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">📋 Basis Informationen</h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Produkt */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Produkt *</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="">-- Wähle Produkt --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kunde */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Kunde *</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="">-- Wähle Kunde --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="active">✅ Active</option>
                  <option value="inactive">⏸️ Inactive</option>
                  <option value="expired">❌ Expired</option>
                  <option value="revoked">🚫 Revoked</option>
                </select>
              </div>

              {/* Lizenz Typ */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Lizenz Typ</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="single">👤 Single User</option>
                  <option value="floating">🔄 Floating (Shared)</option>
                  <option value="concurrent">⚡ Concurrent (Limited)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ADVANCED SECTION */}
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">⚙️ Erweiterte Optionen</h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Max Activations */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Max. Aktivierungen
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={maxActivations}
                  onChange={(e) => setMaxActivations(e.target.value)}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Ablaufdatum (optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4">
            <button
              onClick={handleCreate}
              disabled={loading || !licenseKey || !productId || !customerId}
              className="flex-1 py-3 bg-[#00FF9C] text-[#0E0E12] font-bold rounded hover:bg-[#00cc80] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FaCheck /> {loading ? "Wird erstellt..." : "Lizenz erstellen"}
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 py-3 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </>
  );
}