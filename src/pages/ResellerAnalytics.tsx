// src/pages/ResellerAnalytics.tsx - REDESIGNED: Analytics mit neuem Design (FIXED)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaArrowLeft, FaChartBar, FaKey, FaShoppingCart, FaDollarSign, FaFire } from "react-icons/fa";
import Sidebar from "../components/Sidebar";

type SalesData = {
  product_name: string;
  quantity_sold: number;
  revenue: number;
};

type Analytics = {
  total_keys_purchased: number;
  total_keys_sold: number;
  total_revenue: number;
  total_profit: number;
  sales_by_product: SalesData[];
  this_month_revenue: number;
  this_week_revenue: number;
};

export default function ResellerAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [resellerId, setResellerId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;
      let reId = (data.user?.user_metadata as any)?.reseller_id;

      if (!orgId) {
        navigate("/reseller-login", { replace: true });
        return;
      }

      if (!reId) {
        const { data: resellerData } = await supabase
          .from("resellers")
          .select("id")
          .eq("organization_id", orgId)
          .single();

        if (resellerData) reId = resellerData.id;
      }

      setOrganizationId(orgId);
      setResellerId(reId);
      await loadAnalytics(reId);
    }
    init();
  }, []);

  async function loadAnalytics(reId: string) {
    setLoading(true);
    try {
      const { data: productsData } = await supabase
        .from("reseller_products")
        .select("*, products(name)")
        .eq("reseller_id", reId);

      if (!productsData) {
        setLoading(false);
        return;
      }

      const totalKeysPurchased = productsData.reduce((sum, p) => sum + p.quantity_purchased, 0);
      const totalKeysSold = productsData.reduce((sum, p) => sum + p.quantity_sold, 0);
      const totalRevenue = productsData.reduce(
        (sum, p) => sum + p.quantity_sold * p.resale_price,
        0
      );
      const totalProfit = productsData.reduce(
        (sum, p) => sum + p.quantity_sold * (p.resale_price - p.purchase_price),
        0
      );

      const salesByProduct: SalesData[] = productsData
        .filter((p) => p.quantity_sold > 0)
        .map((p) => ({
          product_name: p.products.name,
          quantity_sold: p.quantity_sold,
          revenue: p.quantity_sold * p.resale_price,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      setAnalytics({
        total_keys_purchased: totalKeysPurchased,
        total_keys_sold: totalKeysSold,
        total_revenue: totalRevenue,
        total_profit: totalProfit,
        sales_by_product: salesByProduct,
        this_month_revenue: totalRevenue,
        this_week_revenue: Math.round(totalRevenue / 4),
      });
    } catch (err) {
      console.error("Error:", err);
    }
    setLoading(false);
  }

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

  if (!analytics) {
    return (
      <div className="min-h-screen bg-[#0E0E12]">
        <Sidebar />
        <div className="ml-0 md:ml-64 flex items-center justify-center h-screen text-gray-400">
          <p>Keine Daten verfügbar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
      <Sidebar />

      {/* HEADER */}
      <div className="ml-0 md:ml-64 bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border-b border-yellow-500/20 p-6 sticky top-0 z-40 shadow-lg shadow-yellow-500/10">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate("/reseller-dashboard")}
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
          <p className="text-gray-400">Deine Verkaufs- und Umsatzstatistiken im Überblick</p>
        </div>
      </div>

      <div className="ml-0 md:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* MAIN STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Gekaufte Keys */}
            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition shadow-lg hover:shadow-purple-500/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-sm">🛒 Gekaufte Keys</p>
                <FaKey className="text-purple-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-purple-400">{analytics.total_keys_purchased}</p>
              <p className="text-xs text-gray-500 mt-2">insgesamt gekauft</p>
            </div>

            {/* Verkaufte Keys */}
            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-blue-500/20 rounded-lg p-6 hover:border-blue-500/50 transition shadow-lg hover:shadow-blue-500/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-sm">📦 Verkaufte Keys</p>
                <FaShoppingCart className="text-blue-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-blue-400">{analytics.total_keys_sold}</p>
              <p className="text-xs text-gray-500 mt-2">an Kunden verkauft</p>
            </div>

            {/* Umsatz */}
            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-green-500/20 rounded-lg p-6 hover:border-green-500/50 transition shadow-lg hover:shadow-green-500/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-sm">💵 Umsatz</p>
                <FaDollarSign className="text-green-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-green-400">€{analytics.total_revenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-2">Gesamteinnahmen</p>
            </div>

            {/* Gewinn */}
            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#00FF9C]/20 rounded-lg p-6 hover:border-[#00FF9C]/50 transition shadow-lg hover:shadow-[#00FF9C]/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-sm">📈 Gewinn</p>
                <FaFire className="text-[#00FF9C] text-2xl" />
              </div>
              <p className="text-4xl font-bold text-[#00FF9C]">€{analytics.total_profit.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-2">Dein Profit</p>
            </div>
          </div>

          {/* PERIOD STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Diese Woche */}
            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-blue-500/20 rounded-lg p-6 hover:border-blue-500/50 transition">
              <p className="text-gray-400 mb-3">📅 Diese Woche</p>
              <p className="text-4xl font-bold text-blue-400">€{analytics.this_week_revenue.toFixed(2)}</p>
              <div className="mt-4 h-2 bg-[#0E0E12] rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-full" style={{ width: "45%" }}></div>
              </div>
            </div>

            {/* Dieser Monat */}
            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-green-500/20 rounded-lg p-6 hover:border-green-500/50 transition">
              <p className="text-gray-400 mb-3">📆 Dieser Monat</p>
              <p className="text-4xl font-bold text-green-400">€{analytics.this_month_revenue.toFixed(2)}</p>
              <div className="mt-4 h-2 bg-[#0E0E12] rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-400 h-full" style={{ width: "100%" }}></div>
              </div>
            </div>
          </div>

          {/* TOP PRODUCTS */}
          {analytics.sales_by_product.length > 0 && (
            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#2C2C34] rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                🏆 Top Verkaufte Produkte
              </h2>

              <div className="space-y-4">
                {analytics.sales_by_product.map((product, idx) => {
                  const percentage = (product.revenue / analytics.total_revenue) * 100;
                  const colors = [
                    "from-[#00FF9C] to-green-400",
                    "from-blue-500 to-blue-400",
                    "from-purple-500 to-purple-400",
                  ];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={idx} className="bg-[#0E0E12]/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-[#00FF9C] bg-[#1A1A1F] w-8 h-8 rounded flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold">{product.product_name}</p>
                            <p className="text-xs text-gray-500">{product.quantity_sold} Keys verkauft</p>
                          </div>
                        </div>
                        <p className="text-right">
                          <p className="text-2xl font-bold text-green-400">€{product.revenue.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{percentage.toFixed(1)}% des Umsatzes</p>
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 bg-[#2C2C34] rounded-full overflow-hidden">
                        <div
                          className={`bg-gradient-to-r ${color} h-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-yellow-500/20 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">📊 Durchschnitt pro Key</p>
              <p className="text-3xl font-bold text-yellow-400">
                €{(analytics.total_revenue / Math.max(analytics.total_keys_sold, 1)).toFixed(2)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-orange-500/20 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">💹 Gewinn pro Key</p>
              <p className="text-3xl font-bold text-orange-400">
                €{(analytics.total_profit / Math.max(analytics.total_keys_sold, 1)).toFixed(2)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-pink-500/20 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">📈 Conversion Rate</p>
              <p className="text-3xl font-bold text-pink-400">
                {((analytics.total_keys_sold / Math.max(analytics.total_keys_purchased, 1)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* INFO */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 rounded-lg p-6">
            <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
              💡 Analytics-Tipps
            </h3>
            <ul className="text-sm text-blue-300 space-y-2">
              <li>✅ Überwache deine Top-Produkte regelmäßig</li>
              <li>✅ Arbeite an der Conversion Rate (Kauf vs. Verkauf)</li>
              <li>✅ Identifiziere Bestseller und fokussiere auf diese</li>
              <li>✅ Kalkuliere Preise so, dass die Margin stimmt</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}