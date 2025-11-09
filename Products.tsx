// src/pages/Products.tsx - ✅ FIXED: base_price hinzugefügt!
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FaBox, FaPlus, FaSearch, FaDownload, FaTrash } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import { useDialog } from "../components/Dialog";
import { useAdvancedFilter, usePagination, exportToCSV } from "../utils/helpers.tsx";

type Product = {
  id: string;
  name: string;
  base_price: number;
  created_at: string;
};

export default function Products() {
  const { Dialog: DialogComponent, open: openDialog } = useDialog();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: "", base_price: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
  });

  // Filter & Search
  const { filters, setFilters, filtered } = useAdvancedFilter(products);
  const pagination = usePagination(filtered, 10);

  // Load Data
  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;

      if (!orgId) {
        openDialog({
          type: "error",
          title: "❌ Organisation fehlt",
          message: "Bitte melde dich ab und neu an",
          closeButton: "OK",
        });
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
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (data) {
        setProducts(data);
        setStats({ total: data.length });
      }
    } catch (err) {
      console.error("Error loading products:", err);
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

    console.log("📦 Creating product with base_price:", basePrice);

    const { error } = await supabase
      .from("products")
      .insert({
        name: newProduct.name,
        base_price: basePrice, // ✅ JETZT DABEI!
        organization_id: organizationId,
      });

    if (error) {
      console.error("❌ Error:", error);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: error.message,
        closeButton: "OK",
      });
    } else {
      openDialog({
        type: "success",
        title: "✅ Produkt hinzugefügt",
        message: `${newProduct.name} (€${basePrice}) wurde erfolgreich erstellt`,
        closeButton: "OK",
      });
      setNewProduct({ name: "", base_price: "" });
      setShowAddModal(false);
      if (organizationId) loadData(organizationId);
    }
  }

  async function handleDeleteProduct(productId: string) {
    const confirmed = window.confirm("❌ Möchtest du dieses Produkt wirklich löschen?");
    if (!confirmed) return;

    const { error } = await supabase.from("products").delete().eq("id", productId);

    if (error) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: error.message,
        closeButton: "OK",
      });
    } else {
      openDialog({
        type: "success",
        title: "✅ Gelöscht",
        message: "Produkt wurde entfernt",
        closeButton: "OK",
      });
      if (organizationId) loadData(organizationId);
    }
  }

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 bg-[#0E0E12] text-[#E0E0E0] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="loader mb-4"></div>
            <p>Lädt Produkte...</p>
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
          {/* HEADER */}
          <div className="border-b border-[#2C2C34] p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-extrabold flex items-center gap-2">
                  <FaBox className="text-[#00FF9C]" />
                  Produkte
                </h1>
                <p className="text-gray-400 mt-2">
                  Verwalte alle deine Produkte
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-3 bg-[#00FF9C] text-[#0E0E12] rounded-lg font-bold hover:bg-[#00cc80] transition flex items-center gap-2"
              >
                <FaPlus /> Neues Produkt
              </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 gap-4 mt-6">
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4">
                <p className="text-gray-400 text-sm">Gesamt Produkte</p>
                <p className="text-3xl font-bold text-[#00FF9C]">{stats.total}</p>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER */}
          <div className="border-b border-[#2C2C34] p-8">
            <div className="flex gap-4 flex-wrap items-end">
              {/* Search Input */}
              <div className="flex-1 min-w-64">
                <label className="block text-sm text-gray-400 mb-2">Suche</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Produktname..."
                    value={filters.searchQuery || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, searchQuery: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters({})}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition text-sm font-bold"
                >
                  Clear
                </button>
              )}

              {/* Export Button */}
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

          {/* PRODUCT LIST */}
          <div className="p-8">
            {pagination.currentItems.length === 0 ? (
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 text-center text-gray-400">
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
                    <p className="text-sm text-[#00FF9C] font-bold mb-2">€{product.base_price.toFixed(2)}</p>
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

            {/* PAGINATION */}
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
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => pagination.goToPage(page)}
                      className={`
                        w-10 h-10 rounded font-bold transition
                        ${
                          page === pagination.currentPage
                            ? "bg-[#00FF9C] text-black"
                            : "bg-[#2C2C34] hover:bg-[#3C3C44]"
                        }
                      `}
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

      {/* ADD PRODUCT MODAL - ✅ FIXED WITH base_price */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">➕ Neues Produkt</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Produktname</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  placeholder="z.B. CloudSync Pro"
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">💰 Basis-Preis (€)</label>
                <input
                  type="number"
                  value={newProduct.base_price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, base_price: e.target.value })
                  }
                  placeholder="z.B. 49.99"
                  step="0.01"
                  min="0"
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAddProduct}
                className="flex-1 px-4 py-3 bg-[#00FF9C] text-[#0E0E12] font-bold rounded hover:bg-[#00cc80] transition"
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