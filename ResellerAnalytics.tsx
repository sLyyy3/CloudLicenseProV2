// src/pages/ResellerAnalytics.tsx - RESELLER ANALYTICS DASHBOARD
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaArrowLeft, FaChartBar, FaKey, FaShoppingCart, FaDollarSign } from "react-icons/fa";

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

        if (resellerData) {
          reId = resellerData.id;
        }
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
      console.log("📊 Loading analytics for reseller:", reId);

      // 1. Lade alle reseller_products
      const { data: productsData } = await supabase
        .from("reseller_products")
        .select("*, products(name)")
        .eq("reseller_id", reId);

      if (!productsData) {
        setLoading(false);
        return;
      }

      // Berechne Stats
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

      // TODO: Berechne monatlich/wöchentlich (würde customer_orders Tabelle brauchen)
      const thisMonthRevenue = totalRevenue; // Placeholder
      const thisWeekRevenue = Math.round(totalRevenue / 4); // Placeholder

      setAnalytics({
        total_keys_purchased: totalKeysPurchased,
        total_keys_sold: totalKeysSold,
        total_revenue: totalRevenue,
        total_profit: totalProfit,
        sales_by_product: salesByProduct,
        this_month_revenue: thisMonthRevenue,
        this_week_revenue: thisWeekRevenue,
      });

      console.log("✅ Analytics loaded!");
    } catch (err) {
      console.error("❌ Error:", err);
    }
    setLoading(false);
  }

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

  if (!analytics) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        <div className="flex items-center justify-center h-screen text-gray-400">
          <p>Keine Daten verfügbar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
      {/* HEADER */}
      <div className="bg-[#1A1A1F] border-b border-[#2C2C34] p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate("/reseller-dashboard")}
            className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition mb-4"
          >
            <FaArrowLeft /> Zurück zum Dashboard
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaChartBar className="text-[#00FF9C]" />
            Analytics
          </h1>
          <p className="text-gray-400 mt-1">Deine Verkaufs- und Umsatzstatistiken</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* MAIN STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <FaKey className="text-[#00FF9C]" />
              <p className="text-gray-400">Gekaufte Keys</p>
            </div>
            <p className="text-4xl font-bold text-[#00FF9C]">{analytics.total_keys_purchased}</p>
          </div>

          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <FaShoppingCart className="text-blue-400" />
              <p className="text-gray-400">Verkaufte Keys</p>
            </div>
            <p className="text-4xl font-bold text-blue-400">{analytics.total_keys_sold}</p>
          </div>

          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <FaDollarSign className="text-green-400" />
              <p className="text-gray-400">Umsatz</p>
            </div>
            <p className="text-4xl font-bold text-green-400">
              €{analytics.total_revenue.toFixed(2)}
            </p>
          </div>

          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <FaDollarSign className="text-yellow-400" />
              <p className="text-gray-400">Gewinn</p>
            </div>
            <p className="text-4xl font-bold text-yellow-400">
              €{analytics.total_profit.toFixed(2)}
            </p>
          </div>
        </div>

        {/* PERIOD STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
            <p className="text-gray-400 mb-2">📅 Diese Woche</p>
            <p className="text-3xl font-bold text-[#00FF9C]">
              €{analytics.this_week_revenue.toFixed(2)}
            </p>
          </div>

          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
            <p className="text-gray-400 mb-2">📆 Dieser Monat</p>
            <p className="text-3xl font-bold text-blue-400">
              €{analytics.this_month_revenue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* TOP PRODUCTS */}
        {analytics.sales_by_product.length > 0 && (
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">🏆 Top Verkaufte Produkte</h2>

            <div className="space-y-3">
              {analytics.sales_by_product.map((product, idx) => (
                <div key={idx} className="bg-[#2C2C34] rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold">{product.product_name}</p>
                    <span className="bg-[#00FF9C] text-[#0E0E12] px-2 py-1 rounded text-sm font-bold">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Verkauft</p>
                      <p className="font-bold text-blue-400">{product.quantity_sold}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Umsatz</p>
                      <p className="font-bold text-green-400">€{product.revenue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Anteil</p>
                      <p className="font-bold">
                        {((product.revenue / analytics.total_revenue) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 bg-[#1A1A1F] rounded h-2 overflow-hidden">
                    <div
                      className="bg-[#00FF9C] h-full"
                      style={{
                        width: `${(product.revenue / analytics.total_revenue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INFO */}
        <div className="mt-12 bg-blue-600/20 border border-blue-600 rounded-lg p-6">
          <h3 className="font-bold text-blue-400 mb-3">ℹ️ Wie funktioniert Analytics?</h3>
          <ul className="text-sm text-blue-300 space-y-2">
            <li>✅ <strong>Gekaufte Keys:</strong> Anzahl aller Keys die du gekauft hast</li>
            <li>✅ <strong>Verkaufte Keys:</strong> Anzahl aller Keys die deine Kunden gekauft haben</li>
            <li>✅ <strong>Umsatz:</strong> Gesamt Einnahmen (Verkaufspreis × Menge)</li>
            <li>✅ <strong>Gewinn:</strong> Dein Profit (Umsatz - Einkaufskosten)</li>
            <li>✅ <strong>Zeiträume:</strong> Wöchentliche und monatliche Überblicke</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
