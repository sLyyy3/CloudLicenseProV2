// src/pages/ResellerDevelopers.tsx - FIXED: resale_price + Buy Validation
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaArrowLeft,
  FaUsers,
  FaShoppingCart,
  FaChartLine,
  FaTrash,
  FaSearch,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type Developer = {
  id: string;
  name: string;
  owner_email: string;
};

type Product = {
  id: string;
  name: string;
  developer_id: string;
  base_price: number;
  reseller_price: number;
};

type ResaleLine = {
  id: string;
  product_id: string;
  product_name: string;
  base_price: number;
  resale_price: number;
  quantity_available: number;
  quantity_sold: number;
  profit_per_unit: number;
  total_profit: number;
};

export default function ResellerDevelopers() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [selectedDev, setSelectedDev] = useState<Developer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [resaleLines, setResaleLines] = useState<ResaleLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [resellerId, setResellerId] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyProduct, setBuyProduct] = useState<Product | null>(null);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [buyPrice, setBuyPrice] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const { data, error: authError } = await supabase.auth.getUser();

        if (authError || !data.user) {
          setLoading(false);
          openDialog({
            type: "warning",
            title: "🔒 Anmeldung erforderlich",
            message: "Bitte melde dich als Reseller an!",
            closeButton: "OK",
          });
          setTimeout(() => navigate("/reseller-login", { replace: true }), 1500);
          return;
        }

        const orgId = (data.user?.user_metadata as any)?.organization_id;
        const userRole = (data.user?.user_metadata as any)?.role;

        // Check if user is actually a reseller
        if (userRole === "developer") {
          setLoading(false);
          openDialog({
            type: "error",
            title: "❌ Zugriff verweigert",
            message: "Du bist als Developer eingeloggt. Diese Seite ist nur für Reseller!",
            closeButton: "OK",
          });
          setTimeout(() => navigate("/developer-dashboard", { replace: true }), 2000);
          return;
        }

        if (!orgId) {
          setLoading(false);
          openDialog({
            type: "error",
            title: "❌ Organisation fehlt",
            message: "Bitte melde dich erneut an.",
            closeButton: "OK",
          });
          setTimeout(() => navigate("/reseller-login", { replace: true }), 1500);
          return;
        }

        // Get reseller_id
        const { data: resellerData, error: resellerError } = await supabase
          .from("resellers")
          .select("id")
          .eq("organization_id", orgId)
          .maybeSingle();

        if (resellerError || !resellerData) {
          setLoading(false);
          openDialog({
            type: "error",
            title: "❌ Reseller nicht gefunden",
            message: "Dein Account ist nicht als Reseller registriert.",
            closeButton: "OK",
          });
          setTimeout(() => navigate("/reseller-login", { replace: true }), 1500);
          return;
        }

        setResellerId(resellerData.id);
        await loadDevelopers(resellerData.id);
      } catch (err) {
        setLoading(false);
        console.error("Init error:", err);
        openDialog({
          type: "error",
          title: "❌ Fehler",
          message: "Ein Fehler ist aufgetreten beim Laden der Daten.",
          closeButton: "OK",
        });
      }
    }
    init();
  }, []);

  async function loadDevelopers(reId: string) {
    setLoading(true);
    try {
      // Get accepted developers
      const { data: devRequests } = await supabase
        .from("developer_resellers")
        .select("developer_id")
        .eq("reseller_id", reId)
        .eq("status", "active");

      if (!devRequests || devRequests.length === 0) {
        setDevelopers([]);
        setLoading(false);
        return;
      }

      const devIds = devRequests.map((r) => r.developer_id);

      // Get developer info
      const { data: devData } = await supabase
        .from("organizations")
        .select("id, name, owner_email")
        .in("id", devIds);

      setDevelopers(devData || []);
    } catch (err) {
      console.error("Error loading developers:", err);
    }
    setLoading(false);
  }

  async function loadProducts(developerId: string) {
    try {
      const { data: prodsData } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", developerId)
        .eq("status", "active");

      setProducts(prodsData || []);

      // Load resale lines
      if (resellerId) {
        const { data: resaleData } = await supabase
          .from("reseller_products")
          .select("*")
          .eq("reseller_id", resellerId);

        const resaleMap = resaleData || [];
        setResaleLines(resaleMap);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    }
  }

  async function handleBuyClick(product: Product) {
    setBuyProduct(product);
    setBuyPrice(product.reseller_price);
    setBuyQuantity(1);
    setShowBuyModal(true);
  }

  async function handleBuyConfirm() {
    if (!buyProduct || !resellerId) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Produkt oder Reseller ID fehlt",
        closeButton: "OK",
      });
      return;
    }

    if (buyQuantity <= 0 || !buyPrice || buyPrice <= 0) {
      openDialog({
        type: "warning",
        title: "⚠️ Ungültige Eingabe",
        message: "Bitte gib gültige Menge und Preis ein",
        closeButton: "OK",
      });
      return;
    }

    try {
      console.log("🛒 Kaufe Keys:", {
        product: buyProduct.name,
        quantity: buyQuantity,
        price: buyPrice,
      });

      // Check if resale line exists
      const { data: existing } = await supabase
        .from("reseller_products")
        .select("id")
        .eq("reseller_id", resellerId)
        .eq("product_id", buyProduct.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("reseller_products")
          .update({
            quantity_available: buyQuantity,
            resale_price: buyPrice,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Create new - ✅ FIX: Include all required fields!
        const { error } = await supabase
          .from("reseller_products")
          .insert({
            reseller_id: resellerId,
            product_id: buyProduct.id,
            quantity_available: buyQuantity,
            quantity_sold: 0,
            base_price: buyProduct.base_price,
            resale_price: buyPrice, // ✅ FIX: Always set this!
            status: "active",
          });

        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
      }

      openDialog({
        type: "success",
        title: "✅ Keys gekauft!",
        message: (
          <div className="text-left space-y-2">
            <p><strong>{buyProduct.name}</strong></p>
            <p>Menge: <strong>{buyQuantity}</strong></p>
            <p>Preis pro Key: <strong>€{(buyPrice || 0).toFixed(2)}</strong></p>
            <p className="text-green-400 font-bold">
              Gewinn pro Key: €{((buyPrice || 0) - (buyProduct.base_price || 0)).toFixed(2)}
            </p>
          </div>
        ),
        closeButton: "OK",
      });

      setShowBuyModal(false);
      setBuyProduct(null);
      
      if (selectedDev) {
        await loadProducts(selectedDev.id);
      }
    } catch (err: any) {
      console.error("❌ Error:", err);
      openDialog({
        type: "error",
        title: "❌ Kauf fehlgeschlagen",
        message: err.message || "Fehler beim Kaufen der Keys",
        closeButton: "OK",
      });
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <p>⏳ Lädt...</p>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        {/* HEADER */}
        <div className="bg-[#1A1A1F] border-b border-[#2C2C34] p-6 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/reseller-dashboard")}
                className="flex items-center gap-2 px-3 py-2 bg-[#2C2C34] hover:bg-[#3C3C44] rounded text-gray-400 hover:text-[#00FF9C] transition"
              >
                <FaArrowLeft /> Zurück
              </button>
              <div className="border-l border-[#3C3C44] pl-4">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <FaUsers className="text-[#00FF9C]" />
                  Meine Developer
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* DEVELOPER LIST - LEFT */}
            <div className="lg:col-span-1">
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4 sticky top-24">
                <h2 className="font-bold text-lg mb-4">👥 Developer ({developers.length})</h2>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {developers.length === 0 ? (
                    <p className="text-gray-400 text-sm">Keine Developer</p>
                  ) : (
                    developers.map((dev) => (
                      <button
                        key={dev.id}
                        onClick={() => {
                          setSelectedDev(dev);
                          loadProducts(dev.id);
                        }}
                        className={`w-full text-left p-3 rounded border transition ${
                          selectedDev?.id === dev.id
                            ? "bg-[#00FF9C]/20 border-[#00FF9C]"
                            : "bg-[#2C2C34] border-[#3C3C44] hover:border-[#00FF9C]"
                        }`}
                      >
                        <p className="font-bold text-sm">{dev.name}</p>
                        <p className="text-xs text-gray-400">{dev.owner_email}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* PRODUCTS LIST - RIGHT */}
            <div className="lg:col-span-3">
              {selectedDev ? (
                <div className="space-y-6">
                  {/* SEARCH */}
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Produkte suchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                    />
                  </div>

                  {/* PRODUCTS GRID */}
                  {filteredProducts.length === 0 ? (
                    <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 text-center">
                      <p className="text-gray-400">Keine Produkte verfügbar</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredProducts.map((product) => {
                        const resaleLine = resaleLines.find(
                          (r) => r.product_id === product.id
                        );
                        const profitPerUnit = (product.reseller_price || 0) - (product.base_price || 0);

                        return (
                          <div
                            key={product.id}
                            className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C] transition"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">{product.name}</h3>

                                {/* PRICES */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                  <div>
                                    <p className="text-xs text-gray-400 mb-1">Base Preis</p>
                                    <p className="text-lg font-bold text-blue-400">
                                      €{(product.base_price || 0).toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400 mb-1">Dein Preis</p>
                                    <p className="text-lg font-bold text-[#00FF9C]">
                                      €{(product.reseller_price || 0).toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400 mb-1">Gewinn/Unit</p>
                                    <p className="text-lg font-bold text-green-400">
                                      €{(profitPerUnit || 0).toFixed(2)}
                                    </p>
                                  </div>
                                </div>

                                {/* STOCK INFO */}
                                {resaleLine && (
                                  <div className="grid grid-cols-3 gap-4 bg-[#2C2C34] rounded p-3 text-sm">
                                    <div>
                                      <p className="text-gray-400">Im Lager</p>
                                      <p className="font-bold">{resaleLine.quantity_available}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400">Verkauft</p>
                                      <p className="font-bold">{resaleLine.quantity_sold}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-400">Gesamtgewinn</p>
                                      <p className="font-bold text-green-400">
                                        €{(
                                          resaleLine.quantity_sold * profitPerUnit
                                        ).toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* BUTTONS */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleBuyClick(product)}
                                className="flex-1 px-4 py-2 bg-[#00FF9C] text-[#0E0E12] rounded font-bold hover:bg-[#00cc80] transition flex items-center justify-center gap-2"
                              >
                                <FaShoppingCart /> Keys kaufen
                              </button>
                              {resaleLine && (
                                <button
                                  onClick={async () => {
                                    await supabase
                                      .from("reseller_products")
                                      .delete()
                                      .eq("id", resaleLine.id);
                                    await loadProducts(selectedDev.id);
                                  }}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-bold transition"
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-12 text-center">
                  <FaUsers className="text-4xl text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    Wähle einen Developer um seine Produkte zu sehen
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BUY MODAL */}
      {showBuyModal && buyProduct && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">🛒 Keys kaufen</h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-400 mb-1">Produkt:</p>
                <p className="text-lg font-bold">{buyProduct.name}</p>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Basis Preis:</label>
                <p className="text-lg font-bold text-blue-400">
                  €{(buyProduct.base_price || 0).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Dein Verkaufspreis pro Key:</label>
                <input
                  type="number"
                  step="0.01"
                  min={buyProduct.base_price || 0}
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none text-lg font-bold text-[#00FF9C]"
                />
                <p className="text-xs text-green-400 mt-1">
                  Gewinn: €{(buyPrice - (buyProduct.base_price || 0)).toFixed(2)} pro Key
                </p>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Menge:</label>
                <input
                  type="number"
                  min="1"
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(parseInt(e.target.value) || 1)}
                  className="w-full p-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                />
              </div>

              <div className="bg-[#2C2C34] rounded p-4">
                <div className="flex justify-between mb-2">
                  <p className="text-gray-400">Gesamt investieren:</p>
                  <p className="font-bold text-blue-400">
                    €{((buyProduct.base_price || 0) * buyQuantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between border-t border-[#3C3C44] pt-2">
                  <p className="text-gray-400">Verkaufswert:</p>
                  <p className="font-bold text-[#00FF9C]">
                    €{((buyPrice || 0) * buyQuantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between border-t border-[#3C3C44] pt-2">
                  <p className="text-gray-400">Potentieller Gewinn:</p>
                  <p className="font-bold text-green-400">
                    €{(((buyPrice || 0) - (buyProduct.base_price || 0)) * buyQuantity).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleBuyConfirm}
                className="flex-1 px-4 py-3 bg-[#00FF9C] text-[#0E0E12] rounded font-bold hover:bg-[#00cc80] transition"
              >
                ✅ Bestätigen
              </button>
              <button
                onClick={() => setShowBuyModal(false)}
                className="flex-1 px-4 py-3 bg-gray-600 rounded font-bold hover:bg-gray-700 transition"
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