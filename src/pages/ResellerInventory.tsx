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

  // Edit Modal - Now supports ALL fields
  const [editModal, setEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ResellerProduct | null>(null);
  const [editFields, setEditFields] = useState({
    product_name: "",
    description: "",
    reseller_price: "",
    status: "",
    license_duration: "",
  });
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

  async function handleEditProduct() {
    if (!selectedProduct) return;

    setEditLoading(true);
    try {
      const updateData: any = {};

      // Only update fields that have changed
      if (editFields.product_name && editFields.product_name !== selectedProduct.product_name) {
        updateData.product_name = editFields.product_name;
      }
      if (editFields.description !== undefined && editFields.description !== selectedProduct.description) {
        updateData.description = editFields.description;
      }
      if (editFields.reseller_price && parseFloat(editFields.reseller_price) !== selectedProduct.reseller_price) {
        updateData.reseller_price = parseFloat(editFields.reseller_price);
      }
      if (editFields.status && editFields.status !== selectedProduct.status) {
        updateData.status = editFields.status;
      }
      if (editFields.license_duration !== undefined && parseInt(editFields.license_duration) !== selectedProduct.license_duration) {
        updateData.license_duration = parseInt(editFields.license_duration);
      }

      if (Object.keys(updateData).length === 0) {
        openDialog({
          type: "warning",
          title: "⚠️ Keine Änderungen",
          message: "Du hast keine Felder geändert.",
          closeButton: "OK",
        });
        setEditLoading(false);
        return;
      }

      const { error } = await supabase
        .from("reseller_products")
        .update(updateData)
        .eq("id", selectedProduct.id);

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Produkt aktualisiert",
        message: `${Object.keys(updateData).length} Feld(er) wurden erfolgreich aktualisiert!`,
        closeButton: "OK",
      });

      setEditModal(false);
      setSelectedProduct(null);
      setEditFields({
        product_name: "",
        description: "",
        reseller_price: "",
        status: "",
        license_duration: "",
      });

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
                          setEditFields({
                            product_name: item.product_name,
                            description: item.description || "",
                            reseller_price: item.reseller_price.toString(),
                            status: item.status,
                            license_duration: (item.license_duration || 0).toString(),
                          });
                          setEditModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold flex items-center gap-2 transition"
                      >
                        <FaEdit /> Bearbeiten
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

      {/* FULL EDIT MODAL - ALL FIELDS */}
      {editModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#00FF9C]/30 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-[#00FF9C]/10">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <div className="p-2 bg-[#00FF9C]/20 rounded-lg">
                <FaEdit className="text-[#00FF9C] text-xl" />
              </div>
              Produkt bearbeiten
            </h2>

            <div className="space-y-5 mb-8">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-bold text-[#00FF9C] mb-2">📦 Produktname</label>
                <input
                  type="text"
                  value={editFields.product_name}
                  onChange={(e) => setEditFields({...editFields, product_name: e.target.value})}
                  placeholder="z.B. Premium Fortnite Lifetime Key"
                  className="w-full p-3 bg-[#0E0E12] border border-[#2C2C34] rounded-lg focus:border-[#00FF9C] focus:shadow-lg focus:shadow-[#00FF9C]/20 outline-none transition text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-[#00FF9C] mb-2">📝 Beschreibung</label>
                <textarea
                  value={editFields.description}
                  onChange={(e) => setEditFields({...editFields, description: e.target.value})}
                  placeholder="Beschreibe dein Produkt..."
                  rows={3}
                  className="w-full p-3 bg-[#0E0E12] border border-[#2C2C34] rounded-lg focus:border-[#00FF9C] focus:shadow-lg focus:shadow-[#00FF9C]/20 outline-none transition text-white resize-none"
                />
              </div>

              {/* Price and Status Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-sm font-bold text-[#00FF9C] mb-2">💰 Verkaufspreis (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFields.reseller_price}
                    onChange={(e) => setEditFields({...editFields, reseller_price: e.target.value})}
                    className="w-full p-3 bg-[#0E0E12] border border-[#2C2C34] rounded-lg focus:border-[#00FF9C] focus:shadow-lg focus:shadow-[#00FF9C]/20 outline-none transition text-white"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-bold text-[#00FF9C] mb-2">🔘 Status</label>
                  <select
                    value={editFields.status}
                    onChange={(e) => setEditFields({...editFields, status: e.target.value})}
                    className="w-full p-3 bg-[#0E0E12] border border-[#2C2C34] rounded-lg focus:border-[#00FF9C] focus:shadow-lg focus:shadow-[#00FF9C]/20 outline-none transition text-white"
                  >
                    <option value="active">✅ Aktiv</option>
                    <option value="inactive">❌ Inaktiv</option>
                  </select>
                </div>
              </div>

              {/* License Duration */}
              <div>
                <label className="block text-sm font-bold text-[#00FF9C] mb-2">⏰ Lizenz-Laufzeit (Tage)</label>
                <input
                  type="number"
                  value={editFields.license_duration}
                  onChange={(e) => setEditFields({...editFields, license_duration: e.target.value})}
                  placeholder="0 = Lifetime"
                  className="w-full p-3 bg-[#0E0E12] border border-[#2C2C34] rounded-lg focus:border-[#00FF9C] focus:shadow-lg focus:shadow-[#00FF9C]/20 outline-none transition text-white"
                />
                <p className="text-xs text-gray-400 mt-2">
                  {editFields.license_duration === "0" || !editFields.license_duration
                    ? "♾️ Lifetime Lizenz"
                    : `⏰ Läuft ab nach ${editFields.license_duration} Tagen`}
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  💡 <strong>Tipp:</strong> Du kannst alle Felder auf einmal bearbeiten. Nur geänderte Werte werden gespeichert.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditModal(false);
                  setSelectedProduct(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold transition"
              >
                Abbrechen
              </button>
              <button
                onClick={handleEditProduct}
                disabled={editLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00FF9C] to-cyan-400 text-[#0E0E12] hover:shadow-xl hover:shadow-[#00FF9C]/30 rounded-lg font-bold transition disabled:opacity-50"
              >
                {editLoading ? "⏳ Wird gespeichert..." : "✅ Änderungen speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}