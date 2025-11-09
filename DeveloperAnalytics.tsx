// src/pages/DeveloperAnalytics.tsx - ANALYTICS & STATISTICS
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
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";

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
      // Lade alle Lizenzen
      const { data: licenseData } = await supabase
        .from("licenses")
        .select("*")
        .eq("organization_id", orgId);

      if (!licenseData) {
        setLoading(false);
        return;
      }

      // Lade Products
      const { data: productData } = await supabase
        .from("products")
        .select("id, name")
        .eq("organization_id", orgId);

      // Berechne Stats
      const totalLicenses = licenseData.length;
      const activeLicenses = licenseData.filter(
        (l) => l.status === "active"
      ).length;
      const inactiveLicenses = licenseData.filter(
        (l) => l.status === "inactive"
      ).length;
      const expiredLicenses = licenseData.filter(
        (l) => l.status === "expired"
      ).length;

      // Zähle Kunden
      const customerEmails = new Set(
        licenseData
          .map((l) => l.customer_email)
          .filter((e) => e && e !== "")
      );
      const totalCustomers = customerEmails.size;

      // Finde Top Product
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

      // Recent Licenses
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
          <div className="text-2xl mb-4">⏳</div>
          <p>Lädt Analytics...</p>
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
              <FaChartBar className="text-[#00FF9C]" />
              Analytics & Statistiken
            </h1>
            <p className="text-gray-400 mt-1">
              Deine Lizenz- und Verkaufsstatistiken
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {/* KEY METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <FaKey className="text-[#00FF9C]" />
                <p className="text-sm text-gray-400">Gesamt Keys</p>
              </div>
              <p className="text-4xl font-bold text-[#00FF9C]">
                {analytics.totalLicenses}
              </p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
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

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <FaUsers className="text-blue-400" />
                <p className="text-sm text-gray-400">Kunden</p>
              </div>
              <p className="text-4xl font-bold text-blue-400">
                {analytics.totalCustomers}
              </p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <FaDollarSign className="text-yellow-400" />
                <p className="text-sm text-gray-400">Top Produkt</p>
              </div>
              {analytics.topProduct ? (
                <>
                  <p className="text-2xl font-bold text-yellow-400">
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

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
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
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6">📊 Status Verteilung</h2>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Aktiv</span>
                    <span className="font-bold text-green-400">
                      {analytics.activeLicenses}
                    </span>
                  </div>
                  <div className="w-full bg-[#2C2C34] rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-green-500 h-full transition-all"
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
                  <div className="w-full bg-[#2C2C34] rounded-full h-3 overflow-hidden">
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
                  <div className="w-full bg-[#2C2C34] rounded-full h-3 overflow-hidden">
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
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6">📈 Übersicht</h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-[#2C2C34] rounded">
                  <span className="text-gray-400">Gesamt Keys:</span>
                  <span className="font-bold text-lg">
                    {analytics.totalLicenses}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-[#2C2C34] rounded">
                  <span className="text-gray-400">Aktive Nutzer:</span>
                  <span className="font-bold text-lg text-green-400">
                    {analytics.activeLicenses}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-[#2C2C34] rounded">
                  <span className="text-gray-400">Unique Customers:</span>
                  <span className="font-bold text-lg text-blue-400">
                    {analytics.totalCustomers}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-[#2C2C34] rounded">
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
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold mb-6">🆕 Letzte Keys</h2>

              <div className="space-y-2">
                {analytics.recentLicenses.map((lic, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[#2C2C34] rounded hover:bg-[#3C3C44] transition"
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
          <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-6">
            <h3 className="font-bold text-blue-400 mb-3">💡 Insights & Tipps</h3>
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
                  {analytics.topProduct.count} Sales)
                </li>
              )}
              <li>✅ Warte bald auf erweiterte Analytics mit Charts und Trends!</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
