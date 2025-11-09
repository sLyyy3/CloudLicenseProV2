// src/pages/Analytics.tsx - ERWEITERTE ANALYTICS MIT INSIGHTS
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaCalendar,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";

type License = {
  id: string;
  status: "active" | "inactive" | "expired" | "revoked";
  type?: string;
  expires_at?: string;
  created_at: string;
  product_id: string;
  customer_id: string;
};

type AnalyticsData = {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  expiringIn30Days: number;
  expiringIn7Days: number;
  licensesByType: Record<string, number>;
  licensesByStatus: Record<string, number>;
  createdThisMonth: number;
  createdThisWeek: number;
  averageActivationDuration: number;
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      const orgId = (userData.user?.user_metadata as any)?.organization_id;
      if (orgId) {
        setOrganizationId(orgId);
        await loadAnalytics(orgId);
      }
    }
    init();
  }, []);

  async function loadAnalytics(orgId: string) {
    setLoading(true);
    try {
      const { data: licensesData } = await supabase
        .from("licenses")
        .select("*")
        .eq("organization_id", orgId);

      if (licensesData) {
        const analytics = calculateAnalytics(licensesData);
        setData(analytics);
      }
    } catch (err) {
      console.error("Error loading analytics:", err);
    }
    setLoading(false);
  }

  function calculateAnalytics(licenses: License[]): AnalyticsData {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());

    let activeLicenses = 0;
    let expiredLicenses = 0;
    let expiringIn30Days = 0;
    let expiringIn7Days = 0;
    let createdThisMonth = 0;
    let createdThisWeek = 0;
    let totalActivationDays = 0;
    let activationCount = 0;

    const licensesByType: Record<string, number> = {
      single: 0,
      floating: 0,
      concurrent: 0,
    };

    const licensesByStatus: Record<string, number> = {
      active: 0,
      inactive: 0,
      expired: 0,
      revoked: 0,
    };

    licenses.forEach((license) => {
      licensesByStatus[license.status] =
        (licensesByStatus[license.status] || 0) + 1;

      if (license.status === "active") activeLicenses++;
      if (license.status === "expired") expiredLicenses++;

      const type = license.type || "single";
      licensesByType[type] = (licensesByType[type] || 0) + 1;

      if (license.expires_at) {
        const expiryDate = new Date(license.expires_at);
        const daysUntil = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (license.status === "active" && daysUntil <= 30 && daysUntil > 0) {
          expiringIn30Days++;
        }
        if (license.status === "active" && daysUntil <= 7 && daysUntil > 0) {
          expiringIn7Days++;
        }
      }

      const createdDate = new Date(license.created_at);
      if (createdDate >= thisMonthStart) createdThisMonth++;
      if (createdDate >= thisWeekStart) createdThisWeek++;

      if (license.expires_at) {
        const createdTime = new Date(license.created_at).getTime();
        const expiryTime = new Date(license.expires_at).getTime();
        const durationDays = (expiryTime - createdTime) / (1000 * 60 * 60 * 24);
        totalActivationDays += durationDays;
        activationCount++;
      }
    });

    return {
      totalLicenses: licenses.length,
      activeLicenses,
      expiredLicenses,
      expiringIn30Days,
      expiringIn7Days,
      licensesByType,
      licensesByStatus,
      createdThisMonth,
      createdThisWeek,
      averageActivationDuration:
        activationCount > 0 ? totalActivationDays / activationCount : 0,
    };
  }

  if (loading) {
    return (
      <div className="flex w-full min-h-screen bg-[#0F0F14]">
        <Sidebar />
        <main className="ml-64 flex-1 bg-[#0F0F14] text-[#E0E0E0] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-2xl">📊</div>
            <p>Lädt Analytics...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex w-full min-h-screen bg-[#0F0F14]">
        <Sidebar />
        <main className="ml-64 flex-1 bg-[#0F0F14] text-[#E0E0E0] p-8">
          <p>Keine Daten verfügbar</p>
        </main>
      </div>
    );
  }

  const activationPercentage = ((data.activeLicenses / data.totalLicenses) * 100).toFixed(1);
  const expiringPercentage = ((data.expiringIn30Days / data.totalLicenses) * 100).toFixed(1);
  const expiredPercentage = ((data.expiredLicenses / data.totalLicenses) * 100).toFixed(1);

  return (
    <div className="flex w-full min-h-screen bg-[#0F0F14]">
      <Sidebar />

      <main className="ml-64 flex-1 bg-[#0F0F14] text-[#E0E0E0]">
        {/* HEADER */}
        <div className="border-b border-[#2a2a34] p-8">
          <h1 className="text-4xl font-extrabold flex items-center gap-2 mb-2">
            <FaChartBar className="text-[#00FF9C]" />
            Analytics Dashboard
          </h1>
          <p className="text-[#a0a0a8]">Detaillierte Einblicke in deine Lizenzen</p>
        </div>

        <div className="p-8 space-y-8">
          {/* KEY METRICS ROW 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Licenses */}
            <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-6 hover:border-[#00FF9C]/50 transition">
              <div className="flex items-center gap-2 mb-2">
                <FaChartBar className="text-blue-400" />
                <p className="text-[#a0a0a8] text-sm">Gesamt Lizenzen</p>
              </div>
              <p className="text-4xl font-bold text-blue-400">{data.totalLicenses}</p>
              <p className="text-xs text-[#a0a0a8] mt-2">
                🎯 Alle deine lizenzierten Produkte
              </p>
            </div>

            {/* Active Licenses */}
            <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-6 hover:border-green-500/50 transition">
              <div className="flex items-center gap-2 mb-2">
                <FaCheckCircle className="text-green-400" />
                <p className="text-[#a0a0a8] text-sm">Aktive Lizenzen</p>
              </div>
              <p className="text-4xl font-bold text-green-400">{data.activeLicenses}</p>
              <p className="text-xs text-[#a0a0a8] mt-2">
                ✅ {activationPercentage}% von gesamt
              </p>
            </div>

            {/* Expiring Soon */}
            <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-6 hover:border-[#FFCD3C]/50 transition">
              <div className="flex items-center gap-2 mb-2">
                <FaArrowDown className="text-[#FFCD3C]" />
                <p className="text-[#a0a0a8] text-sm">Demnächst ablaufend</p>
              </div>
              <p className="text-4xl font-bold text-[#FFCD3C]">
                {data.expiringIn30Days}
              </p>
              <p className="text-xs text-[#a0a0a8] mt-2">
                ⏰ In den nächsten 30 Tagen
              </p>
            </div>

            {/* Expired */}
            <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-6 hover:border-red-500/50 transition">
              <div className="flex items-center gap-2 mb-2">
                <FaExclamationTriangle className="text-red-400" />
                <p className="text-[#a0a0a8] text-sm">Abgelaufen</p>
              </div>
              <p className="text-4xl font-bold text-red-400">{data.expiredLicenses}</p>
              <p className="text-xs text-[#a0a0a8] mt-2">
                ❌ {expiredPercentage}% von gesamt
              </p>
            </div>
          </div>

          {/* KEY METRICS ROW 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Created This Month */}
            <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <FaCalendar className="text-purple-400" />
                <p className="text-[#a0a0a8] text-sm">Diesen Monat erstellt</p>
              </div>
              <p className="text-3xl font-bold text-purple-400">
                {data.createdThisMonth}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs text-[#a0a0a8]">
                <FaArrowUp className="text-green-400" />
                Diese Woche: {data.createdThisWeek}
              </div>
            </div>

            {/* Expiring in 7 Days */}
            <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <FaExclamationTriangle className="text-orange-400" />
                <p className="text-[#a0a0a8] text-sm">Ablaufen in 7 Tagen</p>
              </div>
              <p className="text-3xl font-bold text-orange-400">
                {data.expiringIn7Days}
              </p>
              <p className="text-xs text-[#a0a0a8] mt-2">
                ⚠️ Schnelle Aktion erforderlich!
              </p>
            </div>

            {/* Avg Activation Duration */}
            <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <FaChartLine className="text-cyan-400" />
                <p className="text-[#a0a0a8] text-sm">Durchschn. Lizenzdauer</p>
              </div>
              <p className="text-3xl font-bold text-cyan-400">
                {Math.round(data.averageActivationDuration)}
              </p>
              <p className="text-xs text-[#a0a0a8] mt-2">days</p>
            </div>
          </div>

          {/* DISTRIBUTION SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Status Distribution */}
            <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FaChartPie className="text-pink-400" />
                Status Verteilung
              </h2>

              <div className="space-y-3">
                {Object.entries(data.licensesByStatus).map(([status, count]) => {
                  const percentage = ((count / data.totalLicenses) * 100).toFixed(1);
                  let color = "";
                  let label = "";

                  switch (status) {
                    case "active":
                      color = "bg-green-600";
                      label = "✅ Aktiv";
                      break;
                    case "inactive":
                      color = "bg-blue-600";
                      label = "⏸️ Inaktiv";
                      break;
                    case "expired":
                      color = "bg-red-600";
                      label = "❌ Abgelaufen";
                      break;
                    case "revoked":
                      color = "bg-gray-600";
                      label = "🚫 Widerrufen";
                      break;
                  }

                  return (
                    <div key={status}>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm">{label}</p>
                        <p className="text-sm font-bold">
                          {count} ({percentage}%)
                        </p>
                      </div>
                      <div className="w-full bg-[#2a2a34] rounded h-3 overflow-hidden">
                        <div
                          className={`${color} h-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Type Distribution */}
            <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FaChartBar className="text-teal-400" />
                Lizenz Typ Verteilung
              </h2>

              <div className="space-y-3">
                {Object.entries(data.licensesByType).map(([type, count]) => {
                  const percentage = ((count / data.totalLicenses) * 100).toFixed(1);
                  let color = "";
                  let label = "";

                  switch (type) {
                    case "single":
                      color = "bg-indigo-600";
                      label = "👤 Single User";
                      break;
                    case "floating":
                      color = "bg-amber-600";
                      label = "🔄 Floating";
                      break;
                    case "concurrent":
                      color = "bg-rose-600";
                      label = "⚡ Concurrent";
                      break;
                  }

                  return (
                    <div key={type}>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm">{label}</p>
                        <p className="text-sm font-bold">
                          {count} ({percentage}%)
                        </p>
                      </div>
                      <div className="w-full bg-[#2a2a34] rounded h-3 overflow-hidden">
                        <div
                          className={`${color} h-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* INSIGHTS SECTION */}
          <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">💡 Insights & Empfehlungen</h2>

            <div className="space-y-3">
              {data.expiringIn7Days > 0 && (
                <div className="bg-orange-600/20 border border-orange-600 rounded p-3 text-sm">
                  <p className="font-bold text-orange-400">⚠️ Warnung!</p>
                  <p className="text-gray-300 mt-1">
                    {data.expiringIn7Days} Lizenzen laufen in den nächsten 7 Tagen ab. Bitte erneuere diese zeitnah!
                  </p>
                </div>
              )}

              {data.activeLicenses === data.totalLicenses && (
                <div className="bg-green-600/20 border border-green-600 rounded p-3 text-sm">
                  <p className="font-bold text-green-400">✅ Alles in Ordnung!</p>
                  <p className="text-gray-300 mt-1">
                    Alle deine Lizenzen sind aktiv und laufen noch nicht ab.
                  </p>
                </div>
              )}

              {data.expiredLicenses > 0 && (
                <div className="bg-red-600/20 border border-red-600 rounded p-3 text-sm">
                  <p className="font-bold text-red-400">❌ Aktion erforderlich!</p>
                  <p className="text-gray-300 mt-1">
                    {data.expiredLicenses} Lizenzen sind abgelaufen. Bitte erneuere diese oder widerrufe sie.
                  </p>
                </div>
              )}

              <div className="bg-blue-600/20 border border-blue-600 rounded p-3 text-sm">
                <p className="font-bold text-blue-400">📊 Statistik</p>
                <p className="text-gray-300 mt-1">
                  Diese Woche wurden {data.createdThisWeek} Lizenzen erstellt.
                  Im Durchschnitt läuft jede Lizenz {Math.round(data.averageActivationDuration)} Tage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
