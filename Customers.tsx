// src/pages/Customers.tsx - KORRIGIERT
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FaUsers, FaPlus, FaSearch, FaDownload, FaTrash } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import { useDialog } from "../components/Dialog";
import { useAdvancedFilter, usePagination, exportToCSV } from "../utils/helpers.tsx";

type Customer = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export default function Customers() {
  const { Dialog: DialogComponent, open: openDialog } = useDialog();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({ total: 0 });

  // Filter & Search
  const { filters, setFilters, filtered } = useAdvancedFilter(customers);
  const pagination = usePagination(filtered, 10);

  // Load Data
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

  async function loadData(orgId: string) {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("customers")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (data) {
        setCustomers(data);
        setStats({ total: data.length });
      }
    } catch (err) {
      console.error("Error loading customers:", err);
    }
    setLoading(false);
  }

  async function handleAddCustomer() {
    if (!newCustomer.name || !newCustomer.email) {
      openDialog({
        type: "warning",
        title: "⚠️ Felder erforderlich",
        message: "Bitte fülle Name und Email aus",
        closeButton: "OK",
      });
      return;
    }

    const { error } = await supabase
      .from("customers")
      .insert({ ...newCustomer, organization_id: organizationId });

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
        title: "✅ Kunde hinzugefügt",
        message: `${newCustomer.name} wurde erfolgreich erstellt`,
        closeButton: "OK",
      });
      setNewCustomer({ name: "", email: "" });
      setShowAddModal(false);
      if (organizationId) loadData(organizationId);
    }
  }

  async function handleDeleteCustomer(customerId: string) {
    const confirmed = window.confirm("❌ Möchtest du diesen Kunden wirklich löschen?");
    if (!confirmed) return;

    const { error } = await supabase.from("customers").delete().eq("id", customerId);

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
        message: "Kunde wurde entfernt",
        closeButton: "OK",
      });
      if (organizationId) loadData(organizationId);
    }
  }

  if (loading) {
    return (
      <div className="flex w-full min-h-screen bg-[#0F0F14]">
        <Sidebar />
        <main className="ml-64 flex-1 bg-[#0F0F14] text-[#E0E0E0] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="loader mb-4"></div>
            <p>Lädt Kunden...</p>
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

        <main className="ml-64 flex-1 bg-[#0F0F14] text-[#E0E0E0]">
          {/* HEADER */}
          <div className="border-b border-[#2a2a34] p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-extrabold flex items-center gap-2">
                  <FaUsers className="text-[#00FF9C]" />
                  Kunden
                </h1>
                <p className="text-[#a0a0a8] mt-2">Verwalte alle deine Kunden</p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-3 bg-[#00FF9C] text-[#0E0E12] rounded-lg font-bold hover:bg-[#00cc80] transition flex items-center gap-2"
              >
                <FaPlus /> Neuer Kunde
              </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 gap-4 mt-6">
              <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-4">
                <p className="text-[#a0a0a8] text-sm">Gesamt Kunden</p>
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
                    placeholder="Kunde Name, Email..."
                    value={filters.searchQuery || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, searchQuery: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters({})}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition text-sm font-bold"
                >
                  Clear
                </button>
              )}

              {/* Export Button */}
              <button
                onClick={() => exportToCSV(filtered, "customers_export.csv")}
                disabled={filtered.length === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-bold disabled:opacity-50 flex items-center gap-2 transition"
              >
                <FaDownload /> Export
              </button>
            </div>

            <div className="text-sm text-[#a0a0a8] mt-4">
              Zeige {pagination.currentItems.length} von {filtered.length} Kunden
            </div>
          </div>

          {/* CUSTOMER LIST */}
          <div className="p-8">
            {pagination.currentItems.length === 0 ? (
              <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-8 text-center text-[#a0a0a8]">
                <p className="text-lg font-semibold mb-2">Keine Kunden gefunden</p>
                <p className="text-sm">Erstelle deinen ersten Kunden um zu beginnen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pagination.currentItems.map((customer) => (
                  <div
                    key={customer.id}
                    className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-4 hover:bg-[#2a2a34] transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{customer.name}</p>
                        <p className="text-sm text-[#a0a0a8]">{customer.email}</p>
                        <p className="text-xs text-[#a0a0a8] mt-1">
                          Erstellt: {new Date(customer.created_at).toLocaleDateString("de-DE")}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(customer.email);
                            alert("✅ Email kopiert!");
                          }}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-bold transition"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-bold flex items-center gap-2 transition"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
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
                  className="px-4 py-2 bg-[#2a2a34] rounded disabled:opacity-50 flex items-center gap-2 hover:bg-[#3a3a44] transition"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => pagination.goToPage(page)}
                        className={`w-10 h-10 rounded font-bold transition ${
                          page === pagination.currentPage
                            ? "bg-[#00FF9C] text-black"
                            : "bg-[#2a2a34] hover:bg-[#3a3a44]"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
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

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">➕ Neuer Kunde</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">Name</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  placeholder="z.B. John Doe"
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm text-[#a0a0a8] mb-2">Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                  placeholder="john@example.com"
                  className="w-full p-3 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAddCustomer}
                className="flex-1 px-4 py-3 bg-[#00FF9C] text-[#0E0E12] font-bold rounded hover:bg-[#00cc80] transition"
              >
                ✅ Erstellen
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition"
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
