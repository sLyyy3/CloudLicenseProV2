// src/pages/DeveloperProducts.tsx - KOMPLETT FIXED - base_price hinzugefügt!
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaBox,
  FaArrowLeft,
  FaChevronDown,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type Product = {
  id: string;
  name: string;
  description: string;
  base_price: number;
  status: string;
  created_at: string;
};

export default function DeveloperProducts() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [products, setProducts] = useState<Product[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: "0", // ✅ HINZUGEFÜGT!
    status: "active",
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
      console.log("   - name:", formData.name);
      console.log("   - base_price:", basePrice);

      if (editingId) {
        // UPDATE
        console.log("📝 UPDATE Product:", editingId);
        const { error } = await supabase
          .from("products")
          .update({
            name: formData.name,
            description: formData.description,
            base_price: basePrice, // ✅ HINZUGEFÜGT!
            status: formData.status,
          })
          .eq("id", editingId);

        if (error) throw error;

        console.log("✅ Product updated");

        openDialog({
          type: "success",
          title: "✅ Produkt aktualisiert!",
          message: `"${formData.name}" wurde aktualisiert`,
          closeButton: "OK",
        });
      } else {
        // CREATE
        console.log("✨ CREATE Product");
        const { error } = await supabase.from("products").insert({
          name: formData.name,
          description: formData.description,
          base_price: basePrice, // ✅ HINZUGEFÜGT!
          status: formData.status,
          organization_id: organizationId,
        });

        if (error) {
          console.error("❌ Create error:", error);
          throw error;
        }

        console.log("✅ Product created");

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <p>⏳ Produkte werden geladen...</p>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        {/* HEADER */}
        <div className="bg-[#1A1A1F] border-b border-[#2C2C34] p-6 mb-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/dev-dashboard")}
                className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition"
              >
                <FaArrowLeft /> Zurück
              </button>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FaBox className="text-[#00FF9C]" />
                📦 Produkte Verwaltung
              </h1>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] rounded-lg font-bold flex items-center gap-2 transition"
            >
              <FaPlus /> Neues Produkt
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {/* ADD/EDIT FORM */}
          {showForm && (
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6">
                {editingId ? "✏️ Produkt bearbeiten" : "➕ Neues Produkt"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    📝 Produktname
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. AimBot Pro"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>

                {/* Base Price - ✅ WICHTIG! */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    💰 Grundpreis (€)
                  </label>
                  <input
                    type="number"
                    placeholder="z.B. 5.99"
                    step="0.01"
                    min="0"
                    value={formData.base_price}
                    onChange={(e) =>
                      setFormData({ ...formData, base_price: e.target.value })
                    }
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">
                  📄 Beschreibung
                </label>
                <textarea
                  placeholder="Beschreibe dein Produkt..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>

              {/* Status */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">
                  🔄 Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="active">✅ Aktiv</option>
                  <option value="inactive">❌ Inaktiv</option>
                </select>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-3 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] rounded-lg font-bold transition"
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

          {/* PRODUCTS LIST */}
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-6">
                📭 Noch keine Produkte
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] rounded-lg font-bold"
              >
                <FaPlus className="inline mr-2" /> Erstes Produkt erstellen
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C] transition"
                >
                  {/* HEADER */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{product.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(product.created_at).toLocaleDateString(
                          "de-DE"
                        )}
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

                  {/* DESCRIPTION */}
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* PRICE - ✅ ANGEZEIGT! */}
                  <div className="bg-[#2C2C34] rounded p-3 mb-4">
                    <p className="text-xs text-gray-400">Grundpreis</p>
                    <p className="text-2xl font-bold text-[#00FF9C]">
                      €{product.base_price.toFixed(2)}
                    </p>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition flex items-center justify-center gap-2"
                    >
                      <FaEdit /> Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition flex items-center justify-center gap-2"
                    >
                      <FaTrash /> Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}