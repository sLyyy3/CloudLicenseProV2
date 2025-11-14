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
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
          setLoading(false);
          openDialog({
            type: "error",
            title: "❌ Authentifizierung erforderlich",
            message: "Bitte melde dich an, um Produkte zu verwalten.",
            closeButton: "OK",
          });
          return;
        }

        const orgId = (authData.user?.user_metadata as any)?.organization_id;
        if (!orgId) {
          setLoading(false);
          openDialog({
            type: "error",
            title: "❌ Organisation fehlt",
            message: "Bitte melde dich erneut an.",
            closeButton: "OK",
          });
          return;
        }

        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("id, name")
          .eq("id", orgId)
          .maybeSingle();

        if (orgError || !orgData) {
          setLoading(false);
          openDialog({
            type: "error",
            title: "❌ Organisation nicht gefunden",
            message: "Fehler beim Abrufen der Organisation.",
            closeButton: "OK",
          });
          return;
        }

        setOrganizationId(orgId);
        await loadData(orgId);
      } catch (err) {
        setLoading(false);
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
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const totalActive = (data || []).filter((p) => p.status === "active").length;

      setProducts(data || []);
      setStats({
        total: data?.length || 0,
        active: totalActive,
        totalRevenue: 0,
      });
    } catch (err) {
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
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: newProduct.name,
          description: newProduct.description || "",
          base_price: basePrice,
          organization_id: organizationId,
          status: newProduct.status,
        })
        .select();

      if (error) throw error;

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
      <div className="flex w-full min-h-screen bg-[#0F0F14]">
        <Sidebar />
        <main className="ml-64 flex-1 bg-[#0F0F14] text-[#E0E0E0] min-h-screen flex items-center justify-center">
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
      <div className="flex w-full min-h-screen bg-[#0F0F14]">
        <Sidebar />
        <main className="ml-64 flex-1 bg-[#0F0F14] text-[#E0E0E0] p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FaBox /> Produkte ({stats.total})
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-[#00FF9C] text-black font-semibold rounded hover:bg-[#00cc80] transition"
              >
                <FaPlus className="inline mr-2" /> Neu
              </button>
              <button
                onClick={() => exportToCSV(products, "products_export.csv")}
                className="px-4 py-2 bg-[#2a2a34] border border-[#3a3a44] rounded hover:bg-[#3a3a44] transition"
              >
                <FaDownload className="inline mr-2" /> Export
              </button>
            </div>
          </div>

          {/* Suchleiste */}
          <div className="flex items-center mb-6 bg-[#1a1a24] p-3 rounded-xl border border-[#2a2a34]">
            <FaSearch className="text-[#a0a0a8] mr-3" />
            <input
              type="text"
              placeholder="Produkte durchsuchen..."
              value={filters.search || ""}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="flex-1 bg-transparent outline-none text-[#E0E0E0]"
            />
          </div>

          {/* Produktliste */}
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 mt-20">Keine Produkte gefunden.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b border-[#2a2a34] text-[#a0a0a8]">
                    <th className="p-3">Name</th>
                    <th className="p-3">Beschreibung</th>
                    <th className="p-3">Preis (€)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.currentItems.map((product) => (
                    <tr key={product.id} className="border-b border-[#2a2a34] hover:bg-[#1a1a24] transition">
                      <td className="p-3 font-medium">{product.name}</td>
                      <td className="p-3 text-gray-400">{product.description || "–"}</td>
                      <td className="p-3">{product.base_price.toFixed(2)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            product.status === "active" ? "bg-green-700/30 text-green-400" : "bg-red-700/30 text-red-400"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-400 hover:text-red-600 transition"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Modal bleibt gleich */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaPlus className="text-[#00FF9C]" /> Neues Produkt
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">📦 Produktname</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="z.B. CloudSync Pro"
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">📝 Beschreibung</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Kurze Beschreibung..."
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">💶 Preis</label>
                <input
                  type="number"
                  value={newProduct.base_price}
                  onChange={(e) => setNewProduct({ ...newProduct, base_price: e.target.value })}
                  placeholder="z.B. 19.99"
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                />
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
