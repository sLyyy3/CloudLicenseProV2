// src/pages/DeveloperProducts.tsx - RESELLER KEY UPLOAD - KOMPLETT NEU!
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaBox,
  FaKey,
  FaUpload,
  FaFileImport,
  FaCheckCircle,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

type Product = {
  id: string;
  name: string;
  description: string;
  base_price: number;
  status: string;
  created_at: string;
  _count?: {
    licenses: number;
  };
};

export default function DeveloperProducts() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [products, setProducts] = useState<Product[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showKeyUpload, setShowKeyUpload] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: "0",
    status: "active",
  });

  const [keyUploadData, setKeyUploadData] = useState({
    keys: "",
    price: "",
    duration_days: "30",
  });

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;
      const isReseller = (data.user?.user_metadata as any)?.is_reseller;

      if (!orgId || !isReseller) {
        navigate("/reseller-login", { replace: true });
        return;
      }

      setOrganizationId(orgId);
      await loadProducts(orgId);
    }
    init();
  }, []);

  async function loadProducts(orgId: string) {
    setLoading(true);
    try {
      console.log("📦 Loading products for org:", orgId);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Load error:", error);
        throw error;
      }

      console.log("✅ Loaded products:", data?.length || 0);
      setProducts(data || []);
    } catch (err: any) {
      console.error("Error loading products:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Produkte konnten nicht geladen werden",
        closeButton: "OK",
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!formData.name || !formData.description || !formData.base_price) {
      openDialog({
        type: "warning",
        title: "⚠️ Alle Felder erforderlich",
        message: "Bitte fülle alle Felder aus!",
        closeButton: "OK",
      });
      return;
    }

    if (!organizationId) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Organization ID fehlt",
        closeButton: "OK",
      });
      return;
    }

    const basePrice = parseFloat(formData.base_price);
    if (isNaN(basePrice) || basePrice <= 0) {
      openDialog({
        type: "warning",
        title: "⚠️ Ungültiger Preis",
        message: "Preis muss eine Zahl größer als 0 sein!",
        closeButton: "OK",
      });
      return;
    }

    try {
      console.log("💾 Speichern...");

      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update({
            name: formData.name,
            description: formData.description,
            base_price: basePrice,
            status: formData.status,
          })
          .eq("id", editingId);

        if (error) throw error;

        openDialog({
          type: "success",
          title: "✅ Produkt aktualisiert!",
          message: `"${formData.name}" wurde aktualisiert`,
          closeButton: "OK",
        });
      } else {
        const { error } = await supabase.from("products").insert({
          name: formData.name,
          description: formData.description,
          base_price: basePrice,
          status: formData.status,
          organization_id: organizationId,
        });

        if (error) throw error;

        openDialog({
          type: "success",
          title: "✅ Produkt erstellt!",
          message: `"${formData.name}" wurde erstellt`,
          closeButton: "OK",
        });
      }

      setFormData({
        name: "",
        description: "",
        base_price: "0",
        status: "active",
      });
      setEditingId(null);
      setShowForm(false);
      await loadProducts(organizationId);
    } catch (err: any) {
      console.error("Error saving product:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message || "Produkt konnte nicht gespeichert werden",
        closeButton: "OK",
      });
    }
  }

  async function handleKeyUpload() {
    if (!keyUploadData.keys || !keyUploadData.price || !selectedProductId) {
      openDialog({
        type: "warning",
        title: "⚠️ Felder fehlen",
        message: "Bitte fülle alle Felder aus!",
        closeButton: "OK",
      });
      return;
    }

    const keys = keyUploadData.keys.split("\n").map(k => k.trim()).filter(k => k);
    const price = parseFloat(keyUploadData.price);
    const durationDays = parseInt(keyUploadData.duration_days);

    if (keys.length === 0) {
      openDialog({
        type: "warning",
        title: "⚠️ Keine Keys",
        message: "Bitte gib mindestens einen Key ein!",
        closeButton: "OK",
      });
      return;
    }

    if (isNaN(price) || price <= 0) {
      openDialog({
        type: "warning",
        title: "⚠️ Ungültiger Preis",
        message: "Preis muss größer als 0 sein!",
        closeButton: "OK",
      });
      return;
    }

    try {
      console.log(`📤 Uploading ${keys.length} keys...`);

      const licenses = keys.map(key => ({
        license_key: key,
        product_id: selectedProductId,
        organization_id: organizationId,
        status: "available",
        price: price,
        duration_days: durationDays,
      }));

      const { error } = await supabase.from("licenses").insert(licenses);

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Keys hochgeladen!",
        message: `${keys.length} Keys wurden erfolgreich hochgeladen!`,
        closeButton: "OK",
      });

      setKeyUploadData({
        keys: "",
        price: "",
        duration_days: "30",
      });
      setShowKeyUpload(false);
      setSelectedProductId(null);
      await loadProducts(organizationId!);
    } catch (err: any) {
      console.error("Error uploading keys:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message || "Keys konnten nicht hochgeladen werden",
        closeButton: "OK",
      });
    }
  }

  async function handleDelete(id: string, name: string) {
    openDialog({
      type: "error",
      title: "⚠️ Produkt löschen?",
      message: `Du willst wirklich "${name}" löschen? Das ist nicht rückgängig zu machen!`,
      closeButton: "Abbrechen",
      actionButton: {
        label: "🗑️ Ja, löschen",
        onClick: async () => {
          try {
            const { error } = await supabase
              .from("products")
              .delete()
              .eq("id", id);

            if (error) throw error;

            openDialog({
              type: "success",
              title: "✅ Gelöscht!",
              message: `"${name}" wurde gelöscht`,
              closeButton: "OK",
            });

            if (organizationId) {
              await loadProducts(organizationId);
            }
          } catch (err: any) {
            openDialog({
              type: "error",
              title: "❌ Fehler",
              message: "Produkt konnte nicht gelöscht werden",
              closeButton: "OK",
            });
          }
        },
      },
    });
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      base_price: product.base_price.toString(),
      status: product.status,
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      base_price: "0",
      status: "active",
    });
  }

  function openKeyUploadForm(productId: string) {
    setSelectedProductId(productId);
    setShowKeyUpload(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-3xl animate-spin">⏳</div>
          <p className="text-lg">Lädt Produkte...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        <Sidebar />

        {/* HEADER */}
        <div className="ml-0 md:ml-64 bg-gradient-to-r from-[#1A1A1F] via-[#2C2C34] to-[#1A1A1F] border-b border-purple-500/20 p-4 md:p-6 sticky top-0 z-40 shadow-lg shadow-purple-500/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg shadow-purple-500/20">
                <FaBox className="text-white text-2xl md:text-3xl" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Keys Hochladen
                </h1>
                <p className="text-gray-400 text-xs md:text-sm">
                  Verwalte deine Produkte und lade Keys hoch
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="px-3 md:px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-bold flex items-center gap-2 transition text-sm md:text-base shadow-lg shadow-purple-500/20"
            >
              <FaPlus /> Neues Produkt
            </button>
          </div>
        </div>

        <div className="ml-0 md:ml-64 p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* ADD/EDIT PRODUCT FORM */}
            {showForm && (
              <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-xl p-6 shadow-lg shadow-purple-500/10">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {editingId ? "✏️ Produkt bearbeiten" : "➕ Neues Produkt"}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-bold">
                      📝 Produktname
                    </label>
                    <input
                      type="text"
                      placeholder="z.B. Rust Cheat - 30 Tage"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full p-3 rounded-lg bg-[#2C2C34] border border-purple-500/30 focus:border-purple-500 outline-none transition text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-bold">
                      💰 Grundpreis (€)
                    </label>
                    <input
                      type="number"
                      placeholder="z.B. 29.99"
                      step="0.01"
                      min="0"
                      value={formData.base_price}
                      onChange={(e) =>
                        setFormData({ ...formData, base_price: e.target.value })
                      }
                      className="w-full p-3 rounded-lg bg-[#2C2C34] border border-purple-500/30 focus:border-purple-500 outline-none transition text-white"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2 font-bold">
                    📄 Beschreibung
                  </label>
                  <textarea
                    placeholder="Beschreibe dein Produkt..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-purple-500/30 focus:border-purple-500 outline-none transition text-white"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2 font-bold">
                    🔄 Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-purple-500/30 focus:border-purple-500 outline-none transition text-white"
                  >
                    <option value="active">✅ Aktiv</option>
                    <option value="inactive">❌ Inaktiv</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-bold transition shadow-lg"
                  >
                    {editingId ? "💾 Aktualisieren" : "✅ Erstellen"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-6 py-3 bg-[#2C2C34] hover:bg-[#3C3C44] rounded-lg font-bold transition"
                  >
                    ❌ Abbrechen
                  </button>
                </div>
              </div>
            )}

            {/* KEY UPLOAD FORM */}
            {showKeyUpload && (
              <div className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 border border-green-500/30 rounded-xl p-6 shadow-lg shadow-green-500/10">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  🔑 Keys hochladen
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-bold">
                      💰 Verkaufspreis (€)
                    </label>
                    <input
                      type="number"
                      placeholder="z.B. 29.99"
                      step="0.01"
                      min="0"
                      value={keyUploadData.price}
                      onChange={(e) =>
                        setKeyUploadData({ ...keyUploadData, price: e.target.value })
                      }
                      className="w-full p-3 rounded-lg bg-[#2C2C34] border border-green-500/30 focus:border-green-500 outline-none transition text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-bold">
                      ⏱️ Laufzeit (Tage)
                    </label>
                    <input
                      type="number"
                      placeholder="z.B. 30"
                      min="1"
                      value={keyUploadData.duration_days}
                      onChange={(e) =>
                        setKeyUploadData({ ...keyUploadData, duration_days: e.target.value })
                      }
                      className="w-full p-3 rounded-lg bg-[#2C2C34] border border-green-500/30 focus:border-green-500 outline-none transition text-white"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2 font-bold">
                    🔑 Keys (ein Key pro Zeile)
                  </label>
                  <textarea
                    placeholder={`ABCD-1234-EFGH-5678\nXYZ1-2345-ABCD-6789\n...`}
                    value={keyUploadData.keys}
                    onChange={(e) =>
                      setKeyUploadData({ ...keyUploadData, keys: e.target.value })
                    }
                    rows={8}
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-green-500/30 focus:border-green-500 outline-none transition text-white font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {keyUploadData.keys.split("\n").filter(k => k.trim()).length} Keys
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleKeyUpload}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-bold transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <FaUpload /> Keys hochladen
                  </button>
                  <button
                    onClick={() => {
                      setShowKeyUpload(false);
                      setSelectedProductId(null);
                      setKeyUploadData({ keys: "", price: "", duration_days: "30" });
                    }}
                    className="flex-1 px-6 py-3 bg-[#2C2C34] hover:bg-[#3C3C44] rounded-lg font-bold transition"
                  >
                    ❌ Abbrechen
                  </button>
                </div>
              </div>
            )}

            {/* PRODUCTS LIST */}
            {products.length === 0 ? (
              <div className="text-center py-12 bg-[#1A1A1F] border border-[#2C2C34] rounded-xl">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-400 text-lg mb-6">
                  Noch keine Produkte vorhanden
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-bold shadow-lg shadow-purple-500/20 inline-flex items-center gap-2"
                >
                  <FaPlus /> Erstes Produkt erstellen
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-purple-500/30 rounded-xl p-6 hover:border-purple-500 transition shadow-lg hover:shadow-purple-500/20"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white">{product.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(product.created_at).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          product.status === "active"
                            ? "bg-green-600/20 text-green-400"
                            : "bg-gray-600/20 text-gray-400"
                        }`}
                      >
                        {product.status === "active" ? "✅" : "❌"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="bg-purple-600/20 rounded-lg p-3 mb-4 border border-purple-500/30">
                      <p className="text-xs text-purple-400 font-bold">Grundpreis</p>
                      <p className="text-2xl font-bold text-purple-300">
                        €{product.base_price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => openKeyUploadForm(product.id)}
                        className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-2 shadow-lg"
                      >
                        <FaUpload /> Keys +
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg font-bold transition flex items-center justify-center gap-2"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg font-bold transition flex items-center justify-center gap-2"
                      >
                        <FaTrash /> Del
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
