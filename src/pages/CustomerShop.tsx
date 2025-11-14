// src/pages/CustomerShop.tsx - FIXED: toFixed Error + Auth Protected + Shortened Descriptions
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaShoppingBag, FaArrowLeft } from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number | null;
  base_price: number | null;
  organization_id: string;
};

type Organization = {
  id: string;
  name: string;
};

export default function CustomerShop() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [organizations, setOrganizations] = useState<Record<string, Organization>>({});
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    async function init() {
      // ✅ FIX: Check if user is authenticated
      const { data } = await supabase.auth.getUser();

      if (!data.user?.id) {
        // ❌ NOT AUTHENTICATED - REDIRECT TO LOGIN
        openDialog({
          type: "warning",
          title: "🔒 Anmeldung erforderlich",
          message: "Du musst angemeldet sein um den Shop zu nutzen!",
          closeButton: "Anmelden",
          actionButton: {
            label: "Registrieren",
            onClick: () => navigate("/signup"),
          },
        });
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1500);
        return;
      }

      setUser(data.user);
      await loadData();
    }
    init();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load Products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      setProducts(productsData || []);

      // Load Organizations
      if (productsData && productsData.length > 0) {
        const orgIds = [...new Set(productsData.map((p) => p.organization_id))];
        const { data: orgsData } = await supabase
          .from("organizations")
          .select("id, name")
          .in("id", orgIds);

        const orgsMap: Record<string, Organization> = {};
        orgsData?.forEach((org) => {
          orgsMap[org.id] = org;
        });
        setOrganizations(orgsMap);
      }
    } catch (err: any) {
      console.error("Error loading data:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Produkte konnten nicht geladen werden",
        closeButton: "OK",
      });
    }
    setLoading(false);
  }

  function truncateDescription(desc: string, maxLength: number = 100): string {
    if (!desc) return "Keine Beschreibung";
    if (desc.length <= maxLength) return desc;
    return desc.substring(0, maxLength) + "...";
  }

  // ✅ FIX: Safe price extraction
  function getProductPrice(product: Product): number {
    const price = product.price || product.base_price || 0;
    return Math.max(0, price); // Ensure non-negative
  }

  async function handleBuy(product: Product, quantity: number) {
    const productPrice = getProductPrice(product);

    if (quantity <= 0) {
      openDialog({
        type: "warning",
        title: "⚠️ Ungültige Menge",
        message: "Bitte gib eine Menge größer als 0 ein!",
        closeButton: "OK",
      });
      return;
    }

    if (productPrice <= 0) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Dieses Produkt hat keinen gültigen Preis",
        closeButton: "OK",
      });
      return;
    }

    try {
      console.log("🛒 Kauf starten:", product.name, "x", quantity);

      // Generate Keys
      const keys = Array.from({ length: quantity }, () =>
        `KEY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      );

      // Create Order
      const { data: orderData, error: orderError } = await supabase
        .from("customer_orders")
        .insert({
          customer_email: user.email,
          total_amount: productPrice * quantity,
          status: "completed",
          items: [
            {
              product_id: product.id,
              product_name: product.name,
              price: productPrice,
              quantity,
            },
          ],
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create Keys in DB (bulk insert)
      const keyInserts = keys.map((key) => ({
        customer_email: user.email,
        key_code: key,
        status: "active",
        order_id: orderData.id,
        reseller_product_id: null, // Direct purchase from developer, not from reseller
      }));

      const { error: keysError } = await supabase
        .from("customer_keys")
        .insert(keyInserts);

      if (keysError) {
        console.error("❌ Fehler beim Speichern der Keys:", keysError);
        throw new Error(`Keys konnten nicht gespeichert werden: ${keysError.message}`);
      }

      console.log("✅ Order erstellt:", orderData.id);

      // SUCCESS
      openDialog({
        type: "success",
        title: "✅ Kauf erfolgreich!",
        message: (
          <div className="text-left space-y-3">
            <div className="bg-green-600/20 border border-green-600 rounded p-3">
              <p className="font-bold text-green-400">🎉 Danke für den Kauf!</p>
            </div>
            <p className="text-sm text-gray-400">
              <strong>Produkt:</strong> {product.name}
            </p>
            <p className="text-sm text-gray-400">
              <strong>Menge:</strong> {quantity} Keys
            </p>
            <p className="text-sm text-gray-400">
              <strong>Preis:</strong> €{(productPrice * quantity).toFixed(2)}
            </p>
            <p className="text-sm text-gray-400 mt-3">
              💡 Deine Keys wurden per Email gesendet!
            </p>
          </div>
        ),
        closeButton: "OK",
      });

      // Reset cart
      setCart({});
    } catch (err: any) {
      console.error("Error creating order:", err);
      openDialog({
        type: "error",
        title: "❌ Kauf fehlgeschlagen",
        message: err.message || "Fehler beim Erstellen der Order",
        closeButton: "OK",
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <p>🛒 Lädt Shop...</p>
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
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition"
              >
                <FaArrowLeft /> Zurück
              </button>
              <div className="border-l border-[#2C2C34] pl-3">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <FaShoppingBag className="text-[#00FF9C]" />
                  🛒 CloudLicensePro Shop
                </h1>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400">Angemeldet als:</p>
              <p className="font-bold text-[#00FF9C]">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">🔭 Keine Produkte verfügbar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const org = organizations[product.organization_id];
                const quantity = cart[product.id] || 1;
                const productPrice = getProductPrice(product);

                return (
                  <div
                    key={product.id}
                    className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C] transition flex flex-col"
                  >
                    {/* HEADER */}
                    <div className="mb-4 pb-4 border-b border-[#2C2C34]">
                      <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-400">
                        👤 {org?.name || "Unknown Developer"}
                      </p>
                    </div>

                    {/* DESCRIPTION - ✅ SHORTENED! */}
                    <p className="text-sm text-gray-300 mb-4 line-clamp-2 flex-1">
                      {truncateDescription(product.description, 80)}
                    </p>

                    {/* PRICE */}
                    <div className="mb-4 pb-4 border-b border-[#2C2C34]">
                      <p className="text-2xl font-bold text-[#00FF9C]">
                        €{productPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">pro Key</p>
                    </div>

                    {/* QUANTITY INPUT */}
                    <div className="mb-4">
                      <label className="block text-sm text-gray-400 mb-2">
                        📦 Menge
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setCart({
                              ...cart,
                              [product.id]: Math.max(1, (quantity || 1) - 1),
                            })
                          }
                          className="px-3 py-1 bg-[#2C2C34] hover:bg-[#3C3C44] rounded"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={quantity || 1}
                          onChange={(e) =>
                            setCart({
                              ...cart,
                              [product.id]: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          className="flex-1 px-3 py-1 rounded bg-[#2C2C34] border border-[#3C3C44] text-center outline-none"
                        />
                        <button
                          onClick={() =>
                            setCart({
                              ...cart,
                              [product.id]: (quantity || 1) + 1,
                            })
                          }
                          className="px-3 py-1 bg-[#2C2C34] hover:bg-[#3C3C44] rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* TOTAL */}
                    <div className="bg-[#2C2C34] rounded p-3 mb-4">
                      <p className="text-xs text-gray-400">Gesamtpreis</p>
                      <p className="text-lg font-bold text-[#00FF9C]">
                        €{(productPrice * (quantity || 1)).toFixed(2)}
                      </p>
                    </div>

                    {/* BUY BUTTON */}
                    <button
                      onClick={() =>
                        handleBuy(product, quantity || 1)
                      }
                      className="w-full py-3 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] rounded-lg font-bold transition flex items-center justify-center gap-2"
                    >
                      <FaShoppingBag /> Kaufen
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}