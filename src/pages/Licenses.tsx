// src/pages/Licenses.tsx - PROFESSIONELL mit Kunden-Dropdown & Auto Key Generator
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FaKey, FaPlus, FaSearch, FaDownload, FaTrash, FaSync, FaCopy } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import { useDialog } from "../components/Dialog";
import { useAdvancedFilter, usePagination, exportToCSV } from "../lib/helpers.tsx";

type License = {
  id: string;
  license_key?: string;
  key_code?: string;
  status: string;
  type: string;
  expires_at?: string;
  max_activations?: number;
  organization_id: string;
  created_at: string;
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

export default function Licenses() {
  const { Dialog: DialogComponent, open: openDialog } = useDialog();
  
  const [licenses, setLicenses] = useState<License[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // Form für neue Lizenz
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLicense, setNewLicense] = useState({
    customerId: "",
    productId: "",
    type: "Trial",
    status: "active",
    expiresAt: "",
    maxActivations: 1,
  });
  const [generatedKey, setGeneratedKey] = useState("");
  const [stats, setStats] = useState({ total: 0 });

  // Filter & Search
  const { filters, setFilters, filtered } = useAdvancedFilter(
    licenses,
    (item: License, query: string) => {
      const key = item.license_key || item.key_code || "";
      const status = item.status || "";
      const type = item.type || "";
      return (
        key.toLowerCase().includes(query.toLowerCase()) ||
        status.toLowerCase().includes(query.toLowerCase()) ||
        type.toLowerCase().includes(query.toLowerCase())
      );
    }
  );
  const pagination = usePagination(filtered, 10);

  // Load Initial Data
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
      await loadAllData(orgId);
    }
    init();
  }, []);

  async function loadAllData(orgId: string) {
    setLoading(true);
    try {
      console.log("📦 Loading licenses data...");

      // Lade Lizenzen
      const { data: licensesData } = await supabase
        .from("licenses")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      console.log("✅ Got licenses:", licensesData?.length);
      setLicenses(licensesData || []);
      setStats({ total: licensesData?.length || 0 });

      // Lade Kunden
      const { data: customersData } = await supabase
        .from("customers")
        .select("id, name, email")
        .eq("organization_id", orgId)
        .order("name");

      console.log("✅ Got customers:", customersData?.length);
      setCustomers(customersData || []);

      // Lade Produkte
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name")
        .eq("organization_id", orgId)
        .order("name");

      console.log("✅ Got products:", productsData?.length);
      setProducts(productsData || []);
    } catch (err) {
      console.error("❌ Error loading data:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Daten konnten nicht geladen werden",
        closeButton: "OK",
      });
    }
    setLoading(false);
  }

  // 🔑 Generate License Key
  function generateLicenseKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
      if ((i + 1) % 4 === 0 && i < 31) key += "-";
    }
    return key;
  }

  // Generate & Preview Key
  function handleGenerateKey() {
    const key = generateLicenseKey();
    setGeneratedKey(key);
    console.log("🔑 Generated key:", key);
  }

  // Copy Generated Key
  function copyToClipboard() {
    navigator.clipboard.writeText(generatedKey);
    openDialog({
      type: "success",
      title: "✅ Kopiert",
      message: "Lizenz Key wurde in die Zwischenablage kopiert",
      closeButton: "OK",
    });
  }

  // Create License
  async function handleAddLicense() {
    // Validierung
    if (!newLicense.customerId) {
      openDialog({
        type: "warning",
        title: "⚠️ Kunde erforderlich",
        message: "Bitte wähle einen Kunden aus",
        closeButton: "OK",
      });
      return;
    }

    if (!newLicense.productId) {
      openDialog({
        type: "warning",
        title: "⚠️ Produkt erforderlich",
        message: "Bitte wähle ein Produkt aus",
        closeButton: "OK",
      });
      return;
    }

    if (!generatedKey) {
      openDialog({
        type: "warning",
        title: "⚠️ Lizenz Key erforderlich",
        message: "Bitte generiere einen Lizenz Key",
        closeButton: "OK",
      });
      return;
    }

    const insertData: any = {
      license_key: generatedKey,
      status: newLicense.status,
      type: newLicense.type,
      organization_id: organizationId,
      product_id: newLicense.productId,
    };

    if (newLicense.expiresAt) {
      insertData.expires_at = newLicense.expiresAt;
    }

    if (newLicense.type === "Floating") {
      insertData.max_activations = newLicense.maxActivations;
    }

    console.log("💾 Inserting license...", insertData);

    const { error } = await supabase.from("licenses").insert(insertData);

    if (error) {
      console.error("❌ Insert Error:", error);
      openDialog({
        type: "error",
        title: "❌ Fehler beim Erstellen",
        message: error.message,
        closeButton: "OK",
      });
      return;
    }

    openDialog({
      type: "success",
      title: "✅ Lizenz erstellt",
      message: `Neue Lizenz wurde erfolgreich erstellt`,
      closeButton: "OK",
    });

    // Reset Form
    setNewLicense({
      customerId: "",
      productId: "",
      type: "Trial",
      status: "active",
      expiresAt: "",
      maxActivations: 1,
    });
    setGeneratedKey("");
    setShowAddModal(false);

    if (organizationId) {
      await loadAllData(organizationId);
    }
  }

  // Delete License
  async function handleDeleteLicense(licenseId: string) {
    const confirmed = window.confirm("❌ Möchtest du diese Lizenz wirklich löschen?");
    if (!confirmed) return;

    const { error } = await supabase.from("licenses").delete().eq("id", licenseId);

    if (error) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: error.message,
        closeButton: "OK",
      });
      return;
    }

    openDialog({
      type: "success",
      title: "✅ Gelöscht",
      message: "Lizenz wurde entfernt",
      closeButton: "OK",
    });

    if (organizationId) {
      await loadAllData(organizationId);
    }
  }

  // Get Customer Name by ID
  function getCustomerName(customerId: string): string {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unbekannter Kunde";
  }

  // Get Product Name by ID
  function getProductName(productId: string): string {
    const product = products.find(p => p.id === productId);
    return product?.name || "Unbekanntes Produkt";
  }

  if (loading) {
    return (
      <div className="flex w-full h-screen bg-[#0F0F14]">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00FF9C] mx-auto mb-4"></div>
            <p className="text-[#a0a0a8]">Lädt Lizenzen...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="flex w-full min-h-screen bg-[#0F0F14]">
        <Sidebar />

        <main className="ml-64 flex-1">
          {/* HEADER */}
          <div className="border-b border-[#2a2a34] bg-gradient-to-r from-[#1a1a24]/50 to-[#2a2a34]/30 backdrop-blur-sm p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-[#00FF9C] flex items-center gap-3">
                  <div className="p-3 bg-[#00FF9C]/20 rounded-lg">
                    <FaKey className="text-2xl" />
                  </div>
                  Lizenzen
                </h1>
                <p className="text-[#a0a0a8] mt-2">
                  Verwalte alle deine Lizenz Keys
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-3 bg-[#00FF9C] hover:bg-[#00E88A] text-[#0F0F14] rounded-lg font-bold transition flex items-center gap-2"
              >
                <FaPlus /> Neue Lizenz
              </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-4 hover:border-[#00FF9C]/50 transition">
                <p className="text-[#a0a0a8] text-sm mb-2">Gesamt Lizenzen</p>
                <p className="text-3xl font-bold text-[#00FF9C]">{stats.total}</p>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER */}
          <div className="border-b border-[#2a2a34] p-8">
            <div className="flex gap-4 flex-wrap items-end">
              {/* Search Input */}
              <div className="flex-1 min-w-64">
                <label className="block text-sm text-[#a0a0a8] mb-2">Suche</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-[#a0a0a8]" />
                  <input
                    type="text"
                    placeholder="Lizenz Key, Status, Typ..."
                    value={filters.searchQuery || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, searchQuery: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 rounded bg-[#1a1a24] border border-[#2a2a34] focus:border-[#00FF9C] focus:outline-none transition text-white"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters({})}
                  className="px-4 py-2 bg-[#2a2a34] hover:bg-[#3a3a44] rounded transition text-sm font-bold text-white"
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

            <div className="text-sm text-[#a0a0a8] mt-4">
              Zeige {pagination.currentItems.length} von {filtered.length} Lizenzen
            </div>
          </div>

          {/* LICENSE LIST */}
          <div className="p-8">
            {pagination.currentItems.length === 0 ? (
              <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-8 text-center text-[#a0a0a8]">
                <FaKey className="text-6xl mb-4 mx-auto opacity-30" />
                <p className="text-lg font-semibold mb-2">Keine Lizenzen gefunden</p>
                <p className="text-sm">Erstelle deine erste Lizenz um zu beginnen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pagination.currentItems.map((license) => {
                  const licenseKey = license.license_key || license.key_code || "N/A";
                  return (
                    <div
                      key={license.id}
                      className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-4 hover:border-[#00FF9C]/30 transition"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        {/* Left: License Info */}
                        <div className="flex-1 min-w-96">
                          <p className="font-mono font-semibold text-[#00FF9C] mb-1">
                            {licenseKey}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-[#a0a0a8]">Status</p>
                              <p className="font-semibold text-white capitalize">{license.status}</p>
                            </div>
                            <div>
                              <p className="text-[#a0a0a8]">Typ</p>
                              <p className="font-semibold text-white">{license.type}</p>
                            </div>
                            {license.expires_at && (
                              <div>
                                <p className="text-[#a0a0a8]">Ablauf</p>
                                <p className="font-semibold text-white">
                                  {new Date(license.expires_at).toLocaleDateString("de-DE")}
                                </p>
                              </div>
                            )}
                            {license.max_activations && (
                              <div>
                                <p className="text-[#a0a0a8]">Max. Aktivierungen</p>
                                <p className="font-semibold text-white">{license.max_activations}</p>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-[#a0a0a8] mt-2">
                            Erstellt: {new Date(license.created_at).toLocaleDateString("de-DE")}
                          </p>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(licenseKey);
                              alert("✅ Key kopiert!");
                            }}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-bold transition flex items-center gap-2"
                            title="In Zwischenablage kopieren"
                          >
                            <FaCopy /> Copy
                          </button>
                          <button
                            onClick={() => handleDeleteLicense(license.id)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-bold flex items-center gap-2 transition"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PAGINATION */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={pagination.prevPage}
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 bg-[#2a2a34] rounded disabled:opacity-50 flex items-center gap-2 hover:bg-[#3a3a44] transition"
                >
                  Previous
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
                            ? "bg-[#00FF9C] text-[#0F0F14]"
                            : "bg-[#2a2a34] hover:bg-[#3a3a44]"
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
                  className="px-4 py-2 bg-[#2a2a34] rounded disabled:opacity-50 flex items-center gap-2 hover:bg-[#3a3a44] transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ADD LICENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <FaPlus /> Neue Lizenz erstellen
            </h2>

            <div className="space-y-4 mb-6">
              {/* Kunden Dropdown */}
              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">
                  👤 Kunde *
                </label>
                <select
                  value={newLicense.customerId}
                  onChange={(e) =>
                    setNewLicense({ ...newLicense, customerId: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#0F0F14] border border-[#2a2a34] focus:border-[#00FF9C] outline-none transition text-white"
                >
                  <option value="">-- Kunde auswählen --</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    ⚠️ Keine Kunden vorhanden. Bitte erstelle zuerst Kunden.
                  </p>
                )}
              </div>

              {/* Produkt Dropdown */}
              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">
                  📦 Produkt *
                </label>
                <select
                  value={newLicense.productId}
                  onChange={(e) =>
                    setNewLicense({ ...newLicense, productId: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#0F0F14] border border-[#2a2a34] focus:border-[#00FF9C] outline-none transition text-white"
                >
                  <option value="">-- Produkt auswählen --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {products.length === 0 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    ⚠️ Keine Produkte vorhanden. Bitte erstelle zuerst Produkte.
                  </p>
                )}
              </div>

              {/* License Key Generator */}
              <div className="bg-[#0F0F14] rounded-lg p-4 border border-[#2a2a34]">
                <label className="block text-sm text-[#a0a0a8] mb-2">
                  🔑 Lizenz Key Generator
                </label>

                {generatedKey ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedKey}
                        readOnly
                        className="flex-1 p-3 rounded bg-[#1a1a24] border border-[#3a3a44] text-[#00FF9C] font-mono font-bold focus:border-[#00FF9C] outline-none"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold transition flex items-center gap-2"
                      >
                        <FaCopy /> Copy
                      </button>
                    </div>
                    <button
                      onClick={handleGenerateKey}
                      className="w-full px-4 py-2 bg-[#00FF9C] text-[#0F0F14] rounded font-bold hover:bg-[#00E88A] transition flex items-center justify-center gap-2"
                    >
                      <FaSync /> Neuer Key
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateKey}
                    className="w-full px-4 py-3 bg-[#00FF9C] text-[#0F0F14] rounded font-bold hover:bg-[#00E88A] transition flex items-center justify-center gap-2"
                  >
                    <FaSync /> Key generieren
                  </button>
                )}
              </div>

              {/* License Typ */}
              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">
                  📋 Lizenz Typ
                </label>
                <select
                  value={newLicense.type}
                  onChange={(e) =>
                    setNewLicense({ ...newLicense, type: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#0F0F14] border border-[#2a2a34] focus:border-[#00FF9C] outline-none transition text-white"
                >
                  <option value="Trial">Trial</option>
                  <option value="Subscription">Subscription</option>
                  <option value="Lifetime">Lifetime</option>
                  <option value="Floating">Floating</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">
                  ✅ Status
                </label>
                <select
                  value={newLicense.status}
                  onChange={(e) =>
                    setNewLicense({ ...newLicense, status: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#0F0F14] border border-[#2a2a34] focus:border-[#00FF9C] outline-none transition text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>

              {/* Ablaufdatum */}
              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">
                  📅 Ablaufdatum (optional)
                </label>
                <input
                  type="date"
                  value={newLicense.expiresAt}
                  onChange={(e) =>
                    setNewLicense({ ...newLicense, expiresAt: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#0F0F14] border border-[#2a2a34] focus:border-[#00FF9C] outline-none transition text-white"
                />
              </div>

              {/* Max Aktivierungen (für Floating Type) */}
              {newLicense.type === "Floating" && (
                <div>
                  <label className="block text-sm text-[#a0a0a8] mb-2">
                    🔢 Max. Aktivierungen
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newLicense.maxActivations}
                    onChange={(e) =>
                      setNewLicense({
                        ...newLicense,
                        maxActivations: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-3 rounded bg-[#0F0F14] border border-[#2a2a34] focus:border-[#00FF9C] outline-none transition text-white"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddLicense}
                className="flex-1 px-4 py-3 bg-[#00FF9C] hover:bg-[#00E88A] text-[#0F0F14] font-bold rounded transition"
              >
                ✅ Erstellen
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setGeneratedKey("");
                  setNewLicense({
                    customerId: "",
                    productId: "",
                    type: "Trial",
                    status: "active",
                    expiresAt: "",
                    maxActivations: 1,
                  });
                }}
                className="flex-1 px-4 py-3 bg-[#2a2a34] hover:bg-[#3a3a44] text-white font-bold rounded transition"
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