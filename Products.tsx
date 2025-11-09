import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FaBox, FaPlus, FaSearch, FaDownload, FaTrash } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import { useDialog } from "../components/Dialog";
import { useAdvancedFilter, usePagination, exportToCSV } from "../utils/helpers.tsx";

type Product = {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  status: string;
  created_at: string;
};

export default function Products() {
  const { Dialog: DialogComponent, open: openDialog } = useDialog();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", base_price: "", status: "active" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, totalRevenue: 0 });

  const { filters, setFilters, filtered } = useAdvancedFilter(products);
  const pagination = usePagination(filtered, 10);

  useEffect(() => {
    async function init() {
      try {
        console.log("🔄 Initializing Products page...");

        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData.user) {
          console.error("❌ Auth Error:", authError);
          openDialog({
            type: "error",
            title: "❌ Authentifizierung erforderlich",
            message: "Bitte melde dich an um Produkte zu verwalten",
            closeButton: "OK",
          });
          return;
        }

        console.log("✅ User authenticated:", authData.user.id);

        const orgId = (authData.user?.user_metadata as any)?.organization_id;
        console.log("📋 Organization ID from metadata:", orgId);

        if (!orgId) {
          console.error("❌ No organization_id in metadata");
          openDialog({
            type: "error",
            title: "❌ Organisation fehlt",
            message: "Deine Organisation konnte nicht gefunden werden. Bitte melde dich ab und erneut an.",
            closeButton: "OK",
          });
          return;
        }

        console.log("🔍 Verifying organization in database...");
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("id, name")
          .eq("id", orgId)
          .maybeSingle();

        if (orgError) {
          console.error("❌ Database Error:", orgError);
          openDialog({
            type: "error",
            title: "❌ Datenbankfehler",
            message: `Fehler beim Prüfen der Organisation: ${orgError.message}`,
            closeButton: "OK",
          });
          return;
        }

        if (!orgData) {
          console.error("❌ Organization not found in database for ID:", orgId);
          openDialog({
            type: "error",
            title: "❌ Organisation nicht gefunden",
            message: `Die Organisation ${orgId} existiert nicht in der Datenbank. Bitte kontaktiere den Support oder melde dich neu an.`,
            closeButton: "OK",
          });
          return;
        }

        console.log("✅ Organization verified:", orgData.name);
        setOrganizationId(orgId);
        await loadData(orgId);
      } catch (err) {
        console.error("❌ Init Error:", err);
        openDialog({
          type: "error",
          title: "❌ Fehler beim Laden",
          message: `${err}`,
          closeButton: "OK",
        });
      }
    }
    init();
  }, []);

  async function loadData(orgId: string) {
    setLoading(true);
    try {
      console.log("📦 Loading products for org:", orgId);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error loading products:", error);
        throw error;
      }

      console.log("✅ Loaded products:", data?.length || 0);
      
      const totalActive = (data || []).filter(p => p.status === "active").length;
      
      setProducts(data || []);
      setStats({
        total: data?.length || 0,
        active: totalActive,
        totalRevenue: 0,
      });
    } catch (err) {
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

  async function handleAddProduct() {
    if (!newProduct.name || !newProduct.base_price) {
      openDialog({
        type: "warning",
        title: "⚠️ Felder erforderlich",
        message: "Bitte gib Produktname und Preis ein",
        closeButton: "OK",
      });
      return;
    }

    const basePrice = parseFloat(newProduct.base_price);
    if (isNaN(basePrice) || basePrice <= 0) {
      openDialog({
        type: "error",
        title: "❌ Ungültiger Preis",
        message: "Preis muss eine positive Zahl sein",
        closeButton: "OK",
      });
      return;
    }

    if (!organizationId) {
      openDialog({
        type: "error",
        title: "❌ Organisation fehlt",
        message: "Organisation konnte nicht gefunden werden",
        closeButton: "OK",
      });
      return;
    }

    try {
      console.log("📝 Creating product:", { name: newProduct.name, base_price: basePrice, organization_id: organizationId });

      const { data, error } = await supabase.from("products").insert({
        name: newProduct.name,
        description: newProduct.description || "",
        base_price: basePrice,
        organization_id: organizationId,
        status: newProduct.status,
      }).select();

      if (error) {
        console.error("❌ Insert error:", error);
        throw error;
      }

      console.log("✅ Product created:", data);

      openDialog({
        type: "success",
        title: "✅ Produkt hinzugefügt",
        message: `${newProduct.name} (€${basePrice.toFixed(2)}) wurde erfolgreich erstellt`,
        closeButton: "OK",
      });

      setNewProduct({ name: "", description: "", base_price: "", status: "active" });
      setShowAddModal(false);
      if (organizationId) await loadData(organizationId);
    } catch (err: any) {
      console.error("❌ Error:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler beim Erstellen",
        message: err.message || "Fehler beim Erstellen",
        closeButton: "OK",
      });
    }
  }

  async function handleDeleteProduct(productId: string) {
    const confirmed = window.confirm("⚠️ Möchtest du dieses Produkt wirklich löschen?");
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Gelöscht",
        message: "Produkt wurde entfernt",
        closeButton: "OK",
      });

      if (organizationId) await loadData(organizationId);
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message || "Fehler beim Löschen",
        closeButton: "OK",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 bg-[#0E0E12] text-[#E0E0E0] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-4">⏳</div>
            <p className="text-lg">Lädt Produkte...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="flex">
        <Sidebar />

        <main className="flex-1 bg-[#0E0E12] text-[#E0E0E0]">
          <div className="border-b border-[#2C2C34] p-8 bg-gradient-to-r from-[#1A1A1F] to-[#0E0E12]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-extrabold flex items-center gap-2">
                  <FaBox className="text-[#00FF9C]" />
                  Produkte
                </h1>
                <p className="text-gray-400 mt-2">
                  Verwalte alle deine Produkte und Preise
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-[#00FF9C] text-[#0E0E12] rounded-lg font-bold hover:bg-[#00cc80] transition flex items-center gap-2 shadow-lg"
              >
                <FaPlus /> Neues Produkt
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4 hover:border-[#00FF9C] transition">
                <p className="text-gray-400 text-sm">Gesamt Produkte</p>
                <p className="text-3xl font-bold text-[#00FF9C]">{stats.total}</p>
              </div>
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4 hover:border-green-400 transition">
                <p className="text-gray-400 text-sm">Aktive Produkte</p>
                <p className="text-3xl font-bold text-green-400">{stats.active}</p>
              </div>
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4 hover:border-blue-400 transition">
                <p className="text-gray-400 text-sm">Ø Preis</p>
                <p className="text-3xl font-bold text-blue-400">
                  €{products.length > 0 ? (products.reduce((s, p) => s + p.base_price, 0) / products.length).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-[#2C2C34] p-8">
            <div className="flex gap-4 flex-wrap items-end">
              <div className="flex-1 min-w-64">
                <label className="block text-sm text-gray-400 mb-2">🔍 Suche</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Produktname..."
                    value={filters.searchQuery || ""}
                    onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>
              </div>

              {filters.searchQuery && (
                <button
                  onClick={() => setFilters({})}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition text-sm font-bold"
                >
                  Clear
                </button>
              )}

              <button
                onClick={() => exportToCSV(filtered, "products_export.csv")}
                disabled={filtered.length === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-bold disabled:opacity-50 flex items-center gap-2 transition"
              >
                <FaDownload /> Export
              </button>
            </div>

            <div className="text-sm text-gray-400 mt-4">
              Zeige {pagination.currentItems.length} von {filtered.length} Produkte
            </div>
          </div>

          <div className="p-8">
            {pagination.currentItems.length === 0 ? (
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-12 text-center text-gray-400">
                <FaBox className="text-4xl mx-auto mb-4 opacity-30" />
                <p className="text-lg font-semibold mb-2">Keine Produkte gefunden</p>
                <p className="text-sm">Erstelle dein erstes Produkt um zu beginnen</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagination.currentItems.map((product) => (
                  <div
                    key={product.id}
                    className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:bg-[#2C2C34] hover:border-[#00FF9C] transition group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-[#00FF9C]/20 flex items-center justify-center group-hover:bg-[#00FF9C]/30 transition">
                        <FaBox className="text-[#00FF9C] text-lg" />
                      </div>
                    </div>

                    <p className="font-semibold text-lg mb-1">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{product.description}</p>
                    )}
                    <p className="text-sm text-[#00FF9C] font-bold mb-2">
                      €{product.base_price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Erstellt: {new Date(product.created_at).toLocaleDateString("de-DE")}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(product.id);
                          alert("✅ Produkt ID kopiert!");
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-bold transition"
                      >
                        📋 ID
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-bold transition"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={pagination.prevPage}
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 bg-[#2C2C34] rounded disabled:opacity-50 flex items-center gap-2 hover:bg-[#3C3C44] transition"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => pagination.goToPage(page)}
                      className={`w-10 h-10 rounded font-bold transition ${
                        page === pagination.currentPage
                          ? "bg-[#00FF9C] text-black"
                          : "bg-[#2C2C34] hover:bg-[#3C3C44]"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={pagination.nextPage}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 bg-[#2C2C34] rounded disabled:opacity-50 flex items-center gap-2 hover:bg-[#3C3C44] transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaPlus className="text-[#00FF9C]" /> Neues Produkt
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">📦 Produktname</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="z.B. CloudSync Pro"
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">📝 Beschreibung (optional)</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="z.B. Professionelle Cloud-Lösung"
                  rows={3}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">💰 Basis-Preis (€)</label>
                <input
                  type="number"
                  value={newProduct.base_price}
                  onChange={(e) => setNewProduct({ ...newProduct, base_price: e.target.value })}
                  placeholder="49.99"
                  step="0.01"
                  min="0"
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">🟢 Status</label>
                <select
                  value={newProduct.status}
                  onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAddProduct}
                className="flex-1 px-4 py-3 bg-[#00FF9C] text-[#0E0E12] font-bold rounded hover:bg-[#00cc80] transition shadow-lg"
              >
                ✅ Erstellen
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition"
              >
                ❌ Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}