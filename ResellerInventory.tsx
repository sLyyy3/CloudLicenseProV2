// src/pages/ResellerInventory.tsx - FIXED: Quantities are tracked, not editable
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaArrowLeft,
  FaShoppingCart,
  FaEdit,
  FaTrash,
  FaChartBar,
  FaBox,
  FaPlus,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type ResallerProduct = {
  id: string;
  product_id: string;
  developer_id: string;
  product_name: string;
  developer_name: string;
  purchase_price: number;
  resale_price: number;
  quantity_purchased: number;
  quantity_available: number;
  quantity_sold: number;
};

export default function ResellerInventory() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [inventory, setInventory] = useState<ResallerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [resellerId, setResellerId] = useState<string | null>(null);

  // Edit Price Modal
  const [editPriceModal, setEditPriceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ResallerProduct | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;
      let reId = (data.user?.user_metadata as any)?.reseller_id;

      console.log("🏪 ResellerInventory Init");
      console.log("   Org ID:", orgId);
      console.log("   Reseller ID:", reId);

      if (!orgId) {
        navigate("/reseller-login", { replace: true });
        return;
      }

      // Auto-lookup reseller_id
      if (!reId) {
        const { data: resellerData } = await supabase
          .from("resellers")
          .select("id")
          .eq("organization_id", orgId)
          .single();

        if (resellerData) {
          reId = resellerData.id;
          await supabase.auth.updateUser({
            data: {
              is_reseller: true,
              organization_id: orgId,
              reseller_id: reId,
            },
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
      console.log("📦 Loading inventory for reseller:", reId);

      // 1. Lade reseller_products
      const { data: productsData, error: productsError } = await supabase
        .from("reseller_products")
        .select("*")
        .eq("reseller_id", reId)
        .order("created_at", { ascending: false });

      if (productsError) {
        console.error("❌ Error loading products:", productsError);
        throw productsError;
      }

      console.log("✅ Got products:", productsData?.length || 0);

      if (!productsData || productsData.length === 0) {
        setInventory([]);
        setLoading(false);
        return;
      }

      // 2. Lade Product Namen
      const productIds = [...new Set(productsData.map((p) => p.product_id))];
      const { data: productsInfo } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);

      // 3. Lade Developer Namen
      const devIds = [...new Set(productsData.map((p) => p.developer_id))];
      const { data: devsInfo } = await supabase
        .from("organizations")
        .select("id, name")
        .in("id", devIds);

      // Baue enriched Daten
      const enriched: ResallerProduct[] = productsData.map((p) => {
        const prodInfo = productsInfo?.find((pr) => pr.id === p.product_id);
        const devInfo = devsInfo?.find((d) => d.id === p.developer_id);

        return {
          id: p.id,
          product_id: p.product_id,
          developer_id: p.developer_id,
          product_name: prodInfo?.name || "Unbekanntes Produkt",
          developer_name: devInfo?.name || "Unbekannter Developer",
          purchase_price: p.purchase_price,
          resale_price: p.resale_price,
          quantity_purchased: p.quantity_purchased,
          quantity_available: p.quantity_available,
          quantity_sold: p.quantity_sold,
        };
      });

      console.log("✅ Enriched inventory:", enriched.length);
      setInventory(enriched);
    } catch (err) {
      console.error("❌ Error loading inventory:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Lagerverwaltung konnte nicht geladen werden",
        closeButton: "OK",
      });
    }
    setLoading(false);
  }

  async function handleEditPrice() {
    if (!selectedProduct || !editPrice || !resellerId) {
      openDialog({
        type: "warning",
        title: "⚠️ Fehler",
        message: "Bitte gib einen gültigen Preis ein",
        closeButton: "OK",
      });
      return;
    }

    setEditLoading(true);

    try {
      const newPrice = parseFloat(editPrice);

      console.log("💰 Updating price:");
      console.log("   Product:", selectedProduct.product_name);
      console.log("   Old price:", selectedProduct.resale_price);
      console.log("   New price:", newPrice);
      console.log("   Profit per key:", (newPrice - selectedProduct.purchase_price).toFixed(2));

      const { error } = await supabase
        .from("reseller_products")
        .update({ resale_price: newPrice })
        .eq("id", selectedProduct.id);

      if (error) throw error;

      console.log("✅ Price updated!");

      openDialog({
        type: "success",
        title: "✅ Preis aktualisiert!",
        message: (
          <div className="text-left space-y-2">
            <p>
              Neuer Preis: <strong>€{newPrice.toFixed(2)}</strong>
            </p>
            <p className="text-sm text-gray-400">
              Gewinn pro Key:{" "}
              <strong>€{(newPrice - selectedProduct.purchase_price).toFixed(2)}</strong>
            </p>
          </div>
        ),
        closeButton: "OK",
      });

      setEditPriceModal(false);
      setSelectedProduct(null);
      setEditPrice("");

      if (resellerId) await loadInventory(resellerId);
    } catch (err: any) {
      console.error("❌ Error:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    }

    setEditLoading(false);
  }

  async function handleDeleteProduct() {
    if (!selectedProduct || !resellerId) return;

    if (!confirm("⚠️ Wirklich löschen? Das kann nicht rückgängig gemacht werden!")) {
      return;
    }

    try {
      console.log("🗑️ Deleting product:", selectedProduct.product_name);

      const { error } = await supabase
        .from("reseller_products")
        .delete()
        .eq("id", selectedProduct.id);

      if (error) throw error;

      console.log("✅ Product deleted!");

      openDialog({
        type: "success",
        title: "✅ Gelöscht!",
        message: `${selectedProduct.product_name} wurde aus deinem Lager entfernt`,
        closeButton: "OK",
      });

      setSelectedProduct(null);

      if (resellerId) await loadInventory(resellerId);
    } catch (err: any) {
      console.error("❌ Error:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    }
  }

  const stats = {
    totalKeys: inventory.reduce((sum, p) => sum + p.quantity_available, 0),
    totalSold: inventory.reduce((sum, p) => sum + p.quantity_sold, 0),
    totalInvested: inventory.reduce(
      (sum, p) => sum + p.quantity_purchased * p.purchase_price,
      0
    ),
    totalCanEarn: inventory.reduce(
      (sum, p) => sum + p.quantity_available * (p.resale_price - p.purchase_price),
      0
    ),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⏳</div>
          <p>Lädt Lagerverwaltung...</p>
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
              onClick={() => navigate("/reseller-dashboard")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition mb-4"
            >
              <FaArrowLeft /> Zurück zum Dashboard
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FaShoppingCart className="text-[#00FF9C]" />
              Lagerverwaltung
            </h1>
            <p className="text-gray-400 mt-1">
              Verwalte deine gekauften Keys - Menge wird automatisch aktualisiert
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <FaBox className="text-[#00FF9C]" />
                <p className="text-gray-400">Im Lager</p>
              </div>
              <p className="text-4xl font-bold text-[#00FF9C]">{stats.totalKeys}</p>
              <p className="text-xs text-gray-500 mt-1">verfügbar zum Verkauf</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <FaChartBar className="text-blue-400" />
                <p className="text-gray-400">Verkauft</p>
              </div>
              <p className="text-4xl font-bold text-blue-400">{stats.totalSold}</p>
              <p className="text-xs text-gray-500 mt-1">insgesamt</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <FaBox className="text-purple-400" />
                <p className="text-gray-400">Investiert</p>
              </div>
              <p className="text-4xl font-bold text-purple-400">
                €{stats.totalInvested.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">für alle Keys</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <FaBox className="text-green-400" />
                <p className="text-gray-400">Zu verdienen</p>
              </div>
              <p className="text-4xl font-bold text-green-400">
                €{stats.totalCanEarn.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">bei aktuellem Lager</p>
            </div>
          </div>

          {/* INVENTORY LIST */}
          {inventory.length === 0 ? (
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 text-center text-gray-400">
              <FaShoppingCart className="text-4xl mb-4 mx-auto opacity-50" />
              <p className="text-lg font-semibold mb-2">Dein Lager ist leer</p>
              <p className="text-sm mb-4">
                Gehe zu "Meine Developer" und kaufe Keys um sie hier zu verwalten
              </p>
              <button
                onClick={() => navigate("/reseller-developers")}
                className="px-6 py-2 bg-[#00FF9C] text-[#0E0E12] rounded font-bold"
              >
                Zum Developer Bereich →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {inventory.map((product) => (
                <div
                  key={product.id}
                  className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C] transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{product.product_name}</h3>
                      <p className="text-sm text-gray-400 mb-3">
                        von <strong>{product.developer_name}</strong>
                      </p>

                      {/* Prices */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-[#2C2C34] rounded p-3">
                          <p className="text-xs text-gray-400">Einkaufspreis</p>
                          <p className="font-bold text-green-400">
                            €{product.purchase_price}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            (fest vorgegeben)
                          </p>
                        </div>

                        <div
                          className="bg-[#2C2C34] rounded p-3 cursor-pointer hover:bg-[#3C3C44] transition"
                          onClick={() => {
                            setSelectedProduct(product);
                            setEditPrice(product.resale_price.toString());
                            setEditPriceModal(true);
                          }}
                        >
                          <p className="text-xs text-gray-400">Dein Verkaufspreis</p>
                          <p className="font-bold text-blue-400">
                            €{product.resale_price}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            (klick zum ändern)
                          </p>
                        </div>

                        <div className="bg-[#2C2C34] rounded p-3">
                          <p className="text-xs text-gray-400">Gewinn pro Key</p>
                          <p className="font-bold text-yellow-400">
                            €{(product.resale_price - product.purchase_price).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            (automatisch berechnet)
                          </p>
                        </div>
                      </div>

                      {/* Quantities - READ ONLY */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[#2C2C34] rounded p-3 border border-[#3C3C44]">
                          <p className="text-xs text-gray-400">Im Lager</p>
                          <p className="text-2xl font-bold text-[#00FF9C]">
                            {product.quantity_available}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            (verfügbar zum Verkauf)
                          </p>
                        </div>

                        <div className="bg-[#2C2C34] rounded p-3 border border-[#3C3C44]">
                          <p className="text-xs text-gray-400">Verkauft</p>
                          <p className="text-2xl font-bold text-blue-400">
                            {product.quantity_sold}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            (bereits verkauft)
                          </p>
                        </div>

                        <div className="bg-[#2C2C34] rounded p-3 border border-[#3C3C44]">
                          <p className="text-xs text-gray-400">Gesamt gekauft</p>
                          <p className="text-2xl font-bold text-purple-400">
                            {product.quantity_purchased}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            (je gekauft)
                          </p>
                        </div>
                      </div>

                      {/* Potential Earnings */}
                      <div className="mt-4 bg-green-600/20 border border-green-600 rounded p-3">
                        <p className="text-sm text-green-400 font-bold">
                          💰 Möglicher Gewinn: €
                          {(
                            product.quantity_available *
                            (product.resale_price - product.purchase_price)
                          ).toFixed(2)}
                        </p>
                        <p className="text-xs text-green-300 mt-1">
                          ({product.quantity_available} Keys × €
                          {(product.resale_price - product.purchase_price).toFixed(2)} Gewinn)
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 md:flex-col md:w-48">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setEditPrice(product.resale_price.toString());
                          setEditPriceModal(true);
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold flex items-center justify-center gap-2 transition"
                      >
                        <FaEdit /> Preis
                      </button>
                      <button
                        onClick={() => navigate("/reseller-developers")}
                        className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded font-bold flex items-center justify-center gap-2 transition"
                      >
                        <FaPlus /> Mehr kaufen
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          handleDeleteProduct();
                        }}
                        className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded font-bold flex items-center justify-center gap-2 transition"
                      >
                        <FaTrash /> Löschen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* INFO BOX */}
          <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-6 mt-12">
            <h3 className="font-bold text-blue-400 mb-3">ℹ️ Wie funktioniert es?</h3>
            <ul className="text-sm text-blue-300 space-y-2">
              <li>✅ <strong>Im Lager:</strong> Zeigt verfügbare Keys (automatisch aktualisiert)</li>
              <li>✅ <strong>Preis ändern:</strong> Click auf Preis → Modal → Speichern</li>
              <li>✅ <strong>Mehr kaufen:</strong> Click "Mehr kaufen" → Gehe zu "Meine Developer" → Kaufe von gleichem Developer</li>
              <li>✅ <strong>Menge sinkt:</strong> Automatisch wenn Keys verkauft werden</li>
              <li>✅ <strong>Löschen:</strong> Entfernt komplettes Produkt aus Lager</li>
              <li>✅ <strong>Gewinn berechnet:</strong> (Verkaufspreis - Einkaufspreis) × verfügbare Keys</li>
            </ul>
          </div>
        </div>

        {/* EDIT PRICE MODAL */}
        {editPriceModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">💰 Verkaufspreis ändern</h2>

              <div className="space-y-4">
                <div className="bg-[#2C2C34] rounded p-3">
                  <p className="text-sm text-gray-400">Produkt</p>
                  <p className="font-bold">{selectedProduct.product_name}</p>
                </div>

                <div className="bg-[#2C2C34] rounded p-3">
                  <p className="text-sm text-gray-400">Einkaufspreis (FEST)</p>
                  <p className="font-bold text-green-400">€{selectedProduct.purchase_price}</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Neuer Verkaufspreis (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={selectedProduct.purchase_price}
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                  {editPrice && parseFloat(editPrice) >= selectedProduct.purchase_price && (
                    <p className="text-xs text-green-400 mt-2">
                      💰 Gewinn pro Key: €
                      {(parseFloat(editPrice) - selectedProduct.purchase_price).toFixed(2)}
                    </p>
                  )}
                  {editPrice && parseFloat(editPrice) < selectedProduct.purchase_price && (
                    <p className="text-xs text-red-400 mt-2">
                      ❌ Preis darf nicht unter Einkaufspreis sein!
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditPriceModal(false)}
                    disabled={editLoading}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-bold transition"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleEditPrice}
                    disabled={
                      editLoading ||
                      !editPrice ||
                      parseFloat(editPrice) < selectedProduct.purchase_price
                    }
                    className="flex-1 px-4 py-2 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] rounded font-bold transition disabled:opacity-50"
                  >
                    {editLoading ? "⏳..." : "✅ Speichern"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}