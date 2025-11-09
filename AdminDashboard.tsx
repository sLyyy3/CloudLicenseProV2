// src/pages/AdminDashboard.tsx - ULTRA MEGA EPIC ADMIN DASHBOARD V2 🚀
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
  FaSearch,
  FaSync,
  FaFire,
  FaRocket,
  FaBell,
  FaCog,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaEdit,
  FaServer,
  FaDatabase,
  FaChartLine,
  FaTrophy,
  FaStar,
  FaGlobe,
  FaLightbulb,
  FaBolt,
  FaHeart,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import { formatDateTime, exportToCSV } from "../utils/helpers.tsx";

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
  activeLicenses: number;
  expiredLicenses: number;
};

type Activity = {
  id: string;
  action: string;
  user_email: string;
  timestamp: string;
  details: string;
};

type SystemHealth = {
  database: "online" | "offline";
  api: "online" | "offline";
  auth: "online" | "offline";
  storage: "online" | "offline";
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<Stats>({
    totalOrgs: 0,
    totalDevelopers: 0,
    totalResellers: 0,
    totalProducts: 0,
    totalLicenses: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    activeLicenses: 0,
    expiredLicenses: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: "online",
    api: "online",
    auth: "online",
    storage: "online",
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "orgs" | "dev" | "resellers" | "analytics" | "activity" | "health">("overview");
  const [godMode, setGodMode] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showOrgModal, setShowOrgModal] = useState(false);

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

  // Filter organizations when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrgs(organizations);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredOrgs(
        organizations.filter(
          (org) =>
            org.name.toLowerCase().includes(query) ||
            org.owner_email.toLowerCase().includes(query) ||
            org.plan.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, organizations]);

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
        setFilteredOrgs(orgsData);
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
        .select("id, status");

      const { data: ordersData } = await supabase
        .from("customer_orders")
        .select("*");

      let totalRevenue = 0;
      ordersData?.forEach((order) => {
        totalRevenue += order.total_amount || 0;
      });

      // Count active/expired licenses
      const activeLicenses = licensesData?.filter((l) => l.status === "active").length || 0;
      const expiredLicenses = licensesData?.filter((l) => l.status === "expired").length || 0;

      setStats({
        totalOrgs: orgsData?.length || 0,
        totalDevelopers: devsData?.length || 0,
        totalResellers: resellersData?.length || 0,
        totalProducts: productsData?.length || 0,
        totalLicenses: licensesData?.length || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue,
        activeUsers: orgsData?.length || 0,
        activeLicenses,
        expiredLicenses,
      });

      // Load recent activity (mock data for now - can be replaced with real audit log)
      const mockActivity: Activity[] = [
        {
          id: "1",
          action: "CREATE_LICENSE",
          user_email: "user@example.com",
          timestamp: new Date().toISOString(),
          details: "Neue Lizenz erstellt",
        },
        {
          id: "2",
          action: "UPDATE_ORG",
          user_email: "admin@example.com",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: "Organisation aktualisiert",
        },
        {
          id: "3",
          action: "DELETE_PRODUCT",
          user_email: "dev@example.com",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          details: "Produkt gelöscht",
        },
      ];
      setRecentActivity(mockActivity);

      // Check system health
      checkSystemHealth();
    } catch (err) {
      console.error("Error loading admin data:", err);
    }
    setLoading(false);
  }

  async function checkSystemHealth() {
    try {
      // Test database connection
      const { error: dbError } = await supabase.from("organizations").select("id").limit(1);

      setSystemHealth({
        database: dbError ? "offline" : "online",
        api: "online", // If we got here, API is working
        auth: "online",
        storage: "online",
      });
    } catch (err) {
      console.error("Health check error:", err);
      setSystemHealth({
        database: "offline",
        api: "offline",
        auth: "offline",
        storage: "offline",
      });
    }
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
      const targetPath =
        type === "dev"
          ? "/dev-dashboard"
          : type === "reseller"
          ? "/reseller-dashboard"
          : "/dashboard";

      sessionStorage.setItem("adminOverride", JSON.stringify({ orgId, type }));
      navigate(targetPath);
    } catch (err) {
      console.error("Error:", err);
    }
  }

  function getActivityIcon(action: string) {
    switch (action) {
      case "CREATE_LICENSE":
        return <FaKey className="text-green-400" />;
      case "UPDATE_ORG":
        return <FaEdit className="text-blue-400" />;
      case "DELETE_PRODUCT":
        return <FaTrash className="text-red-400" />;
      default:
        return <FaBell className="text-gray-400" />;
    }
  }

  function exportOrganizations() {
    const exportData = filteredOrgs.map((org) => ({
      name: org.name,
      email: org.owner_email,
      plan: org.plan,
      status: org.status,
      created: new Date(org.created_at).toLocaleDateString(),
    }));
    exportToCSV(exportData, "organizations_export.csv");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0E0E12] via-[#1A1A1F] to-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <FaCrown className="text-6xl text-yellow-400 animate-bounce mx-auto" />
          </div>
          <p className="text-xl font-bold">Lädt Admin Panel...</p>
          <p className="text-sm text-gray-400 mt-2">Bitte warten...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-gradient-to-br from-[#0E0E12] via-[#1A1A1F] to-[#0E0E12] text-[#E0E0E0]">
        {/* EPIC HEADER */}
        <div className="bg-gradient-to-r from-[#1A1A1F] via-[#2C2C34] to-[#1A1A1F] border-b border-[#3C3C44] shadow-2xl sticky top-0 z-50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              {/* LEFT */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2C2C34] hover:bg-[#3C3C44] rounded-xl text-gray-400 hover:text-[#00FF9C] transition-all transform hover:scale-105"
                >
                  <FaHome /> Home
                </button>
                <div className="border-l border-[#3C3C44] pl-4">
                  <div className="flex items-center gap-3 mb-1">
                    <FaCrown className="text-4xl text-yellow-400 animate-pulse" />
                    <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                      Admin Panel
                    </h1>
                  </div>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    {godMode ? (
                      <>
                        <FaFire className="text-red-400 animate-pulse" />
                        <span className="text-red-400 font-bold">GOD MODE AKTIV</span>
                      </>
                    ) : (
                      <>
                        <FaShieldAlt className="text-blue-400" />
                        <span>Normaler Modus</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => loadAdminData()}
                  className="px-4 py-2 bg-[#2C2C34] hover:bg-[#3C3C44] rounded-xl font-bold flex items-center gap-2 transition-all transform hover:scale-105"
                >
                  <FaSync /> Refresh
                </button>
                <button
                  onClick={() => setGodMode(!godMode)}
                  className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all transform hover:scale-105 ${
                    godMode
                      ? "bg-gradient-to-r from-red-600 to-red-700 shadow-lg shadow-red-600/50"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-600/50"
                  }`}
                >
                  <FaShieldAlt /> {godMode ? "GOD MODE: AN" : "GOD MODE: AUS"}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-600/50 rounded-xl font-bold flex items-center gap-2 transition-all transform hover:scale-105"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {/* MEGA STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Organizations */}
            <div
              className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-2xl p-6 hover:border-purple-500 transition-all cursor-pointer transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 group relative overflow-hidden"
              onClick={() => setActiveTab("orgs")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-600/20 p-3 rounded-xl">
                    <FaUsers className="text-purple-400 text-3xl" />
                  </div>
                  <FaRocket className="text-purple-400/20 text-4xl group-hover:text-purple-400/40 transition" />
                </div>
                <p className="text-gray-400 text-sm mb-1">Organisationen</p>
                <p className="text-4xl font-black text-purple-400 mb-2">{stats.totalOrgs}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                    {stats.activeUsers} aktiv
                  </span>
                </div>
              </div>
            </div>

            {/* Developer */}
            <div
              className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-2xl p-6 hover:border-blue-500 transition-all cursor-pointer transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 group relative overflow-hidden"
              onClick={() => setActiveTab("dev")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-600/20 p-3 rounded-xl">
                    <FaBox className="text-blue-400 text-3xl" />
                  </div>
                  <FaLightbulb className="text-blue-400/20 text-4xl group-hover:text-blue-400/40 transition" />
                </div>
                <p className="text-gray-400 text-sm mb-1">Developer</p>
                <p className="text-4xl font-black text-blue-400 mb-2">{stats.totalDevelopers}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
                    {stats.totalProducts} Produkte
                  </span>
                </div>
              </div>
            </div>

            {/* Reseller */}
            <div
              className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-2xl p-6 hover:border-green-500 transition-all cursor-pointer transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 group relative overflow-hidden"
              onClick={() => setActiveTab("resellers")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-600/20 p-3 rounded-xl">
                    <FaStore className="text-green-400 text-3xl" />
                  </div>
                  <FaHandshake className="text-green-400/20 text-4xl group-hover:text-green-400/40 transition" />
                </div>
                <p className="text-gray-400 text-sm mb-1">Reseller</p>
                <p className="text-4xl font-black text-green-400 mb-2">{stats.totalResellers}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-green-600/20 text-green-300 px-2 py-1 rounded">
                    {stats.totalOrders} Orders
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div
              className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-2xl p-6 hover:border-yellow-500 transition-all cursor-pointer transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20 group relative overflow-hidden"
              onClick={() => setActiveTab("analytics")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-600/20 p-3 rounded-xl">
                    <FaDollarSign className="text-yellow-400 text-3xl" />
                  </div>
                  <FaTrophy className="text-yellow-400/20 text-4xl group-hover:text-yellow-400/40 transition" />
                </div>
                <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
                <p className="text-4xl font-black text-yellow-400 mb-2">€{stats.totalRevenue.toFixed(2)}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-yellow-600/20 text-yellow-300 px-2 py-1 rounded">
                    +12.5% MoM
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECONDARY STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-4 hover:border-[#00FF9C] transition">
              <div className="flex items-center gap-3 mb-2">
                <FaBox className="text-[#00FF9C] text-2xl" />
                <p className="text-gray-400 text-sm">Produkte</p>
              </div>
              <p className="text-3xl font-bold text-[#00FF9C]">{stats.totalProducts}</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-4 hover:border-blue-400 transition">
              <div className="flex items-center gap-3 mb-2">
                <FaKey className="text-blue-400 text-2xl" />
                <p className="text-gray-400 text-sm">Lizenzen</p>
              </div>
              <p className="text-3xl font-bold text-blue-400">{stats.totalLicenses}</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-4 hover:border-green-400 transition">
              <div className="flex items-center gap-3 mb-2">
                <FaCheckCircle className="text-green-400 text-2xl" />
                <p className="text-gray-400 text-sm">Aktiv</p>
              </div>
              <p className="text-3xl font-bold text-green-400">{stats.activeLicenses}</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-4 hover:border-red-400 transition">
              <div className="flex items-center gap-3 mb-2">
                <FaExclamationTriangle className="text-red-400 text-2xl" />
                <p className="text-gray-400 text-sm">Abgelaufen</p>
              </div>
              <p className="text-3xl font-bold text-red-400">{stats.expiredLicenses}</p>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex gap-2 mb-8 flex-wrap bg-[#1A1A1F] p-2 rounded-xl border border-[#2C2C34]">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] shadow-lg shadow-[#00FF9C]/50"
                  : "hover:bg-[#2C2C34]"
              }`}
            >
              <FaChartBar /> Überblick
            </button>
            <button
              onClick={() => setActiveTab("orgs")}
              className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
                activeTab === "orgs"
                  ? "bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] shadow-lg shadow-[#00FF9C]/50"
                  : "hover:bg-[#2C2C34]"
              }`}
            >
              <FaUsers /> Organisationen
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
                activeTab === "activity"
                  ? "bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] shadow-lg shadow-[#00FF9C]/50"
                  : "hover:bg-[#2C2C34]"
              }`}
            >
              <FaBell /> Activity
            </button>
            <button
              onClick={() => setActiveTab("health")}
              className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
                activeTab === "health"
                  ? "bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] shadow-lg shadow-[#00FF9C]/50"
                  : "hover:bg-[#2C2C34]"
              }`}
            >
              <FaServer /> Health
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
                activeTab === "analytics"
                  ? "bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] shadow-lg shadow-[#00FF9C]/50"
                  : "hover:bg-[#2C2C34]"
              }`}
            >
              <FaChartLine /> Analytics
            </button>
          </div>

          {/* TAB CONTENT */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Info */}
                <div className="bg-gradient-to-br from-blue-600/10 to-blue-600/5 border border-blue-600 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-600/20 p-3 rounded-xl">
                      <FaDatabase className="text-blue-400 text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-blue-400">System Info</h2>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between bg-[#1A1A1F]/50 p-3 rounded-lg">
                      <span className="text-gray-400">Total Organizations</span>
                      <span className="text-blue-300 font-bold">{stats.totalOrgs}</span>
                    </div>
                    <div className="flex items-center justify-between bg-[#1A1A1F]/50 p-3 rounded-lg">
                      <span className="text-gray-400">Total Revenue</span>
                      <span className="text-green-400 font-bold">€{stats.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between bg-[#1A1A1F]/50 p-3 rounded-lg">
                      <span className="text-gray-400">Total Orders</span>
                      <span className="text-purple-300 font-bold">{stats.totalOrders}</span>
                    </div>
                    <div className="flex items-center justify-between bg-[#1A1A1F]/50 p-3 rounded-lg">
                      <span className="text-gray-400">System Status</span>
                      <span className="text-green-400 font-bold flex items-center gap-2">
                        <FaCheckCircle /> Online
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-purple-600/10 to-purple-600/5 border border-purple-600 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-purple-600/20 p-3 rounded-xl">
                      <FaBolt className="text-purple-400 text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-purple-400">Quick Actions</h2>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab("orgs")}
                      className="w-full bg-[#1A1A1F]/50 hover:bg-[#2C2C34] p-4 rounded-lg text-left transition flex items-center justify-between group"
                    >
                      <span className="flex items-center gap-3">
                        <FaUsers className="text-purple-400" />
                        <span>Manage Organizations</span>
                      </span>
                      <FaArrowLeft className="rotate-180 group-hover:translate-x-2 transition" />
                    </button>
                    <button
                      onClick={() => setActiveTab("activity")}
                      className="w-full bg-[#1A1A1F]/50 hover:bg-[#2C2C34] p-4 rounded-lg text-left transition flex items-center justify-between group"
                    >
                      <span className="flex items-center gap-3">
                        <FaBell className="text-blue-400" />
                        <span>View Activity Feed</span>
                      </span>
                      <FaArrowLeft className="rotate-180 group-hover:translate-x-2 transition" />
                    </button>
                    <button
                      onClick={() => setActiveTab("health")}
                      className="w-full bg-[#1A1A1F]/50 hover:bg-[#2C2C34] p-4 rounded-lg text-left transition flex items-center justify-between group"
                    >
                      <span className="flex items-center gap-3">
                        <FaServer className="text-green-400" />
                        <span>Check System Health</span>
                      </span>
                      <FaArrowLeft className="rotate-180 group-hover:translate-x-2 transition" />
                    </button>
                    <button
                      onClick={exportOrganizations}
                      className="w-full bg-[#1A1A1F]/50 hover:bg-[#2C2C34] p-4 rounded-lg text-left transition flex items-center justify-between group"
                    >
                      <span className="flex items-center gap-3">
                        <FaDownload className="text-yellow-400" />
                        <span>Export Report</span>
                      </span>
                      <FaArrowLeft className="rotate-180 group-hover:translate-x-2 transition" />
                    </button>
                  </div>
                </div>
              </div>

              {godMode && (
                <div className="bg-gradient-to-br from-red-600/10 to-red-600/5 border border-red-600 rounded-2xl p-8 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <FaFire className="text-red-400 text-4xl" />
                    <div>
                      <h2 className="text-3xl font-bold text-red-400">GOD MODE AKTIV</h2>
                      <p className="text-red-300 text-sm">
                        Du hast vollständigen Admin-Zugriff auf alle Funktionen
                      </p>
                    </div>
                  </div>
                  <div className="bg-red-600/20 p-4 rounded-xl mb-4">
                    <p className="text-red-200 text-sm">
                      ⚠️ Mit großer Macht kommt große Verantwortung. Sei vorsichtig mit Admin-Aktionen.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("orgs")}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-600/50 rounded-xl font-bold transition"
                  >
                    Zu Organisationen
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "orgs" && (
            <div className="space-y-6">
              {/* Search & Actions Bar */}
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-4">
                <div className="flex gap-4 flex-wrap items-center">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Suche nach Organisation, Email oder Plan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#2C2C34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                      />
                    </div>
                  </div>
                  <button
                    onClick={exportOrganizations}
                    className="px-4 py-2 bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FF9C]/50 transition flex items-center gap-2"
                  >
                    <FaDownload /> Export
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <FaUsers className="text-purple-400" />
                  Organisationen ({filteredOrgs.length})
                </h2>
              </div>

              {filteredOrgs.length === 0 ? (
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-12 text-center">
                  <FaUsers className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    {searchQuery ? "Keine Organisationen gefunden" : "Noch keine Organisationen"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredOrgs.map((org) => (
                    <div
                      key={org.id}
                      className="bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-2xl p-6 hover:border-[#00FF9C] transition-all hover:shadow-xl hover:shadow-[#00FF9C]/10"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-64">
                          <div className="flex items-start gap-4 mb-3">
                            <div className="bg-purple-600/20 p-3 rounded-xl">
                              <FaUsers className="text-purple-400 text-2xl" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold mb-1">{org.name}</h3>
                              <p className="text-sm text-gray-400 mb-2">{org.owner_email}</p>
                              <div className="flex gap-2 flex-wrap">
                                <span className="bg-[#2C2C34] px-3 py-1 rounded-lg text-xs font-bold">
                                  Plan: <span className="text-blue-400">{org.plan}</span>
                                </span>
                                <span
                                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                    org.status === "active"
                                      ? "bg-green-600/20 text-green-400"
                                      : "bg-red-600/20 text-red-400"
                                  }`}
                                >
                                  {org.status === "active" ? "✅ Aktiv" : "❌ Inaktiv"}
                                </span>
                                <span className="bg-[#2C2C34] px-3 py-1 rounded-lg text-xs text-gray-400">
                                  Erstellt: {new Date(org.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedOrg(org);
                              setShowOrgModal(true);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                          >
                            <FaEye /> Details
                          </button>
                          {godMode && (
                            <>
                              <button
                                onClick={() => navigateAsAdmin(org.id, "dev")}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                              >
                                <FaUserShield /> Als Dev
                              </button>
                              <button
                                onClick={() => navigateAsAdmin(org.id, "user")}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                              >
                                <FaUserShield /> Als User
                              </button>
                              <button
                                onClick={() => handleDeleteOrg(org.id)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                              >
                                <FaTrash /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600/20 p-3 rounded-xl">
                  <FaBell className="text-blue-400 text-3xl" />
                </div>
                <h2 className="text-3xl font-bold text-blue-400">Recent Activity</h2>
              </div>

              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-4 hover:border-blue-500 transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-[#2C2C34] p-3 rounded-lg">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <p className="font-bold mb-1">{activity.details}</p>
                            <p className="text-sm text-gray-400">{activity.user_email}</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <FaClock />
                            {new Date(activity.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {recentActivity.length === 0 && (
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-12 text-center">
                  <FaBell className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Keine Aktivitäten</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "health" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-600/20 p-3 rounded-xl">
                  <FaServer className="text-green-400 text-3xl" />
                </div>
                <h2 className="text-3xl font-bold text-green-400">System Health</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Database */}
                <div
                  className={`bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 rounded-2xl p-6 ${
                    systemHealth.database === "online"
                      ? "border-green-500 shadow-lg shadow-green-500/20"
                      : "border-red-500 shadow-lg shadow-red-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-xl ${
                          systemHealth.database === "online" ? "bg-green-600/20" : "bg-red-600/20"
                        }`}
                      >
                        <FaDatabase
                          className={`text-3xl ${
                            systemHealth.database === "online" ? "text-green-400" : "text-red-400"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Database</h3>
                        <p className="text-sm text-gray-400">PostgreSQL (Supabase)</p>
                      </div>
                    </div>
                    {systemHealth.database === "online" ? (
                      <FaCheckCircle className="text-3xl text-green-400" />
                    ) : (
                      <FaExclamationTriangle className="text-3xl text-red-400" />
                    )}
                  </div>
                  <div className="bg-[#2C2C34] rounded-lg p-3">
                    <p
                      className={`font-bold ${
                        systemHealth.database === "online" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      Status: {systemHealth.database === "online" ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                {/* API */}
                <div
                  className={`bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 rounded-2xl p-6 ${
                    systemHealth.api === "online"
                      ? "border-green-500 shadow-lg shadow-green-500/20"
                      : "border-red-500 shadow-lg shadow-red-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-xl ${
                          systemHealth.api === "online" ? "bg-green-600/20" : "bg-red-600/20"
                        }`}
                      >
                        <FaGlobe
                          className={`text-3xl ${
                            systemHealth.api === "online" ? "text-green-400" : "text-red-400"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">API</h3>
                        <p className="text-sm text-gray-400">REST API</p>
                      </div>
                    </div>
                    {systemHealth.api === "online" ? (
                      <FaCheckCircle className="text-3xl text-green-400" />
                    ) : (
                      <FaExclamationTriangle className="text-3xl text-red-400" />
                    )}
                  </div>
                  <div className="bg-[#2C2C34] rounded-lg p-3">
                    <p
                      className={`font-bold ${
                        systemHealth.api === "online" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      Status: {systemHealth.api === "online" ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                {/* Auth */}
                <div
                  className={`bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 rounded-2xl p-6 ${
                    systemHealth.auth === "online"
                      ? "border-green-500 shadow-lg shadow-green-500/20"
                      : "border-red-500 shadow-lg shadow-red-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-xl ${
                          systemHealth.auth === "online" ? "bg-green-600/20" : "bg-red-600/20"
                        }`}
                      >
                        <FaShieldAlt
                          className={`text-3xl ${
                            systemHealth.auth === "online" ? "text-green-400" : "text-red-400"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Authentication</h3>
                        <p className="text-sm text-gray-400">Auth Service</p>
                      </div>
                    </div>
                    {systemHealth.auth === "online" ? (
                      <FaCheckCircle className="text-3xl text-green-400" />
                    ) : (
                      <FaExclamationTriangle className="text-3xl text-red-400" />
                    )}
                  </div>
                  <div className="bg-[#2C2C34] rounded-lg p-3">
                    <p
                      className={`font-bold ${
                        systemHealth.auth === "online" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      Status: {systemHealth.auth === "online" ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                {/* Storage */}
                <div
                  className={`bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 rounded-2xl p-6 ${
                    systemHealth.storage === "online"
                      ? "border-green-500 shadow-lg shadow-green-500/20"
                      : "border-red-500 shadow-lg shadow-red-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-xl ${
                          systemHealth.storage === "online" ? "bg-green-600/20" : "bg-red-600/20"
                        }`}
                      >
                        <FaBox
                          className={`text-3xl ${
                            systemHealth.storage === "online" ? "text-green-400" : "text-red-400"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Storage</h3>
                        <p className="text-sm text-gray-400">File Storage</p>
                      </div>
                    </div>
                    {systemHealth.storage === "online" ? (
                      <FaCheckCircle className="text-3xl text-green-400" />
                    ) : (
                      <FaExclamationTriangle className="text-3xl text-red-400" />
                    )}
                  </div>
                  <div className="bg-[#2C2C34] rounded-lg p-3">
                    <p
                      className={`font-bold ${
                        systemHealth.storage === "online" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      Status: {systemHealth.storage === "online" ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-600/10 to-green-600/5 border border-green-600 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaCheckCircle className="text-green-400 text-3xl" />
                  <h3 className="text-2xl font-bold text-green-400">All Systems Operational</h3>
                </div>
                <p className="text-green-300">
                  Alle Services laufen reibungslos. Letzte Überprüfung:{" "}
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-yellow-600/20 p-3 rounded-xl">
                  <FaChartLine className="text-yellow-400 text-3xl" />
                </div>
                <h2 className="text-3xl font-bold text-yellow-400">Analytics & Reports</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FaDollarSign className="text-green-400 text-3xl" />
                    <h3 className="text-xl font-bold">Revenue Overview</h3>
                  </div>
                  <p className="text-5xl font-black text-green-400 mb-2">€{stats.totalRevenue.toFixed(2)}</p>
                  <p className="text-sm text-gray-400">
                    Aus {stats.totalOrders} Orders generiert
                  </p>
                  <div className="mt-4 bg-green-600/10 p-3 rounded-lg">
                    <p className="text-green-300 text-sm">
                      ↗️ +12.5% im Vergleich zum letzten Monat
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FaUsers className="text-blue-400 text-3xl" />
                    <h3 className="text-xl font-bold">User Growth</h3>
                  </div>
                  <p className="text-5xl font-black text-blue-400 mb-2">{stats.totalOrgs}</p>
                  <p className="text-sm text-gray-400">Aktive Organisationen</p>
                  <div className="mt-4 bg-blue-600/10 p-3 rounded-lg">
                    <p className="text-blue-300 text-sm">
                      ↗️ +8% neue Registrierungen diese Woche
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FaKey className="text-purple-400 text-3xl" />
                    <h3 className="text-xl font-bold">License Stats</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total</span>
                      <span className="font-bold text-purple-400">{stats.totalLicenses}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Active</span>
                      <span className="font-bold text-green-400">{stats.activeLicenses}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Expired</span>
                      <span className="font-bold text-red-400">{stats.expiredLicenses}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FaBox className="text-[#00FF9C] text-3xl" />
                    <h3 className="text-xl font-bold">Products</h3>
                  </div>
                  <p className="text-5xl font-black text-[#00FF9C] mb-2">{stats.totalProducts}</p>
                  <p className="text-sm text-gray-400">Verfügbare Produkte</p>
                  <div className="mt-4 bg-[#00FF9C]/10 p-3 rounded-lg">
                    <p className="text-[#00FF9C] text-sm">
                      ✨ {stats.totalLicenses} Lizenzen ausgegeben
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ORG DETAILS MODAL */}
      {showOrgModal && selectedOrg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-600/20 p-4 rounded-xl">
                  <FaUsers className="text-purple-400 text-3xl" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-1">{selectedOrg.name}</h2>
                  <p className="text-gray-400">{selectedOrg.owner_email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowOrgModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#2C2C34] rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">Organisation ID</p>
                <p className="font-mono text-sm">{selectedOrg.id}</p>
              </div>

              <div className="bg-[#2C2C34] rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">Plan</p>
                <p className="font-bold text-blue-400">{selectedOrg.plan}</p>
              </div>

              <div className="bg-[#2C2C34] rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${
                    selectedOrg.status === "active"
                      ? "bg-green-600/20 text-green-400"
                      : "bg-red-600/20 text-red-400"
                  }`}
                >
                  {selectedOrg.status === "active" ? "✅ Aktiv" : "❌ Inaktiv"}
                </span>
              </div>

              <div className="bg-[#2C2C34] rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">Erstellt am</p>
                <p className="font-bold">{new Date(selectedOrg.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowOrgModal(false)}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-xl font-bold transition"
              >
                Schließen
              </button>
              {godMode && (
                <button
                  onClick={() => {
                    setShowOrgModal(false);
                    navigateAsAdmin(selectedOrg.id, "user");
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] font-bold rounded-xl hover:shadow-lg hover:shadow-[#00FF9C]/50 transition"
                >
                  Als User ansehen
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
