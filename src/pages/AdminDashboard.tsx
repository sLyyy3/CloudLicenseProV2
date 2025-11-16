// src/pages/AdminDashboard.tsx - MEGA EPIC ADMIN DASHBOARD
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaArrowLeft,
  FaCrown,
  FaUsers,
  FaBox,
  FaKey,
  FaStore,
  FaChartBar,
  FaDollarSign,
  FaShieldAlt,
  FaSignOutAlt,
  FaHome,
  FaTrash,
  FaUserShield,
  FaHandshake,
  FaDownload,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type Organization = {
  id: string;
  name: string;
  owner_email: string;
  plan: string;
  status: string;
  created_at: string;
};

type Stats = {
  totalOrgs: number;
  totalDevelopers: number;
  totalResellers: number;
  totalProducts: number;
  totalLicenses: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrgs: 0,
    totalDevelopers: 0,
    totalResellers: 0,
    totalProducts: 0,
    totalLicenses: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "orgs" | "dev" | "resellers" | "analytics" | "admin">("overview");
  const [godMode, setGodMode] = useState(false);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const isAdmin = (data.user?.user_metadata as any)?.admin === true;

      if (!isAdmin) {
        navigate("/", { replace: true });
        return;
      }

      await loadAdminData();
    }
    init();
  }, []);

  async function loadAdminData() {
    setLoading(true);
    try {
      // Organizations
      const { data: orgsData } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (orgsData) {
        setOrganizations(orgsData);
      }

      // Count statistics
      const { data: devsData } = await supabase
        .from("organizations")
        .select("id")
        .eq("plan", "developer");

      const { data: resellersData } = await supabase
        .from("resellers")
        .select("id");

      const { data: productsData } = await supabase
        .from("products")
        .select("id");

      const { data: licensesData } = await supabase
        .from("licenses")
        .select("id");

      const { data: ordersData } = await supabase
        .from("customer_orders")
        .select("*");

      let totalRevenue = 0;
      ordersData?.forEach((order) => {
        totalRevenue += order.total_amount || 0;
      });

      setStats({
        totalOrgs: orgsData?.length || 0,
        totalDevelopers: devsData?.length || 0,
        totalResellers: resellersData?.length || 0,
        totalProducts: productsData?.length || 0,
        totalLicenses: licensesData?.length || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue,
        activeUsers: orgsData?.length || 0,
      });
    } catch (err) {
      console.error("Error loading admin data:", err);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  async function handleDeleteOrg(orgId: string) {
    const confirmed = window.confirm("⚠️ Diese Organisation wirklich löschen? Das kann nicht rückgängig gemacht werden!");
    if (!confirmed) return;

    try {
      // Delete associated data
      await supabase.from("licenses").delete().eq("organization_id", orgId);
      await supabase.from("products").delete().eq("organization_id", orgId);
      await supabase.from("customers").delete().eq("organization_id", orgId);

      // Delete organization
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", orgId);

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Gelöscht",
        message: "Organisation wurde gelöscht",
        closeButton: "OK",
      });

      await loadAdminData();
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    }
  }

  async function navigateAsAdmin(orgId: string, type: "dev" | "reseller" | "user") {
    try {
      // Update current user to navigate as that org
      const targetPath =
        type === "dev"
          ? "/dev-dashboard"
          : type === "reseller"
          ? "/reseller-dashboard"
          : "/dashboard";

      // Store admin override
      sessionStorage.setItem("adminOverride", JSON.stringify({ orgId, type }));

      navigate(targetPath);
    } catch (err) {
      console.error("Error:", err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">👑</div>
          <p>⏳ Lädt Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border-b border-[#3C3C44] p-6 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
            {/* LEFT */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-3 py-2 bg-[#2C2C34] hover:bg-[#3C3C44] rounded-lg text-gray-400 hover:text-[#00FF9C] transition"
              >
                <FaHome /> Home
              </button>
              <div className="border-l border-[#3C3C44] pl-4">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <FaCrown className="text-yellow-400" />
                  Admin Panel
                </h1>
                <p className="text-gray-400 text-sm">
                  👑 {godMode ? "GOD MODE AKTIV" : "Normaler Modus"}
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex gap-3 flex-wrap justify-end">
              <button
                onClick={() => setGodMode(!godMode)}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition ${
                  godMode
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <FaShieldAlt /> {godMode ? "GOD MODE: AN" : "GOD MODE: AUS"}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold flex items-center gap-2 transition"
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {/* KEY METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-purple-600 transition cursor-pointer"
              onClick={() => setActiveTab("orgs")}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Organisationen</p>
                <FaUsers className="text-purple-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-purple-400">{stats.totalOrgs}</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-blue-600 transition cursor-pointer"
              onClick={() => setActiveTab("dev")}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Developer</p>
                <FaBox className="text-blue-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-blue-400">{stats.totalDevelopers}</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-green-600 transition cursor-pointer"
              onClick={() => setActiveTab("resellers")}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Reseller</p>
                <FaStore className="text-green-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-green-400">{stats.totalResellers}</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-yellow-600 transition cursor-pointer"
              onClick={() => setActiveTab("analytics")}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Revenue</p>
                <FaDollarSign className="text-yellow-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-yellow-400">€{stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          {/* MORE STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-2">Produkte</p>
              <p className="text-3xl font-bold text-[#00FF9C]">{stats.totalProducts}</p>
            </div>
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-2">Lizenzen</p>
              <p className="text-3xl font-bold text-blue-400">{stats.totalLicenses}</p>
            </div>
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-2">Orders</p>
              <p className="text-3xl font-bold text-purple-400">{stats.totalOrders}</p>
            </div>
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-2">Active Users</p>
              <p className="text-3xl font-bold text-green-400">{stats.activeUsers}</p>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex gap-2 mb-8 flex-wrap">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded font-bold transition ${
                activeTab === "overview"
                  ? "bg-[#00FF9C] text-[#0E0E12]"
                  : "bg-[#2C2C34] hover:bg-[#3C3C44]"
              }`}
            >
              📊 Überblick
            </button>
            <button
              onClick={() => setActiveTab("orgs")}
              className={`px-4 py-2 rounded font-bold transition ${
                activeTab === "orgs"
                  ? "bg-[#00FF9C] text-[#0E0E12]"
                  : "bg-[#2C2C34] hover:bg-[#3C3C44]"
              }`}
            >
              👥 Organisationen
            </button>
            <button
              onClick={() => setActiveTab("dev")}
              className={`px-4 py-2 rounded font-bold transition ${
                activeTab === "dev"
                  ? "bg-[#00FF9C] text-[#0E0E12]"
                  : "bg-[#2C2C34] hover:bg-[#3C3C44]"
              }`}
            >
              👨‍💻 Developer
            </button>
            <button
              onClick={() => setActiveTab("resellers")}
              className={`px-4 py-2 rounded font-bold transition ${
                activeTab === "resellers"
                  ? "bg-[#00FF9C] text-[#0E0E12]"
                  : "bg-[#2C2C34] hover:bg-[#3C3C44]"
              }`}
            >
              🏪 Reseller
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded font-bold transition ${
                activeTab === "analytics"
                  ? "bg-[#00FF9C] text-[#0E0E12]"
                  : "bg-[#2C2C34] hover:bg-[#3C3C44]"
              }`}
            >
              📈 Analytics
            </button>
          </div>

          {/* TAB CONTENT */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-blue-600/10 border border-blue-600 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-blue-400 mb-4">📋 System Info</h2>
                <div className="space-y-2 text-sm text-blue-300">
                  <p>✅ Total Organizations: <strong>{stats.totalOrgs}</strong></p>
                  <p>✅ Total Revenue: <strong>€{stats.totalRevenue.toFixed(2)}</strong></p>
                  <p>✅ Total Orders: <strong>{stats.totalOrders}</strong></p>
                  <p>✅ System Status: <strong className="text-green-400">Online</strong></p>
                </div>
              </div>

              {godMode && (
                <div className="bg-red-600/10 border border-red-600 rounded-lg p-8">
                  <h2 className="text-2xl font-bold text-red-400 mb-4">⚠️ GOD MODE AKTIV</h2>
                  <p className="text-red-300 text-sm mb-4">
                    Du hast Zugriff auf alle Admin-Funktionen und kannst überall als Admin navigieren.
                  </p>
                  <button
                    onClick={() => setActiveTab("orgs")}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold"
                  >
                    Zu Organisationen
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "orgs" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-6">👥 Alle Organisationen ({organizations.length})</h2>

              {organizations.length === 0 ? (
                <p className="text-gray-400">Keine Organisationen</p>
              ) : (
                <div className="space-y-3">
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C] transition"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-1">{org.name}</h3>
                          <p className="text-sm text-gray-400">{org.owner_email}</p>
                          <div className="flex gap-3 mt-2 text-xs">
                            <span className="bg-[#2C2C34] px-2 py-1 rounded">
                              Plan: <strong>{org.plan}</strong>
                            </span>
                            <span className={`px-2 py-1 rounded ${
                              org.status === "active"
                                ? "bg-green-600/20 text-green-400"
                                : "bg-red-600/20 text-red-400"
                            }`}>
                              {org.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {godMode && (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => navigateAsAdmin(org.id, "dev")}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-bold"
                          >
                            👁️ Als Dev ansehen
                          </button>
                          <button
                            onClick={() => navigateAsAdmin(org.id, "user")}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-bold"
                          >
                            👁️ Als User ansehen
                          </button>
                          <button
                            onClick={() => handleDeleteOrg(org.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-bold"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "dev" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-6">👨‍💻 Developer Organisations</h2>
              <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-6">
                <p className="text-blue-300">
                  Zeigt alle Organisationen im Developer-Plan: <strong>{organizations.filter((o) => o.plan.includes("developer")).length}</strong>
                </p>
              </div>
            </div>
          )}

          {activeTab === "resellers" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-6">🏪 Reseller Management</h2>
              <div className="bg-green-600/20 border border-green-600 rounded-lg p-6">
                <p className="text-green-300">
                  Total Reseller: <strong>{stats.totalResellers}</strong>
                </p>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">📊 System Analytics</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
                  <h3 className="font-bold mb-4">💰 Revenue</h3>
                  <p className="text-4xl font-bold text-green-400">€{stats.totalRevenue.toFixed(2)}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Aus {stats.totalOrders} Orders
                  </p>
                </div>

                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
                  <h3 className="font-bold mb-4">📈 Growth</h3>
                  <p className="text-4xl font-bold text-blue-400">{stats.totalOrgs}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Aktive Organisationen
                  </p>
                </div>
              </div>

              <div className="bg-yellow-600/10 border border-yellow-600 rounded-lg p-6">
                <h3 className="font-bold text-yellow-400 mb-4">⚙️ System Status</h3>
                <div className="space-y-2 text-sm text-yellow-300">
                  <p>✅ Database: <strong>Connected</strong></p>
                  <p>✅ API: <strong>Online</strong></p>
                  <p>✅ Auth: <strong>Active</strong></p>
                  <p>✅ Storage: <strong>Available</strong></p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}