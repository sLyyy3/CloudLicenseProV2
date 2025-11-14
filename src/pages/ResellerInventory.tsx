// src/pages/ResellerInventory.tsx - REDESIGNED: Neues Fließendes Design mit Sidebar
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaBox,
  FaPlus,
  FaSearch,
  FaDownload,
  FaPercent,
  FaCoins,
  FaArchive,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

type ResellerProduct = {
  id: string;
  reseller_id: string;
  product_name: string;
  description?: string;
  reseller_price: number;
  quantity_available: number;
  quantity_sold: number;
  status: string;
  keys_pool?: string;
  created_at?: string;
  license_duration?: number; // License duration in days (0 = lifetime)
};

export default function ResellerInventory() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [inventory, setInventory] = useState<ResellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [resellerId, setResellerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Price Modal
  const [editPriceModal, setEditPriceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ResellerProduct | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;
      let reId = (data.user?.user_metadata as any)?.reseller_id;

      if (!orgId) {
        navigate("/reseller-login", { replace: true });
        return;
      }

      if (!reId) {
        const { data: resellerData } = await supabase
          .from("resellers")
          .select("id")
          .eq("organization_id", orgId)
          .single();

        if (resellerData) {
          reId = resellerData.id;
          await supabase.auth.updateUser({
            data: { is_reseller: true, organization_id: orgId, reseller_id: reId },
          });
        }
      }

      setOrganizationId(orgId);
      setResellerId(reId);
      await loadInventory(reId);
    }
    init();
  }, []);

  async function loadInventory(reId: string) {
    setLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from("reseller_products")
        .select("*")
        .eq("reseller_id", reId)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      if (!productsData || productsData.length === 0) {
        setInventory([]);
        setLoading(false);
        return;
      }

      const productIds = [...new Set(productsData.map((p) => p.product_id))];
      const developerIds = [...new Set(productsData.map((p) => p.developer_id))];

      const { data: productNamesData } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);

      const { data: developerNamesData } = await supabase
        .from("organizations")
        .select("id, name")
        .in("id", developerIds);

      const enrichedInventory = productsData.map((product) => ({
        ...product,
        product_name: productNamesData?.find((p) => p.id === product.product_id)?.name || "Unbekannt",
        developer_name: developerNamesData?.find((d) => d.id === product.developer_id)?.name || "Unbekannt",
      }));

      setInventory(enrichedInventory);
    } catch (err) {
      console.error("Error loading inventory:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Lager konnte nicht geladen werden",
        closeButton: "OK",
      });
    }
    setLoading(false);
  }

  async function handleEditPrice() {
    if (!selectedProduct || !editPrice) return;

    setEditLoading(true);
    try {
      const { error } = await supabase
        .from("reseller_products")
        .update({ reseller_price: parseFloat(editPrice) })
        .eq("id", selectedProduct.id);

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Preis aktualisiert",
        message: `Neuer Preis: €${editPrice}`,
        closeButton: "OK",
      });

      setEditPriceModal(false);
      setSelectedProduct(null);
      setEditPrice("");

      if (resellerId) await loadInventory(resellerId);
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    }
    setEditLoading(false);
  }

  const filtered = inventory.filter((item) =>
    item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalValue = inventory.reduce(
    (sum, item) => sum + item.quantity_available * item.reseller_price,
    0
  );

  const totalRevenue = inventory.reduce((sum, item) => {
    const revenue = item.quantity_sold * item.reseller_price;
    return sum + revenue;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-4 animate-spin">⏳</div>
          <p className="text-lg">Lädt Lager...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}
      
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        <Sidebar />

        {/* HEADER - Mit nahtlosem Design */}
        <div className="ml-0 md:ml-64 bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border-b border-[#00FF9C]/20 p-6 sticky top-0 z-40 shadow-lg shadow-[#00FF9C]/10">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate("/reseller-dashboard")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition mb-4 text-sm"
            >
              <FaArrowLeft /> Zurück zum Dashboard
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
                  <div className="p-3 bg-[#00FF9C]/20 rounded-lg">
                    <FaBox className="text-[#00FF9C] text-2xl" />
                  </div>
                  Lager / Inventar
                </h1>
                <p className="text-gray-400">Verwalte deine Produkte und Preise</p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-sm text-gray-400">Gesamtwert</p>
                <p className="text-3xl font-bold text-[#00FF9C]">€{totalValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="ml-0 md:ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            {/* STATS CARDS - Mit fließendem Design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Gesamtwert */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#00FF9C]/20 rounded-lg p-6 hover:border-[#00FF9C]/50 transition shadow-lg shadow-[#00FF9C]/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm">📦 Gesamtwert</p>
                  <FaArchive className="text-[#00FF9C] text-2xl" />
                </div>
                <p className="text-4xl font-bold text-[#00FF9C]">€{totalValue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">{inventory.length} Produkte</p>
              </div>

              {/* Keys verfügbar */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-blue-500/20 rounded-lg p-6 hover:border-blue-500/50 transition shadow-lg shadow-blue-500/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm">🔑 Keys verfügbar</p>
                  <FaCoins className="text-blue-400 text-2xl" />
                </div>
                <p className="text-4xl font-bold text-blue-400">
                  {inventory.reduce((sum, item) => sum + item.quantity_available, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-2">Zum Verkauf bereit</p>
              </div>

              {/* Umsatz */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-green-500/20 rounded-lg p-6 hover:border-green-500/50 transition shadow-lg shadow-green-500/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm">💰 Umsatz</p>
                  <FaPercent className="text-green-400 text-2xl" />
                </div>
                <p className="text-4xl font-bold text-green-400">€{totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">{inventory.reduce((sum, item) => sum + item.quantity_sold, 0)} Keys verkauft</p>
              </div>
            </div>

            {/* SEARCH & FILTER */}
            <div className="mb-8 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nach Produkt oder Beschreibung suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#1A1A1F] border border-[#2C2C34] rounded-lg focus:border-[#00FF9C] focus:shadow-lg focus:shadow-[#00FF9C]/20 outline-none transition"
                />
              </div>
              <button
                onClick={() => navigate("/reseller-key-upload")}
                className="px-6 py-3 bg-[#00FF9C] text-[#0E0E12] rounded-lg font-bold hover:bg-[#00cc80] transition flex items-center gap-2 shadow-lg shadow-[#00FF9C]/20"
              >
                <FaPlus /> Keys hochladen
              </button>
            </div>

            {/* INVENTORY LIST */}
            {filtered.length === 0 ? (
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-12 text-center">
                <FaBox className="text-5xl mb-4 mx-auto opacity-30 text-gray-400" />
                <p className="text-lg font-semibold mb-2">Kein Lager vorhanden</p>
                <p className="text-gray-400 mb-6">Lade Keys hoch die du von Developern erhalten hast</p>
                <button
                  onClick={() => navigate("/reseller-key-upload")}
                  className="px-6 py-2 bg-[#00FF9C] text-[#0E0E12] rounded font-bold hover:bg-[#00cc80]"
                >
                  Keys hochladen →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C]/30 transition shadow-lg hover:shadow-[#00FF9C]/10"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center mb-4">
                      {/* Product Info */}
                      <div className="md:col-span-2">
                        <h3 className="text-xl font-bold mb-1">{item.product_name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-xs text-gray-500">
                            Status: <span className={item.status === 'active' ? 'text-green-400' : 'text-red-400'}>{item.status === 'active' ? '✅ Aktiv' : '❌ Inaktiv'}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Laufzeit: <span className={item.license_duration === 0 ? 'text-green-400' : 'text-blue-400'}>
                              {item.license_duration === 0 ? '♾️ Lifetime' : `⏰ ${item.license_duration || 30} Tage`}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Preis */}
                      <div className="bg-[#0E0E12]/50 rounded p-4">
                        <p className="text-xs text-gray-400 mb-2">💵 Verkaufspreis</p>
                        <p className="text-2xl font-bold text-[#00FF9C]">€{item.reseller_price?.toFixed(2) || '0.00'}</p>
                        <p className="text-xs text-gray-500 mt-1">pro Key</p>
                      </div>

                      {/* Mengen */}
                      <div className="bg-[#0E0E12]/50 rounded p-4">
                        <p className="text-xs text-gray-400 mb-2">📦 Lagerbestand</p>
                        <p className="text-2xl font-bold text-blue-400">{item.quantity_available}</p>
                        <p className="text-xs text-gray-500 mt-1">Verkauft: {item.quantity_sold}</p>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-3 pt-4 border-t border-[#2C2C34] mt-4">
                      <button
                        onClick={() => {
                          setSelectedProduct(item);
                          setEditPrice(item.reseller_price.toString());
                          setEditPriceModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold flex items-center gap-2 transition"
                      >
                        <FaEdit /> Preis ändern
                      </button>
                      <button
                        onClick={() => navigate('/reseller-key-upload')}
                        className="px-4 py-2 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] rounded font-bold flex items-center gap-2 transition"
                      >
                        <FaPlus /> Mehr Keys hinzufügen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* INFO BOX */}
            <div className="mt-12 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 rounded-lg p-6">
              <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                💡 Lager-Tipps
              </h3>
              <ul className="text-sm text-blue-300 space-y-2">
                <li>✅ Passe deine Preise an um konkurrenzfähig zu sein</li>
                <li>✅ Kaufe beliebte Produkte nach wenn der Bestand niedrig ist</li>
                <li>✅ Verfolge deinen Gewinn pro Produkt</li>
                <li>✅ Verkaufe regelmäßig um Cashflow zu maximieren</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT PRICE MODAL */}
      {editPriceModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">💰 Verkaufspreis ändern</h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-400 mb-2">Produkt</p>
                <p className="text-lg font-bold">{selectedProduct.product_name}</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Neuer Preis (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full p-3 bg-[#2C2C34] border border-[#3C3C44] rounded focus:border-[#00FF9C] outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-1">Einkaufspreis: €{selectedProduct.purchase_price}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditPriceModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-bold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleEditPrice}
                disabled={editLoading}
                className="flex-1 px-4 py-2 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] rounded font-bold disabled:opacity-50"
              >
                {editLoading ? "⏳..." : "✅ Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}