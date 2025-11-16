// src/pages/Dashboard.tsx - EPIC UPGRADE DES ORIGINAL DASHBOARDS MIT ANIMATIONEN + FIXES
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaHome,
  FaArrowLeft,
  FaPlus,
  FaSearch,
  FaDownload,
  FaTrash,
  FaEdit,
  FaKey,
  FaChevronLeft,
  FaChevronRight,
  FaCopy,
  FaSync,
  FaFilter,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaCheck,
  FaEye,
  FaFileExport,
  FaFire,
  FaRocket,
  FaTrophy,
  FaLightbulb,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import { useDialog } from "../components/Dialog";
import {
  useAdvancedFilter,
  usePagination,
  exportToCSV,
} from "../lib/helpers.tsx";

type License = {
  id: string;
  license_key: string;
  status: "active" | "inactive" | "expired" | "revoked";
  type?: "single" | "floating" | "concurrent";
  expires_at?: string;
  max_activations?: number;
  current_activations?: number;
  product_name: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  product_id: string;
  customer_id: string;
};

type Customer = { id: string; name: string; email: string };
type Product = { id: string; name: string };
type Stats = { total: number; active: number; expiring: number; expired: number };

export default function Dashboard() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  // State
  const [licenses, setLicenses] = useState<License[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, expiring: 0, expired: 0 });
  const [displayStats, setDisplayStats] = useState<Stats>({ total: 0, active: 0, expiring: 0, expired: 0 });

  // Filter & Search
  const { filters, setFilters, filtered } = useAdvancedFilter(licenses);
  const pagination = usePagination(filtered, 20);

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [editStatus, setEditStatus] = useState("active");

  // Bulk Generation Modal
  const [showBulkGenerateModal, setShowBulkGenerateModal] = useState(false);
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkProduct, setBulkProduct] = useState("");
  const [bulkCustomer, setBulkCustomer] = useState("");
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("active");
  const [bulkType, setBulkType] = useState("single");

  // Bulk Selection
  const [selectedLicenses, setSelectedLicenses] = useState<Set<string>>(new Set());
  const [showBulkActionsBar, setShowBulkActionsBar] = useState(false);

  // Create Single License Modal State
  const [showCreateLicenseModal, setShowCreateLicenseModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    product_id: "",
    customer_id: "",
    type: "single",
    max_activations: 1,
    expires_at: "",
  });
  const [creatingLicense, setCreatingLicense] = useState(false);

  // ===== LOAD ORGANISATION & DATA =====
  useEffect(() => {
    async function init() {
      try {
        console.log("📊 Dashboard Init - Getting User...");
        const { data } = await supabase.auth.getUser();
        
        if (!data.user) {
          throw new Error("User nicht authentifiziert");
        }

        const orgId = (data.user?.user_metadata as any)?.organization_id;

        if (!orgId) {
          console.error("❌ organization_id fehlt in metadata");
          openDialog({
            type: "error",
            title: "❌ Organisation fehlt",
            message: "organisation_id nicht in user metadata. Bitte melde dich ab und neu an.",
            closeButton: "OK",
          });
          return;
        }

        console.log("✅ Organization ID:", orgId);
        setOrganizationId(orgId);

        // Lade alle Daten
        await loadData(orgId);
      } catch (err: any) {
        console.error("❌ Init Error:", err);
        openDialog({
          type: "error",
          title: "❌ Fehler",
          message: err.message || "Daten konnten nicht geladen werden",
          closeButton: "OK",
        });
        setLoading(false);
      }
    }
    init();
  }, []);

  // ===== Animate Stats =====
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!loading) {
      interval = setInterval(() => {
        setDisplayStats((prev) => ({
          total: Math.min(prev.total + Math.ceil((stats.total - prev.total) / 10), stats.total),
          active: Math.min(prev.active + Math.ceil((stats.active - prev.active) / 10), stats.active),
          expiring: Math.min(prev.expiring + Math.ceil((stats.expiring - prev.expiring) / 10), stats.expiring),
          expired: Math.min(prev.expired + Math.ceil((stats.expired - prev.expired) / 10), stats.expired),
        }));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [stats, loading]);

  // ===== Load Data Function (VERBESSERT) =====
  async function loadData(orgId: string) {
    setLoading(true);
    try {
      console.log("📦 Loading Licenses for org:", orgId);

      // LICENSES LADEN MIT BESSEREN ERROR HANDLING
      const { data: licensesData, error: licensesError } = await supabase
        .from("licenses")
        .select("*")
        .eq("organization_id", orgId);

      if (licensesError) {
        console.error("❌ Licenses Query Error:", licensesError);
        throw new Error(`Licenses: ${licensesError.message}`);
      }

      console.log("✅ Got licenses:", licensesData?.length || 0);

      // PRODUCTS LADEN
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name")
        .eq("organization_id", orgId);

      if (productsError) {
        console.error("❌ Products Query Error:", productsError);
      } else {
        console.log("✅ Got products:", productsData?.length || 0);
        setProducts(productsData || []);
      }

      // CUSTOMERS LADEN
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("id, name, email")
        .eq("organization_id", orgId);

      if (customersError) {
        console.error("❌ Customers Query Error:", customersError);
      } else {
        console.log("✅ Got customers:", customersData?.length || 0);
        setCustomers(customersData || []);
      }

      // FORMAT LICENSES (WICHTIG!)
      if (licensesData && licensesData.length > 0) {
        const formattedLicenses: License[] = licensesData.map((l: any) => {
          // Finde Product Name
          const product = productsData?.find((p) => p.id === l.product_id);
          // Finde Customer Info
          const customer = customersData?.find((c) => c.id === l.customer_id);

          return {
            id: l.id || "",
            license_key: l.license_key || "N/A",
            status: l.status || "active",
            type: l.type || "single",
            expires_at: l.expires_at,
            max_activations: l.max_activations || 1,
            current_activations: l.current_activations || 0,
            product_name: product?.name || l.product_name || "Unbekanntes Produkt",
            customer_name: customer?.name || l.customer_name || "Unbekannter Kunde",
            customer_email: customer?.email || l.customer_email || "unknown@example.com",
            created_at: l.created_at || new Date().toISOString(),
            product_id: l.product_id || "",
            customer_id: l.customer_id || "",
          };
        });

        console.log("✅ Formatted licenses:", formattedLicenses.length);
        setLicenses(formattedLicenses);
        calculateStats(formattedLicenses);
      } else {
        console.log("ℹ️ Keine Lizenzen gefunden");
        setLicenses([]);
        setStats({ total: 0, active: 0, expiring: 0, expired: 0 });
      }
    } catch (err: any) {
      console.error("❌ Error loading data:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler beim Laden",
        message: err.message || "Lizenzen konnten nicht geladen werden",
        closeButton: "OK",
      });
    } finally {
      setLoading(false);
    }
  }

  // ===== Calculate Stats =====
  function calculateStats(licenses: License[]) {
    const now = new Date();
    let active = 0;
    let expiring = 0;
    let expired = 0;

    licenses.forEach((l) => {
      if (l.status === "active") {
        active++;
        if (l.expires_at) {
          const expiryDate = new Date(l.expires_at);
          const daysUntil = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 30 && daysUntil > 0) expiring++;
        }
      }
      if (l.status === "expired") expired++;
    });

    setStats({ total: licenses.length, active, expiring, expired });
  }

  // ===== Copy License Key =====
  async function copyLicenseKey(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      openDialog({
        type: "success",
        title: "✅ Kopiert!",
        message: "License Key wurde kopiert",
        closeButton: "OK",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  // ===== Edit License =====
  async function handleEditLicense() {
    if (!selectedLicense) return;
    const { error } = await supabase
      .from("licenses")
      .update({ status: editStatus })
      .eq("id", selectedLicense.id);

    if (error) {
      openDialog({ type: "error", title: "❌ Fehler", message: error.message, closeButton: "OK" });
    } else {
      openDialog({ type: "success", title: "✅ Aktualisiert", message: "License wurde aktualisiert", closeButton: "OK" });
      setShowEditModal(false);
      if (organizationId) await loadData(organizationId);
    }
  }

  // ===== Delete License =====
  async function handleDeleteLicense(licenseId: string) {
    const confirmed = window.confirm(
      "⚠️ Möchtest du diese License wirklich löschen? Das kann nicht rückgängig gemacht werden!"
    );
    if (!confirmed) return;

    const { error } = await supabase.from("licenses").delete().eq("id", licenseId);

    if (error) {
      openDialog({ type: "error", title: "❌ Fehler", message: error.message, closeButton: "OK" });
    } else {
      openDialog({ type: "success", title: "✅ Gelöscht", message: "License wurde gelöscht", closeButton: "OK" });
      if (organizationId) await loadData(organizationId);
    }
  }

  // ===== Bulk Generate Licenses =====
  async function handleBulkGenerate() {
    if (!bulkProduct || !bulkCustomer || bulkCount <= 0) {
      openDialog({
        type: "warning",
        title: "⚠️ Ungültige Eingabe",
        message: "Bitte fülle alle erforderlichen Felder aus",
        closeButton: "OK",
      });
      return;
    }

    setBulkGenerating(true);

    try {
      const newLicenses = [];

      for (let i = 0; i < bulkCount; i++) {
        const key = `KEY-${Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase()}-${Date.now() + i}`;

        newLicenses.push({
          license_key: key,
          product_id: bulkProduct,
          customer_id: bulkCustomer,
          organization_id: organizationId,
          status: bulkStatus,
          type: bulkType,
          max_activations: bulkType === "concurrent" ? 5 : 1,
        });
      }

      const { error } = await supabase.from("licenses").insert(newLicenses);

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Bulk generiert!",
        message: `${bulkCount} neue Licenses wurden erfolgreich erstellt`,
        closeButton: "OK",
      });

      setShowBulkGenerateModal(false);
      setBulkCount(5);
      setBulkProduct("");
      setBulkCustomer("");
      if (organizationId) await loadData(organizationId);
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    } finally {
      setBulkGenerating(false);
    }
  }

  // ===== Bulk Delete =====
  async function handleBulkDelete() {
    if (selectedLicenses.size === 0) return;

    const confirmed = window.confirm(
      `⚠️ ${selectedLicenses.size} Licenses wirklich löschen?`
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("licenses")
        .delete()
        .in("id", Array.from(selectedLicenses));

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Gelöscht",
        message: `${selectedLicenses.size} Licenses wurden gelöscht`,
        closeButton: "OK",
      });

      setSelectedLicenses(new Set());
      setShowBulkActionsBar(false);
      if (organizationId) await loadData(organizationId);
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    }
  }

  // ===== Toggle License Selection =====
  function toggleLicenseSelection(licenseId: string) {
    const newSelected = new Set(selectedLicenses);
    if (newSelected.has(licenseId)) {
      newSelected.delete(licenseId);
    } else {
      newSelected.add(licenseId);
    }
    setSelectedLicenses(newSelected);
    setShowBulkActionsBar(newSelected.size > 0);
  }

  // ===== Select All on current page =====
  function toggleSelectAll() {
    const items = (pagination as any).currentItems || [];

    const pageIds = new Set(items.filter((l: any) => l.id).map((l: any) => l.id));
    
    if (selectedLicenses.size === pageIds.size) {
      setSelectedLicenses(new Set());
      setShowBulkActionsBar(false);
    } else {
      setSelectedLicenses(pageIds);
      setShowBulkActionsBar(true);
    }
  }

  // ===== Get Status Badge =====
  function getStatusBadge(status: string) {
    switch (status) {
      case "active":
        return (
          <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-lg text-xs font-bold flex items-center gap-1">
            <FaCheckCircle /> Active
          </span>
        );
      case "inactive":
        return (
          <span className="px-3 py-1 bg-gray-600/20 text-[#a0a0a8] rounded-lg text-xs font-bold flex items-center gap-1">
            <FaClock /> Inactive
          </span>
        );
      case "expired":
        return (
          <span className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg text-xs font-bold flex items-center gap-1">
            <FaExclamationTriangle /> Expired
          </span>
        );
      case "revoked":
        return (
          <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-lg text-xs font-bold flex items-center gap-1">
            <FaCheck /> Revoked
          </span>
        );
      default:
        return null;
    }
  }

  // ===== Handle Create License =====
  async function handleCreateLicense() {
    if (!createForm.product_id || !createForm.customer_id) {
      openDialog({
        type: "warning",
        title: "⚠️ Ungültige Eingabe",
        message: "Bitte wähle Produkt und Kunde",
        closeButton: "OK",
      });
      return;
    }

    setCreatingLicense(true);

    try {
      const key = `KEY-${Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()}-${Date.now()}`;

      const { error } = await supabase.from("licenses").insert({
        license_key: key,
        product_id: createForm.product_id,
        customer_id: createForm.customer_id,
        organization_id: organizationId,
        status: "active",
        type: createForm.type,
        max_activations: createForm.max_activations,
        expires_at: createForm.expires_at || null,
      });

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Lizenz erstellt!",
        message: `Neue Lizenz wurde erfolgreich erstellt`,
        closeButton: "OK",
      });

      setShowCreateLicenseModal(false);
      setCreateForm({
        product_id: "",
        customer_id: "",
        type: "single",
        max_activations: 1,
        expires_at: "",
      });

      if (organizationId) await loadData(organizationId);
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    } finally {
      setCreatingLicense(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0E0E12] via-[#1A1A1F] to-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin text-4xl">🚀</div>
          </div>
          <p className="text-lg font-bold">Lädt...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}
      <Sidebar />

      <div className="ml-0 md:ml-64 min-h-screen bg-gradient-to-br from-[#0E0E12] via-[#1A1A1F] to-[#0E0E12] text-[#E0E0E0] p-6">
        {/* EPIC HERO SECTION */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00FF9C]/10 border border-[#00FF9C] rounded-full mb-4">
            <FaFire className="text-[#00FF9C] animate-pulse" />
            <span className="text-sm font-bold text-[#00FF9C]">Dashboard aktiv</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-3 bg-gradient-to-r from-[#00FF9C] via-purple-400 to-blue-400 bg-clip-text text-transparent">
            🎯 Lizenz-Dashboard
          </h1>
          <p className="text-[#a0a0a8] text-lg">Verwalte all deine Keys, Kunden und Produkte an einem Ort</p>
        </div>

        {/* EPIC STATS CARDS MIT ANIMATIONEN */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Licenses */}
          <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-xl p-6 hover:border-[#00FF9C] transition group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FF9C]/5 to-transparent opacity-0 group-hover:opacity-100 transition" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#a0a0a8] font-semibold">Gesamt Keys</h3>
                <div className="text-3xl">🔑</div>
              </div>
              <div className="text-4xl font-black text-[#00FF9C] mb-2">{displayStats.total}</div>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <FaRocket /> +{displayStats.active} aktiv
              </div>
            </div>
          </div>

          {/* Active Licenses */}
          <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-xl p-6 hover:border-green-400 transition group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#a0a0a8] font-semibold">Aktiv</h3>
                <div className="text-3xl">✅</div>
              </div>
              <div className="text-4xl font-black text-green-400 mb-2">{displayStats.active}</div>
              <div className="w-full bg-[#2a2a34] rounded-full h-2 mt-4">
                <div
                  className="bg-green-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total ? (stats.active / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Expiring Soon */}
          <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-xl p-6 hover:border-yellow-400 transition group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#a0a0a8] font-semibold">Verfällt bald</h3>
                <div className="text-3xl">⏰</div>
              </div>
              <div className="text-4xl font-black text-yellow-400 mb-2">{displayStats.expiring}</div>
              <div className="text-sm text-yellow-300 mt-4">In den nächsten 30 Tagen</div>
            </div>
          </div>

          {/* Expired */}
          <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-xl p-6 hover:border-red-400 transition group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#a0a0a8] font-semibold">Abgelaufen</h3>
                <div className="text-3xl">❌</div>
              </div>
              <div className="text-4xl font-black text-red-400 mb-2">{displayStats.expired}</div>
              <div className="text-sm text-red-300 mt-4">Überprüfe diese!</div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS MIT GRADIENT */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setShowCreateLicenseModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00FF9C]/50 transition flex items-center gap-2"
          >
            <FaPlus /> Neue Lizenz
          </button>
          <button
            onClick={() => setShowBulkGenerateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-600/50 transition flex items-center gap-2"
          >
            <FaRocket /> Bulk Generieren
          </button>
          <button
            onClick={() => {
              setFilters({});
              if (organizationId) loadData(organizationId);
            }}
            className="px-6 py-3 bg-[#2a2a34] text-white font-bold rounded-lg hover:bg-[#3a3a44] transition flex items-center gap-2"
          >
            <FaSync /> Neu laden
          </button>
        </div>

        {/* SEARCH & FILTER */}
        <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-xl p-6 mb-8">
          <div className="flex gap-4 flex-wrap items-end">
            {/* Search Input */}
            <div className="flex-1 min-w-64">
              <label className="block text-sm text-[#a0a0a8] mb-2">🔍 Suche</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-[#a0a0a8]" />
                <input
                  type="text"
                  placeholder="License Key, Kunde, Produkt..."
                  value={filters.searchQuery || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, searchQuery: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm text-[#a0a0a8] mb-2">Status</label>
              <select
                value={filters.statusFilter || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    statusFilter: e.target.value || undefined,
                  })
                }
                className="px-4 py-2 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
              >
                <option value="">-- Alle --</option>
                <option value="active">✅ Aktiv</option>
                <option value="inactive">⏸️ Inaktiv</option>
                <option value="expired">❌ Abgelaufen</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(filters.searchQuery || filters.statusFilter) && (
              <button
                onClick={() => setFilters({})}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition text-sm font-bold"
              >
                Clear
              </button>
            )}

            {/* Export Button */}
            <button
              onClick={() => exportToCSV(filtered, "licenses_export.csv")}
              disabled={filtered.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-bold disabled:opacity-50 flex items-center gap-2 transition"
            >
              <FaDownload /> Export
            </button>
          </div>
        </div>

        {/* LICENSE TABLE */}
        <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2a2a34] border-b border-[#3a3a44]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#a0a0a8]">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={(() => {
                        const items = (pagination as any).currentPage || 
                                     (pagination as any).items || 
                                     (pagination as any).paginatedItems ||
                                     [];
                        return selectedLicenses.size === items.length && items.length > 0;
                      })()}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#a0a0a8]">🔑 Key</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#a0a0a8]">📦 Produkt</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#a0a0a8]">👤 Kunde</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#a0a0a8]">📊 Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#a0a0a8]">🎯 Typ</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-[#a0a0a8]">⚙️ Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const items = (pagination as any).currentPage || 
                               (pagination as any).items || 
                               (pagination as any).paginatedItems ||
                               [];
                  
                  if (!Array.isArray(items) || items.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-[#a0a0a8]">
                          <FaLightbulb className="text-4xl mx-auto mb-3 opacity-50" />
                          <p>Keine Lizenzen gefunden. Erstelle jetzt eine neue!</p>
                        </td>
                      </tr>
                    );
                  }
                  
                  return items.map((license) => (
                    <tr
                      key={license.id}
                      className="border-b border-[#2a2a34] hover:bg-[#2a2a34]/50 transition"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLicenses.has(license.id)}
                          onChange={() => toggleLicenseSelection(license.id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-[#2a2a34] px-3 py-1 rounded text-[#00FF9C] font-mono text-sm">
                          {license.license_key.substring(0, 10)}...
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm">{license.product_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <div>{license.customer_name}</div>
                        <div className="text-xs text-[#a0a0a8]">{license.customer_email}</div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(license.status)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="text-[#00FF9C] font-semibold">
                          {license.type === "single" && "👤 Single"}
                          {license.type === "floating" && "🔄 Floating"}
                          {license.type === "concurrent" && "⚡ Concurrent"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedLicense(license);
                              setEditStatus(license.status);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-blue-400 hover:bg-blue-600/20 rounded transition"
                            title="Bearbeiten"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => copyLicenseKey(license.license_key)}
                            className="p-2 text-[#00FF9C] hover:bg-[#00FF9C]/20 rounded transition"
                            title="Kopieren"
                          >
                            <FaCopy />
                          </button>
                          <button
                            onClick={() => handleDeleteLicense(license.id)}
                            className="p-2 text-red-400 hover:bg-red-600/20 rounded transition"
                            title="Löschen"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {((pagination as any).totalPages || 1) > 1 && (
            <div className="flex items-center justify-center gap-4 p-6 border-t border-[#2a2a34]">
              <button
                onClick={() => pagination.goToPage((pagination as any).currentPageNumber - 1)}
                disabled={(pagination as any).currentPageNumber === 1}
                className="p-2 disabled:opacity-50"
              >
                <FaChevronLeft />
              </button>
              <span className="text-sm text-[#a0a0a8]">
                Seite {(pagination as any).currentPageNumber || 1} von {(pagination as any).totalPages || 1}
              </span>
              <button
                onClick={() => pagination.goToPage((pagination as any).currentPageNumber + 1)}
                disabled={(pagination as any).currentPageNumber === (pagination as any).totalPages}
                className="p-2 disabled:opacity-50"
              >
                <FaChevronRight />
              </button>
            </div>
          )}
        </div>

        {/* BULK ACTIONS BAR */}
        {showBulkActionsBar && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-6 z-40">
            <span className="font-bold">
              {selectedLicenses.size} ausgewählt
            </span>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition font-bold"
            >
              🗑️ Löschen
            </button>
          </div>
        )}
      </div>

      {/* CREATE LICENSE MODAL */}
      {showCreateLicenseModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaRocket className="text-[#00FF9C]" /> Neue Lizenz erstellen
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">📦 Produkt *</label>
                <select
                  value={createForm.product_id}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, product_id: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="">-- Wähle Produkt --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">👤 Kunde *</label>
                <select
                  value={createForm.customer_id}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, customer_id: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="">-- Wähle Kunde --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">🎯 Lizenz Typ</label>
                <select
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, type: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="single">👤 Single User</option>
                  <option value="floating">🔄 Floating</option>
                  <option value="concurrent">⚡ Concurrent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">📊 Max Aktivierungen</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={createForm.max_activations}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      max_activations: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">📅 Ablaufdatum (optional)</label>
                <input
                  type="date"
                  value={createForm.expires_at}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, expires_at: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCreateLicense}
                disabled={creatingLicense}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] font-bold rounded hover:shadow-lg hover:shadow-green-500/50 transition disabled:opacity-50"
              >
                {creatingLicense ? "⏳ Wird erstellt..." : "✅ Erstellen"}
              </button>
              <button
                onClick={() => setShowCreateLicenseModal(false)}
                disabled={creatingLicense}
                className="flex-1 px-4 py-3 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition disabled:opacity-50"
              >
                ❌ Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedLicense && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaEdit className="text-blue-400" /> Lizenz bearbeiten
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-[#a0a0a8] mb-2">📝 License Key</p>
                <input
                  type="text"
                  value={selectedLicense.license_key}
                  disabled
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] text-[#a0a0a8] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">🔄 Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="active">✅ Active</option>
                  <option value="inactive">⏸️ Inactive</option>
                  <option value="expired">❌ Expired</option>
                  <option value="revoked">🚫 Revoked</option>
                </select>
              </div>

              <div className="bg-blue-600/20 border border-blue-600 rounded p-3">
                <p className="text-xs text-blue-300">
                  <strong>Info:</strong> Andere Felder können hier nicht bearbeitet werden
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleEditLicense}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] font-bold rounded hover:shadow-lg hover:shadow-green-500/50 transition"
              >
                ✅ Speichern
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-3 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition"
              >
                ❌ Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK GENERATE MODAL */}
      {showBulkGenerateModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3a3a44] rounded-xl p-8 w-full max-w-md max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaRocket className="text-purple-400" /> Bulk Key Generator
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">📊 Anzahl Keys</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                />
                <p className="text-xs text-[#a0a0a8] mt-1">Max 100 Keys gleichzeitig</p>
              </div>

              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">📦 Produkt *</label>
                <select
                  value={bulkProduct}
                  onChange={(e) => setBulkProduct(e.target.value)}
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="">-- Wähle Produkt --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">👤 Kunde *</label>
                <select
                  value={bulkCustomer}
                  onChange={(e) => setBulkCustomer(e.target.value)}
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="">-- Wähle Kunde --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">🔄 Status</label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="active">✅ Active</option>
                  <option value="inactive">⏸️ Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">🎯 Lizenz Typ</label>
                <select
                  value={bulkType}
                  onChange={(e) => setBulkType(e.target.value)}
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="single">👤 Single User</option>
                  <option value="floating">🔄 Floating</option>
                  <option value="concurrent">⚡ Concurrent</option>
                </select>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-600 rounded p-4 mb-6">
              <p className="text-sm text-purple-300 font-bold">
                ✨ Preview: {bulkCount} Keys werden als {bulkType} erstellt
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBulkGenerate}
                disabled={bulkGenerating || !bulkProduct || !bulkCustomer}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded hover:shadow-lg hover:shadow-purple-600/50 transition disabled:opacity-50"
              >
                {bulkGenerating ? "⏳ Generiere..." : "🔑 Generieren"}
              </button>
              <button
                onClick={() => setShowBulkGenerateModal(false)}
                disabled={bulkGenerating}
                className="flex-1 px-4 py-3 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition disabled:opacity-50"
              >
                ❌ Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}