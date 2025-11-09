// src/pages/Dashboard.tsx - KOMPLETT ÜBERARBEITETE VERSION V2 MIT BULK OPERATIONS + HOME BUTTON
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
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import { useDialog } from "../components/Dialog";
import {
  useAdvancedFilter,
  usePagination,
  exportToCSV,
} from "../utils/helpers.tsx";

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

type Customer = {
  id: string;
  name: string;
  email: string;
};

type Product = {
  id: string;
  name: string;
};

type Stats = {
  total: number;
  active: number;
  expiring: number;
  expired: number;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  // State
  const [licenses, setLicenses] = useState<License[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
  });

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


  // ✅ Create Single License Modal State
  const [showCreateLicenseModal, setShowCreateLicenseModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    product_id: "",
    customer_id: "",
    type: "single",
    max_activations: 1,
    expires_at: "",
  });
  const [creatingLicense, setCreatingLicense] = useState(false);

  // ===== LOAD DATA =====
  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;

      if (!orgId) {
        openDialog({
          type: "error",
          title: "❌ Organisation fehlt",
          message: "Bitte melde dich ab und neu an",
          closeButton: "OK",
        });
        return;
      }

      setOrganizationId(orgId);
      await loadData(orgId);
    }
    init();
  }, []);


  // ✅ Create Single License Handler
  async function handleCreateLicense() {
    if (!createForm.product_id || !createForm.customer_id) {
      openDialog({
        type: "warning",
        title: "⚠️ Felder erforderlich",
        message: "Bitte wähle Produkt und Kunde",
        closeButton: "OK",
      });
      return;
    }

    setCreatingLicense(true);
    try {
      console.log("🔑 Creating single license...");
      
      // Generate random license key
      const licenseKey = `LIC-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

      const { error } = await supabase
        .from("licenses")
        .insert({
          license_key: licenseKey,
          product_id: createForm.product_id,
          customer_id: createForm.customer_id,
          organization_id: organizationId,
          status: "active",
          type: createForm.type,
          max_activations: createForm.max_activations,
          current_activations: 0,
          expires_at: createForm.expires_at || null,
        });

      if (error) {
        console.error("❌ Error:", error);
        throw error;
      }

      console.log("✅ License created");

      openDialog({
        type: "success",
        title: "✅ Lizenz erstellt!",
        message: `Lizenzschlüssel: ${licenseKey}`,
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
      console.error("❌ Error creating license:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message || "Lizenz konnte nicht erstellt werden",
        closeButton: "OK",
      });
    } finally {
      setCreatingLicense(false);
    }
  }


  async function loadData(orgId: string) {
    setLoading(true);
    try {
      const { data: licensesData } = await supabase
        .from("licenses")
        .select(
          `
          *,
          products(name),
          customers(name, email)
        `
        )
        .eq("organization_id", orgId);

      if (licensesData) {
        const formattedLicenses = licensesData.map((l: any) => ({
          id: l.id,
          license_key: l.license_key,
          status: l.status,
          type: l.type || "single",
          expires_at: l.expires_at,
          max_activations: l.max_activations || 1,
          current_activations: l.current_activations || 0,
          product_name: l.products?.name || "Unknown",
          customer_name: l.customers?.name || "Unknown",
          customer_email: l.customers?.email || "unknown@example.com",
          created_at: l.created_at,
          product_id: l.product_id,
          customer_id: l.customer_id,
        }));
        setLicenses(formattedLicenses);
        calculateStats(formattedLicenses);
      }

      const { data: customersData } = await supabase
        .from("customers")
        .select("id, name, email")
        .eq("organization_id", orgId);
      if (customersData) setCustomers(customersData);

      const { data: productsData } = await supabase
        .from("products")
        .select("id, name")
        .eq("organization_id", orgId);
      if (productsData) setProducts(productsData);
    } catch (err) {
      console.error("Error loading data:", err);
    }
    setLoading(false);
  }

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
          const daysUntil = Math.ceil(
            (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntil <= 30 && daysUntil > 0) expiring++;
        }
      }
      if (l.status === "expired") expired++;
    });

    setStats({
      total: licenses.length,
      active,
      expiring,
      expired,
    });
  }

  // Copy to Clipboard
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

  // Edit License
  async function handleEditLicense() {
    if (!selectedLicense) return;

    const { error } = await supabase
      .from("licenses")
      .update({ status: editStatus })
      .eq("id", selectedLicense.id);

    if (error) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: error.message,
        closeButton: "OK",
      });
    } else {
      openDialog({
        type: "success",
        title: "✅ Aktualisiert",
        message: "License wurde aktualisiert",
        closeButton: "OK",
      });
      setShowEditModal(false);
      if (organizationId) await loadData(organizationId);
    }
  }

  // Delete License
  async function handleDeleteLicense(licenseId: string) {
    const confirmed = window.confirm(
      "⚠️ Möchtest du diese License wirklich löschen? Das kann nicht rückgängig gemacht werden!"
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("licenses")
      .delete()
      .eq("id", licenseId);

    if (error) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: error.message,
        closeButton: "OK",
      });
    } else {
      openDialog({
        type: "success",
        title: "✅ Gelöscht",
        message: "License wurde gelöscht",
        closeButton: "OK",
      });
      if (organizationId) await loadData(organizationId);
    }
  }

  // Bulk Generate Licenses
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
          current_activations: 0,
        });
      }

      const { error } = await supabase
        .from("licenses")
        .insert(newLicenses);

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

  // Bulk Delete
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

  // Toggle License Selection
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

  // Select All on current page
  function toggleSelectAll() {
    const pageIds = new Set(pagination.currentItems.map((l) => l.id));
    if (selectedLicenses.size === pageIds.size) {
      setSelectedLicenses(new Set());
      setShowBulkActionsBar(false);
    } else {
      setSelectedLicenses(pageIds);
      setShowBulkActionsBar(true);
    }
  }

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
          <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-lg text-xs font-bold flex items-center gap-1">
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
          <span className="px-3 py-1 bg-gray-600/20 text-gray-400 rounded-lg text-xs font-bold">
            Revoked
          </span>
        );
      default:
        return status;
    }
  }

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 bg-[#0E0E12] text-[#E0E0E0] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="loader mb-4"></div>
            <p>⏳ Lädt Licenses...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="flex">
        <Sidebar />

        <main className="flex-1 bg-[#0E0E12] text-[#E0E0E0]">
          {/* HEADER - WITH HOME BUTTON */}
          <div className="border-b border-[#2C2C34] p-8 sticky top-0 z-40 bg-[#0E0E12]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00FF9C] text-[#0E0E12] rounded-lg font-bold hover:bg-[#00cc80] transition"
                  title="Zurück zur Landing Page"
                >
                  <FaHome /> Home
                </button>
                <div>
                  <h1 className="text-4xl font-extrabold flex items-center gap-2">
                    <FaKey className="text-[#00FF9C]" />
                    Deine Licenses
                  </h1>
                  <p className="text-gray-400 mt-2">
                    Verwalte und überwache alle deine Lizenzschlüssel
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateLicenseModal(true)}
                className="px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold flex items-center gap-2 transition"
              >
                <FaPlus /> Lizenz erstellen
              </button>
              <button
                onClick={() => setShowBulkGenerateModal(true)}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold flex items-center gap-2 transition"
              >
                <FaPlus /> Bulk Generate
              </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4">
                <p className="text-gray-400 text-sm">Gesamt Licenses</p>
                <p className="text-3xl font-bold text-[#00FF9C]">{stats.total}</p>
              </div>
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4">
                <p className="text-gray-400 text-sm">Aktiv</p>
                <p className="text-3xl font-bold text-green-400">{stats.active}</p>
              </div>
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4">
                <p className="text-gray-400 text-sm">Ablaufen bald</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.expiring}</p>
              </div>
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-4">
                <p className="text-gray-400 text-sm">Abgelaufen</p>
                <p className="text-3xl font-bold text-red-400">{stats.expired}</p>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER */}
          <div className="border-b border-[#2C2C34] p-8">
            <div className="flex gap-4 flex-wrap items-end">
              {/* Search Input */}
              <div className="flex-1 min-w-64">
                <label className="block text-sm text-gray-400 mb-2">🔍 Suche</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="License Key, Kunde, Produkt..."
                    value={filters.searchQuery || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, searchQuery: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Status</label>
                <select
                  value={filters.statusFilter || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      statusFilter: e.target.value || undefined,
                    })
                  }
                  className="px-4 py-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
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

              {/* Export */}
              <button
                onClick={() => exportToCSV(filtered, "licenses_export.csv")}
                disabled={filtered.length === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-bold disabled:opacity-50 flex items-center gap-2 transition"
              >
                <FaDownload /> Export
              </button>
            </div>

            <div className="text-sm text-gray-400 mt-4">
              Zeige {pagination.currentItems.length} von {filtered.length} Licenses
              {selectedLicenses.size > 0 && ` | ${selectedLicenses.size} ausgewählt`}
            </div>
          </div>

          {/* BULK ACTIONS BAR */}
          {showBulkActionsBar && (
            <div className="bg-purple-600/20 border-t border-purple-600 border-b p-4 flex items-center justify-between">
              <p className="font-bold text-purple-300">
                ⚡ {selectedLicenses.size} Licenses ausgewählt
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedLicenses(new Set());
                    setShowBulkActionsBar(false);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm font-bold transition"
                >
                  ❌ Abbrechen
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-bold transition"
                >
                  <FaTrash /> Alle löschen
                </button>
              </div>
            </div>
          )}

          {/* LICENSES LIST */}
          <div className="p-8">
            {pagination.currentItems.length === 0 ? (
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 text-center text-gray-400">
                <p className="text-lg font-semibold mb-2">Keine Licenses gefunden</p>
                <p className="text-sm">Erstelle eine neue License um zu beginnen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Select All Checkbox */}
                <div className="flex items-center gap-3 p-3 bg-[#1A1A1F] rounded">
                  <input
                    type="checkbox"
                    checked={selectedLicenses.size === pagination.currentItems.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <p className="text-sm text-gray-400">
                    Alle auf dieser Seite auswählen
                  </p>
                </div>

                {/* License Items */}
                {pagination.currentItems.map((license) => (
                  <div
                    key={license.id}
                    className={`bg-[#1A1A1F] border rounded-lg p-4 hover:bg-[#2C2C34] transition flex items-center justify-between cursor-pointer ${
                      selectedLicenses.has(license.id)
                        ? "border-[#00FF9C]"
                        : "border-[#2C2C34]"
                    }`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedLicenses.has(license.id)}
                      onChange={() => toggleLicenseSelection(license.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 cursor-pointer"
                    />

                    {/* License Info */}
                    <div className="flex-1 ml-4">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="bg-[#2C2C34] px-3 py-1 rounded font-mono text-sm text-[#00FF9C]">
                          {license.license_key}
                        </code>
                        {getStatusBadge(license.status)}
                        <span className="text-xs bg-[#2C2C34] px-2 py-1 rounded text-gray-300">
                          {license.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Produkt:</p>
                          <p className="font-bold">{license.product_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Kunde:</p>
                          <p className="font-bold">{license.customer_name}</p>
                          <p className="text-xs text-gray-500">{license.customer_email}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Aktivierungen:</p>
                          <p className="font-bold">
                            {license.current_activations} / {license.max_activations}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => copyLicenseKey(license.license_key)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-bold flex items-center gap-2 transition"
                      >
                        <FaCopy />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLicense(license);
                          setEditStatus(license.status);
                          setShowEditModal(true);
                        }}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-bold flex items-center gap-2 transition"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLicense(license.id)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-bold flex items-center gap-2 transition"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PAGINATION */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={pagination.prevPage}
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 bg-[#2C2C34] rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-[#3C3C44] transition"
                >
                  <FaChevronLeft /> Previous
                </button>

                <div className="flex gap-1">
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => pagination.goToPage(page)}
                      className={`
                        w-10 h-10 rounded font-bold transition
                        ${
                          page === pagination.currentPage
                            ? "bg-[#00FF9C] text-black"
                            : "bg-[#2C2C34] hover:bg-[#3C3C44]"
                        }
                      `}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={pagination.nextPage}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 bg-[#2C2C34] rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-[#3C3C44] transition"
                >
                  Next <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ✅ CREATE LICENSE MODAL */}
      {showCreateLicenseModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">🔑 Neue Lizenz erstellen</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">📦 Produkt *</label>
                <select
                  value={createForm.product_id}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, product_id: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
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
                <label className="block text-sm text-gray-400 mb-2">👤 Kunde *</label>
                <select
                  value={createForm.customer_id}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, customer_id: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
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
                <label className="block text-sm text-gray-400 mb-2">🎯 Lizenz Typ</label>
                <select
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, type: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="single">👤 Single User (1 Aktivierung)</option>
                  <option value="floating">🔄 Floating (Team)</option>
                  <option value="concurrent">⚡ Concurrent (Mehrere)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">📊 Max Aktivierungen</label>
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
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">📅 Ablaufdatum (optional)</label>
                <input
                  type="date"
                  value={createForm.expires_at}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, expires_at: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCreateLicense}
                disabled={creatingLicense}
                className="flex-1 px-4 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition disabled:opacity-50"
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
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">✏️ License bearbeiten</h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">📝 License Key</p>
                <input
                  type="text"
                  value={selectedLicense.license_key}
                  disabled
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">🔄 Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="active">✅ Active</option>
                  <option value="inactive">⏸️ Inactive</option>
                  <option value="expired">❌ Expired</option>
                  <option value="revoked">🚫 Revoked</option>
                </select>
              </div>

              <div className="bg-blue-600/20 border border-blue-600 rounded p-3">
                <p className="text-xs text-blue-300">
                  <strong>Info:</strong> Produkt, Kunde und andere Felder können nicht
                  hier bearbeitet werden
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleEditLicense}
                className="flex-1 px-4 py-3 bg-[#00FF9C] text-[#0E0E12] font-bold rounded hover:bg-[#00cc80] transition"
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
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">⚡ Bulk Key Generator</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">📊 Anzahl Keys</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-1">Max 100 Keys gleichzeitig</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">📦 Produkt *</label>
                <select
                  value={bulkProduct}
                  onChange={(e) => setBulkProduct(e.target.value)}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
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
                <label className="block text-sm text-gray-400 mb-2">👤 Kunde *</label>
                <select
                  value={bulkCustomer}
                  onChange={(e) => setBulkCustomer(e.target.value)}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
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
                <label className="block text-sm text-gray-400 mb-2">🔄 Status</label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="active">✅ Active</option>
                  <option value="inactive">⏸️ Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">🎯 Lizenz Typ</label>
                <select
                  value={bulkType}
                  onChange={(e) => setBulkType(e.target.value)}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                >
                  <option value="single">👤 Single User - 1 Aktivierung</option>
                  <option value="floating">🔄 Floating - Für Team</option>
                  <option value="concurrent">⚡ Concurrent - Mehrere gleichzeitig</option>
                </select>
              </div>
            </div>

            <div className="bg-green-600/20 border border-green-600 rounded p-3 mb-6">
              <p className="text-xs text-green-300">
                <strong>✨ Preview:</strong> {bulkCount} Keys für {bulkType}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBulkGenerate}
                disabled={bulkGenerating || !bulkProduct || !bulkCustomer}
                className="flex-1 px-4 py-3 bg-purple-600 text-white font-bold rounded hover:bg-purple-700 transition disabled:opacity-50"
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