// src/pages/DeveloperResellers.tsx - DEVELOPER RESELLER MANAGEMENT
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaArrowLeft,
  FaHandshake,
  FaCheck,
  FaTimes,
  FaChartBar,
  FaUsers,
  FaClock,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type ResellerRequest = {
  id: string;
  reseller_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  reseller_name?: string;
  reseller_email?: string;
};

type DeveloperReseller = {
  id: string;
  reseller_id: string;
  organization_id: string;
  reseller_name: string;
  reseller_email: string;
  status: string;
  created_at: string;
  keys_sold?: number;
  revenue?: number;
};

export default function DeveloperResellers() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [requests, setRequests] = useState<ResellerRequest[]>([]);
  const [resellers, setResellers] = useState<DeveloperReseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "stats">(
    "pending"
  );

  useEffect(() => {
    async function init() {
      try {
        const { data, error: authError } = await supabase.auth.getUser();

        if (authError || !data.user) {
          setLoading(false);
          navigate("/dev-login", { replace: true });
          return;
        }

        const orgId = (data.user?.user_metadata as any)?.organization_id;
        const isDev = (data.user?.user_metadata as any)?.is_developer;

        if (!orgId || !isDev) {
          setLoading(false);
          navigate("/dev-login", { replace: true });
          return;
        }

        setOrganizationId(orgId);
        await loadData(orgId);
      } catch (err) {
        setLoading(false);
        console.error("Init error:", err);
      }
    }
    init();
  }, []);

  async function loadData(orgId: string) {
    setLoading(true);
    try {
      // Lade alle Anfragen für diesen Developer
      const { data: reqData } = await supabase
        .from("reseller_requests")
        .select("*")
        .eq("developer_id", orgId)
        .order("created_at", { ascending: false });

      if (reqData) {
        // Enriche mit Reseller Daten
        const enriched = await Promise.all(
          reqData.map(async (req) => {
            const { data: resellerData } = await supabase
              .from("resellers")
              .select("shop_name, owner_email")
              .eq("id", req.reseller_id)
              .single();

            return {
              ...req,
              reseller_name: resellerData?.shop_name || "Unbekannter Shop",
              reseller_email: resellerData?.owner_email || "Unbekannt",
            };
          })
        );
        setRequests(enriched);
      }

      // Lade akzeptierte Reseller
      const { data: resellerData } = await supabase
        .from("developer_resellers")
        .select("*")
        .eq("developer_id", orgId)
        .eq("status", "active");

      if (resellerData) {
        const enrichedResellers = await Promise.all(
          resellerData.map(async (r) => {
            const { data: resData } = await supabase
              .from("resellers")
              .select("shop_name, owner_email")
              .eq("id", r.reseller_id)
              .single();

            return {
              id: r.id,
              reseller_id: r.reseller_id,
              organization_id: r.developer_id,
              reseller_name: resData?.shop_name || "Unbekannter Shop",
              reseller_email: resData?.owner_email || "Unbekannt",
              status: r.status,
              created_at: r.created_at,
              keys_sold: 0, // TODO: Calculate from transactions
              revenue: 0, // TODO: Calculate from transactions
            };
          })
        );
        setResellers(enrichedResellers);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
    setLoading(false);
  }

  async function handleAcceptRequest(requestId: string, resellerId: string) {
    try {
      // 1. Aktualisiere Request Status
      const { error: updateError } = await supabase
        .from("reseller_requests")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // 2. Erstelle developer_resellers Eintrag
      const { error: createError } = await supabase
        .from("developer_resellers")
        .insert({
          developer_id: organizationId,
          reseller_id: resellerId,
          status: "active",
        });

      if (createError) throw createError;

      openDialog({
        type: "success",
        title: "✅ Akzeptiert!",
        message: "Der Reseller wurde akzeptiert und kann nun Keys kaufen",
        closeButton: "OK",
      });

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

  async function handleRejectRequest(requestId: string) {
    if (
      !confirm("⚠️ Anfrage wirklich ablehnen? Dieser Reseller kann keine Keys kaufen.")
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("reseller_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Abgelehnt",
        message: "Die Anfrage wurde abgelehnt",
        closeButton: "OK",
      });

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

  async function handleRemoveReseller(resellerId: string) {
    if (
      !confirm("⚠️ Reseller wirklich entfernen? Er kann keine Keys mehr kaufen.")
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("developer_resellers")
        .update({ status: "inactive" })
        .eq("reseller_id", resellerId)
        .eq("developer_id", organizationId);

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Entfernt",
        message: "Reseller wurde von deiner Liste entfernt",
        closeButton: "OK",
      });

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

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⏳</div>
          <p>Lädt Reseller Management...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        {/* HEADER */}
        <div className="bg-[#1A1A1F] border-b border-[#2C2C34] p-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate("/dev-dashboard")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition mb-4"
            >
              <FaArrowLeft /> Zurück zum Dashboard
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FaHandshake className="text-[#00FF9C]" />
              Reseller Management
            </h1>
            <p className="text-gray-400 mt-1">
              Verwalte deine Reseller und deren Anfragen
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <FaClock className="text-yellow-400" />
                <p className="text-gray-400">Ausstehende Anfragen</p>
              </div>
              <p className="text-4xl font-bold text-yellow-400">{pendingCount}</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <FaCheck className="text-green-400" />
                <p className="text-gray-400">Aktive Reseller</p>
              </div>
              <p className="text-4xl font-bold text-green-400">
                {resellers.length}
              </p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <FaChartBar className="text-blue-400" />
                <p className="text-gray-400">Gesamt Umsatz</p>
              </div>
              <p className="text-4xl font-bold text-blue-400">€0,00</p>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-4 mb-6 border-b border-[#2C2C34]">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-6 py-3 font-bold border-b-2 transition ${
                activeTab === "pending"
                  ? "border-[#00FF9C] text-[#00FF9C]"
                  : "border-transparent text-gray-400 hover:text-[#E0E0E0]"
              }`}
            >
              📬 Anfragen ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-6 py-3 font-bold border-b-2 transition ${
                activeTab === "active"
                  ? "border-[#00FF9C] text-[#00FF9C]"
                  : "border-transparent text-gray-400 hover:text-[#E0E0E0]"
              }`}
            >
              ✅ Aktive Reseller ({resellers.length})
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-6 py-3 font-bold border-b-2 transition ${
                activeTab === "stats"
                  ? "border-[#00FF9C] text-[#00FF9C]"
                  : "border-transparent text-gray-400 hover:text-[#E0E0E0]"
              }`}
            >
              📊 Statistiken
            </button>
          </div>

          {/* PENDING REQUESTS TAB */}
          {activeTab === "pending" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">📬 Reseller Anfragen</h2>

              {requests.filter((r) => r.status === "pending").length === 0 ? (
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 text-center text-gray-400">
                  <FaClock className="text-4xl mb-4 mx-auto opacity-50" />
                  <p className="text-lg font-semibold mb-2">Keine ausstehenden Anfragen</p>
                  <p className="text-sm">
                    Wenn Reseller dich hinzufügen möchten, erscheinen sie hier
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests
                    .filter((r) => r.status === "pending")
                    .map((request) => (
                      <div
                        key={request.id}
                        className="bg-[#1A1A1F] border border-yellow-600/50 rounded-lg p-6 hover:border-yellow-600 transition"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-2">
                              {request.reseller_name}
                            </h3>
                            <div className="space-y-1 text-sm text-gray-400">
                              <p>📧 {request.reseller_email}</p>
                              <p>
                                📅 Angefordert:{" "}
                                {new Date(
                                  request.created_at
                                ).toLocaleDateString("de-DE")}
                              </p>
                            </div>

                            <div className="mt-4 p-3 bg-yellow-600/20 rounded">
                              <p className="text-sm text-yellow-300">
                                ⏳ <strong>Dieser Reseller wartet auf Bestätigung</strong>
                              </p>
                              <p className="text-xs text-yellow-400 mt-1">
                                Akzeptiere oder lehne die Anfrage ab
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() =>
                                handleAcceptRequest(request.id, request.reseller_id)
                              }
                              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded font-bold flex items-center gap-2 transition"
                            >
                              <FaCheck /> Akzeptieren
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded font-bold flex items-center gap-2 transition"
                            >
                              <FaTimes /> Ablehnen
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ACTIVE RESELLERS TAB */}
          {activeTab === "active" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">✅ Deine Reseller</h2>

              {resellers.length === 0 ? (
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 text-center text-gray-400">
                  <FaUsers className="text-4xl mb-4 mx-auto opacity-50" />
                  <p className="text-lg font-semibold mb-2">
                    Noch keine Reseller
                  </p>
                  <p className="text-sm">
                    Akzeptiere Anfragen um Reseller hinzuzufügen
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {resellers.map((reseller) => (
                    <div
                      key={reseller.id}
                      className="bg-[#1A1A1F] border border-green-600/50 rounded-lg p-6 hover:border-green-600 transition"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2 text-green-400">
                            ✓ {reseller.reseller_name}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400 text-xs">Email</p>
                              <p className="font-bold">{reseller.reseller_email}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">Status</p>
                              <p className="font-bold text-green-400">Aktiv</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">Keys verkauft</p>
                              <p className="font-bold">{reseller.keys_sold || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">Umsatz</p>
                              <p className="font-bold text-green-400">
                                €{(reseller.revenue || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-gray-500 mt-3">
                            Hinzugefügt:{" "}
                            {new Date(reseller.created_at).toLocaleDateString(
                              "de-DE"
                            )}
                          </p>
                        </div>

                        <button
                          onClick={() => handleRemoveReseller(reseller.reseller_id)}
                          className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded font-bold transition"
                        >
                          🗑️ Entfernen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STATISTICS TAB */}
          {activeTab === "stats" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">📊 Reseller Statistiken</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
                  <h3 className="font-bold mb-4">🎯 Übersicht</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Gesamt Reseller:</span>
                      <span className="font-bold">{resellers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ausstehend:</span>
                      <span className="font-bold text-yellow-400">{pendingCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Diesen Monat:</span>
                      <span className="font-bold text-green-400">+2</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
                  <h3 className="font-bold mb-4">💰 Umsatz</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Gesamt Umsatz:</span>
                      <span className="font-bold text-green-400">€0,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Diesen Monat:</span>
                      <span className="font-bold text-green-400">€0,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Deine Gebühren (5%):</span>
                      <span className="font-bold text-[#00FF9C]">€0,00</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-6 mt-6">
                <h3 className="font-bold text-blue-400 mb-3">ℹ️ Wie funktioniert es?</h3>
                <ul className="text-sm text-blue-300 space-y-2">
                  <li>
                    ✅ Reseller senden dir eine Anfrage um deine Keys zu verkaufen
                  </li>
                  <li>✅ Du akzeptierst oder lehnst die Anfrage ab</li>
                  <li>
                    ✅ Akzeptierte Reseller können jetzt Keys von dir kaufen
                  </li>
                  <li>
                    ✅ Für jeden Verkauf bekommst du 5% als Gebühr
                  </li>
                  <li>✅ Reseller verdient die Differenz zwischen Einkauf und Verkauf</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}