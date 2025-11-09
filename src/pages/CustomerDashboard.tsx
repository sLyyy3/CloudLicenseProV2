// src/pages/CustomerDashboard.tsx - KUNDEN DASHBOARD MIT ORDER HISTORY & KEYS
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
  FaArrowRight,
  FaStore,
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
      // Load customer orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("customer_orders")
        .select("*")
        .eq("customer_email", email)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);

      // Load customer keys
      const { data: keysData, error: keysError } = await supabase
        .from("customer_keys")
        .select("*")
        .eq("customer_email", email)
        .order("created_at", { ascending: false });

      if (keysError) throw keysError;

      setKeys(keysData || []);
    } catch (err: any) {
      console.error("Error loading data:", err);
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

  function downloadKeys() {
    const content = keys.map((k) => k.key_code).join("\n");
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

  return (
    <>
      {DialogComponent}

      <div className="flex w-full min-h-screen bg-gradient-to-br from-[#0F0F14] via-[#1A1A1F] to-[#0F0F14]">
        <Sidebar />

        <main className="ml-64 flex-1 p-8 text-[#E0E0E0]">
          {/* HEADER */}
          <div className="mb-8">
            <div className="relative bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border-2 border-blue-500/50 rounded-3xl p-8 overflow-hidden shadow-2xl shadow-blue-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 animate-pulse"></div>
              <div className="relative z-10">
                <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  🔑 Meine License Keys
                </h1>
                <p className="text-gray-400 text-lg">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Keys */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500/20 p-3 rounded-xl">
                  <FaKey className="text-blue-400 text-3xl" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Gesamt Keys</p>
                  <p className="text-4xl font-black text-blue-400">{keys.length}</p>
                </div>
              </div>
            </div>

            {/* Active Keys */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-500/20 p-3 rounded-xl">
                  <FaCheckCircle className="text-green-400 text-3xl" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Aktiv</p>
                  <p className="text-4xl font-black text-green-400">{activeKeys}</p>
                </div>
              </div>
            </div>

            {/* Total Spent */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-500/20 p-3 rounded-xl">
                  <FaShoppingBag className="text-yellow-400 text-3xl" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Ausgegeben</p>
                  <p className="text-4xl font-black text-yellow-400">€{totalSpent.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="flex gap-4 mb-8 flex-wrap">
            <button
              onClick={() => navigate("/shop")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-bold flex items-center gap-2 transition shadow-lg hover:shadow-blue-500/50"
            >
              <FaStore /> Zum Shop
            </button>
            {keys.length > 0 && (
              <button
                onClick={downloadKeys}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-bold flex items-center gap-2 transition shadow-lg hover:shadow-green-500/50"
              >
                <FaDownload /> Alle Keys downloaden
              </button>
            )}
          </div>

          {/* TABS */}
          <div className="mb-6 flex gap-4 border-b border-[#2C2C34]">
            <button
              onClick={() => setTab("keys")}
              className={`px-6 py-3 font-bold transition border-b-2 ${
                tab === "keys"
                  ? "text-[#00FF9C] border-[#00FF9C]"
                  : "text-gray-400 border-transparent hover:text-white"
              }`}
            >
              🔑 Meine Keys
            </button>
            <button
              onClick={() => setTab("orders")}
              className={`px-6 py-3 font-bold transition border-b-2 ${
                tab === "orders"
                  ? "text-[#00FF9C] border-[#00FF9C]"
                  : "text-gray-400 border-transparent hover:text-white"
              }`}
            >
              📦 Bestellungen
            </button>
          </div>

          {/* KEYS TAB */}
          {tab === "keys" && (
            <div className="space-y-4">
              {keys.length === 0 ? (
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-12 text-center">
                  <FaKey className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-xl text-gray-400 mb-6">Du hast noch keine Keys gekauft</p>
                  <button
                    onClick={() => navigate("/shop")}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-bold flex items-center gap-2 mx-auto transition"
                  >
                    <FaShoppingBag /> Jetzt kaufen
                  </button>
                </div>
              ) : (
                keys.map((key) => (
                  <div
                    key={key.id}
                    className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-6 hover:border-[#00FF9C] transition shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <FaKey className="text-[#00FF9C]" />
                          <h3 className="text-lg font-bold">License Key</h3>
                          {key.status === "active" && (
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <FaCheckCircle /> Aktiv
                            </span>
                          )}
                        </div>
                        <code className="block bg-[#0F0F14] px-4 py-3 rounded-lg font-mono text-[#00FF9C] text-sm break-all mb-3">
                          {key.key_code}
                        </code>
                        <p className="text-xs text-gray-500">
                          Gekauft am {new Date(key.created_at).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                      <button
                        onClick={() => copyKey(key.key_code)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold flex items-center gap-2 transition shrink-0"
                      >
                        <FaCopy /> Kopieren
                      </button>
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
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-12 text-center">
                  <FaShoppingBag className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-xl text-gray-400 mb-6">Noch keine Bestellungen</p>
                  <button
                    onClick={() => navigate("/shop")}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-bold flex items-center gap-2 mx-auto transition"
                  >
                    <FaShoppingBag /> Zum Shop
                  </button>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-6 hover:border-[#00FF9C] transition shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <FaShoppingBag className="text-blue-400" />
                          <h3 className="text-lg font-bold">Bestellung #{order.id.substring(0, 8)}</h3>
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
                        <p className="text-2xl font-black text-[#00FF9C]">€{order.total_amount.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="bg-[#0F0F14] rounded-lg p-4 mt-4">
                        <p className="text-sm text-gray-400 mb-3 font-bold">📦 Bestellte Produkte:</p>
                        <div className="space-y-2">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div>
                                <p className="font-bold">{item.product_name}</p>
                                <p className="text-xs text-gray-500">
                                  {item.quantity} × €{item.price.toFixed(2)}
                                </p>
                              </div>
                              <p className="text-[#00FF9C] font-bold">
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

          {/* INFO BOX */}
          <div className="mt-8 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-2 border-blue-500/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-blue-400 mb-3 flex items-center gap-2">
              <FaArrowRight /> Nächste Schritte
            </h3>
            <ul className="text-blue-300 space-y-2 text-sm">
              <li>🛒 Besuche den <button onClick={() => navigate("/shop")} className="underline font-bold">Shop</button> um neue Keys zu kaufen</li>
              <li>🔑 Kopiere deine Keys und nutze sie in deinen Programmen</li>
              <li>📧 Alle Keys wurden auch per E-Mail gesendet</li>
              <li>💾 Speichere deine Keys sicher ab</li>
            </ul>
          </div>
        </main>
      </div>
    </>
  );
}
