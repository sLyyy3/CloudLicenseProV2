// src/pages/DeveloperLicenses.tsx - LICENSES MANAGEMENT
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaArrowLeft,
  FaPlus,
  FaKey,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaCopy,
  FaSearch,
  FaDownload,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type License = {
  id: string;
  license_key: string;
  product_id: string;
  product_name?: string;
  customer_email?: string;
  status: "active" | "inactive" | "expired";
  created_at: string;
};

type Product = {
  id: string;
  name: string;
};

export default function DeveloperLicenses() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [licenses, setLicenses] = useState<License[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive" | "expired"
  >("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    product_id: "",
    customer_email: "",
    quantity: "1",
  });

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;
      const isDev = (data.user?.user_metadata as any)?.is_developer;

      if (!orgId || !isDev) {
        navigate("/dev-login", { replace: true });
        return;
      }

      setOrganizationId(orgId);
      await loadData(orgId);
    }
    init();
  }, []);

  async function loadData(orgId: string) {
    setLoading(true);
    try {
      // Lade Licenses
      const { data: licenseData } = await supabase
        .from("licenses")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      // Lade Products
      const { data: productData } = await supabase
        .from("products")
        .select("id, name")
        .eq("organization_id", orgId);

      if (licenseData) {
        const enriched = licenseData.map((lic: any) => {
          const product = productData?.find((p) => p.id === lic.product_id);
          return {
            ...lic,
            product_name: product?.name || "Unbekanntes Produkt",
          };
        });
        setLicenses(enriched);
      }

      if (productData) setProducts(productData);
    } catch (err) {
      console.error("Error loading data:", err);
    }
    setLoading(false);
  }

  function generateLicenseKey(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PROD-${year}${month}-${random}`;
  }

  async function handleCreateLicense() {
    if (!formData.product_id) {
      openDialog({
        type: "warning",
        title: "⚠️ Produkt erforderlich",
        message: "Bitte wähle ein Produkt",
        closeButton: "OK",
      });
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity < 1) {
      openDialog({
        type: "warning",
        title: "⚠️ Ungültige Menge",
        message: "Bitte gib eine gültige Anzahl ein",
        closeButton: "OK",
      });
      return;
    }

    try {
      const licensesToCreate = Array(quantity)
        .fill(null)
        .map(() => ({
          organization_id: organizationId,
          product_id: formData.product_id,
          license_key: generateLicenseKey(),
          customer_email: formData.customer_email || null,
          status: "active",
        }));

      const { error } = await supabase
        .from("licenses")
        .insert(licensesToCreate);

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Lizenzen erstellt!",
        message: `${quantity} neue Lizenz${quantity > 1 ? "en" : ""} wurden erstellt`,
        closeButton: "OK",
      });

      setFormData({
        product_id: "",
        customer_email: "",
        quantity: "1",
      });
      setShowCreateForm(false);

      if (organizationId) await loadData(organizationId);
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    }
  }

  async function handleToggleStatus(license: License) {
    const newStatus =
      license.status === "active" ? "inactive" : "active";

    try {
      const { error } = await supabase
        .from("licenses")
        .update({ status: newStatus })
        .eq("id", license.id);

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Status aktualisiert",
        message: `Lizenz ist jetzt ${newStatus === "active" ? "aktiv" : "inaktiv"}`,
        closeButton: "OK",
      });

      if (organizationId) await loadData(organizationId);
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    }
  }

  async function handleDeleteLicense(id: string) {
    if (!confirm("⚠️ Lizenz wirklich löschen?")) return;

    try {
      const { error } = await supabase.from("licenses").delete().eq("id", id);

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Gelöscht",
        message: "Lizenz wurde entfernt",
        closeButton: "OK",
      });

      if (organizationId) await loadData(organizationId);
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    }
  }

  const stats = {
    total: licenses.length,
    active: licenses.filter((l) => l.status === "active").length,
    inactive: licenses.filter((l) => l.status === "inactive").length,
    expired: licenses.filter((l) => l.status === "expired").length,
  };

  let filtered = licenses;
  if (searchQuery) {
    filtered = filtered.filter(
      (l) =>
        l.license_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  if (filterStatus !== "all") {
    filtered = filtered.filter((l) => l.status === filterStatus);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⏳</div>
          <p>Lädt Lizenzen...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        {/* HEADER */}
        <div className="bg-[#1A1A1F] border-b border-[#2C2C34] p-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate("/dev-dashboard")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition mb-4"
            >
              <FaArrowLeft /> Zurück zum Dashboard
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FaKey className="text-[#00FF9C]" />
              Lizenzen Management
            </h1>
            <p className="text-gray-400 mt-1">
              Erstelle und verwalte deine Lizenzen
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <p className="text-gray-400 text-sm">Gesamt</p>
              <p className="text-4xl font-bold text-[#00FF9C]">{stats.total}</p>
            </div>
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <p className="text-gray-400 text-sm">Aktiv</p>
              <p className="text-4xl font-bold text-green-400">
                {stats.active}
              </p>
            </div>
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <p className="text-gray-400 text-sm">Inaktiv</p>
              <p className="text-4xl font-bold text-gray-400">
                {stats.inactive}
              </p>
            </div>
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <p className="text-gray-400 text-sm">Abgelaufen</p>
              <p className="text-4xl font-bold text-red-400">{stats.expired}</p>
            </div>
          </div>

          {/* CREATE FORM */}
          {showCreateForm && (
            <div className="bg-[#1A1A1F] border border-purple-600/50 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6">➕ Neue Lizenzen</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Produkt *
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) =>
                      setFormData({ ...formData, product_id: e.target.value })
                    }
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-purple-600 outline-none transition"
                  >
                    <option value="">-- Wähle ein Produkt --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Anzahl *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-purple-600 outline-none transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-2">
                    Kunden-Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="kunde@example.com"
                    value={formData.customer_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_email: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-purple-600 outline-none transition"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateLicense}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded font-bold transition"
                >
                  ✅ Erstellen
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded font-bold transition"
                >
                  ❌ Abbrechen
                </button>
              </div>
            </div>
          )}

          {/* FILTER & BUTTONS */}
          <div className="flex gap-4 mb-6 flex-col md:flex-row">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Nach Keys oder Produkten suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as
                    | "all"
                    | "active"
                    | "inactive"
                    | "expired"
                )
              }
              className="px-4 py-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
            >
              <option value="all">Alle</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
              <option value="expired">Abgelaufen</option>
            </select>

            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded font-bold flex items-center gap-2 transition whitespace-nowrap"
              >
                <FaPlus /> Neue Lizenz
              </button>
            )}
          </div>

          {/* LICENSES TABLE */}
          {filtered.length === 0 ? (
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 text-center text-gray-400">
              <FaKey className="text-4xl mb-4 mx-auto opacity-50" />
              <p className="text-lg font-semibold mb-2">Keine Lizenzen</p>
              <p className="text-sm">Erstelle deine erste Lizenz</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2C2C34]">
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-400">
                      License Key
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-400">
                      Produkt
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-400">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-400">
                      Erstellt
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-400">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((license) => (
                    <tr
                      key={license.id}
                      className="border-b border-[#2C2C34] hover:bg-[#2C2C34] transition"
                    >
                      <td className="py-3 px-4">
                        <code className="text-sm font-mono text-[#00FF9C] bg-[#0E0E12] px-2 py-1 rounded">
                          {license.license_key}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {license.product_name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded font-bold ${
                            license.status === "active"
                              ? "bg-green-600 text-white"
                              : license.status === "inactive"
                              ? "bg-gray-600 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {license.status === "active"
                            ? "✅ Aktiv"
                            : license.status === "inactive"
                            ? "⏸️ Inaktiv"
                            : "❌ Abgelaufen"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {new Date(license.created_at).toLocaleDateString(
                          "de-DE"
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                license.license_key
                              );
                              openDialog({
                                type: "success",
                                title: "✅ Kopiert!",
                                message: "Key wurde kopiert",
                                closeButton: "OK",
                              });
                            }}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-bold transition"
                          >
                            <FaCopy />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(license)}
                            className={`px-2 py-1 rounded text-xs font-bold transition ${
                              license.status === "active"
                                ? "bg-yellow-600 hover:bg-yellow-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {license.status === "active" ? (
                              <FaToggleOn />
                            ) : (
                              <FaToggleOff />
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteLicense(license.id)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-bold transition"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* INFO */}
          <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-6 mt-12">
            <h3 className="font-bold text-blue-400 mb-3">💡 Lizenzen erstellen</h3>
            <ul className="text-sm text-blue-300 space-y-2">
              <li>
                ✅ Erstelle eine oder mehrere Lizenzen auf einmal (Bulk-Erstellung)
              </li>
              <li>✅ Jede Lizenz hat einen eindeutigen Key</li>
              <li>✅ Kunden-Email ist optional</li>
              <li>✅ Wechsle Status zwischen Aktiv/Inaktiv</li>
              <li>
                ✅ Kopiere Keys einfach und versende sie an deine Kunden
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
