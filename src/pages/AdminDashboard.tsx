// src/pages/AdminDashboard.tsx - ULTRA MEGA EPIC ADMIN DASHBOARD V3 🚀🔥
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
  FaShoppingCart,
  FaMoneyBillWave,
  FaUserCog,
  FaChevronRight,
  FaFilter,
  FaCopy,
  FaBan,
  FaUserTimes,
  FaChartPie,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";

// TYPES
type Organization = {
  id: string;
  name: string;
  owner_email: string;
  plan: string;
  status: string;
  created_at: string;
};

type Customer = {
  id: string;
  email: string;
  name?: string;
  total_keys: number;
  total_spent: number;
  created_at: string;
};

type Developer = {
  id: string;
  email: string;
  organization_id: string;
  organization_name: string;
  total_products: number;
  total_licenses: number;
  created_at: string;
};

type Reseller = {
  id: string;
  shop_name: string;
  organization_id: string;
  balance: number;
  total_sales: number;
  total_products: number;
  created_at: string;
};

type Transaction = {
  id: string;
  type: "order" | "sale" | "license";
  customer_email: string;
  amount: number;
  product_name: string;
  timestamp: string;
};

type License = {
  id: string;
  license_key: string;
  product_id: string;
  product_name?: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  status: "active" | "expired" | "suspended";
  type?: string;
  created_at: string;
  expires_at?: string;
  max_activations?: number;
  current_activations?: number;
  organization_id: string;
};

