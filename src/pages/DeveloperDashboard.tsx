// src/pages/DeveloperDashboard.tsx - ULTRA MODERN DEVELOPER DASHBOARD V2
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
  FaDollarSign,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaTrophy,
  FaArrowUp,
  FaArrowDown,
  FaArrowLeft,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

type DeveloperInfo = {
  id: string;
  name: string;
  owner_email: string;
  plan: string;
};

type Stats = {
  totalProducts: number;
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  totalResellers: number;
  activeResellers: number;
  totalRevenue: number;
  monthlyRevenue: number;
};

type RecentActivity = {
  id: string;
  type: 'license_created' | 'product_created' | 'reseller_joined';
  message: string;
  timestamp: string;
};

type TopProduct = {
  id: string;
  name: string;
  license_count: number;
  revenue: number;
};

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [developer, setDeveloper] = useState<DeveloperInfo | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalLicenses: 0,
    activeLicenses: 0,
    expiredLicenses: 0,
    totalResellers: 0,
    activeResellers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        console.log("🚀 DeveloperDashboard Init...");

        const { data, error: authError } = await supabase.auth.getUser();

        if (authError || !data.user) {
          setLoading(false);
          console.error("❌ Auth Error:", authError);
          openDialog({
            type: "warning",
            title: "🔒 Anmeldung erforderlich",
            message: "Bitte melde dich als Developer an!",
            closeButton: "OK",
          });
          setTimeout(() => navigate("/dev-login", { replace: true }), 1500);
          return;
        }

        const isDev = (data.user?.user_metadata as any)?.is_developer;
        const userRole = (data.user?.user_metadata as any)?.role;
        const orgId = (data.user?.user_metadata as any)?.organization_id;

        // Check if user is trying to access as reseller
        if (userRole === "reseller") {
          setLoading(false);
          openDialog({
            type: "error",
            title: "❌ Zugriff verweigert",
            message: "Du bist als Reseller eingeloggt. Diese Seite ist nur für Developer!",
            closeButton: "OK",
          });
          setTimeout(() => navigate("/reseller-dashboard", { replace: true }), 2000);
          return;
        }

        if (!isDev || !orgId) {
          setLoading(false);
          console.error("❌ Not a developer or missing org_id!");
          openDialog({
            type: "error",
            title: "❌ Zugriff verweigert",
            message: "Du bist kein Developer oder deine Organisation fehlt!",
            closeButton: "OK",
          });
          setTimeout(() => navigate("/dev-login", { replace: true }), 1500);
          return;
        }

        setOrganizationId(orgId);
        await loadData(orgId);
      } catch (err) {
        setLoading(false);
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

  async function loadData(orgId: string) {
    setLoading(true);
    try {
      // Load organization
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, owner_email, plan")
        .eq("id", orgId)
        .maybeSingle();

      if (orgError) {
        console.error("❌ Org Load Error:", orgError);
      }

      if (orgData) {
        console.log("✅ Organization loaded:", orgData.name);
        setDeveloper(orgData as DeveloperInfo);
      }

      // Load products with license counts
      const { data: productsData } = await supabase
        .from("products")
        .select(`
          id,
          name,
          base_price,
          licenses:licenses(id)
        `)
        .eq("organization_id", orgId);

      const totalProducts = productsData?.length || 0;

      // Calculate top products
      const topProds: TopProduct[] = (productsData || [])
        .map(p => ({
          id: p.id,
          name: p.name,
          license_count: p.licenses?.length || 0,
          revenue: (p.licenses?.length || 0) * (p.base_price || 0),
        }))
        .sort((a, b) => b.license_count - a.license_count)
        .slice(0, 5);

      setTopProducts(topProds);

      // Load licenses with status
      const { data: licensesData } = await supabase
        .from("licenses")
        .select("id, status, expires_at")
        .eq("organization_id", orgId);

      const totalLicenses = licensesData?.length || 0;
      const activeLicenses = (licensesData || []).filter(l => {
        if (l.status !== 'active') return false;
        if (!l.expires_at) return true;
        return new Date(l.expires_at) > new Date();
      }).length;
      const expiredLicenses = totalLicenses - activeLicenses;

      // Load resellers
      const { data: resellersData } = await supabase
        .from("developer_resellers")
        .select("id, status, created_at")
        .eq("developer_id", orgId);

      const totalResellers = resellersData?.length || 0;
      const activeResellers = (resellersData || []).filter(r => r.status === "active").length;

      // Calculate revenue (simplified)
      const totalRevenue = topProds.reduce((sum, p) => sum + p.revenue, 0);

      // Monthly revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentLicenses = (licensesData || []).filter(
        l => new Date(l.created_at || 0) > thirtyDaysAgo
      );
      const monthlyRevenue = recentLicenses.length * 50; // Estimate

      setStats({
        totalProducts,
        totalLicenses,
        activeLicenses,
        expiredLicenses,
        totalResellers,
        activeResellers,
        totalRevenue,
        monthlyRevenue,
      });

      // Build recent activity
      const activities: RecentActivity[] = [];

      // Recent products
      const recentProducts = (productsData || [])
        .slice(0, 3)
        .map(p => ({
          id: p.id,
          type: 'product_created' as const,
          message: `Produkt "${p.name}" erstellt`,
          timestamp: new Date().toISOString(),
        }));

      // Recent resellers
      const recentResellers = (resellersData || [])
        .filter(r => r.status === 'active')
        .slice(0, 2)
        .map(r => ({
          id: r.id,
          type: 'reseller_joined' as const,
          message: `Neuer Reseller beigetreten`,
          timestamp: r.created_at,
        }));

      activities.push(...recentProducts, ...recentResellers);
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setRecentActivity(activities.slice(0, 5));
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
    navigate("/dev-login", { replace: true });
  }

  if (loading) {
    return (
      <div className="flex w-full min-h-screen bg-gradient-to-br from-[#0F0F14] via-[#1A1A1F] to-[#0F0F14]">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <p className="text-xl text-gray-300">Lädt Developer Dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  const revenueChange = stats.monthlyRevenue > 0 ? "+12%" : "0%";
  const isRevenueUp = stats.monthlyRevenue > 0;

  return (
    <>
      {DialogComponent}

      <div className="flex w-full min-h-screen bg-gradient-to-br from-[#0F0F14] via-[#1A1A1F] to-[#0F0F14]">
        <Sidebar />

        <main className="ml-64 flex-1 p-8 text-[#E0E0E0]">
          {/* BACK BUTTON */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition mb-6 text-sm font-semibold"
          >
            <FaArrowLeft /> Zurück zur Startseite
          </button>

          {/* ANIMATED HEADER */}
          <div className="relative mb-8 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border-2 border-blue-500/50 rounded-3xl p-8 overflow-hidden shadow-2xl shadow-blue-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-4 rounded-2xl shadow-lg">
                    <FaRocket className="text-4xl text-white" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Developer Dashboard
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">
                      {developer?.name || "Loading..."} • Plan: <strong className="text-[#00FF9C]">{developer?.plan || "N/A"}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl font-bold flex items-center gap-2 transition shadow-lg hover:shadow-red-500/50"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            </div>
          </div>

          {/* MAIN STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Revenue */}
            <div className="group relative bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-green-500/30 hover:border-green-400 rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-green-400/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-400/20 p-3 rounded-xl group-hover:animate-pulse">
                  <FaDollarSign className="text-green-400 text-3xl" />
                </div>
                <p className="text-gray-400 text-sm">Gesamtumsatz</p>
              </div>
              <p className="text-5xl font-black text-green-400 mb-2">
                €{stats.totalRevenue.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 text-xs">
                {isRevenueUp ? (
                  <FaArrowUp className="text-green-400" />
                ) : (
                  <FaArrowDown className="text-red-400" />
                )}
                <span className={isRevenueUp ? "text-green-400" : "text-red-400"}>
                  {revenueChange} diesen Monat
                </span>
              </div>
            </div>

            {/* Products */}
            <div className="group relative bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-blue-500/30 hover:border-blue-400 rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-400/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-400/20 p-3 rounded-xl group-hover:animate-pulse">
                  <FaBox className="text-blue-400 text-3xl" />
                </div>
                <p className="text-gray-400 text-sm">Produkte</p>
              </div>
              <p className="text-5xl font-black text-blue-400 mb-2">
                {stats.totalProducts}
              </p>
              <p className="text-xs text-gray-500">Gesamt erstellt</p>
            </div>

            {/* Active Licenses */}
            <div className="group relative bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-[#00FF9C]/30 hover:border-[#00FF9C] rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#00FF9C]/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#00FF9C]/20 p-3 rounded-xl group-hover:animate-pulse">
                  <FaCheckCircle className="text-[#00FF9C] text-3xl" />
                </div>
                <p className="text-gray-400 text-sm">Aktive Lizenzen</p>
              </div>
              <p className="text-5xl font-black text-[#00FF9C] mb-2">
                {stats.activeLicenses}
              </p>
              <p className="text-xs text-gray-500">von {stats.totalLicenses} gesamt</p>
            </div>

            {/* Resellers */}
            <div className="group relative bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-purple-500/30 hover:border-purple-400 rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-400/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-400/20 p-3 rounded-xl group-hover:animate-pulse">
                  <FaUsers className="text-purple-400 text-3xl" />
                </div>
                <p className="text-gray-400 text-sm">Aktive Reseller</p>
              </div>
              <p className="text-5xl font-black text-purple-400 mb-2">
                {stats.activeResellers}
              </p>
              <p className="text-xs text-gray-500">von {stats.totalResellers} gesamt</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* QUICK ACTIONS */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
                <FaFire className="text-orange-400" />
                Quick Actions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => navigate("/dev-products")}
                  className="bg-gradient-to-br from-blue-600/20 to-blue-600/10 border-2 border-blue-500/50 rounded-2xl p-6 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition cursor-pointer group"
                >
                  <FaBox className="text-4xl text-blue-400 mb-3 group-hover:scale-110 transition" />
                  <h3 className="text-xl font-bold mb-2">Produkte</h3>
                  <p className="text-sm text-gray-400 mb-4">Verwalte deine Produkte</p>
                  <div className="text-blue-400 font-bold text-sm">Öffnen →</div>
                </div>

                <div
                  onClick={() => navigate("/dev-licenses")}
                  className="bg-gradient-to-br from-green-600/20 to-green-600/10 border-2 border-green-500/50 rounded-2xl p-6 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20 transition cursor-pointer group"
                >
                  <FaKey className="text-4xl text-green-400 mb-3 group-hover:scale-110 transition" />
                  <h3 className="text-xl font-bold mb-2">Lizenzen</h3>
                  <p className="text-sm text-gray-400 mb-4">Erstelle Lizenzen</p>
                  <div className="text-green-400 font-bold text-sm">Öffnen →</div>
                </div>

                <div
                  onClick={() => navigate("/dev-resellers")}
                  className="bg-gradient-to-br from-purple-600/20 to-purple-600/10 border-2 border-purple-500/50 rounded-2xl p-6 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition cursor-pointer group"
                >
                  <FaUsers className="text-4xl text-purple-400 mb-3 group-hover:scale-110 transition" />
                  <h3 className="text-xl font-bold mb-2">Reseller</h3>
                  <p className="text-sm text-gray-400 mb-4">Anfragen verwalten</p>
                  <div className="text-purple-400 font-bold text-sm">Öffnen →</div>
                </div>
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <FaClock className="text-yellow-400" />
                Letzte Aktivität
              </h2>

              {recentActivity.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Noch keine Aktivität</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="bg-[#2C2C34] rounded-xl p-3 border border-[#3C3C44] hover:border-[#00FF9C] transition"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-1">
                          {activity.type === 'product_created' && <FaBox className="text-blue-400" />}
                          {activity.type === 'license_created' && <FaKey className="text-green-400" />}
                          {activity.type === 'reseller_joined' && <FaUsers className="text-purple-400" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.timestamp).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TOP PRODUCTS */}
          {topProducts.length > 0 && (
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-8 mb-8 shadow-xl">
              <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
                <FaTrophy className="text-yellow-400" />
                Top Produkte
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topProducts.slice(0, 3).map((product, index) => (
                  <div
                    key={product.id}
                    className="bg-gradient-to-br from-[#2C2C34] to-[#1A1A1F] border border-[#3C3C44] rounded-xl p-6 hover:border-[#00FF9C] transition relative overflow-hidden"
                  >
                    {index === 0 && (
                      <div className="absolute top-0 right-0 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-bl-lg">
                        🏆 #1
                      </div>
                    )}
                    <h3 className="text-lg font-bold mb-3">{product.name}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Lizenzen:</span>
                        <span className="font-bold text-[#00FF9C]">{product.license_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Umsatz:</span>
                        <span className="font-bold text-green-400">€{product.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INFO BOXES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-2 border-blue-500/50 rounded-2xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                <FaFire /> Schnellstart
              </h3>
              <ol className="text-blue-300 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">1️⃣</span>
                  <span>Gehe zu <strong>Produkte</strong> und erstelle dein erstes Produkt</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">2️⃣</span>
                  <span>Gehe zu <strong>Lizenzen</strong> und erstelle Lizenzen für deine Kunden</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">3️⃣</span>
                  <span>Gehe zu <strong>Reseller</strong> um Anfragen zu verwalten</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">4️⃣</span>
                  <span>Überwache alles in deinem Dashboard</span>
                </li>
              </ol>
            </div>

            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/50 rounded-2xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
                <FaLightbulb /> Pro-Tipps
              </h3>
              <ul className="text-green-300 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-xl">✅</span>
                  <span>Mehrere Produkte = mehr Umsatzpotenzial</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">✅</span>
                  <span>Reseller sind dein erweiterter Vertriebskanal</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">✅</span>
                  <span>Kommuniziere regelmäßig mit deinen Resellern</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">✅</span>
                  <span>Überwache deine Lizenz-Ablaufdaten für Renewals</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
