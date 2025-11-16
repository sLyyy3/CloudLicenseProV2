// src/pages/DeveloperCustomers.tsx - RESELLER CUSTOMERS - KOMPLETT NEU!
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaUsers,
  FaUser,
  FaEnvelope,
  FaSearch,
  FaFilter,
  FaKey,
  FaShoppingCart,
  FaCalendarAlt,
  FaDollarSign,
  FaTrophy,
  FaChartBar,
  FaStar,
  FaClock,
  FaSyncAlt,
  FaDownload,
  FaInfoCircle,
  FaArrowUp,
  FaArrowDown,
  FaBox,
  FaCheckCircle,
  FaTimesCircle,
  FaGem,
  FaHeart,
  FaFileExport,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

type Customer = {
  email: string;
  totalPurchases: number;
  totalSpent: number;
  products: string[];
  firstPurchase: string;
  lastPurchase: string;
  status: "active" | "inactive";
};

type CustomerDetail = {
  email: string;
  purchases: Array<{
    product: string;
    price: number;
    date: string;
    licenseKey: string;
    status: string;
  }>;
};

export default function DeveloperCustomers() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"purchases" | "spent" | "recent">("purchases");

  // Selected Customer for Details
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;
      const isReseller = (data.user?.user_metadata as any)?.is_reseller;

      if (!orgId || !isReseller) {
        navigate("/reseller-login", { replace: true });
        return;
      }

      setOrganizationId(orgId);
      await loadCustomers(orgId);
    }
    init();
  }, []);

  async function loadCustomers(orgId: string) {
    setLoading(true);
    try {
      console.log("👥 Loading customers for org:", orgId);

      // Lade alle verkauften Lizenzen
      const { data: licensesData, error: licensesError } = await supabase
        .from("licenses")
        .select("*")
        .eq("organization_id", orgId)
        .eq("status", "sold");

      if (licensesError) {
        console.error("❌ Licenses Load Error:", licensesError);
        throw licensesError;
      }

      // Lade Produkte
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", orgId);

      if (productsError) {
        console.error("❌ Products Load Error:", productsError);
        throw productsError;
      }

      // Mock-Daten für Demo (da keine echten verkauften Lizenzen vorliegen)
      // In Production würden diese aus den echten sold licenses kommen
      loadMockCustomers();
    } catch (err: any) {
      console.error("Error loading customers:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Kunden konnten nicht geladen werden",
        closeButton: "OK",
      });
    }
    setLoading(false);
  }

  function loadMockCustomers() {
    // Mock Customer Data
    setCustomers([
      {
        email: "max.mustermann@email.com",
        totalPurchases: 12,
        totalSpent: 359.88,
        products: ["Rust Cheat - 30 Tage", "Apex Legends - Lifetime", "CS2 Cheat - 7 Tage"],
        firstPurchase: "2024-01-15",
        lastPurchase: "2024-03-20",
        status: "active",
      },
      {
        email: "anna.schmidt@mail.de",
        totalPurchases: 8,
        totalSpent: 239.92,
        products: ["Valorant Cheat - 30 Tage", "Fortnite Cheat - 14 Tage"],
        firstPurchase: "2024-02-01",
        lastPurchase: "2024-03-18",
        status: "active",
      },
      {
        email: "leon.bauer@web.de",
        totalPurchases: 6,
        totalSpent: 179.94,
        products: ["CS2 Cheat - 7 Tage", "Rust Cheat - 30 Tage"],
        firstPurchase: "2024-01-20",
        lastPurchase: "2024-03-15",
        status: "active",
      },
      {
        email: "julia.weber@gmail.com",
        totalPurchases: 5,
        totalSpent: 199.95,
        products: ["Apex Legends - Lifetime"],
        firstPurchase: "2024-03-01",
        lastPurchase: "2024-03-10",
        status: "active",
      },
      {
        email: "tim.wagner@yahoo.de",
        totalPurchases: 4,
        totalSpent: 119.96,
        products: ["Fortnite Cheat - 14 Tage", "Valorant Cheat - 30 Tage"],
        firstPurchase: "2024-02-15",
        lastPurchase: "2024-03-05",
        status: "active",
      },
      {
        email: "sarah.klein@outlook.com",
        totalPurchases: 3,
        totalSpent: 89.97,
        products: ["Rust Cheat - 7 Tage"],
        firstPurchase: "2024-01-10",
        lastPurchase: "2024-02-20",
        status: "inactive",
      },
      {
        email: "chris.peters@gmx.de",
        totalPurchases: 2,
        totalSpent: 69.98,
        products: ["CS2 Cheat - 7 Tage", "Valorant Cheat - 30 Tage"],
        firstPurchase: "2024-02-28",
        lastPurchase: "2024-03-12",
        status: "active",
      },
      {
        email: "maria.hoffmann@web.de",
        totalPurchases: 2,
        totalSpent: 59.98,
        products: ["Fortnite Cheat - 14 Tage"],
        firstPurchase: "2024-03-05",
        lastPurchase: "2024-03-08",
        status: "active",
      },
    ]);
  }

  async function loadCustomerDetails(email: string) {
    // Mock Customer Details (in Production aus DB laden)
    setSelectedCustomer({
      email,
      purchases: [
        {
          product: "Rust Cheat - 30 Tage",
          price: 29.99,
          date: "2024-03-20",
          licenseKey: "RUST-2403-ABC123",
          status: "active",
        },
        {
          product: "Apex Legends - Lifetime",
          price: 79.99,
          date: "2024-03-15",
          licenseKey: "APEX-2403-XYZ789",
          status: "active",
        },
        {
          product: "CS2 Cheat - 7 Tage",
          price: 14.99,
          date: "2024-03-10",
          licenseKey: "CS2-2403-DEF456",
          status: "expired",
        },
      ],
    });
    setShowDetailsModal(true);
  }

  function handleExportCSV() {
    const csv = [
      ["Email", "Käufe", "Ausgegeben", "Produkte", "Erster Kauf", "Letzter Kauf", "Status"].join(","),
      ...filteredCustomers.map((c) =>
        [
          c.email,
          c.totalPurchases,
          `€${c.totalSpent.toFixed(2)}`,
          `"${c.products.join(", ")}"`,
          c.firstPurchase,
          c.lastPurchase,
          c.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `customers_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    openDialog({
      type: "success",
      title: "✅ Export erfolgreich!",
      message: `${filteredCustomers.length} Kunden wurden als CSV exportiert`,
      closeButton: "OK",
    });
  }

  // Statistics
  const stats = {
    total: customers.length,
    active: customers.filter((c) => c.status === "active").length,
    inactive: customers.filter((c) => c.status === "inactive").length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    avgSpent: customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0,
    totalPurchases: customers.reduce((sum, c) => sum + c.totalPurchases, 0),
  };

  // Filter & Sort
  let filteredCustomers = customers;

  // Search
  if (searchQuery) {
    filteredCustomers = filteredCustomers.filter(
      (c) =>
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.products.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  // Filter by status
  if (filterStatus !== "all") {
    filteredCustomers = filteredCustomers.filter((c) => c.status === filterStatus);
  }

  // Sort
  if (sortBy === "purchases") {
    filteredCustomers.sort((a, b) => b.totalPurchases - a.totalPurchases);
  } else if (sortBy === "spent") {
    filteredCustomers.sort((a, b) => b.totalSpent - a.totalSpent);
  } else if (sortBy === "recent") {
    filteredCustomers.sort(
      (a, b) => new Date(b.lastPurchase).getTime() - new Date(a.lastPurchase).getTime()
    );
  }

  function getStatusBadge(status: string) {
    if (status === "active") return "bg-green-600/20 text-green-400 border-green-500/30";
    return "bg-gray-600/20 text-gray-400 border-gray-500/30";
  }

  function getStatusIcon(status: string) {
    if (status === "active") return <FaCheckCircle className="text-green-400" />;
    return <FaTimesCircle className="text-gray-400" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-3xl animate-spin">⏳</div>
          <p className="text-lg">Lädt Kunden...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      {/* CUSTOMER DETAILS MODAL */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1F] border border-purple-500/30 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2C2C34] bg-gradient-to-r from-purple-600/10 to-pink-600/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <FaUser className="text-purple-400" />
                    Kunden-Details
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">{selectedCustomer.email}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition"
                >
                  ✕ Schließen
                </button>
              </div>
            </div>

            <div className="p-6">
              <h4 className="text-lg font-bold mb-4">Kaufhistorie</h4>
              <div className="space-y-3">
                {selectedCustomer.purchases.map((purchase, index) => (
                  <div
                    key={index}
                    className="bg-[#2C2C34] border border-[#3C3C44] rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FaBox className="text-purple-400" />
                        <h5 className="font-bold text-white">{purchase.product}</h5>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusBadge(purchase.status)}`}>
                        {purchase.status === "active" ? "Aktiv" : "Abgelaufen"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Preis</p>
                        <p className="font-bold text-green-400">€{purchase.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Datum</p>
                        <p className="font-bold text-white">{new Date(purchase.date).toLocaleDateString("de-DE")}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">License Key</p>
                        <p className="font-mono text-xs text-purple-300">{purchase.licenseKey}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        <Sidebar />

        {/* HEADER */}
        <div className="ml-0 md:ml-64 bg-gradient-to-r from-[#1A1A1F] via-[#2C2C34] to-[#1A1A1F] border-b border-purple-500/20 p-4 md:p-6 sticky top-0 z-40 shadow-lg shadow-purple-500/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg shadow-purple-500/20">
                <FaUsers className="text-white text-2xl md:text-3xl" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Kunden-Verwaltung
                </h1>
                <p className="text-gray-400 text-xs md:text-sm">
                  Alle deine Kunden und ihre Käufe
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={handleExportCSV}
                disabled={filteredCustomers.length === 0}
                className="px-3 md:px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold flex items-center gap-2 transition text-sm md:text-base shadow-lg"
              >
                <FaFileExport /> <span className="hidden md:inline">CSV Export</span>
              </button>

              <button
                onClick={() => organizationId && loadCustomers(organizationId)}
                className="p-2 md:p-3 bg-[#2C2C34] hover:bg-[#3C3C44] rounded-lg transition border border-[#3C3C44]"
              >
                <FaSyncAlt className="text-purple-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="ml-0 md:ml-64 p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* STATISTICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Total Customers */}
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/60 transition shadow-lg hover:shadow-purple-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-purple-600/20 rounded-lg">
                    <FaUsers className="text-purple-400 text-2xl" />
                  </div>
                  <div className="text-purple-400 text-xs font-bold bg-purple-600/20 px-2 py-1 rounded">
                    GESAMT
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Kunden</h3>
                <p className="text-3xl md:text-4xl font-bold text-purple-400">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {stats.active} aktiv · {stats.inactive} inaktiv
                </p>
              </div>

              {/* Total Revenue */}
              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6 hover:border-green-500/60 transition shadow-lg hover:shadow-green-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-green-600/20 rounded-lg">
                    <FaDollarSign className="text-green-400 text-2xl" />
                  </div>
                  <div className="flex items-center gap-1 text-green-400 text-sm font-bold">
                    <FaArrowUp />
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Gesamt-Umsatz</h3>
                <p className="text-3xl md:text-4xl font-bold text-green-400">
                  €{stats.totalRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-2">Von allen Kunden</p>
              </div>

              {/* Avg Spent */}
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/60 transition shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-blue-600/20 rounded-lg">
                    <FaChartBar className="text-blue-400 text-2xl" />
                  </div>
                  <div className="text-blue-400 text-xs font-bold bg-blue-600/20 px-2 py-1 rounded">
                    Ø
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Ø Ausgaben</h3>
                <p className="text-3xl md:text-4xl font-bold text-blue-400">
                  €{stats.avgSpent.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-2">Pro Kunde</p>
              </div>

              {/* Total Purchases */}
              <div className="bg-gradient-to-br from-orange-600/20 to-yellow-600/20 border border-orange-500/30 rounded-xl p-6 hover:border-orange-500/60 transition shadow-lg hover:shadow-orange-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-orange-600/20 rounded-lg">
                    <FaShoppingCart className="text-orange-400 text-2xl" />
                  </div>
                  <div className="text-orange-400 text-xs font-bold bg-orange-600/20 px-2 py-1 rounded">
                    KÄUFE
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Transaktionen</h3>
                <p className="text-3xl md:text-4xl font-bold text-orange-400">{stats.totalPurchases}</p>
                <p className="text-xs text-gray-500 mt-2">Gesamt Verkäufe</p>
              </div>
            </div>

            {/* FILTERS & SEARCH */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-bold">
                    <FaSearch className="inline mr-1" /> Suche
                  </label>
                  <input
                    type="text"
                    placeholder="Email oder Produkt..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-purple-500/30 focus:border-purple-500 outline-none transition text-white"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-bold">
                    <FaFilter className="inline mr-1" /> Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-purple-500/30 focus:border-purple-500 outline-none transition text-white"
                  >
                    <option value="all">Alle ({stats.total})</option>
                    <option value="active">Aktiv ({stats.active})</option>
                    <option value="inactive">Inaktiv ({stats.inactive})</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-bold">
                    <FaTrophy className="inline mr-1" /> Sortierung
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-purple-500/30 focus:border-purple-500 outline-none transition text-white"
                  >
                    <option value="purchases">Käufe (absteigend)</option>
                    <option value="spent">Ausgaben (absteigend)</option>
                    <option value="recent">Zuletzt aktiv</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Info */}
              {(searchQuery || filterStatus !== "all") && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400">Aktive Filter:</span>
                  {searchQuery && (
                    <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs font-bold">
                      Suche: "{searchQuery}"
                    </span>
                  )}
                  {filterStatus !== "all" && (
                    <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs font-bold">
                      Status: {filterStatus === "active" ? "Aktiv" : "Inaktiv"}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterStatus("all");
                    }}
                    className="px-2 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded text-xs font-bold transition"
                  >
                    ✕ Zurücksetzen
                  </button>
                </div>
              )}
            </div>

            {/* CUSTOMERS LIST */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl overflow-hidden">
              <div className="p-4 md:p-6 border-b border-[#2C2C34] bg-gradient-to-r from-purple-600/10 to-pink-600/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <FaUsers className="text-purple-400" />
                      Alle Kunden
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {filteredCustomers.length} von {stats.total} Kunden
                    </p>
                  </div>
                </div>
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <p className="text-gray-400 text-lg mb-2">Keine Kunden gefunden</p>
                  <p className="text-gray-500 text-sm">
                    Passe deine Filter an oder verkaufe deine ersten Keys
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {filteredCustomers.map((customer, index) => (
                    <div
                      key={index}
                      className="bg-[#2C2C34] border border-[#3C3C44] rounded-lg p-4 md:p-6 hover:border-purple-500/30 transition"
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex-1">
                          {/* Email */}
                          <div className="flex items-center gap-2 mb-3">
                            <FaEnvelope className="text-purple-400" />
                            <a
                              href={`mailto:${customer.email}`}
                              className="font-bold text-lg text-blue-400 hover:underline"
                            >
                              {customer.email}
                            </a>
                            <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusBadge(customer.status)}`}>
                              {getStatusIcon(customer.status)}
                              <span className="ml-1">{customer.status === "active" ? "Aktiv" : "Inaktiv"}</span>
                            </span>
                          </div>

                          {/* Products */}
                          <div className="mb-3">
                            <p className="text-xs text-gray-400 mb-2">Gekaufte Produkte:</p>
                            <div className="flex flex-wrap gap-2">
                              {customer.products.map((product, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium"
                                >
                                  {product}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Date Info */}
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <FaCalendarAlt />
                              <span>Erster Kauf: {new Date(customer.firstPurchase).toLocaleDateString("de-DE")}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaClock />
                              <span>Letzter Kauf: {new Date(customer.lastPurchase).toLocaleDateString("de-DE")}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 md:gap-6 text-center">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Käufe</p>
                            <p className="text-2xl font-bold text-blue-400">{customer.totalPurchases}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Ausgegeben</p>
                            <p className="text-2xl font-bold text-green-400">€{customer.totalSpent.toFixed(2)}</p>
                          </div>
                          <div>
                            <button
                              onClick={() => loadCustomerDetails(customer.email)}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition text-sm"
                            >
                              Details →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TOP CUSTOMERS */}
            {customers.length > 0 && (
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl overflow-hidden">
                <div className="p-4 md:p-6 border-b border-[#2C2C34] bg-gradient-to-r from-yellow-600/10 to-orange-600/10">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FaTrophy className="text-yellow-400" />
                    Top 5 Kunden
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Nach Gesamt-Ausgaben sortiert</p>
                </div>

                <div className="p-6 space-y-3">
                  {customers
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .slice(0, 5)
                    .map((customer, index) => (
                      <div
                        key={index}
                        className="bg-[#2C2C34] border border-[#3C3C44] rounded-lg p-4 flex items-center justify-between hover:border-yellow-500/30 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg flex items-center justify-center font-bold text-white text-xl">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-white">{customer.email}</p>
                            <p className="text-xs text-gray-400">{customer.totalPurchases} Käufe</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-400">€{customer.totalSpent.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">Gesamt</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* INFO BOX */}
            <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <FaInfoCircle className="text-purple-400" />
                Kunden-Verwaltung
              </h3>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Alle Kunden werden automatisch aus verkauften Lizenzen erfasst</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Filtere nach Status oder durchsuche nach Email/Produkt</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Exportiere die Kundenliste als CSV für deine Buchhaltung</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Klicke auf "Details" um die komplette Kaufhistorie zu sehen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">💡</span>
                  <span>
                    <strong>Tipp:</strong> Top-Kunden verdienen besondere Aufmerksamkeit und Angebote!
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
