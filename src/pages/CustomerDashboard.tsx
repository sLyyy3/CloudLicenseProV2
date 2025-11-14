// src/pages/CustomerDashboard.tsx - KOMPLETT ÜBERARBEITET - MEGA CUSTOMER DASHBOARD V2
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaKey,
  FaShoppingBag,
  FaCopy,
  FaDownload,
  FaCheckCircle,
  FaClock,
  FaStore,
  FaRocket,
  FaFire,
  FaStar,
  FaGift,
  FaBox,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

type CustomerOrder = {
  id: string;
  customer_email: string;
  total_amount: number;
  status: string;
  items: any[];
  created_at: string;
};

type CustomerKey = {
  id: string;
  customer_email: string;
  key_code: string;
  status: string;
  order_id: string | null;
  reseller_product_id?: string | null;
  product_name?: string;
  created_at: string;
};

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [keys, setKeys] = useState<CustomerKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"keys" | "orders">("keys");

  useEffect(() => {
    async function init() {
      try {
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          navigate("/login", { replace: true });
          return;
        }

        setUser(data.user);
        await loadCustomerData(data.user.email!);
      } catch (err: any) {
        console.error("Error loading customer data:", err);
        openDialog({
          type: "error",
          title: "❌ Fehler",
          message: "Deine Daten konnten nicht geladen werden",
          closeButton: "OK",
        });
      }
      setLoading(false);
    }

    init();
  }, []);

  async function loadCustomerData(email: string) {
    try {
      console.log(`🔍 Lade Daten für ${email}...`);

      // Load customer orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("customer_orders")
        .select("*")
        .eq("customer_email", email)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("❌ Fehler beim Laden der Bestellungen:", ordersError);
        throw ordersError;
      }

      console.log(`📦 ${ordersData?.length || 0} Bestellungen gefunden`);
      setOrders(ordersData || []);

      // Load customer keys
      const { data: keysData, error: keysError } = await supabase
        .from("customer_keys")
        .select("*")
        .eq("customer_email", email)
        .order("created_at", { ascending: false });

      if (keysError) {
        console.error("❌ Fehler beim Laden der Keys:", keysError);
        throw keysError;
      }

      console.log(`🔑 ${keysData?.length || 0} Keys gefunden:`, keysData);

      if (!keysData || keysData.length === 0) {
        console.warn("⚠️ KEINE KEYS GEFUNDEN! Prüfe ob customer_keys Tabelle existiert und Keys gespeichert wurden!");
      }

      // Enrich keys with product names from orders
      const enrichedKeys = keysData?.map((key) => {
        const order = ordersData?.find((o) => o.id === key.order_id);
        const productName = order?.items?.[0]?.product_name || "Produkt";
        console.log(`  - Key ${key.key_code.substring(0, 10)}... → ${productName}`);
        return { ...key, product_name: productName };
      }) || [];

      setKeys(enrichedKeys);
      console.log(`✅ Insgesamt ${enrichedKeys.length} Keys geladen und enriched`);
    } catch (err: any) {
      console.error("❌ KRITISCHER FEHLER beim Laden der Daten:", err);
      console.error("Details:", err.message, err.code, err.details);
    }
  }

  async function copyKey(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      openDialog({
        type: "success",
        title: "✅ Kopiert!",
        message: "Key wurde in die Zwischenablage kopiert",
        closeButton: "OK",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  async function copyAllKeys() {
    try {
      const allKeys = keys.map((k) => k.key_code).join("\n");
      await navigator.clipboard.writeText(allKeys);
      openDialog({
        type: "success",
        title: "✅ Alle Keys kopiert!",
        message: `${keys.length} Keys wurden in die Zwischenablage kopiert`,
        closeButton: "OK",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  function downloadKeys() {
    const content = keys.map((k) => `${k.product_name || "Key"}: ${k.key_code}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-keys-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex w-full min-h-screen bg-gradient-to-br from-[#0F0F14] via-[#1A1A1F] to-[#0F0F14]">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <p className="text-xl text-gray-300">Lädt deine Keys...</p>
          </div>
        </main>
      </div>
    );
  }

  const activeKeys = keys.filter((k) => k.status === "active").length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const latestOrder = orders[0];

  // Group keys by product
  const groupedKeys = keys.reduce((acc, key) => {
    const productName = key.product_name || "Unbekanntes Produkt";
    if (!acc[productName]) {
      acc[productName] = [];
    }
    acc[productName].push(key);
    return acc;
  }, {} as Record<string, CustomerKey[]>);

  return (
    <>
      {DialogComponent}

      <div className="flex w-full min-h-screen bg-gradient-to-br from-[#0F0F14] via-[#1A1A1F] to-[#0F0F14]">
        <Sidebar />

        <main className="ml-64 flex-1 p-8 text-[#E0E0E0]">
          {/* EPIC HEADER */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 blur-3xl"></div>
            <div className="relative bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border-2 border-blue-500/30 rounded-3xl p-8 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                      <FaKey className="text-[#00FF9C]" /> 📚 Lizenz-Bibliothek
                    </h1>
                    <p className="text-gray-300 text-lg flex items-center gap-2">
                      <FaCheckCircle className="text-green-400" />
                      {user?.email}
                    </p>
                  </div>
                  {latestOrder && (
                    <div className="hidden md:block bg-[#1A1A1F]/80 backdrop-blur-sm border border-[#00FF9C]/30 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">💫 Letzer Kauf</p>
                      <p className="text-sm font-bold text-[#00FF9C]">
                        {new Date(latestOrder.created_at).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MEGA STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Keys */}
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-2 border-blue-500/30 rounded-2xl p-6 shadow-xl hover:shadow-blue-500/30 transition group">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-500/20 p-3 rounded-xl group-hover:scale-110 transition">
                  <FaKey className="text-blue-400 text-3xl" />
                </div>
                <FaStar className="text-blue-400/30 text-4xl" />
              </div>
              <p className="text-gray-400 text-sm mb-1">Gesamt Keys</p>
              <p className="text-5xl font-black text-blue-400 mb-2">{keys.length}</p>
              <p className="text-xs text-blue-300/60">Alle deine Lizenzen</p>
            </div>

            {/* Active Keys */}
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-800/20 border-2 border-green-500/30 rounded-2xl p-6 shadow-xl hover:shadow-green-500/30 transition group">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-500/20 p-3 rounded-xl group-hover:scale-110 transition">
                  <FaCheckCircle className="text-green-400 text-3xl" />
                </div>
                <FaFire className="text-green-400/30 text-4xl" />
              </div>
              <p className="text-gray-400 text-sm mb-1">Aktive Keys</p>
              <p className="text-5xl font-black text-green-400 mb-2">{activeKeys}</p>
              <p className="text-xs text-green-300/60">Bereit zur Nutzung</p>
            </div>

            {/* Total Spent */}
            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-800/20 border-2 border-yellow-500/30 rounded-2xl p-6 shadow-xl hover:shadow-yellow-500/30 transition group">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-yellow-500/20 p-3 rounded-xl group-hover:scale-110 transition">
                  <FaShoppingBag className="text-yellow-400 text-3xl" />
                </div>
                <FaGift className="text-yellow-400/30 text-4xl" />
              </div>
              <p className="text-gray-400 text-sm mb-1">Ausgegeben</p>
              <p className="text-5xl font-black text-yellow-400 mb-2">€{totalSpent.toFixed(2)}</p>
              <p className="text-xs text-yellow-300/60">Gesamtinvestition</p>
            </div>

            {/* Products */}
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-800/20 border-2 border-purple-500/30 rounded-2xl p-6 shadow-xl hover:shadow-purple-500/30 transition group">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-500/20 p-3 rounded-xl group-hover:scale-110 transition">
                  <FaBox className="text-purple-400 text-3xl" />
                </div>
                <FaRocket className="text-purple-400/30 text-4xl" />
              </div>
              <p className="text-gray-400 text-sm mb-1">Produkte</p>
              <p className="text-5xl font-black text-purple-400 mb-2">{Object.keys(groupedKeys).length}</p>
              <p className="text-xs text-purple-300/60">Verschiedene Items</p>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="flex gap-4 mb-8 flex-wrap">
            <button
              onClick={() => navigate("/reseller-shops")}
              className="px-6 py-4 bg-gradient-to-r from-[#00FF9C] to-green-500 hover:from-[#00cc80] hover:to-green-600 text-[#0F0F14] rounded-xl font-black flex items-center gap-3 transition shadow-xl hover:shadow-[#00FF9C]/50 transform hover:scale-105"
            >
              <FaStore className="text-2xl" /> Reseller Shops durchsuchen
            </button>
            {keys.length > 0 && (
              <>
                <button
                  onClick={copyAllKeys}
                  className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-black flex items-center gap-3 transition shadow-xl hover:shadow-blue-500/50"
                >
                  <FaCopy className="text-xl" /> Alle Keys kopieren
                </button>
                <button
                  onClick={downloadKeys}
                  className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-black flex items-center gap-3 transition shadow-xl hover:shadow-purple-500/50"
                >
                  <FaDownload className="text-xl" /> Als .txt downloaden
                </button>
              </>
            )}
          </div>

          {/* TABS */}
          <div className="mb-6 flex gap-4 border-b border-[#2C2C34]">
            <button
              onClick={() => setTab("keys")}
              className={`px-8 py-4 font-black transition border-b-4 text-lg ${
                tab === "keys"
                  ? "text-[#00FF9C] border-[#00FF9C] transform scale-105"
                  : "text-gray-400 border-transparent hover:text-white"
              }`}
            >
              📚 Lizenz-Bibliothek ({keys.length})
            </button>
            <button
              onClick={() => setTab("orders")}
              className={`px-8 py-4 font-black transition border-b-4 text-lg ${
                tab === "orders"
                  ? "text-[#00FF9C] border-[#00FF9C] transform scale-105"
                  : "text-gray-400 border-transparent hover:text-white"
              }`}
            >
              📦 Bestellungen ({orders.length})
            </button>
          </div>

          {/* KEYS TAB - GROUPED BY PRODUCT */}
          {tab === "keys" && (
            <div className="space-y-6">
              {keys.length === 0 ? (
                <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-[#00FF9C]/20 rounded-3xl p-16 text-center">
                  <div className="animate-bounce mb-6">
                    <FaKey className="text-8xl text-gray-600 mx-auto" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-300 mb-4">Noch keine Keys</h2>
                  <p className="text-gray-400 text-lg mb-8">Starte deine Journey und kaufe deinen ersten Key!</p>
                  <button
                    onClick={() => navigate("/reseller-shops")}
                    className="px-8 py-4 bg-gradient-to-r from-[#00FF9C] to-green-500 hover:from-[#00cc80] hover:to-green-600 text-[#0F0F14] rounded-xl font-black flex items-center gap-3 mx-auto transition shadow-xl hover:shadow-[#00FF9C]/50 text-xl"
                  >
                    <FaShoppingBag className="text-2xl" /> Jetzt kaufen
                  </button>
                </div>
              ) : (
                Object.entries(groupedKeys).map(([productName, productKeys]) => (
                  <div key={productName} className="bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border-2 border-[#00FF9C]/20 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2C2C34]">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#00FF9C]/20 p-3 rounded-xl">
                          <FaBox className="text-[#00FF9C] text-2xl" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-white">{productName}</h3>
                          <p className="text-sm text-gray-400">{productKeys.length} Key(s)</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const content = productKeys.map(k => k.key_code).join("\n");
                          navigator.clipboard.writeText(content);
                          openDialog({
                            type: "success",
                            title: "✅ Kopiert!",
                            message: `${productKeys.length} Keys kopiert`,
                            closeButton: "OK",
                          });
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold flex items-center gap-2 transition"
                      >
                        <FaCopy /> Alle kopieren
                      </button>
                    </div>

                    <div className="space-y-3">
                      {productKeys.map((key) => (
                        <div
                          key={key.id}
                          className="bg-[#0F0F14] border border-[#2C2C34] rounded-xl p-4 hover:border-[#00FF9C] transition group"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <FaKey className="text-[#00FF9C]" />
                                {key.status === "active" && (
                                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <FaCheckCircle /> Aktiv
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {new Date(key.created_at).toLocaleDateString("de-DE")}
                                </span>
                              </div>
                              <code className="block bg-[#1A1A1F] px-4 py-2 rounded-lg font-mono text-[#00FF9C] text-sm break-all">
                                {key.key_code}
                              </code>
                            </div>
                            <button
                              onClick={() => copyKey(key.key_code)}
                              className="px-4 py-2 bg-[#00FF9C] hover:bg-[#00cc80] text-[#0F0F14] rounded-lg font-bold flex items-center gap-2 transition shrink-0 opacity-0 group-hover:opacity-100"
                            >
                              <FaCopy /> Copy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ORDERS TAB */}
          {tab === "orders" && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-blue-500/20 rounded-3xl p-16 text-center">
                  <FaShoppingBag className="text-8xl text-gray-600 mx-auto mb-6" />
                  <h2 className="text-3xl font-black text-gray-300 mb-4">Noch keine Bestellungen</h2>
                  <p className="text-gray-400 text-lg mb-8">Deine Kaufhistorie wird hier angezeigt</p>
                  <button
                    onClick={() => navigate("/reseller-shops")}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-black flex items-center gap-3 mx-auto transition shadow-xl text-xl"
                  >
                    <FaStore /> Zum Shop
                  </button>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border-2 border-blue-500/20 rounded-2xl p-6 hover:border-blue-500/50 transition shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <FaShoppingBag className="text-blue-400 text-xl" />
                          <h3 className="text-xl font-black">Bestellung #{order.id.substring(0, 8).toUpperCase()}</h3>
                          {order.status === "completed" && (
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                              ✅ Abgeschlossen
                            </span>
                          )}
                          {order.status === "pending" && (
                            <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <FaClock /> Ausstehend
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {new Date(order.created_at).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-[#00FF9C]">€{order.total_amount.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="bg-[#0F0F14] rounded-xl p-4 mt-4">
                        <p className="text-sm text-gray-400 mb-3 font-bold flex items-center gap-2">
                          <FaBox /> Bestellte Produkte:
                        </p>
                        <div className="space-y-2">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between bg-[#1A1A1F] p-3 rounded-lg">
                              <div>
                                <p className="font-bold text-white">{item.product_name}</p>
                                <p className="text-xs text-gray-500">
                                  {item.quantity} × €{item.price.toFixed(2)}
                                </p>
                              </div>
                              <p className="text-[#00FF9C] font-black text-xl">
                                €{(item.quantity * item.price).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* EPIC INFO BOX */}
          <div className="mt-8 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 border-2 border-blue-500/30 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="bg-blue-500/20 p-4 rounded-xl">
                <FaRocket className="text-blue-400 text-3xl" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-blue-400 mb-3">💡 Tipps & Tricks</h3>
                <ul className="text-blue-200 space-y-2">
                  <li className="flex items-center gap-2">
                    <FaStar className="text-yellow-400" />
                    <span>Speichere deine Keys sicher ab - Download als .txt oder kopiere sie</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaStore className="text-green-400" />
                    <span>Entdecke neue Produkte in den <button onClick={() => navigate("/reseller-shops")} className="underline font-bold hover:text-[#00FF9C]">Reseller Shops</button></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaKey className="text-[#00FF9C]" />
                    <span>Deine Keys sind nach Produkt gruppiert für bessere Übersicht</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-400" />
                    <span>Alle Keys wurden auch per E-Mail an {user?.email} gesendet</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
