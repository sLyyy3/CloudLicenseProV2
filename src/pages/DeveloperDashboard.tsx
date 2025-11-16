// src/pages/DeveloperDashboard.tsx - RESELLER DASHBOARD (Massiv erweitert)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaRocket,
  FaSignOutAlt,
  FaBox,
  FaKey,
  FaUsers,
  FaChartBar,
  FaFire,
  FaLightbulb,
  FaStore,
  FaCoins,
  FaArrowUp,
  FaArrowDown,
  FaTrophy,
  FaBell,
  FaClock,
  FaShoppingCart,
  FaChartLine,
  FaWallet,
  FaEye,
  FaCheckCircle,
  FaExclamationTriangle,
  FaGem,
  FaStar,
  FaCalendarAlt,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

type ResellerInfo = {
  id: string;
  name: string;
  owner_email: string;
  plan: string;
  created_at?: string;
};

type Stats = {
  totalKeys: number;
  soldKeys: number;
  revenue: number;
  commission: number;
  activeListings: number;
  pendingOrders: number;
  totalCustomers: number;
  avgRating: number;
};

type RecentSale = {
  id: string;
  product_name: string;
  price: number;
  commission: number;
  customer: string;
  date: string;
};

type Notification = {
  id: string;
  type: "sale" | "low_stock" | "review" | "info";
  message: string;
  time: string;
  read: boolean;
};

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [reseller, setReseller] = useState<ResellerInfo | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalKeys: 0,
    soldKeys: 0,
    revenue: 0,
    commission: 0,
    activeListings: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    avgRating: 4.8,
  });
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "all">("week");

  useEffect(() => {
    async function init() {
      try {
        console.log("🚀 Reseller Dashboard Init...");

        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          console.error("❌ Auth Error:", error);
          navigate("/reseller-login", { replace: true });
          return;
        }

        const isReseller = (data.user?.user_metadata as any)?.is_reseller;
        const orgId = (data.user?.user_metadata as any)?.organization_id;

        if (!isReseller || !orgId) {
          console.error("❌ Not a reseller or missing org_id!");
          navigate("/reseller-login", { replace: true });
          return;
        }

        setOrganizationId(orgId);
        await loadData(orgId);
        loadMockNotifications();
        loadMockRecentSales();
      } catch (err) {
        console.error("❌ Init Error:", err);
        openDialog({
          type: "error",
          title: "❌ Fehler",
          message: `${err}`,
          closeButton: "OK",
        });
      }
    }
    init();
  }, []);

  // Mock-Daten für Demo-Zwecke
  function loadMockNotifications() {
    setNotifications([
      {
        id: "1",
        type: "sale",
        message: "Neue Bestellung: Rust Cheat Key für 29,99€",
        time: "Vor 5 Minuten",
        read: false,
      },
      {
        id: "2",
        type: "low_stock",
        message: "Warnung: Nur noch 3 Keys für 'Apex Legends Cheat' verfügbar",
        time: "Vor 1 Stunde",
        read: false,
      },
      {
        id: "3",
        type: "review",
        message: "Neue 5-Sterne Bewertung von Kunde Max M.",
        time: "Vor 3 Stunden",
        read: true,
      },
      {
        id: "4",
        type: "info",
        message: "Dein Shop hat heute bereits 12 Besucher",
        time: "Heute, 09:00",
        read: true,
      },
    ]);
  }

  function loadMockRecentSales() {
    setRecentSales([
      {
        id: "1",
        product_name: "Rust Cheat - 30 Tage",
        price: 29.99,
        commission: 1.50,
        customer: "Max M.",
        date: "Vor 5 Min",
      },
      {
        id: "2",
        product_name: "Apex Legends Cheat - Lifetime",
        price: 79.99,
        commission: 4.00,
        customer: "Anna K.",
        date: "Vor 1 Std",
      },
      {
        id: "3",
        product_name: "CS2 Cheat - 7 Tage",
        price: 14.99,
        commission: 0.75,
        customer: "Leon B.",
        date: "Vor 3 Std",
      },
      {
        id: "4",
        product_name: "Valorant Cheat - 30 Tage",
        price: 39.99,
        commission: 2.00,
        customer: "Julia S.",
        date: "Gestern",
      },
      {
        id: "5",
        product_name: "Fortnite Cheat - 14 Tage",
        price: 24.99,
        commission: 1.25,
        customer: "Tim W.",
        date: "Gestern",
      },
    ]);
  }

  async function loadData(orgId: string) {
    setLoading(true);
    try {
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, owner_email, plan, created_at")
        .eq("id", orgId)
        .maybeSingle();

      if (orgError) {
        console.error("❌ Org Load Error:", orgError);
      }

      if (orgData) {
        console.log("✅ Organization loaded:", orgData.name);
        setReseller(orgData as ResellerInfo);
      }

      // Lade Produkte/Keys (für Reseller sind das die Keys im Inventar)
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id")
        .eq("organization_id", orgId);

      if (productsError) {
        console.error("❌ Products Load Error:", productsError);
      }

      // Lade Lizenzen (verkaufte Keys)
      const { data: licensesData, error: licensesError } = await supabase
        .from("licenses")
        .select("id")
        .eq("organization_id", orgId);

      if (licensesError) {
        console.error("❌ Licenses Load Error:", licensesError);
      }

      // Mock-Statistiken für Demo (da keine echten Daten vorliegen)
      // In Production würden diese aus der DB kommen
      setStats({
        totalKeys: productsData?.length || 127,
        soldKeys: licensesData?.length || 89,
        revenue: 2845.50, // Mock
        commission: 142.28, // 5% von revenue
        activeListings: productsData?.length || 15,
        pendingOrders: 3,
        totalCustomers: 56,
        avgRating: 4.8,
      });
    } catch (err) {
      console.error("❌ Error loading data:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler beim Laden",
        message: "Dashboard-Daten konnten nicht geladen werden",
        closeButton: "OK",
      });
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/reseller-login", { replace: true });
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "sale":
        return <FaShoppingCart className="text-green-400" />;
      case "low_stock":
        return <FaExclamationTriangle className="text-yellow-400" />;
      case "review":
        return <FaStar className="text-purple-400" />;
      default:
        return <FaBell className="text-blue-400" />;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-3xl animate-spin">⏳</div>
          <p className="text-lg">Lädt Reseller Dashboard...</p>
        </div>
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        <Sidebar />

        {/* HEADER */}
        <div className="ml-0 md:ml-64 bg-gradient-to-r from-[#1A1A1F] via-[#2C2C34] to-[#1A1A1F] border-b border-purple-500/20 p-4 md:p-6 sticky top-0 z-40 shadow-lg shadow-purple-500/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg shadow-purple-500/20">
                <FaStore className="text-white text-2xl md:text-3xl" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Reseller Dashboard
                </h1>
                <p className="text-gray-400 text-xs md:text-sm">
                  {reseller?.name || "Loading..."} • <span className="text-green-400 font-bold">Nur 5% Fee</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 md:p-3 bg-[#2C2C34] hover:bg-[#3C3C44] rounded-lg transition border border-[#3C3C44]"
                >
                  <FaBell className="text-gray-400 text-lg md:text-xl" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-xs flex items-center justify-center font-bold">
                      {unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-[#1A1A1F] border border-purple-500/30 rounded-lg shadow-2xl shadow-purple-500/10 z-50">
                    <div className="p-4 border-b border-[#2C2C34]">
                      <h3 className="font-bold text-lg">Benachrichtigungen</h3>
                      <p className="text-xs text-gray-400">{unreadNotifications} ungelesen</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 border-b border-[#2C2C34] hover:bg-[#2C2C34] transition cursor-pointer ${
                            !notif.read ? "bg-purple-600/5" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">{getNotificationIcon(notif.type)}</div>
                            <div className="flex-1">
                              <p className="text-sm text-white">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-[#2C2C34] text-center">
                      <button className="text-purple-400 hover:underline text-sm font-bold">
                        Alle anzeigen
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold flex items-center gap-2 transition text-sm md:text-base"
              >
                <FaSignOutAlt /> <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="ml-0 md:ml-64 p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* WELCOME BANNER */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 md:p-8 shadow-lg shadow-purple-500/20">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Willkommen zurück, {reseller?.name || "Reseller"}! 👋
                  </h2>
                  <p className="text-purple-100 text-sm md:text-base">
                    Hier ist deine aktuelle Performance-Übersicht für <strong>{timeRange === "week" ? "diese Woche" : "heute"}</strong>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTimeRange("today")}
                    className={`px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition ${
                      timeRange === "today"
                        ? "bg-white text-purple-600"
                        : "bg-purple-700 text-white hover:bg-purple-800"
                    }`}
                  >
                    Heute
                  </button>
                  <button
                    onClick={() => setTimeRange("week")}
                    className={`px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition ${
                      timeRange === "week"
                        ? "bg-white text-purple-600"
                        : "bg-purple-700 text-white hover:bg-purple-800"
                    }`}
                  >
                    Woche
                  </button>
                  <button
                    onClick={() => setTimeRange("month")}
                    className={`px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition ${
                      timeRange === "month"
                        ? "bg-white text-purple-600"
                        : "bg-purple-700 text-white hover:bg-purple-800"
                    }`}
                  >
                    Monat
                  </button>
                </div>
              </div>
            </div>

            {/* MAIN STATS GRID - 4 Spalten */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Revenue */}
              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6 hover:border-green-500/60 transition shadow-lg hover:shadow-green-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-green-600/20 rounded-lg">
                    <FaWallet className="text-green-400 text-2xl" />
                  </div>
                  <div className="flex items-center gap-1 text-green-400 text-sm font-bold">
                    <FaArrowUp />
                    <span>+15%</span>
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Brutto-Umsatz</h3>
                <p className="text-3xl md:text-4xl font-bold text-green-400">
                  €{stats.revenue.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Netto (nach 5% Fee): <strong className="text-green-300">€{(stats.revenue - stats.commission).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</strong>
                </p>
              </div>

              {/* Commission */}
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/60 transition shadow-lg hover:shadow-purple-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-purple-600/20 rounded-lg">
                    <FaCoins className="text-purple-400 text-2xl" />
                  </div>
                  <div className="text-purple-400 text-xs font-bold bg-purple-600/20 px-2 py-1 rounded">
                    5% FEE
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Provisionskosten</h3>
                <p className="text-3xl md:text-4xl font-bold text-purple-400">
                  €{stats.commission.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Nur 5% pro Verkauf - keine Fixkosten!
                </p>
              </div>

              {/* Sold Keys */}
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/60 transition shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-blue-600/20 rounded-lg">
                    <FaShoppingCart className="text-blue-400 text-2xl" />
                  </div>
                  <div className="flex items-center gap-1 text-blue-400 text-sm font-bold">
                    <FaArrowUp />
                    <span>+8</span>
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Verkaufte Keys</h3>
                <p className="text-3xl md:text-4xl font-bold text-blue-400">{stats.soldKeys}</p>
                <p className="text-xs text-gray-500 mt-2">
                  von {stats.totalKeys} Gesamt-Keys
                </p>
              </div>

              {/* Total Keys */}
              <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/60 transition shadow-lg hover:shadow-yellow-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-yellow-600/20 rounded-lg">
                    <FaKey className="text-yellow-400 text-2xl" />
                  </div>
                  <div className="text-yellow-400 text-xs font-bold bg-yellow-600/20 px-2 py-1 rounded">
                    INVENTAR
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Keys im Lager</h3>
                <p className="text-3xl md:text-4xl font-bold text-yellow-400">{stats.totalKeys}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.activeListings} aktive Listings
                </p>
              </div>
            </div>

            {/* SECONDARY STATS - 4 Spalten */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {/* Pending Orders */}
              <div className="bg-[#1A1A1F] border border-orange-500/20 rounded-lg p-4 hover:border-orange-500/50 transition">
                <div className="flex items-center gap-2 mb-2">
                  <FaClock className="text-orange-400" />
                  <h4 className="text-xs font-medium text-gray-400">Offene Bestellungen</h4>
                </div>
                <p className="text-2xl font-bold text-orange-400">{stats.pendingOrders}</p>
              </div>

              {/* Total Customers */}
              <div className="bg-[#1A1A1F] border border-cyan-500/20 rounded-lg p-4 hover:border-cyan-500/50 transition">
                <div className="flex items-center gap-2 mb-2">
                  <FaUsers className="text-cyan-400" />
                  <h4 className="text-xs font-medium text-gray-400">Kunden</h4>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{stats.totalCustomers}</p>
              </div>

              {/* Avg Rating */}
              <div className="bg-[#1A1A1F] border border-yellow-500/20 rounded-lg p-4 hover:border-yellow-500/50 transition">
                <div className="flex items-center gap-2 mb-2">
                  <FaStar className="text-yellow-400" />
                  <h4 className="text-xs font-medium text-gray-400">Bewertung</h4>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats.avgRating} ⭐</p>
              </div>

              {/* Active Listings */}
              <div className="bg-[#1A1A1F] border border-green-500/20 rounded-lg p-4 hover:border-green-500/50 transition">
                <div className="flex items-center gap-2 mb-2">
                  <FaGem className="text-green-400" />
                  <h4 className="text-xs font-medium text-gray-400">Live Angebote</h4>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats.activeListings}</p>
              </div>
            </div>

            {/* TWO COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* LEFT COLUMN - Recent Sales (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recent Sales Table */}
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-[#2C2C34] bg-gradient-to-r from-purple-600/10 to-pink-600/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <FaChartLine className="text-purple-400" />
                          Letzte Verkäufe
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Deine neuesten Transaktionen</p>
                      </div>
                      <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-bold transition">
                        Alle anzeigen →
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#2C2C34]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Produkt</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Kunde</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Preis</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Fee</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Zeit</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2C2C34]">
                        {recentSales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-[#2C2C34] transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <FaKey className="text-purple-400" />
                                <span className="font-medium text-white text-sm">{sale.product_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">{sale.customer}</td>
                            <td className="px-6 py-4 text-sm font-bold text-green-400">
                              €{sale.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm text-purple-400">
                              €{sale.commission.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-400">{sale.date}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs font-bold">
                                Ausgeliefert
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-[#2C2C34] text-center">
                    <p className="text-xs text-gray-400">
                      Gesamt heute: <strong className="text-green-400">€189.95</strong> · Fee: <strong className="text-purple-400">€9.50</strong>
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <FaFire className="text-orange-400" />
                    Schnellaktionen
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => navigate("/reseller-products")}
                      className="p-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-lg transition text-center group"
                    >
                      <FaBox className="text-blue-400 text-2xl mb-2 mx-auto group-hover:scale-110 transition" />
                      <p className="text-xs font-bold text-white">Keys hochladen</p>
                    </button>
                    <button
                      onClick={() => navigate("/reseller-analytics")}
                      className="p-4 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 rounded-lg transition text-center group"
                    >
                      <FaChartBar className="text-purple-400 text-2xl mb-2 mx-auto group-hover:scale-110 transition" />
                      <p className="text-xs font-bold text-white">Analytics</p>
                    </button>
                    <button
                      onClick={() => navigate("/reseller-customers")}
                      className="p-4 bg-green-600/10 hover:bg-green-600/20 border border-green-500/30 rounded-lg transition text-center group"
                    >
                      <FaUsers className="text-green-400 text-2xl mb-2 mx-auto group-hover:scale-110 transition" />
                      <p className="text-xs font-bold text-white">Kunden</p>
                    </button>
                    <button
                      onClick={() => navigate("/reseller-billing")}
                      className="p-4 bg-yellow-600/10 hover:bg-yellow-600/20 border border-yellow-500/30 rounded-lg transition text-center group"
                    >
                      <FaWallet className="text-yellow-400 text-2xl mb-2 mx-auto group-hover:scale-110 transition" />
                      <p className="text-xs font-bold text-white">Auszahlung</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN (1/3) */}
              <div className="space-y-6">
                {/* Performance */}
                <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <FaTrophy className="text-yellow-400" />
                    Performance
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="text-gray-400">Verkaufsrate</span>
                        <span className="font-bold text-green-400">70%</span>
                      </div>
                      <div className="h-2 bg-[#2C2C34] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-600 to-emerald-600 rounded-full" style={{ width: "70%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="text-gray-400">Kundenzufriedenheit</span>
                        <span className="font-bold text-yellow-400">96%</span>
                      </div>
                      <div className="h-2 bg-[#2C2C34] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full" style={{ width: "96%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="text-gray-400">Lagerauslastung</span>
                        <span className="font-bold text-blue-400">45%</span>
                      </div>
                      <div className="h-2 bg-[#2C2C34] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full" style={{ width: "45%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-400" />
                    Diese Woche
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Neue Kunden</span>
                      <span className="font-bold text-green-400">+12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Transaktionen</span>
                      <span className="font-bold text-blue-400">47</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Ø Bestellwert</span>
                      <span className="font-bold text-purple-400">€32.50</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Shop-Besucher</span>
                      <span className="font-bold text-yellow-400">1,234</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[#2C2C34]">
                      <span className="text-gray-400 font-bold">Conversion Rate</span>
                      <span className="font-bold text-green-400">3.8%</span>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border border-blue-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <FaLightbulb className="text-yellow-400" />
                    Tipps für mehr Verkäufe
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Aktualisiere regelmäßig dein Inventar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Biete konkurrenzfähige Preise an</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Antworte schnell auf Kundenanfragen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Nutze die Analytics für Optimierung</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}