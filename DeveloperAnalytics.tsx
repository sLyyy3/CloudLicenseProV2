// src/pages/DeveloperAnalytics.tsx - REDESIGNED: Developer Analytics mit neuem Design
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaArrowLeft,
  FaChartBar,
  FaChartLine,
  FaKey,
  FaDollarSign,
  FaUsers,
  FaTrendingUp,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

type AnalyticsData = {
  totalLicenses: number;
  activeLicenses: number;
  inactiveLicenses: number;
  expiredLicenses: number;
  totalCustomers: number;
  topProduct: { name: string; count: number } | null;
  recentLicenses: Array<{ key: string; product: string; date: string }>;
};

export default function DeveloperAnalytics() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalLicenses: 0,
    activeLicenses: 0,
    inactiveLicenses: 0,
    expiredLicenses: 0,
    totalCustomers: 0,
    topProduct: null,
    recentLicenses: [],
  });

  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;
      const isDev = (data.user?.user_metadata as any)?.is_developer;

      if (!orgId || !isDev) {
        navigate("/dev-login", { replace: true });
        return;
      }

      setOrganizationId(orgId);
      await loadAnalytics(orgId);
    }
    init();
  }, []);

  async function loadAnalytics(orgId: string) {
    setLoading(true);
    try {
      const { data: licenseData } = await supabase
        .from("licenses")
        .select("*")
        .eq("organization_id", orgId);

      if (!licenseData) {
        setLoading(false);
        return;
      }

      const { data: productData } = await supabase
        .from("products")
        .select("id, name")
        .eq("organization_id", orgId);

      const totalLicenses = licenseData.length;
      const activeLicenses = licenseData.filter((l) => l.status === "active").length;
      const inactiveLicenses = licenseData.filter((l) => l.status === "inactive").length;
      const expiredLicenses = licenseData.filter((l) => l.status === "expired").length;

      const customerEmails = new Set(
        licenseData
          .map((l) => l.customer_email)
          .filter((e) => e && e !== "")
      );
      const totalCustomers = customerEmails.size;

      const productCounts = new Map<string, number>();
      licenseData.forEach((lic) => {
        const product = productData?.find((p) => p.id === lic.product_id);
        if (product) {
          productCounts.set(
            product.name,
            (productCounts.get(product.name) || 0) + 1
          );
        }
      });

      let topProduct = null;
      let maxCount = 0;
      productCounts.forEach((count, name) => {
        if (count > maxCount) {
          maxCount = count;
          topProduct = { name, count };
        }
      });

      const recentLicenses = licenseData
        .slice(0, 5)
        .map((lic) => {
          const product = productData?.find((p) => p.id === lic.product_id);
          return {
            key: lic.license_key,
            product: product?.name || "Unbekannt",
            date: new Date(lic.created_at).toLocaleDateString("de-DE"),
          };
        });

      setAnalytics({
        totalLicenses,
        activeLicenses,
        inactiveLicenses,
        expiredLicenses,
        totalCustomers,
        topProduct,
        recentLicenses,
      });
    } catch (err) {
      console.error("Error loading analytics:", err);
    }
    setLoading(false);
  }

  const activePercentage =
    analytics.totalLicenses > 0
      ? Math.round((analytics.activeLicenses / analytics.totalLicenses) * 100)
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-4 animate-spin">⏳</div>
          <p>Lädt Analytics...</p>
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
        <div className="ml-0 md:ml-64 bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border-b border-yellow-500/20 p-6 sticky top-0 z-40 shadow-lg shadow-yellow-500/10">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate("/dev-dashboard")}
              className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition mb-4 text-sm"
            >
              <FaArrowLeft /> Zurück
            </button>
            <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <FaChartBar className="text-yellow-400 text-2xl" />
              </div>
              Analytics & Statistiken
            </h1>
            <p className="text-gray-400">Deine Lizenz- und Verkaufsstatistiken im Überblick</p>
          </div>
        </div>

        <div className="ml-0 md:ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            {/* KEY METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              {/* Gesamt Keys */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#00FF9C]/20 rounded-lg p-6 hover:border-[#00FF9C]/50 transition shadow-lg hover:shadow-[#00FF9C]/10">
                <div className="flex items-center gap-2 mb-2">
                  <FaKey className="text-[#00FF9C]" />
                  <p className="text-sm text-gray-400">Gesamt Keys</p>
                </div>
                <p className="text-4xl font-bold text-[#00FF9C]">
                  {analytics.totalLicenses}
                </p>
              </div>

              {/* Aktive */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-green-500/20 rounded-lg p-6 hover:border-green-500/50 transition shadow-lg hover:shadow-green-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <FaChartLine className="text-green-400" />
                  <p className="text-sm text-gray-400">Aktive</p>
                </div>
                <p className="text-4xl font-bold text-green-400">
                  {analytics.activeLicenses}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activePercentage}% der Keys
                </p>
              </div>

              {/* Kunden */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-blue-500/20 rounded-lg p-6 hover:border-blue-500/50 transition shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <FaUsers className="text-blue-400" />
                  <p className="text-sm text-gray-400">Kunden</p>
                </div>
                <p className="text-4xl font-bold text-blue-400">
                  {analytics.totalCustomers}
                </p>
              </div>

              {/* Top Produkt */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition shadow-lg hover:shadow-purple-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <FaDollarSign className="text-purple-400" />
                  <p className="text-sm text-gray-400">Top Produkt</p>
                </div>
                {analytics.topProduct ? (
                  <>
                    <p className="text-2xl font-bold text-purple-400">
                      {analytics.topProduct.count}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {analytics.topProduct.name}
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-gray-400">-</p>
                )}
              </div>

              {/* Inaktiv/Abgelaufen */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-red-500/20 rounded-lg p-6 hover:border-red-500/50 transition shadow-lg hover:shadow-red-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <FaChartBar className="text-red-400" />
                  <p className="text-sm text-gray-400">Inaktiv/Abgelaufen</p>
                </div>
                <p className="text-4xl font-bold text-red-400">
                  {analytics.inactiveLicenses + analytics.expiredLicenses}
                </p>
              </div>
            </div>

            {/* STATUS BREAKDOWN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Status Chart */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#2C2C34] rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">📊 Status Verteilung</h2>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Aktiv</span>
                      <span className="font-bold text-green-400">
                        {analytics.activeLicenses}
                      </span>
                    </div>
                    <div className="w-full bg-[#0E0E12] rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-400 h-full transition-all"
                        style={{
                          width: `${
                            (analytics.activeLicenses /
                              Math.max(analytics.totalLicenses, 1)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Inaktiv</span>
                      <span className="font-bold text-gray-400">
                        {analytics.inactiveLicenses}
                      </span>
                    </div>
                    <div className="w-full bg-[#0E0E12] rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gray-500 h-full transition-all"
                        style={{
                          width: `${
                            (analytics.inactiveLicenses /
                              Math.max(analytics.totalLicenses, 1)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Abgelaufen</span>
                      <span className="font-bold text-red-400">
                        {analytics.expiredLicenses}
                      </span>
                    </div>
                    <div className="w-full bg-[#0E0E12] rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-red-500 h-full transition-all"
                        style={{
                          width: `${
                            (analytics.expiredLicenses /
                              Math.max(analytics.totalLicenses, 1)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#2C2C34] rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">📈 Übersicht</h2>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-[#0E0E12]/50 rounded-lg">
                    <span className="text-gray-400">Gesamt Keys:</span>
                    <span className="font-bold text-lg text-[#00FF9C]">
                      {analytics.totalLicenses}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-[#0E0E12]/50 rounded-lg">
                    <span className="text-gray-400">Aktive Nutzer:</span>
                    <span className="font-bold text-lg text-green-400">
                      {analytics.activeLicenses}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-[#0E0E12]/50 rounded-lg">
                    <span className="text-gray-400">Unique Customers:</span>
                    <span className="font-bold text-lg text-blue-400">
                      {analytics.totalCustomers}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-[#0E0E12]/50 rounded-lg">
                    <span className="text-gray-400">Ø Keys pro Kunde:</span>
                    <span className="font-bold text-lg text-yellow-400">
                      {(
                        analytics.totalLicenses / Math.max(analytics.totalCustomers, 1)
                      ).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RECENT LICENSES */}
            {analytics.recentLicenses.length > 0 && (
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#2C2C34] rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-bold mb-6">🆕 Letzte Keys</h2>

                <div className="space-y-2">
                  {analytics.recentLicenses.map((lic, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-[#0E0E12]/50 rounded hover:bg-[#1A1A1F]/50 transition"
                    >
                      <div>
                        <code className="text-sm font-mono text-[#00FF9C]">
                          {lic.key}
                        </code>
                        <p className="text-xs text-gray-400 mt-1">{lic.product}</p>
                      </div>
                      <span className="text-xs text-gray-500">{lic.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* INSIGHTS */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 rounded-lg p-6">
              <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                💡 Analytics-Insights
              </h3>
              <ul className="text-sm text-blue-300 space-y-2">
                <li>✅ Hohe aktive Quote ({activePercentage}%) ist gut!</li>
                <li>✅ {analytics.totalCustomers} Kunden nutzen deine Services</li>
                <li>
                  ✅ Durchschnittlich{" "}
                  {(
                    analytics.totalLicenses / Math.max(analytics.totalCustomers, 1)
                  ).toFixed(1)}{" "}
                  Keys pro Kunde
                </li>
                {analytics.topProduct && (
                  <li>
                    ✅ "{analytics.topProduct.name}" ist dein Best-Seller (
                    {analytics.topProduct.count} Verkäufe)
                  </li>
                )}
                <li>✅ Überwache regelmäßig um Trends zu erkennen</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}