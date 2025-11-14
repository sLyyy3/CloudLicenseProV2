// src/pages/ResellerShop.tsx - ÖFFENTLICHER RESELLER SHOP FÜR KUNDEN
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaShoppingBag, FaArrowLeft, FaStore, FaStar, FaCheckCircle } from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type ResellerProduct = {
  id: string;
  reseller_id: string;
  product_name: string;
  description?: string;
  reseller_price: number;
  quantity_available: number;
  quantity_sold: number;
  status?: string;
  keys_pool?: string;
};

type Reseller = {
  id: string;
  shop_name: string;
  balance: number;
  organization_id: string;
};

export default function ResellerShop() {
  const { resellerId } = useParams();
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [user, setUser] = useState<any>(null);
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [products, setProducts] = useState<ResellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    async function init() {
      // Check if user is authenticated
      const { data } = await supabase.auth.getUser();

      if (!data.user?.id) {
        openDialog({
          type: "warning",
          title: "🔒 Anmeldung erforderlich",
          message: "Du musst angemeldet sein um im Shop zu kaufen!",
          closeButton: "Anmelden",
          actionButton: {
            label: "Registrieren",
            onClick: () => navigate("/signup"),
          },
        });
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
        return;
      }

      setUser(data.user);

      if (!resellerId) {
        openDialog({
          type: "error",
          title: "❌ Fehler",
          message: "Reseller ID fehlt",
          closeButton: "OK",
        });
        navigate("/", { replace: true });
        return;
      }

      await loadResellerShop(resellerId);
    }

    init();
  }, [resellerId]);

  async function loadResellerShop(reId: string) {
    setLoading(true);
    try {
      // Load reseller info
      const { data: resellerData, error: resellerError } = await supabase
        .from("resellers")
        .select("*")
        .eq("id", reId)
        .maybeSingle();

      if (resellerError || !resellerData) {
        openDialog({
          type: "error",
          title: "❌ Reseller nicht gefunden",
          message: "Dieser Shop existiert nicht",
          closeButton: "OK",
        });
        navigate("/", { replace: true });
        return;
      }

      setReseller(resellerData);

      // Load reseller products with availability > 0
      const { data: productsData, error: productsError } = await supabase
        .from("reseller_products")
        .select("*")
        .eq("reseller_id", reId)
        .gt("quantity_available", 0)
        .order("quantity_sold", { ascending: false });

      if (productsError) {
        console.error("Error loading products:", productsError);
      }

      setProducts(productsData || []);
    } catch (err: any) {
      console.error("Error loading reseller shop:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Shop konnte nicht geladen werden",
        closeButton: "OK",
      });
    }
    setLoading(false);
  }

  async function handleBuy(product: ResellerProduct, quantity: number) {
    if (quantity <= 0 || quantity > product.quantity_available) {
      openDialog({
        type: "warning",
        title: "⚠️ Ungültige Menge",
        message: `Bitte wähle eine Menge zwischen 1 und ${product.quantity_available}`,
        closeButton: "OK",
      });
      return;
    }

    // Safety check for price
    if (!product.reseller_price || product.reseller_price <= 0) {
      openDialog({
        type: "error",
        title: "❌ Preis Fehler",
        message: "Produkt hat keinen gültigen Preis",
        closeButton: "OK",
      });
      return;
    }

    try {
      console.log("🛒 Kauf starten:", product.product_name, "x", quantity);

      // Get keys from inventory pool
      const { data: productData } = await supabase
        .from("reseller_products")
        .select("keys_pool")
        .eq("id", product.id)
        .single();

      if (!productData || !productData.keys_pool) {
        throw new Error("Keine Keys im Inventar verfügbar");
      }

      let keysPool: string[] = [];
      try {
        keysPool = JSON.parse(productData.keys_pool);
      } catch {
        throw new Error("Fehler beim Lesen der Keys");
      }

      if (keysPool.length < quantity) {
        throw new Error(`Nur ${keysPool.length} Keys verfügbar`);
      }

      // Take keys from pool (FIFO - First In First Out)
      const keys = keysPool.slice(0, quantity);
      const remainingKeys = keysPool.slice(quantity);

      const totalPrice = product.reseller_price * quantity;

      // Create customer order
      const { data: orderData, error: orderError } = await supabase
        .from("customer_orders")
        .insert({
          customer_email: user.email,
          total_amount: totalPrice,
          status: "completed",
          items: [
            {
              product_id: product.product_id,
              product_name: product.product_name,
              price: product.reseller_price,
              quantity,
            },
          ],
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create customer keys
      for (const key of keys) {
        await supabase.from("customer_keys").insert({
          customer_email: user.email,
          key_code: key,
          status: "active",
          order_id: orderData.id,
        });
      }

      // Record reseller sale (optional - table might not exist yet)
      try {
        await supabase.from("reseller_sales").insert({
          reseller_id: resellerId,
          product_name: product.product_name,
          customer_name: user.email?.split("@")[0] || "Customer",
          customer_email: user.email,
          quantity,
          unit_price: product.reseller_price,
          total_price: totalPrice,
        });
      } catch (salesError) {
        console.log("reseller_sales tracking skipped (table not available)");
      }

      // Update reseller product inventory (remove sold keys from pool)
      await supabase
        .from("reseller_products")
        .update({
          keys_pool: JSON.stringify(remainingKeys),
          quantity_available: remainingKeys.length,
          quantity_sold: product.quantity_sold + quantity,
        })
        .eq("id", product.id);

      // Update reseller balance
      // Note: Since we don't store base_price, we treat total sale as revenue
      const revenue = totalPrice;
      if (reseller) {
        await supabase
          .from("resellers")
          .update({
            balance: reseller.balance + revenue,
          })
          .eq("id", resellerId);
      }

      console.log("✅ Kauf erfolgreich!");

      // Success dialog
      openDialog({
        type: "success",
        title: "✅ Kauf erfolgreich!",
        message: (
          <div className="text-left space-y-3">
            <div className="bg-green-600/20 border border-green-600 rounded p-3">
              <p className="font-bold text-green-400">🎉 Danke für deinen Kauf!</p>
            </div>
            <p className="text-sm text-gray-400">
              <strong>Produkt:</strong> {product.product_name}
            </p>
            <p className="text-sm text-gray-400">
              <strong>Menge:</strong> {quantity} Keys
            </p>
            <p className="text-sm text-gray-400">
              <strong>Preis:</strong> €{totalPrice.toFixed(2)}
            </p>
            <p className="text-sm text-gray-400 mt-3">
              💡 Deine Keys findest du in <button onClick={() => navigate("/customer-dashboard")} className="underline font-bold hover:text-[#00FF9C]">Mein Dashboard</button>
            </p>
          </div>
        ),
        closeButton: "OK",
      });

      // Reset cart and reload
      setCart({});
      if (resellerId) await loadResellerShop(resellerId);
    } catch (err: any) {
      console.error("Error during purchase:", err);
      openDialog({
        type: "error",
        title: "❌ Kauf fehlgeschlagen",
        message: err.message || "Fehler beim Kauf",
        closeButton: "OK",
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🛒</div>
          <p className="text-xl">Lädt Shop...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#1A1A1F] via-[#2C2C34] to-[#1A1A1F] border-b border-[#00FF9C]/20 p-6 sticky top-0 z-40 shadow-lg shadow-[#00FF9C]/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition"
              >
                <FaArrowLeft /> Zurück
              </button>
            </div>

            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-[#00FF9C]/20 rounded-xl">
                  <FaStore className="text-[#00FF9C] text-4xl" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold flex items-center gap-2">
                    {reseller?.shop_name || "Reseller Shop"}
                  </h1>
                  <p className="text-gray-400 text-sm">Offizieller Reseller • Verifiziert ✅</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-400">Angemeldet als:</p>
                <p className="font-bold text-[#00FF9C]">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SHOP INFO */}
        <div className="max-w-7xl mx-auto p-8">
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-6">
              <div className="bg-blue-500/20 p-4 rounded-xl">
                <FaCheckCircle className="text-blue-400 text-3xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-blue-400 mb-2">Verifizierter Shop</h2>
                <p className="text-blue-300 text-sm">
                  Dieser Shop ist ein offizieller Reseller Partner. Alle Keys sind garantiert original und funktionsfähig.
                </p>
              </div>
            </div>
          </div>

          {/* PRODUCTS */}
          {products.length === 0 ? (
            <div className="text-center py-12">
              <FaStore className="text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Keine Produkte verfügbar</p>
            </div>
          ) : (
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                📦 Verfügbare Produkte ({products.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const quantity = cart[product.id] || 1;

                  return (
                    <div
                      key={product.id}
                      className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-6 hover:border-[#00FF9C] transition flex flex-col shadow-xl"
                    >
                      {/* HEADER */}
                      <div className="mb-4 pb-4 border-b border-[#2C2C34]">
                        <h3 className="text-xl font-bold mb-2">{product.product_name}</h3>
                        {product.description && (
                          <p className="text-sm text-gray-400 line-clamp-2">{product.description}</p>
                        )}
                      </div>

                      {/* STOCK INFO */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Auf Lager:</span>
                          <span className="font-bold text-[#00FF9C]">{product.quantity_available} Keys</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Verkauft:</span>
                          <span className="font-bold text-blue-400">{product.quantity_sold}x</span>
                        </div>
                      </div>

                      {/* PRICE */}
                      <div className="mb-4 pb-4 border-b border-[#2C2C34]">
                        <p className="text-3xl font-black text-[#00FF9C]">
                          €{(product.reseller_price || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">pro Key</p>
                      </div>

                      {/* QUANTITY SELECTOR */}
                      <div className="mb-4 flex-1">
                        <label className="block text-sm text-gray-400 mb-2">📦 Menge</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setCart({
                                ...cart,
                                [product.id]: Math.max(1, (quantity || 1) - 1),
                              })
                            }
                            className="px-3 py-2 bg-[#2C2C34] hover:bg-[#3C3C44] rounded font-bold transition"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={product.quantity_available}
                            value={quantity || 1}
                            onChange={(e) =>
                              setCart({
                                ...cart,
                                [product.id]: Math.min(
                                  product.quantity_available,
                                  Math.max(1, parseInt(e.target.value) || 1)
                                ),
                              })
                            }
                            className="flex-1 px-3 py-2 rounded bg-[#2C2C34] border border-[#3C3C44] text-center outline-none font-bold"
                          />
                          <button
                            onClick={() =>
                              setCart({
                                ...cart,
                                [product.id]: Math.min(product.quantity_available, (quantity || 1) + 1),
                              })
                            }
                            className="px-3 py-2 bg-[#2C2C34] hover:bg-[#3C3C44] rounded font-bold transition"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* TOTAL */}
                      <div className="bg-[#2C2C34] rounded-lg p-3 mb-4">
                        <p className="text-xs text-gray-400">Gesamtpreis</p>
                        <p className="text-2xl font-bold text-[#00FF9C]">
                          €{((product.reseller_price || 0) * (quantity || 1)).toFixed(2)}
                        </p>
                      </div>

                      {/* BUY BUTTON */}
                      <button
                        onClick={() => handleBuy(product, quantity || 1)}
                        disabled={product.quantity_available === 0}
                        className="w-full py-3 bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] hover:from-[#00cc80] hover:to-green-600 rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#00FF9C]/50"
                      >
                        <FaShoppingBag /> Kaufen
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* INFO */}
          <div className="mt-12 bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-green-400 mb-3 flex items-center gap-2">
              <FaStar /> Warum bei uns kaufen?
            </h3>
            <ul className="text-green-300 space-y-2 text-sm">
              <li>✅ 100% Original Keys direkt vom Entwickler</li>
              <li>✅ Sofortige Lieferung nach Zahlung</li>
              <li>✅ Keys werden in deinem Dashboard gespeichert</li>
              <li>✅ Sichere Zahlung und Datenschutz</li>
              <li>✅ Support bei Problemen</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
