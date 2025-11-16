// src/pages/Activations.tsx - ADMIN DASHBOARD FÜR AKTIVIERUNGEN
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  FaCheck,
  FaXmark,
  FaSearch,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaDownload,
  FaClock,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import { useDialog } from "../components/Dialog";
import { usePagination, exportToCSV } from "../lib/helpers.tsx";

type Activation = {
  id: string;
  email: string;
  license_key: string;
  program_name: string;
  status: "active" | "inactive";
  activated_at: string;
  last_login?: string;
  created_at: string;
};

type Stats = {
  total: number;
  active: number;
  inactive: number;
  todayActivations: number;
};

export default function Activations() {
  const { Dialog: DialogComponent, open: openDialog } = useDialog();
  const [activations, setActivations] = useState<Activation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inactive: 0,
    todayActivations: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");

  // Pagination
  const filtered = activations.filter((a) => {
    const matchesSearch =
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.program_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.license_key.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pagination = usePagination(filtered, 15);

  // Load Activations
  useEffect(() => {
    loadActivations();
  }, []);

  async function loadActivations() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("activations")
        .select("*")
        .order("activated_at", { ascending: false });

      if (data) {
        setActivations(data);
        calculateStats(data);
      }
    } catch (err) {
      console.error("Error loading activations:", err);
    }
    setLoading(false);
  }

  function calculateStats(activations: Activation[]) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let active = 0;
    let inactive = 0;
    let todayActivations = 0;

    activations.forEach((a) => {
      if (a.status === "active") active++;
      if (a.status === "inactive") inactive++;

      const activationDate = new Date(a.activated_at);
      const activationDateOnly = new Date(
        activationDate.getFullYear(),
        activationDate.getMonth(),
        activationDate.getDate()
      );

      if (activationDateOnly.getTime() === today.getTime()) {
        todayActivations++;
      }
    });

    setStats({
      total: activations.length,
      active,
      inactive,
      todayActivations,
    });
  }

  // Deactivate
  async function handleDeactivate(id: string) {
    if (!confirm("❌ Diesen Key wirklich deaktivieren?")) return;

    const { error } = await supabase
      .from("activations")
      .update({ status: "inactive" })
      .eq("id", id);

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
        title: "✅ Deaktiviert",
        message: "Key wurde deaktiviert",
        closeButton: "OK",
      });
      await loadActivations();
    }
  }

  // Reactivate
  async function handleReactivate(id: string) {
    const { error } = await supabase
      .from("activations")
      .update({ status: "active" })
      .eq("id", id);

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
        title: "✅ Aktiviert",
        message: "Key wurde reaktiviert",
        closeButton: "OK",
      });
      await loadActivations();
    }
  }

  // Delete
  async function handleDelete(id: string) {
    if (!confirm("🗑️ Diesen Eintrag wirklich löschen?")) return;

    const { error } = await supabase.from("activations").delete().eq("id", id);

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
        message: "Eintrag wurde entfernt",
        closeButton: "OK",
      });
      await loadActivations();
    }
  }

  if (loading) {
    return (
      <div className="flex w-full min-h-screen bg-[#0F0F14]">
        <Sidebar />
        <main className="ml-64 flex-1 bg-[#0F0F14] text-[#E0E0E0] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-2xl">⏳</div>
            <p>Lädt Aktivierungen...</p>
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
            <h1 className="text-4xl font-extrabold flex items-center gap-2 mb-2">
              <FaCheck className="text-[#00FF9C]" />
              Aktivierungen
            </h1>
            <p className="text-[#a0a0a8]">
              Überwache alle aktivierten externe Programme
            </p>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-4">
                <p className="text-[#a0a0a8] text-sm">Gesamt</p>
                <p className="text-3xl font-bold text-[#00FF9C]">{stats.total}</p>
              </div>

              <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-4">
                <p className="text-[#a0a0a8] text-sm">🟢 Aktiv</p>
                <p className="text-3xl font-bold text-green-400">{stats.active}</p>
              </div>

              <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-4">
                <p className="text-[#a0a0a8] text-sm">🔴 Inaktiv</p>
                <p className="text-3xl font-bold text-red-400">{stats.inactive}</p>
              </div>

              <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-4">
                <p className="text-[#a0a0a8] text-sm">📅 Heute</p>
                <p className="text-3xl font-bold text-blue-400">
                  {stats.todayActivations}
                </p>
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
                    placeholder="Email, Programm, Key..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="min-w-48">
                <label className="block text-sm text-[#a0a0a8] mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as "" | "active" | "inactive")
                  }
                  className="w-full p-2 rounded bg-[#2a2a34] border border-[#3a3a44] focus:border-[#00FF9C] outline-none transition text-sm"
                >
                  <option value="">Alle Status</option>
                  <option value="active">🟢 Aktiv</option>
                  <option value="inactive">🔴 Inaktiv</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(searchQuery || statusFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("");
                  }}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition text-sm font-bold"
                >
                  ✖️ Clear
                </button>
              )}

              {/* Export Button */}
              <button
                onClick={() => exportToCSV(filtered, "activations_export.csv")}
                disabled={filtered.length === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-bold disabled:opacity-50 flex items-center gap-2 transition"
              >
                <FaDownload /> Export
              </button>
            </div>

            <div className="text-sm text-[#a0a0a8] mt-4">
              Zeige {pagination.currentItems.length} von {filtered.length}{" "}
              Aktivierungen
            </div>
          </div>

          {/* ACTIVATIONS LIST */}
          <div className="p-8">
            {pagination.currentItems.length === 0 ? (
              <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-8 text-center text-[#a0a0a8]">
                <p className="text-lg font-semibold mb-2">
                  Keine Aktivierungen gefunden
                </p>
                <p className="text-sm">
                  Externe Programme werden hier angezeigt, sobald sie sich aktivieren
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pagination.currentItems.map((activation) => (
                  <div
                    key={activation.id}
                    className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-4 hover:bg-[#2a2a34] transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Status Badge */}
                      <div className="pt-1">
                        {activation.status === "active" ? (
                          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        )}
                      </div>

                      {/* Linke Seite - Info */}
                      <div className="flex-1">
                        <p className="font-bold text-lg mb-1">
                          {activation.program_name}
                        </p>
                        <div className="text-xs text-[#a0a0a8] space-y-1">
                          <p>
                            <strong>Email:</strong> {activation.email}
                          </p>
                          <p>
                            <strong>License Key:</strong>{" "}
                            <code className="bg-[#0F0F14] px-1 rounded font-mono text-[#00FF9C]">
                              {activation.license_key}
                            </code>
                          </p>
                          <p>
                            <strong>Aktiviert:</strong>{" "}
                            {new Date(activation.activated_at).toLocaleString("de-DE")}
                          </p>
                          {activation.last_login && (
                            <p>
                              <strong>Letzter Login:</strong>{" "}
                              {new Date(activation.last_login).toLocaleString("de-DE")}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            activation.status === "active"
                              ? "bg-green-600/20 text-green-400"
                              : "bg-red-600/20 text-red-400"
                          }`}
                        >
                          {activation.status === "active" ? "🟢 Active" : "🔴 Inactive"}
                        </span>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2">
                        {activation.status === "active" ? (
                          <button
                            onClick={() => handleDeactivate(activation.id)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-bold flex items-center gap-2 transition"
                            title="Deactivate"
                          >
                            <FaToggleOff /> Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(activation.id)}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-bold flex items-center gap-2 transition"
                            title="Reactivate"
                          >
                            <FaToggleOn /> Reactivate
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(activation.id)}
                          className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm font-bold flex items-center gap-2 transition"
                          title="Delete"
                        >
                          <FaTrash />
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
                  ← Previous
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
                  Next →
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
