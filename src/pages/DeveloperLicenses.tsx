// src/pages/DeveloperLicenses.tsx - RESELLER LICENSE INVENTORY - KOMPLETT NEU!
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaKey,
  FaBox,
  FaSearch,
  FaFilter,
  FaDownload,
  FaCopy,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaChartPie,
  FaFileExport,
  FaEye,
  FaTrash,
  FaEdit,
  FaSyncAlt,
  FaExclamationTriangle,
  FaInfoCircle,
  FaShoppingCart,
  FaCalendarAlt,
  FaUser,
  FaDollarSign,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

type License = {
  id: string;
  license_key: string;
  product_id: string;
  organization_id: string;
  status: "available" | "sold" | "expired";
  price: number;
  duration_days: number;
  customer_email?: string;
  sold_at?: string;
  expires_at?: string;
  created_at: string;
};

type Product = {
  id: string;
  name: string;
  description: string;
  base_price: number;
};

type LicenseWithProduct = License & {
  product_name: string;
};

export default function DeveloperLicenses() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [licenses, setLicenses] = useState<LicenseWithProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "sold" | "expired">("all");
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price_high" | "price_low">("newest");

  // View Mode
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);

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
      await loadData(orgId);
    }
    init();
  }, []);

  async function loadData(orgId: string) {
    setLoading(true);
    try {
      console.log("📦 Loading licenses for org:", orgId);

      // Lade alle Licenses
      const { data: licensesData, error: licensesError } = await supabase
        .from("licenses")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (licensesError) {
        console.error("❌ Licenses Load Error:", licensesError);
        throw licensesError;
      }

      // Lade alle Produkte
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", orgId);

      if (productsError) {
        console.error("❌ Products Load Error:", productsError);
        throw productsError;
      }

      // Merge Licenses mit Produktnamen
      const enrichedLicenses = (licensesData || []).map((lic: any) => {
        const product = productsData?.find((p) => p.id === lic.product_id);
        return {
          ...lic,
          product_name: product?.name || "Unbekanntes Produkt",
        };
      });

      console.log("✅ Loaded licenses:", enrichedLicenses.length);
      setLicenses(enrichedLicenses);
      setProducts(productsData || []);
    } catch (err: any) {
      console.error("Error loading data:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Lizenzen konnten nicht geladen werden",
        closeButton: "OK",
      });
    }
    setLoading(false);
  }

  async function handleDeleteLicense(id: string, key: string) {
    openDialog({
      type: "error",
      title: "⚠️ Lizenz löschen?",
      message: `Du willst wirklich die Lizenz "${key}" löschen? Das ist nicht rückgängig zu machen!`,
      closeButton: "Abbrechen",
      actionButton: {
        label: "🗑️ Ja, löschen",
        onClick: async () => {
          try {
            const { error } = await supabase
              .from("licenses")
              .delete()
              .eq("id", id);

            if (error) throw error;

            openDialog({
              type: "success",
              title: "✅ Gelöscht!",
              message: "Lizenz wurde entfernt",
              closeButton: "OK",
            });

            if (organizationId) {
              await loadData(organizationId);
            }
          } catch (err: any) {
            openDialog({
              type: "error",
              title: "❌ Fehler",
              message: "Lizenz konnte nicht gelöscht werden",
              closeButton: "OK",
            });
          }
        },
      },
    });
  }

  async function handleBulkDelete() {
    if (selectedLicenses.length === 0) {
      openDialog({
        type: "warning",
        title: "⚠️ Keine Auswahl",
        message: "Bitte wähle mindestens eine Lizenz aus",
        closeButton: "OK",
      });
      return;
    }

    openDialog({
      type: "error",
      title: "⚠️ Mehrere Lizenzen löschen?",
      message: `Du willst wirklich ${selectedLicenses.length} Lizenz(en) löschen?`,
      closeButton: "Abbrechen",
      actionButton: {
        label: "🗑️ Alle löschen",
        onClick: async () => {
          try {
            const { error } = await supabase
              .from("licenses")
              .delete()
              .in("id", selectedLicenses);

            if (error) throw error;

            openDialog({
              type: "success",
              title: "✅ Gelöscht!",
              message: `${selectedLicenses.length} Lizenz(en) wurden gelöscht`,
              closeButton: "OK",
            });

            setSelectedLicenses([]);
            if (organizationId) {
              await loadData(organizationId);
            }
          } catch (err: any) {
            openDialog({
              type: "error",
              title: "❌ Fehler",
              message: "Lizenzen konnten nicht gelöscht werden",
              closeButton: "OK",
            });
          }
        },
      },
    });
  }

  function handleCopyKey(key: string) {
    navigator.clipboard.writeText(key);
    openDialog({
      type: "success",
      title: "✅ Kopiert!",
      message: `License Key wurde in die Zwischenablage kopiert`,
      closeButton: "OK",
    });
  }

  function handleExportCSV() {
    const csv = [
      ["License Key", "Produkt", "Status", "Preis", "Laufzeit (Tage)", "Kunde", "Verkauft am", "Erstellt am"].join(","),
      ...filteredLicenses.map((lic) =>
        [
          lic.license_key,
          `"${lic.product_name}"`,
          lic.status,
          lic.price,
          lic.duration_days,
          lic.customer_email || "-",
          lic.sold_at ? new Date(lic.sold_at).toLocaleDateString("de-DE") : "-",
          new Date(lic.created_at).toLocaleDateString("de-DE"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `licenses_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    openDialog({
      type: "success",
      title: "✅ Export erfolgreich!",
      message: `${filteredLicenses.length} Lizenz(en) wurden als CSV exportiert`,
      closeButton: "OK",
    });
  }

  function toggleSelectLicense(id: string) {
    if (selectedLicenses.includes(id)) {
      setSelectedLicenses(selectedLicenses.filter((lid) => lid !== id));
    } else {
      setSelectedLicenses([...selectedLicenses, id]);
    }
  }

  function toggleSelectAll() {
    if (selectedLicenses.length === filteredLicenses.length) {
      setSelectedLicenses([]);
    } else {
      setSelectedLicenses(filteredLicenses.map((l) => l.id));
    }
  }

  // Statistics
  const stats = {
    total: licenses.length,
    available: licenses.filter((l) => l.status === "available").length,
    sold: licenses.filter((l) => l.status === "sold").length,
    expired: licenses.filter((l) => l.status === "expired").length,
    totalValue: licenses.reduce((sum, l) => sum + l.price, 0),
    soldValue: licenses
      .filter((l) => l.status === "sold")
      .reduce((sum, l) => sum + l.price, 0),
  };

  // Filter & Sort
  let filteredLicenses = licenses;

  // Search
  if (searchQuery) {
    filteredLicenses = filteredLicenses.filter(
      (l) =>
        l.license_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.customer_email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Filter by status
  if (filterStatus !== "all") {
    filteredLicenses = filteredLicenses.filter((l) => l.status === filterStatus);
  }

  // Filter by product
  if (filterProduct !== "all") {
    filteredLicenses = filteredLicenses.filter((l) => l.product_id === filterProduct);
  }

  // Sort
  if (sortBy === "newest") {
    filteredLicenses.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } else if (sortBy === "oldest") {
    filteredLicenses.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  } else if (sortBy === "price_high") {
    filteredLicenses.sort((a, b) => b.price - a.price);
  } else if (sortBy === "price_low") {
    filteredLicenses.sort((a, b) => a.price - b.price);
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "available":
        return <FaCheckCircle className="text-green-400" />;
      case "sold":
        return <FaShoppingCart className="text-blue-400" />;
      case "expired":
        return <FaTimesCircle className="text-red-400" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "available":
        return "bg-green-600/20 text-green-400 border-green-500/30";
      case "sold":
        return "bg-blue-600/20 text-blue-400 border-blue-500/30";
      case "expired":
        return "bg-red-600/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-600/20 text-gray-400 border-gray-500/30";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "available":
        return "Verfügbar";
      case "sold":
        return "Verkauft";
      case "expired":
        return "Abgelaufen";
      default:
        return "Unbekannt";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-3xl animate-spin">⏳</div>
          <p className="text-lg">Lädt Inventar...</p>
        </div>
      </div>
    );
  }

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
                <FaKey className="text-white text-2xl md:text-3xl" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  License Inventar
                </h1>
                <p className="text-gray-400 text-xs md:text-sm">
                  Verwalte alle deine Keys und Lizenzen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={handleExportCSV}
                disabled={filteredLicenses.length === 0}
                className="px-3 md:px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold flex items-center gap-2 transition text-sm md:text-base shadow-lg"
              >
                <FaFileExport /> <span className="hidden md:inline">CSV Export</span>
              </button>

              <button
                onClick={() => organizationId && loadData(organizationId)}
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
              {/* Total Keys */}
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/60 transition shadow-lg hover:shadow-purple-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-purple-600/20 rounded-lg">
                    <FaKey className="text-purple-400 text-2xl" />
                  </div>
                  <div className="text-purple-400 text-xs font-bold bg-purple-600/20 px-2 py-1 rounded">
                    GESAMT
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Alle Keys</h3>
                <p className="text-3xl md:text-4xl font-bold text-purple-400">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Wert: <strong className="text-purple-300">€{stats.totalValue.toFixed(2)}</strong>
                </p>
              </div>

              {/* Available */}
              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6 hover:border-green-500/60 transition shadow-lg hover:shadow-green-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-green-600/20 rounded-lg">
                    <FaCheckCircle className="text-green-400 text-2xl" />
                  </div>
                  <div className="flex items-center gap-1 text-green-400 text-sm font-bold">
                    <FaArrowUp />
                    <span>{Math.round((stats.available / stats.total) * 100)}%</span>
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Verfügbar</h3>
                <p className="text-3xl md:text-4xl font-bold text-green-400">{stats.available}</p>
                <p className="text-xs text-gray-500 mt-2">Bereit zum Verkauf</p>
              </div>

              {/* Sold */}
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/60 transition shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-blue-600/20 rounded-lg">
                    <FaShoppingCart className="text-blue-400 text-2xl" />
                  </div>
                  <div className="flex items-center gap-1 text-blue-400 text-sm font-bold">
                    <FaArrowDown />
                    <span>{stats.sold}</span>
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Verkauft</h3>
                <p className="text-3xl md:text-4xl font-bold text-blue-400">{stats.sold}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Umsatz: <strong className="text-blue-300">€{stats.soldValue.toFixed(2)}</strong>
                </p>
              </div>

              {/* Expired */}
              <div className="bg-gradient-to-br from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-xl p-6 hover:border-red-500/60 transition shadow-lg hover:shadow-red-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-red-600/20 rounded-lg">
                    <FaTimesCircle className="text-red-400 text-2xl" />
                  </div>
                  <div className="text-red-400 text-xs font-bold bg-red-600/20 px-2 py-1 rounded">
                    WARNUNG
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Abgelaufen</h3>
                <p className="text-3xl md:text-4xl font-bold text-red-400">{stats.expired}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {Math.round((stats.expired / stats.total) * 100)}% aller Keys
                </p>
              </div>
            </div>

            {/* FILTERS & SEARCH */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="block text-xs text-gray-400 mb-2 font-bold">
                    <FaSearch className="inline mr-1" /> Suche
                  </label>
                  <input
                    type="text"
                    placeholder="Key, Produkt oder Kunde..."
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
                    <option value="available">Verfügbar ({stats.available})</option>
                    <option value="sold">Verkauft ({stats.sold})</option>
                    <option value="expired">Abgelaufen ({stats.expired})</option>
                  </select>
                </div>

                {/* Product Filter */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-bold">
                    <FaBox className="inline mr-1" /> Produkt
                  </label>
                  <select
                    value={filterProduct}
                    onChange={(e) => setFilterProduct(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-purple-500/30 focus:border-purple-500 outline-none transition text-white"
                  >
                    <option value="all">Alle Produkte</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-bold">
                    <FaChartPie className="inline mr-1" /> Sortierung
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-purple-500/30 focus:border-purple-500 outline-none transition text-white"
                  >
                    <option value="newest">Neueste zuerst</option>
                    <option value="oldest">Älteste zuerst</option>
                    <option value="price_high">Preis: Hoch → Niedrig</option>
                    <option value="price_low">Preis: Niedrig → Hoch</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Info */}
              {(searchQuery || filterStatus !== "all" || filterProduct !== "all") && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400">Aktive Filter:</span>
                  {searchQuery && (
                    <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs font-bold">
                      Suche: "{searchQuery}"
                    </span>
                  )}
                  {filterStatus !== "all" && (
                    <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs font-bold">
                      Status: {getStatusLabel(filterStatus)}
                    </span>
                  )}
                  {filterProduct !== "all" && (
                    <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-bold">
                      Produkt: {products.find((p) => p.id === filterProduct)?.name}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterStatus("all");
                      setFilterProduct("all");
                    }}
                    className="px-2 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded text-xs font-bold transition"
                  >
                    ✕ Alle zurücksetzen
                  </button>
                </div>
              )}
            </div>

            {/* BULK ACTIONS */}
            {selectedLicenses.length > 0 && (
              <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaInfoCircle className="text-orange-400 text-xl" />
                  <span className="text-white font-bold">
                    {selectedLicenses.length} Lizenz(en) ausgewählt
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold flex items-center gap-2 transition"
                  >
                    <FaTrash /> Alle löschen
                  </button>
                  <button
                    onClick={() => setSelectedLicenses([])}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold transition"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            {/* LICENSES TABLE */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl overflow-hidden">
              <div className="p-4 md:p-6 border-b border-[#2C2C34] bg-gradient-to-r from-purple-600/10 to-pink-600/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <FaKey className="text-purple-400" />
                      Alle Lizenzen
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {filteredLicenses.length} von {stats.total} Keys
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={toggleSelectAll}
                      className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold transition"
                    >
                      {selectedLicenses.length === filteredLicenses.length
                        ? "Alle abwählen"
                        : "Alle auswählen"}
                    </button>
                  </div>
                </div>
              </div>

              {filteredLicenses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-400 text-lg mb-2">Keine Lizenzen gefunden</p>
                  <p className="text-gray-500 text-sm">
                    Passe deine Filter an oder lade neue Keys hoch
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#2C2C34]">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedLicenses.length === filteredLicenses.length}
                            onChange={toggleSelectAll}
                            className="w-4 h-4"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">
                          License Key
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">
                          Produkt
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">
                          Preis
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">
                          Laufzeit
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">
                          Kunde
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">
                          Erstellt
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">
                          Aktionen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2C2C34]">
                      {filteredLicenses.map((license) => (
                        <tr
                          key={license.id}
                          className={`hover:bg-[#2C2C34] transition ${
                            selectedLicenses.includes(license.id) ? "bg-purple-600/10" : ""
                          }`}
                        >
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedLicenses.includes(license.id)}
                              onChange={() => toggleSelectLicense(license.id)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <code className="text-xs font-mono text-purple-300 bg-[#0E0E12] px-2 py-1 rounded border border-purple-500/30">
                              {license.license_key}
                            </code>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <FaBox className="text-purple-400 text-sm" />
                              <span className="text-sm text-white">{license.product_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit border ${getStatusBadge(
                                license.status
                              )}`}
                            >
                              {getStatusIcon(license.status)}
                              {getStatusLabel(license.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-green-400">
                            €{license.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-300">
                            <div className="flex items-center gap-1">
                              <FaClock className="text-gray-500" />
                              {license.duration_days} Tage
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-300">
                            {license.customer_email ? (
                              <div className="flex items-center gap-1">
                                <FaUser className="text-blue-400" />
                                {license.customer_email}
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <FaCalendarAlt className="text-gray-500" />
                              {new Date(license.created_at).toLocaleDateString("de-DE")}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleCopyKey(license.license_key)}
                                className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded transition"
                                title="Key kopieren"
                              >
                                <FaCopy className="text-xs" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteLicense(license.id, license.license_key)
                                }
                                className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded transition"
                                title="Löschen"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* INFO BOX */}
            <div className="bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border border-blue-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <FaInfoCircle className="text-blue-400" />
                Inventar-Verwaltung
              </h3>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Alle Keys werden hier zentral verwaltet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Filtere nach Status, Produkt oder durchsuche alle Keys</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Exportiere dein Inventar als CSV für Buchhaltung</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Wähle mehrere Keys aus für Bulk-Aktionen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">💡</span>
                  <span>
                    <strong>Tipp:</strong> Verkaufte Keys zeigen den Kunden und Verkaufszeitpunkt
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