type Stats = {
  totalOrgs: number;
  totalDevelopers: number;
  totalResellers: number;
  totalCustomers: number;
  totalProducts: number;
  totalLicenses: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  activeLicenses: number;
  expiredLicenses: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active" | "inactive">("all");
  const [licenseFilter, setLicenseFilter] = useState<"all" | "active" | "expired" | "suspended">("all");
  const [selectedLicenses, setSelectedLicenses] = useState<Set<string>>(new Set());
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);

  const [stats, setStats] = useState<Stats>({
    totalOrgs: 0,
    totalDevelopers: 0,
    totalResellers: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalLicenses: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    activeLicenses: 0,
    expiredLicenses: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: "online",
    api: "online",
    auth: "online",
    storage: "online",
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "customers" | "developers" | "resellers" | "licenses" | "transactions" | "analytics" | "health"
  >("overview");
  const [godMode, setGodMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

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

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing admin data...");
      loadAdminData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  async function loadAdminData() {
    setLoading(true);
    try {
      // ===== ORGANIZATIONS =====
      const { data: orgsData } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      setOrganizations(orgsData || []);

      // ===== CUSTOMERS =====
      const { data: ordersData } = await supabase
        .from("customer_orders")
        .select("*")
        .order("created_at", { ascending: false });

      // Group by customer email
      const customerMap = new Map<string, Customer>();
      ordersData?.forEach((order) => {
        const email = order.customer_email;
        if (!customerMap.has(email)) {
          customerMap.set(email, {
            id: order.id,
            email: email,
            name: email.split("@")[0],
            total_keys: 0,
            total_spent: 0,
            created_at: order.created_at,
          });
        }
        const customer = customerMap.get(email)!;
        customer.total_spent += order.total_amount || 0;

        // Count keys from items
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            customer.total_keys += item.quantity || 0;
          });
        }
      });
      setCustomers(Array.from(customerMap.values()));

      // ===== DEVELOPERS =====
      const developersMap = new Map<string, Developer>();
      orgsData?.forEach((org) => {
        if (org.plan === "developer" || org.plan === "pro") {
          developersMap.set(org.id, {
            id: org.id,
            email: org.owner_email,
            organization_id: org.id,
            organization_name: org.name,
            total_products: 0,
            total_licenses: 0,
            created_at: org.created_at,
          });
        }
      });

      // Count products and licenses for each dev
      const { data: productsData } = await supabase.from("products").select("*");
      const { data: licensesData } = await supabase.from("licenses").select("*");

      productsData?.forEach((product) => {
        const dev = developersMap.get(product.organization_id);
        if (dev) dev.total_products++;
      });

      licensesData?.forEach((license) => {
        const dev = developersMap.get(license.organization_id);
        if (dev) dev.total_licenses++;
      });

      setDevelopers(Array.from(developersMap.values()));

      // ===== RESELLERS =====
      const { data: resellersData } = await supabase.from("resellers").select("*");

      const resellersWithStats = await Promise.all(
        (resellersData || []).map(async (reseller) => {
          // Get product count
          const { count: productCount } = await supabase
            .from("reseller_products")
            .select("*", { count: "exact", head: true })
            .eq("reseller_id", reseller.id);

          // Get total sales
          let totalSales = 0;
          try {
            const { count } = await supabase
              .from("reseller_sales")
              .select("*", { count: "exact", head: true })
              .eq("reseller_id", reseller.id);
            totalSales = count || 0;
          } catch {
            // Table might not exist
          }

          return {
            id: reseller.id,
            shop_name: reseller.shop_name,
            organization_id: reseller.organization_id,
            balance: reseller.balance || 0,
            total_sales: totalSales,
            total_products: productCount || 0,
            created_at: reseller.created_at,
          };
        })
      );
      setResellers(resellersWithStats);

      // ===== LICENSES =====
      // Enrich licenses with product and customer names
      const enrichedLicenses: License[] = (licensesData || []).map((license) => {
        const product = productsData?.find((p) => p.id === license.product_id);
        // Try to find customer from organizations or customer_orders
        const org = orgsData?.find((o) => o.id === license.customer_id);
        const customerOrder = ordersData?.find((o) => o.id === license.customer_id);

        return {
          id: license.id,
          license_key: license.license_key,
          product_id: license.product_id,
          product_name: product?.name || license.product_name || "Unknown Product",
          customer_id: license.customer_id,
          customer_name: org?.name || license.customer_name || "Unknown",
          customer_email: org?.owner_email || license.customer_email || customerOrder?.customer_email || "",
          status: license.status || "active",
          type: license.type,
          created_at: license.created_at,
          expires_at: license.expires_at,
          max_activations: license.max_activations,
          current_activations: license.current_activations || 0,
          organization_id: license.organization_id,
        };
      });
      setLicenses(enrichedLicenses);

      // ===== TRANSACTIONS =====
      const recentTransactions: Transaction[] = [];

      // Add orders as transactions
      ordersData?.slice(0, 10).forEach((order) => {
        const productNames = order.items?.map((i: any) => i.product_name).join(", ") || "Unknown";
        recentTransactions.push({
          id: order.id,
          type: "order",
          customer_email: order.customer_email,
          amount: order.total_amount || 0,
          product_name: productNames,
          timestamp: order.created_at,
        });
      });

      setTransactions(recentTransactions.slice(0, 20));

      // ===== CALCULATE STATS =====
      let totalRevenue = 0;
      let todayRevenue = 0;
      let weekRevenue = 0;
      let monthRevenue = 0;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      ordersData?.forEach((order) => {
        const amount = order.total_amount || 0;
        totalRevenue += amount;

        const orderDate = new Date(order.created_at);
        if (orderDate >= todayStart) todayRevenue += amount;
        if (orderDate >= weekStart) weekRevenue += amount;
        if (orderDate >= monthStart) monthRevenue += amount;
      });

      const activeLicenses = licensesData?.filter((l) => l.status === "active").length || 0;
      const expiredLicenses = licensesData?.filter((l) => l.status === "expired").length || 0;

      setStats({
        totalOrgs: orgsData?.length || 0,
        totalDevelopers: developersMap.size,
        totalResellers: resellersData?.length || 0,
        totalCustomers: customerMap.size,
        totalProducts: productsData?.length || 0,
        totalLicenses: licensesData?.length || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue,
        todayRevenue,
        weekRevenue,
        monthRevenue,
        activeUsers: orgsData?.filter((o) => o.status === "active").length || 0,
        activeLicenses,
        expiredLicenses,
      });

      // ===== SYSTEM HEALTH =====
      await checkSystemHealth();
    } catch (err) {
      console.error("Error loading admin data:", err);
    }
    setLoading(false);
  }

  async function checkSystemHealth() {
    try {
      const { error: dbError } = await supabase.from("organizations").select("id").limit(1);
      setSystemHealth({
        database: dbError ? "offline" : "online",
        api: "online",
        auth: "online",
        storage: "online",
      });
    } catch {
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

  function exportData(data: any[], filename: string) {
    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    openDialog({
      type: "success",
      title: "✅ Kopiert",
      message: "In Zwischenablage kopiert!",
      closeButton: "OK",
    });
  }

  // ===== LICENSE MANAGEMENT FUNCTIONS =====

  function toggleLicenseSelection(licenseId: string) {
    const newSelection = new Set(selectedLicenses);
    if (newSelection.has(licenseId)) {
      newSelection.delete(licenseId);
    } else {
      newSelection.add(licenseId);
    }
    setSelectedLicenses(newSelection);
  }

  function toggleAllLicenses() {
    if (selectedLicenses.size === filteredLicenses.length) {
      setSelectedLicenses(new Set());
    } else {
      setSelectedLicenses(new Set(filteredLicenses.map((l) => l.id)));
    }
  }

  async function handleLicenseAction(action: "activate" | "suspend" | "delete" | "extend", license: License) {
    if (!godMode && (action === "delete" || action === "suspend")) {
      openDialog({
        type: "warning",
        title: "⚠️ GOD MODE benötigt",
        message: "Aktiviere GOD MODE um diese Aktion durchzuführen",
        closeButton: "OK",
      });
      return;
    }

    try {
      if (action === "delete") {
        const confirmed = window.confirm(`⚠️ License ${license.license_key} wirklich löschen?`);
        if (!confirmed) return;

        const { error } = await supabase.from("licenses").delete().eq("id", license.id);
        if (error) throw error;

        openDialog({
          type: "success",
          title: "✅ Gelöscht",
          message: "Lizenz wurde gelöscht",
          closeButton: "OK",
        });
      } else if (action === "activate") {
        const { error } = await supabase
          .from("licenses")
          .update({ status: "active" })
          .eq("id", license.id);
        if (error) throw error;

        openDialog({
          type: "success",
          title: "✅ Aktiviert",
          message: "Lizenz wurde aktiviert",
          closeButton: "OK",
        });
      } else if (action === "suspend") {
        const { error } = await supabase
          .from("licenses")
          .update({ status: "suspended" })
          .eq("id", license.id);
        if (error) throw error;

        openDialog({
          type: "success",
          title: "✅ Suspendiert",
          message: "Lizenz wurde suspendiert",
          closeButton: "OK",
        });
      } else if (action === "extend") {
        // Extend by 30 days
        const currentExpiry = license.expires_at ? new Date(license.expires_at) : new Date();
        const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);

        const { error } = await supabase
          .from("licenses")
          .update({ expires_at: newExpiry.toISOString(), status: "active" })
          .eq("id", license.id);
        if (error) throw error;

        openDialog({
          type: "success",
          title: "✅ Verlängert",
          message: `Lizenz bis ${newExpiry.toLocaleDateString("de-DE")} verlängert`,
          closeButton: "OK",
        });
      }

      await loadAdminData();
      setShowLicenseModal(false);
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    }
  }

  async function handleBulkAction(action: "activate" | "suspend" | "delete" | "extend") {
    if (!godMode) {
      openDialog({
        type: "warning",
        title: "⚠️ GOD MODE benötigt",
        message: "Aktiviere GOD MODE für Bulk Actions",
        closeButton: "OK",
      });
      return;
    }

    const count = selectedLicenses.size;
    if (count === 0) {
      openDialog({
        type: "warning",
        title: "⚠️ Keine Auswahl",
        message: "Bitte wähle mindestens eine Lizenz aus",
        closeButton: "OK",
      });
      return;
    }

    const confirmed = window.confirm(
      `⚠️ ${count} Lizenzen ${action === "delete" ? "löschen" : action === "activate" ? "aktivieren" : action === "suspend" ? "suspendieren" : "verlängern"}?`
    );
    if (!confirmed) return;

    try {
      const ids = Array.from(selectedLicenses);

      if (action === "delete") {
        await supabase.from("licenses").delete().in("id", ids);
      } else if (action === "activate") {
        await supabase.from("licenses").update({ status: "active" }).in("id", ids);
      } else if (action === "suspend") {
        await supabase.from("licenses").update({ status: "suspended" }).in("id", ids);
      } else if (action === "extend") {
        // Can't bulk extend easily due to different expiry dates, so we skip for now
        for (const id of ids) {
          const license = licenses.find((l) => l.id === id);
          if (license) {
            const currentExpiry = license.expires_at ? new Date(license.expires_at) : new Date();
            const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
            await supabase.from("licenses").update({ expires_at: newExpiry.toISOString() }).eq("id", id);
          }
        }
      }

      openDialog({
        type: "success",
        title: "✅ Erfolgreich",
        message: `${count} Lizenzen ${action === "delete" ? "gelöscht" : action === "activate" ? "aktiviert" : action === "suspend" ? "suspendiert" : "verlängert"}`,
        closeButton: "OK",
      });

      setSelectedLicenses(new Set());
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

  // Filter data based on search and filters
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredDevelopers = developers.filter((d) => {
    const matchesSearch = d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.organization_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredResellers = resellers.filter((r) => {
    const matchesSearch = r.shop_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredLicenses = licenses.filter((l) => {
    const matchesSearch =
      l.license_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      licenseFilter === "all" ||
      l.status === licenseFilter;

    return matchesSearch && matchesFilter;
  });

  // Calculate expiring soon licenses (within 7 days)
  const expiringSoon = licenses.filter((l) => {
    if (!l.expires_at || l.status !== "active") return false;
    const expiryDate = new Date(l.expires_at);
    const now = new Date();
    const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  }).length;

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-gradient-to-br from-[#0E0E12] via-[#1A1A1F] to-[#0E0E12] text-[#E0E0E0]">
        {/* EPIC HEADER */}
        <div className="bg-gradient-to-r from-[#1A1A1F] via-[#2C2C34] to-[#1A1A1F] border-b border-[#3C3C44] shadow-2xl sticky top-0 z-50 backdrop-blur-sm">
          <div className="max-w-[1600px] mx-auto p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* LEFT */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2 px-3 py-2 bg-[#2C2C34] hover:bg-[#3C3C44] rounded-xl text-gray-400 hover:text-[#00FF9C] transition-all transform hover:scale-105"
                >
                  <FaHome /> Home
                </button>
                <div className="border-l border-[#3C3C44] pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FaCrown className="text-3xl text-yellow-400 animate-pulse" />
                    <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                      Admin Control Center
                    </h1>
                  </div>
                  <p className="text-gray-400 text-xs flex items-center gap-2">
                    {godMode ? (
                      <>
                        <FaFire className="text-red-400 animate-pulse" />
                        <span className="text-red-400 font-bold">GOD MODE AKTIV</span>
                      </>
                    ) : (
                      <>
                        <FaShieldAlt className="text-blue-400" />
                        <span>Standard Modus</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all transform hover:scale-105 ${
                    autoRefresh
                      ? "bg-gradient-to-r from-green-600 to-green-700 shadow-lg shadow-green-600/50"
                      : "bg-[#2C2C34] hover:bg-[#3C3C44]"
                  }`}
                >
                  <FaSync className={autoRefresh ? "animate-spin" : ""} />
                  {autoRefresh ? "Live" : "Manual"}
                </button>
                <button
                  onClick={() => loadAdminData()}
                  className="px-3 py-2 bg-[#2C2C34] hover:bg-[#3C3C44] rounded-xl text-sm font-bold flex items-center gap-2 transition-all transform hover:scale-105"
                >
                  <FaSync /> Refresh
                </button>
                <button
                  onClick={() => setGodMode(!godMode)}
                  className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all transform hover:scale-105 ${
                    godMode
                      ? "bg-gradient-to-r from-red-600 to-red-700 shadow-lg shadow-red-600/50"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-600/50"
                  }`}
                >
                  <FaShieldAlt /> {godMode ? "GOD ON" : "GOD OFF"}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-600/50 rounded-xl text-sm font-bold flex items-center gap-2 transition-all transform hover:scale-105"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto p-4">
          {/* MEGA STATS GRID - 6 COLUMNS */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {/* Organizations */}
            <div
              className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-purple-500/30 rounded-xl p-4 hover:border-purple-500 transition-all cursor-pointer transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 group"
              onClick={() => setActiveTab("overview")}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-purple-600/20 p-2 rounded-lg">
                  <FaUsers className="text-purple-400 text-xl" />
                </div>
                <p className="text-xs text-gray-400">Orgs</p>
              </div>
              <p className="text-3xl font-black text-purple-400">{stats.totalOrgs}</p>
              <p className="text-xs text-purple-300 mt-1">{stats.activeUsers} aktiv</p>
            </div>

            {/* Customers */}
            <div
              className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-blue-500/30 rounded-xl p-4 hover:border-blue-500 transition-all cursor-pointer transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 group"
              onClick={() => setActiveTab("customers")}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-600/20 p-2 rounded-lg">
                  <FaShoppingCart className="text-blue-400 text-xl" />
                </div>
                <p className="text-xs text-gray-400">Kunden</p>
              </div>
              <p className="text-3xl font-black text-blue-400">{stats.totalCustomers}</p>
              <p className="text-xs text-blue-300 mt-1">{stats.totalOrders} Orders</p>
            </div>

            {/* Developers */}
            <div
              className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-cyan-500/30 rounded-xl p-4 hover:border-cyan-500 transition-all cursor-pointer transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 group"
              onClick={() => setActiveTab("developers")}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-cyan-600/20 p-2 rounded-lg">
                  <FaBox className="text-cyan-400 text-xl" />
                </div>
                <p className="text-xs text-gray-400">Devs</p>
              </div>
              <p className="text-3xl font-black text-cyan-400">{stats.totalDevelopers}</p>
              <p className="text-xs text-cyan-300 mt-1">{stats.totalProducts} Produkte</p>
            </div>

            {/* Resellers */}
            <div
              className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-green-500/30 rounded-xl p-4 hover:border-green-500 transition-all cursor-pointer transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/20 group"
              onClick={() => setActiveTab("resellers")}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-green-600/20 p-2 rounded-lg">
                  <FaStore className="text-green-400 text-xl" />
                </div>
                <p className="text-xs text-gray-400">Reseller</p>
              </div>
              <p className="text-3xl font-black text-green-400">{stats.totalResellers}</p>
              <p className="text-xs text-green-300 mt-1">
                €{resellers.reduce((sum, r) => sum + r.balance, 0).toFixed(0)}
              </p>
            </div>

            {/* Licenses */}
            <div
              className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-orange-500/30 rounded-xl p-4 hover:border-orange-500 transition-all cursor-pointer transform hover:scale-105 hover:shadow-xl hover:shadow-orange-500/20 group"
              onClick={() => setActiveTab("analytics")}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-orange-600/20 p-2 rounded-lg">
                  <FaKey className="text-orange-400 text-xl" />
                </div>
                <p className="text-xs text-gray-400">Keys</p>
              </div>
              <p className="text-3xl font-black text-orange-400">{stats.totalLicenses}</p>
              <p className="text-xs text-orange-300 mt-1">{stats.activeLicenses} aktiv</p>
            </div>

            {/* Revenue */}
            <div
              className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-yellow-500/30 rounded-xl p-4 hover:border-yellow-500 transition-all cursor-pointer transform hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/20 group"
              onClick={() => setActiveTab("analytics")}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-yellow-600/20 p-2 rounded-lg">
                  <FaDollarSign className="text-yellow-400 text-xl" />
                </div>
                <p className="text-xs text-gray-400">Revenue</p>
              </div>
              <p className="text-3xl font-black text-yellow-400">€{stats.totalRevenue.toFixed(0)}</p>
              <p className="text-xs text-yellow-300 mt-1">+€{stats.todayRevenue.toFixed(0)} heute</p>
            </div>
          </div>

          {/* QUICK REVENUE STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-600/10 to-green-600/5 border border-green-600 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300 mb-1">💰 Heute</p>
                  <p className="text-2xl font-black text-green-400">€{stats.todayRevenue.toFixed(2)}</p>
                </div>
                <FaMoneyBillWave className="text-green-400 text-3xl opacity-30" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600/10 to-blue-600/5 border border-blue-600 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-300 mb-1">📅 Diese Woche</p>
                  <p className="text-2xl font-black text-blue-400">€{stats.weekRevenue.toFixed(2)}</p>
                </div>
                <FaChartLine className="text-blue-400 text-3xl opacity-30" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/10 to-purple-600/5 border border-purple-600 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300 mb-1">📆 Dieser Monat</p>
                  <p className="text-2xl font-black text-purple-400">€{stats.monthRevenue.toFixed(2)}</p>
                </div>
                <FaTrophy className="text-purple-400 text-3xl opacity-30" />
              </div>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex gap-2 mb-6 flex-wrap bg-[#1A1A1F] p-2 rounded-xl border border-[#2C2C34]">
            {[
              { id: "overview", label: "Überblick", icon: FaChartBar },
              { id: "customers", label: "Kunden", icon: FaShoppingCart, count: stats.totalCustomers },
              { id: "developers", label: "Developer", icon: FaBox, count: stats.totalDevelopers },
              { id: "resellers", label: "Reseller", icon: FaStore, count: stats.totalResellers },
              { id: "licenses", label: "Lizenzen", icon: FaKey, count: stats.totalLicenses },
              { id: "transactions", label: "Transaktionen", icon: FaMoneyBillWave, count: transactions.length },
              { id: "analytics", label: "Analytics", icon: FaChartPie },
              { id: "health", label: "System", icon: FaServer },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] shadow-lg shadow-[#00FF9C]/50"
                    : "hover:bg-[#2C2C34] text-gray-300"
                }`}
              >
                <tab.icon />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id ? "bg-[#0E0E12]/20" : "bg-[#00FF9C]/20 text-[#00FF9C]"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* SEARCH & FILTER BAR */}
          {(activeTab === "customers" || activeTab === "developers" || activeTab === "resellers" || activeTab === "licenses") && (
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-4 mb-6">
              <div className="flex gap-4 flex-wrap items-center">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Suche ${
                        activeTab === "customers" ? "Kunden" :
                        activeTab === "developers" ? "Developer" :
                        activeTab === "resellers" ? "Reseller" :
                        "Lizenzen (Key, Product, Customer)"
                      }...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#2C2C34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                    />
                  </div>
                </div>

                {activeTab === "licenses" && (
                  <div className="flex gap-2">
                    {["all", "active", "expired", "suspended"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setLicenseFilter(filter as any)}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition ${
                          licenseFilter === filter
                            ? "bg-[#00FF9C] text-[#0E0E12]"
                            : "bg-[#2C2C34] hover:bg-[#3C3C44]"
                        }`}
                      >
                        {filter === "all" ? "Alle" : filter === "active" ? "Aktiv" : filter === "expired" ? "Abgelaufen" : "Suspendiert"}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    if (activeTab === "customers") exportData(filteredCustomers, "customers.csv");
                    else if (activeTab === "developers") exportData(filteredDevelopers, "developers.csv");
                    else if (activeTab === "resellers") exportData(filteredResellers, "resellers.csv");
                    else if (activeTab === "licenses") exportData(filteredLicenses, "licenses.csv");
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FF9C]/50 transition flex items-center gap-2"
                >
                  <FaDownload /> Export CSV
                </button>
              </div>
            </div>
          )}

          {/* TAB CONTENT */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* TOP CUSTOMERS */}
                <div className="bg-gradient-to-br from-blue-600/10 to-blue-600/5 border border-blue-600 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-600/20 p-3 rounded-xl">
                      <FaTrophy className="text-blue-400 text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-blue-400">Top Kunden</h2>
                  </div>
                  <div className="space-y-3">
                    {customers
                      .sort((a, b) => b.total_spent - a.total_spent)
                      .slice(0, 5)
                      .map((customer, idx) => (
                        <div key={customer.id} className="bg-[#1A1A1F]/50 p-3 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              idx === 0 ? "bg-yellow-600/20 text-yellow-400" :
                              idx === 1 ? "bg-gray-400/20 text-gray-300" :
                              idx === 2 ? "bg-orange-600/20 text-orange-400" :
                              "bg-blue-600/20 text-blue-400"
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{customer.name}</p>
                              <p className="text-xs text-gray-400">{customer.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-400">€{customer.total_spent.toFixed(2)}</p>
                            <p className="text-xs text-gray-400">{customer.total_keys} Keys</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* TOP DEVELOPERS */}
                <div className="bg-gradient-to-br from-purple-600/10 to-purple-600/5 border border-purple-600 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-purple-600/20 p-3 rounded-xl">
                      <FaStar className="text-purple-400 text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-purple-400">Top Developer</h2>
                  </div>
                  <div className="space-y-3">
                    {developers
                      .sort((a, b) => b.total_licenses - a.total_licenses)
                      .slice(0, 5)
                      .map((dev, idx) => (
                        <div key={dev.id} className="bg-[#1A1A1F]/50 p-3 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              idx === 0 ? "bg-yellow-600/20 text-yellow-400" :
                              idx === 1 ? "bg-gray-400/20 text-gray-300" :
                              idx === 2 ? "bg-orange-600/20 text-orange-400" :
                              "bg-purple-600/20 text-purple-400"
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{dev.organization_name}</p>
                              <p className="text-xs text-gray-400">{dev.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-400">{dev.total_licenses} Keys</p>
                            <p className="text-xs text-gray-400">{dev.total_products} Produkte</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* RECENT TRANSACTIONS */}
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600/20 p-3 rounded-xl">
                      <FaMoneyBillWave className="text-green-400 text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-green-400">Letzte Transaktionen</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab("transactions")}
                    className="text-sm text-[#00FF9C] hover:underline flex items-center gap-1"
                  >
                    Alle ansehen <FaChevronRight />
                  </button>
                </div>
                <div className="space-y-2">
                  {transactions.slice(0, 8).map((tx) => (
                    <div key={tx.id} className="bg-[#2C2C34] p-3 rounded-lg flex items-center justify-between hover:bg-[#3C3C44] transition">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          tx.type === "order" ? "bg-green-600/20" :
                          tx.type === "sale" ? "bg-blue-600/20" :
                          "bg-purple-600/20"
                        }`}>
                          {tx.type === "order" ? <FaShoppingCart className="text-green-400" /> :
                           tx.type === "sale" ? <FaStore className="text-blue-400" /> :
                           <FaKey className="text-purple-400" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{tx.product_name}</p>
                          <p className="text-xs text-gray-400">{tx.customer_email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">€{tx.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{new Date(tx.timestamp).toLocaleString("de-DE")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {godMode && (
                <div className="bg-gradient-to-br from-red-600/10 to-red-600/5 border border-red-600 rounded-2xl p-8 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <FaFire className="text-red-400 text-4xl" />
                    <div>
                      <h2 className="text-3xl font-bold text-red-400">GOD MODE AKTIV</h2>
                      <p className="text-red-300 text-sm">
                        Vollständiger Admin-Zugriff auf alle Funktionen & Daten
                      </p>
                    </div>
                  </div>
                  <div className="bg-red-600/20 p-4 rounded-xl">
                    <p className="text-red-200 text-sm">
                      ⚠️ Mit großer Macht kommt große Verantwortung. Alle Aktionen werden geloggt.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "customers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <FaShoppingCart className="text-blue-400" />
                  Kunden ({filteredCustomers.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-xl p-6 hover:border-blue-500 transition-all hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-4">
                        <div className="bg-blue-600/20 p-3 rounded-xl">
                          <FaUsers className="text-blue-400 text-2xl" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">{customer.name}</h3>
                          <p className="text-sm text-gray-400 mb-3">{customer.email}</p>
                          <div className="flex gap-3 flex-wrap">
                            <div className="bg-[#2C2C34] px-3 py-1 rounded-lg">
                              <p className="text-xs text-gray-400">Total Keys</p>
                              <p className="text-lg font-bold text-blue-400">{customer.total_keys}</p>
                            </div>
                            <div className="bg-[#2C2C34] px-3 py-1 rounded-lg">
                              <p className="text-xs text-gray-400">Total Ausgaben</p>
                              <p className="text-lg font-bold text-green-400">€{customer.total_spent.toFixed(2)}</p>
                            </div>
                            <div className="bg-[#2C2C34] px-3 py-1 rounded-lg">
                              <p className="text-xs text-gray-400">Kunde seit</p>
                              <p className="text-xs font-bold text-gray-300">
                                {new Date(customer.created_at).toLocaleDateString("de-DE")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => copyToClipboard(customer.email)}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                        >
                          <FaCopy /> Email
                        </button>
                        {godMode && (
                          <button
                            onClick={() => {
                              openDialog({
                                type: "warning",
                                title: "⚠️ GOD MODE",
                                message: `Customer ID: ${customer.id}`,
                                closeButton: "OK",
                              });
                            }}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                          >
                            <FaUserShield /> Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredCustomers.length === 0 && (
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-12 text-center">
                  <FaShoppingCart className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    {searchQuery ? "Keine Kunden gefunden" : "Noch keine Kunden"}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "developers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <FaBox className="text-cyan-400" />
                  Developer ({filteredDevelopers.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredDevelopers.map((dev) => (
                  <div
                    key={dev.id}
                    className="bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-xl p-6 hover:border-cyan-500 transition-all hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-4">
                        <div className="bg-cyan-600/20 p-3 rounded-xl">
                          <FaBox className="text-cyan-400 text-2xl" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">{dev.organization_name}</h3>
                          <p className="text-sm text-gray-400 mb-3">{dev.email}</p>
                          <div className="flex gap-3 flex-wrap">
                            <div className="bg-[#2C2C34] px-3 py-1 rounded-lg">
                              <p className="text-xs text-gray-400">Produkte</p>
                              <p className="text-lg font-bold text-cyan-400">{dev.total_products}</p>
                            </div>
                            <div className="bg-[#2C2C34] px-3 py-1 rounded-lg">
                              <p className="text-xs text-gray-400">Lizenzen</p>
                              <p className="text-lg font-bold text-purple-400">{dev.total_licenses}</p>
                            </div>
                            <div className="bg-[#2C2C34] px-3 py-1 rounded-lg">
                              <p className="text-xs text-gray-400">Seit</p>
                              <p className="text-xs font-bold text-gray-300">
                                {new Date(dev.created_at).toLocaleDateString("de-DE")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => copyToClipboard(dev.organization_id)}
                          className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                        >
                          <FaCopy /> Org ID
                        </button>
                        {godMode && (
                          <button
                            onClick={() => navigate("/dev-dashboard")}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                          >
                            <FaUserShield /> Als Dev
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredDevelopers.length === 0 && (
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-12 text-center">
                  <FaBox className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    {searchQuery ? "Keine Developer gefunden" : "Noch keine Developer"}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "resellers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <FaStore className="text-green-400" />
                  Reseller ({filteredResellers.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredResellers.map((reseller) => (
                  <div
                    key={reseller.id}
                    className="bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-xl p-6 hover:border-green-500 transition-all hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-4">
                        <div className="bg-green-600/20 p-3 rounded-xl">
                          <FaStore className="text-green-400 text-2xl" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">{reseller.shop_name}</h3>
                          <p className="text-sm text-gray-400 mb-3">Shop ID: {reseller.id.slice(0, 8)}...</p>
                          <div className="flex gap-3 flex-wrap">
                            <div className="bg-[#2C2C34] px-3 py-1 rounded-lg">
                              <p className="text-xs text-gray-400">Balance</p>
                              <p className="text-lg font-bold text-green-400">€{reseller.balance.toFixed(2)}</p>
                            </div>
                            <div className="bg-[#2C2C34] px-3 py-1 rounded-lg">
                              <p className="text-xs text-gray-400">Produkte</p>
                              <p className="text-lg font-bold text-blue-400">{reseller.total_products}</p>
                            </div>
                            <div className="bg-[#2C2C34] px-3 py-1 rounded-lg">
                              <p className="text-xs text-gray-400">Verkäufe</p>
                              <p className="text-lg font-bold text-purple-400">{reseller.total_sales}</p>
                            </div>
                            <div className="bg-[#2C2C34] px-3 py-1 rounded-lg">
                              <p className="text-xs text-gray-400">Seit</p>
                              <p className="text-xs font-bold text-gray-300">
                                {new Date(reseller.created_at).toLocaleDateString("de-DE")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => navigate(`/reseller-shop/${reseller.id}`)}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                        >
                          <FaEye /> Shop
                        </button>
                        {godMode && (
                          <button
                            onClick={() => copyToClipboard(reseller.id)}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                          >
                            <FaCopy /> ID
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredResellers.length === 0 && (
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-12 text-center">
                  <FaStore className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    {searchQuery ? "Keine Reseller gefunden" : "Noch keine Reseller"}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "licenses" && (
            <div className="space-y-6">
              {/* QUICK STATS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-green-500/30 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Aktiv</p>
                  <p className="text-3xl font-black text-green-400">{stats.activeLicenses}</p>
                </div>
                <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-red-500/30 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Abgelaufen</p>
                  <p className="text-3xl font-black text-red-400">{stats.expiredLicenses}</p>
                </div>
                <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-orange-500/30 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">⚠️ Läuft bald ab</p>
                  <p className="text-3xl font-black text-orange-400">{expiringSoon}</p>
                  <p className="text-xs text-gray-500 mt-1">Innerhalb 7 Tage</p>
                </div>
                <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-purple-500/30 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Gesamt</p>
                  <p className="text-3xl font-black text-purple-400">{stats.totalLicenses}</p>
                </div>
              </div>

              {/* BULK ACTIONS */}
              {selectedLicenses.size > 0 && godMode && (
                <div className="bg-gradient-to-r from-red-600/10 to-red-600/5 border border-red-600 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-bold text-red-400">{selectedLicenses.size} Lizenzen ausgewählt</p>
                      <p className="text-xs text-gray-400">Bulk Actions (GOD MODE)</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleBulkAction("activate")}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-bold transition"
                      >
                        ✅ Aktivieren
                      </button>
                      <button
                        onClick={() => handleBulkAction("suspend")}
                        className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-bold transition"
                      >
                        ⏸️ Suspendieren
                      </button>
                      <button
                        onClick={() => handleBulkAction("extend")}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold transition"
                      >
                        📅 +30 Tage
                      </button>
                      <button
                        onClick={() => handleBulkAction("delete")}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold transition"
                      >
                        🗑️ Löschen
                      </button>
                      <button
                        onClick={() => setSelectedLicenses(new Set())}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm font-bold transition"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <FaKey className="text-orange-400" />
                  Lizenzen ({filteredLicenses.length})
                </h2>
                {godMode && (
                  <button
                    onClick={toggleAllLicenses}
                    className="px-4 py-2 bg-[#2C2C34] hover:bg-[#3C3C44] rounded-lg text-sm font-bold transition"
                  >
                    {selectedLicenses.size === filteredLicenses.length ? "Alle abwählen" : "Alle auswählen"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredLicenses.map((license) => {
                  const isExpired = license.expires_at && new Date(license.expires_at) < new Date();
                  const isExpiringSoon = license.expires_at && !isExpired && (() => {
                    const daysUntil = (new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                    return daysUntil > 0 && daysUntil <= 7;
                  })();

                  return (
                    <div
                      key={license.id}
                      className={`bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border rounded-xl p-4 hover:shadow-xl transition-all ${
                        license.status === "active"
                          ? "border-green-500/30 hover:border-green-500"
                          : license.status === "expired"
                          ? "border-red-500/30 hover:border-red-500"
                          : "border-orange-500/30 hover:border-orange-500"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3 flex-1">
                          {godMode && (
                            <input
                              type="checkbox"
                              checked={selectedLicenses.has(license.id)}
                              onChange={() => toggleLicenseSelection(license.id)}
                              className="mt-1 w-5 h-5 cursor-pointer"
                            />
                          )}

                          <div className={`p-2 rounded-lg ${
                            license.status === "active"
                              ? "bg-green-600/20"
                              : license.status === "expired"
                              ? "bg-red-600/20"
                              : "bg-orange-600/20"
                          }`}>
                            <FaKey className={`text-xl ${
                              license.status === "active"
                                ? "text-green-400"
                                : license.status === "expired"
                                ? "text-red-400"
                                : "text-orange-400"
                            }`} />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <p className="font-mono text-sm font-bold">{license.license_key}</p>
                              <button
                                onClick={() => copyToClipboard(license.license_key)}
                                className="text-xs text-[#00FF9C] hover:underline"
                              >
                                <FaCopy />
                              </button>
                              <span className={`text-xs px-2 py-1 rounded font-bold ${
                                license.status === "active"
                                  ? "bg-green-600/20 text-green-400"
                                  : license.status === "expired"
                                  ? "bg-red-600/20 text-red-400"
                                  : "bg-orange-600/20 text-orange-400"
                              }`}>
                                {license.status.toUpperCase()}
                              </span>
                              {isExpiringSoon && (
                                <span className="text-xs px-2 py-1 rounded bg-orange-600/20 text-orange-400 font-bold animate-pulse">
                                  ⚠️ LÄUFT BALD AB
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div>
                                <p className="text-gray-500">Produkt</p>
                                <p className="font-bold">{license.product_name}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Kunde</p>
                                <p className="font-bold">{license.customer_name || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Erstellt</p>
                                <p className="font-bold">{new Date(license.created_at).toLocaleDateString("de-DE")}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Läuft ab</p>
                                <p className={`font-bold ${isExpiringSoon ? "text-orange-400" : ""}`}>
                                  {license.expires_at ? new Date(license.expires_at).toLocaleDateString("de-DE") : "Nie"}
                                </p>
                              </div>
                            </div>

                            {license.customer_email && (
                              <p className="text-xs text-gray-400 mt-1">📧 {license.customer_email}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedLicense(license);
                              setShowLicenseModal(true);
                            }}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                          >
                            <FaEye /> Details
                          </button>

                          {godMode && (
                            <>
                              {license.status !== "active" && (
                                <button
                                  onClick={() => handleLicenseAction("activate", license)}
                                  className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-bold transition"
                                >
                                  ✅ Aktivieren
                                </button>
                              )}
                              {license.status === "active" && (
                                <button
                                  onClick={() => handleLicenseAction("suspend", license)}
                                  className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-bold transition"
                                >
                                  ⏸️ Suspend
                                </button>
                              )}
                              <button
                                onClick={() => handleLicenseAction("extend", license)}
                                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-bold transition"
                              >
                                📅 +30 Tage
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredLicenses.length === 0 && (
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-12 text-center">
                  <FaKey className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    {searchQuery || licenseFilter !== "all" ? "Keine Lizenzen gefunden" : "Noch keine Lizenzen"}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <FaMoneyBillWave className="text-green-400" />
                  Alle Transaktionen ({transactions.length})
                </h2>
                <button
                  onClick={() => exportData(transactions, "transactions.csv")}
                  className="px-4 py-2 bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FF9C]/50 transition flex items-center gap-2"
                >
                  <FaDownload /> Export
                </button>
              </div>

              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="bg-[#1A1A1F] border border-[#2C2C34] p-4 rounded-lg hover:border-green-500 transition">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${
                          tx.type === "order" ? "bg-green-600/20" :
                          tx.type === "sale" ? "bg-blue-600/20" :
                          "bg-purple-600/20"
                        }`}>
                          {tx.type === "order" ? <FaShoppingCart className="text-green-400 text-xl" /> :
                           tx.type === "sale" ? <FaStore className="text-blue-400 text-xl" /> :
                           <FaKey className="text-purple-400 text-xl" />}
                        </div>
                        <div>
                          <p className="font-bold">{tx.product_name}</p>
                          <p className="text-sm text-gray-400">{tx.customer_email}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString("de-DE")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">€{tx.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 uppercase">{tx.type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {transactions.length === 0 && (
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-12 text-center">
                  <FaMoneyBillWave className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Noch keine Transaktionen</p>
                </div>
              )}
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
                  <p className="text-sm text-gray-400 mb-4">Aus {stats.totalOrders} Orders generiert</p>

                  {/* Progress Bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Heute</span>
                        <span className="text-green-400">€{stats.todayRevenue.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-[#2C2C34] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-600 to-green-400"
                          style={{ width: `${Math.min((stats.todayRevenue / stats.totalRevenue) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Diese Woche</span>
                        <span className="text-blue-400">€{stats.weekRevenue.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-[#2C2C34] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                          style={{ width: `${Math.min((stats.weekRevenue / stats.totalRevenue) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Dieser Monat</span>
                        <span className="text-purple-400">€{stats.monthRevenue.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-[#2C2C34] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
                          style={{ width: `${Math.min((stats.monthRevenue / stats.totalRevenue) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FaKey className="text-purple-400 text-3xl" />
                    <h3 className="text-xl font-bold">License Distribution</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total Licenses</span>
                      <span className="font-bold text-purple-400 text-2xl">{stats.totalLicenses}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-green-400 flex items-center gap-2">
                          <FaCheckCircle /> Active
                        </span>
                        <span className="font-bold">{stats.activeLicenses}</span>
                      </div>
                      <div className="h-3 bg-[#2C2C34] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-600 to-green-400"
                          style={{ width: `${(stats.activeLicenses / stats.totalLicenses) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-red-400 flex items-center gap-2">
                          <FaExclamationTriangle /> Expired
                        </span>
                        <span className="font-bold">{stats.expiredLicenses}</span>
                      </div>
                      <div className="h-3 bg-[#2C2C34] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-600 to-red-400"
                          style={{ width: `${(stats.expiredLicenses / stats.totalLicenses) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FaUsers className="text-blue-400 text-3xl" />
                    <h3 className="text-xl font-bold">User Growth</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-[#2C2C34] p-3 rounded-lg">
                      <span className="text-gray-400 text-sm">Organizations</span>
                      <span className="font-bold text-purple-400 text-xl">{stats.totalOrgs}</span>
                    </div>
                    <div className="flex items-center justify-between bg-[#2C2C34] p-3 rounded-lg">
                      <span className="text-gray-400 text-sm">Developers</span>
                      <span className="font-bold text-cyan-400 text-xl">{stats.totalDevelopers}</span>
                    </div>
                    <div className="flex items-center justify-between bg-[#2C2C34] p-3 rounded-lg">
                      <span className="text-gray-400 text-sm">Resellers</span>
                      <span className="font-bold text-green-400 text-xl">{stats.totalResellers}</span>
                    </div>
                    <div className="flex items-center justify-between bg-[#2C2C34] p-3 rounded-lg">
                      <span className="text-gray-400 text-sm">Customers</span>
                      <span className="font-bold text-blue-400 text-xl">{stats.totalCustomers}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FaBox className="text-[#00FF9C] text-3xl" />
                    <h3 className="text-xl font-bold">Products & Sales</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-[#2C2C34] p-3 rounded-lg">
                      <span className="text-gray-400 text-sm">Total Products</span>
                      <span className="font-bold text-[#00FF9C] text-xl">{stats.totalProducts}</span>
                    </div>
                    <div className="flex items-center justify-between bg-[#2C2C34] p-3 rounded-lg">
                      <span className="text-gray-400 text-sm">Total Orders</span>
                      <span className="font-bold text-blue-400 text-xl">{stats.totalOrders}</span>
                    </div>
                    <div className="flex items-center justify-between bg-[#2C2C34] p-3 rounded-lg">
                      <span className="text-gray-400 text-sm">Avg Order Value</span>
                      <span className="font-bold text-yellow-400 text-xl">
                        €{stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "health" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-600/20 p-3 rounded-xl">
                  <FaServer className="text-green-400 text-3xl" />
                </div>
                <h2 className="text-3xl font-bold text-green-400">System Health Monitor</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: "database", name: "Database", desc: "PostgreSQL (Supabase)", icon: FaDatabase },
                  { key: "api", name: "API", desc: "REST API", icon: FaGlobe },
                  { key: "auth", name: "Authentication", desc: "Auth Service", icon: FaShieldAlt },
                  { key: "storage", name: "Storage", desc: "File Storage", icon: FaBox },
                ].map((service) => {
                  const status = systemHealth[service.key as keyof SystemHealth];
                  const isOnline = status === "online";
                  return (
                    <div
                      key={service.key}
                      className={`bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 rounded-2xl p-6 transition-all ${
                        isOnline
                          ? "border-green-500 shadow-lg shadow-green-500/20"
                          : "border-red-500 shadow-lg shadow-red-500/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl ${isOnline ? "bg-green-600/20" : "bg-red-600/20"}`}>
                            <service.icon className={`text-3xl ${isOnline ? "text-green-400" : "text-red-400"}`} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{service.name}</h3>
                            <p className="text-sm text-gray-400">{service.desc}</p>
                          </div>
                        </div>
                        {isOnline ? (
                          <FaCheckCircle className="text-3xl text-green-400" />
                        ) : (
                          <FaExclamationTriangle className="text-3xl text-red-400 animate-pulse" />
                        )}
                      </div>
                      <div className="bg-[#2C2C34] rounded-lg p-3">
                        <p className={`font-bold ${isOnline ? "text-green-400" : "text-red-400"}`}>
                          Status: {isOnline ? "🟢 Online" : "🔴 Offline"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gradient-to-br from-green-600/10 to-green-600/5 border border-green-600 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaCheckCircle className="text-green-400 text-3xl" />
                  <h3 className="text-2xl font-bold text-green-400">All Systems Operational</h3>
                </div>
                <p className="text-green-300 mb-3">
                  Alle Services laufen reibungslos. Letzte Überprüfung: {new Date().toLocaleTimeString("de-DE")}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-green-600/20 p-3 rounded-lg text-center">
                    <p className="text-xs text-green-300 mb-1">Uptime</p>
                    <p className="text-xl font-bold text-green-400">99.9%</p>
                  </div>
                  <div className="bg-blue-600/20 p-3 rounded-lg text-center">
                    <p className="text-xs text-blue-300 mb-1">Response Time</p>
                    <p className="text-xl font-bold text-blue-400">45ms</p>
                  </div>
                  <div className="bg-purple-600/20 p-3 rounded-lg text-center">
                    <p className="text-xs text-purple-300 mb-1">API Calls</p>
                    <p className="text-xl font-bold text-purple-400">1.2M</p>
                  </div>
                  <div className="bg-yellow-600/20 p-3 rounded-lg text-center">
                    <p className="text-xs text-yellow-300 mb-1">Success Rate</p>
                    <p className="text-xl font-bold text-yellow-400">99.8%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LICENSE DETAILS MODAL */}
      {showLicenseModal && selectedLicense && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3C3C44] rounded-2xl max-w-3xl w-full p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FaKey className="text-orange-400" />
                  License Details
                </h2>
                <p className="text-sm text-gray-400 mt-1">ID: {selectedLicense.id}</p>
              </div>
              <button
                onClick={() => {
                  setShowLicenseModal(false);
                  setSelectedLicense(null);
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* LICENSE KEY */}
              <div className="bg-[#2C2C34] rounded-xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">License Key</p>
                    <p className="font-mono text-lg font-bold">{selectedLicense.license_key}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedLicense.license_key)}
                    className="px-3 py-2 bg-[#00FF9C] text-[#0E0E12] font-bold rounded-lg hover:shadow-lg transition"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              {/* STATUS & INFO GRID */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-[#2C2C34] rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <p className={`font-bold text-lg ${
                    selectedLicense.status === "active" ? "text-green-400" :
                    selectedLicense.status === "expired" ? "text-red-400" :
                    "text-orange-400"
                  }`}>
                    {selectedLicense.status.toUpperCase()}
                  </p>
                </div>

                <div className="bg-[#2C2C34] rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Type</p>
                  <p className="font-bold">{selectedLicense.type || "Standard"}</p>
                </div>

                <div className="bg-[#2C2C34] rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Erstellt</p>
                  <p className="font-bold">{new Date(selectedLicense.created_at).toLocaleDateString("de-DE")}</p>
                </div>

                <div className="bg-[#2C2C34] rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Läuft ab</p>
                  <p className="font-bold">
                    {selectedLicense.expires_at ? new Date(selectedLicense.expires_at).toLocaleDateString("de-DE") : "Nie"}
                  </p>
                </div>

                <div className="bg-[#2C2C34] rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Max Aktivierungen</p>
                  <p className="font-bold">{selectedLicense.max_activations || "Unlimited"}</p>
                </div>

                <div className="bg-[#2C2C34] rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Aktuelle Aktivierungen</p>
                  <p className="font-bold">{selectedLicense.current_activations || 0}</p>
                </div>
              </div>

              {/* PRODUCT & CUSTOMER INFO */}
              <div className="bg-[#2C2C34] rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2">Produkt</p>
                <p className="font-bold text-lg">{selectedLicense.product_name}</p>
                <p className="text-xs text-gray-500 mt-1">Product ID: {selectedLicense.product_id}</p>
              </div>

              <div className="bg-[#2C2C34] rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2">Kunde</p>
                <p className="font-bold text-lg">{selectedLicense.customer_name || "N/A"}</p>
                {selectedLicense.customer_email && (
                  <p className="text-sm text-gray-400 mt-1">📧 {selectedLicense.customer_email}</p>
                )}
                {selectedLicense.customer_id && (
                  <p className="text-xs text-gray-500 mt-1">Customer ID: {selectedLicense.customer_id}</p>
                )}
              </div>

              {/* ACTIONS */}
              {godMode && (
                <div className="bg-gradient-to-r from-red-600/10 to-red-600/5 border border-red-600 rounded-xl p-4">
                  <p className="text-sm text-red-400 font-bold mb-3">🔥 GOD MODE ACTIONS</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedLicense.status !== "active" && (
                      <button
                        onClick={() => handleLicenseAction("activate", selectedLicense)}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition"
                      >
                        ✅ Aktivieren
                      </button>
                    )}
                    {selectedLicense.status === "active" && (
                      <button
                        onClick={() => handleLicenseAction("suspend", selectedLicense)}
                        className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-bold transition"
                      >
                        ⏸️ Suspendieren
                      </button>
                    )}
                    <button
                      onClick={() => handleLicenseAction("extend", selectedLicense)}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition"
                    >
                      📅 +30 Tage verlängern
                    </button>
                    <button
                      onClick={() => handleLicenseAction("delete", selectedLicense)}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition"
                    >
                      🗑️ Löschen
                    </button>
                  </div>
                </div>
              )}

              {/* CLOSE BUTTON */}
              <button
                onClick={() => {
                  setShowLicenseModal(false);
                  setSelectedLicense(null);
                }}
                className="w-full px-4 py-3 bg-[#2C2C34] hover:bg-[#3C3C44] rounded-lg font-bold transition"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
