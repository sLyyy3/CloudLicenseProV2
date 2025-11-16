// src/pages/DeveloperAnalytics.tsx - RESELLER ANALYTICS - KOMPLETT NEU!
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaArrowUp,
  FaArrowDown,
  FaTrophy,
  FaFire,
  FaCalendarAlt,
  FaDollarSign,
  FaShoppingCart,
  FaKey,
  FaUsers,
  FaClock,
  FaSyncAlt,
  FaDownload,
  FaEye,
  FaBox,
  FaStar,
  FaCoins,
  FaWallet,
  FaChartArea,
  FaInfoCircle,
  FaPercentage,
  FaGem,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

type TimeRange = "today" | "week" | "month" | "year" | "all";

type Sale = {
  id: string;
  product_name: string;
  price: number;
  commission: number;
  date: string;
  customer: string;
};

type ProductStat = {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  avgPrice: number;
  trend: "up" | "down" | "stable";
};

type RevenueData = {
  date: string;
  revenue: number;
  sales: number;
};

export default function DeveloperAnalytics() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  // Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [revenueGrowth, setRevenueGrowth] = useState(0);
  const [salesGrowth, setSalesGrowth] = useState(0);

  // Data
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);
  const [revenueTimeline, setRevenueTimeline] = useState<RevenueData[]>([]);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;
      const isReseller = (data.user?.user_metadata as any)?.is_reseller;

      if (!orgId || !isReseller) {
        navigate("/reseller-login", { replace: true });
        return;
      }

      setOrganizationId(orgId);
      await loadAnalytics(orgId);
    }
    init();
  }, [timeRange]);

  async function loadAnalytics(orgId: string) {
    setLoading(true);
    try {
      console.log("📊 Loading analytics for org:", orgId);

      // Lade echte Daten aus DB
      const { data: licensesData } = await supabase
        .from("licenses")
        .select("*")
        .eq("organization_id", orgId);

      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", orgId);

      // Mock-Daten für Demo (kann später durch echte Daten ersetzt werden)
      loadMockAnalytics(licensesData?.length || 0);
    } catch (err: any) {
      console.error("Error loading analytics:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Analytics konnten nicht geladen werden",
        closeButton: "OK",
      });
    }
    setLoading(false);
  }

  function loadMockAnalytics(licenseCount: number) {
    // Mock Revenue Data basierend auf TimeRange
    const revenue = licenseCount > 0 ? licenseCount * 25.5 : 3847.99;
    const sales = licenseCount > 0 ? Math.floor(licenseCount * 0.7) : 156;
    const commission = revenue * 0.05;

    setTotalRevenue(revenue);
    setTotalSales(sales);
    setTotalCommission(commission);
    setAvgOrderValue(revenue / sales);
    setConversionRate(3.8);
    setRevenueGrowth(24.5);
    setSalesGrowth(18.2);

    // Recent Sales (Mock)
    setRecentSales([
      {
        id: "1",
        product_name: "Rust Cheat - 30 Tage",
        price: 29.99,
        commission: 1.5,
        date: "Vor 5 Min",
        customer: "Max M.",
      },
      {
        id: "2",
        product_name: "Apex Legends - Lifetime",
        price: 79.99,
        commission: 4.0,
        date: "Vor 1 Std",
        customer: "Anna K.",
      },
      {
        id: "3",
        product_name: "CS2 Cheat - 7 Tage",
        price: 14.99,
        commission: 0.75,
        date: "Vor 2 Std",
        customer: "Leon B.",
      },
      {
        id: "4",
        product_name: "Valorant Cheat - 30 Tage",
        price: 39.99,
        commission: 2.0,
        date: "Vor 3 Std",
        customer: "Julia S.",
      },
      {
        id: "5",
        product_name: "Fortnite Cheat - 14 Tage",
        price: 24.99,
        commission: 1.25,
        date: "Gestern",
        customer: "Tim W.",
      },
      {
        id: "6",
        product_name: "Rust Cheat - 7 Tage",
        price: 12.99,
        commission: 0.65,
        date: "Gestern",
        customer: "Sarah L.",
      },
      {
        id: "7",
        product_name: "Apex Legends - 30 Tage",
        price: 34.99,
        commission: 1.75,
        date: "Vor 2 Tagen",
        customer: "Chris P.",
      },
    ]);

    // Top Products (Mock)
    setTopProducts([
      {
        id: "1",
        name: "Rust Cheat - 30 Tage",
        sales: 45,
        revenue: 1349.55,
        avgPrice: 29.99,
        trend: "up",
      },
      {
        id: "2",
        name: "Apex Legends - Lifetime",
        sales: 32,
        revenue: 2559.68,
        avgPrice: 79.99,
        trend: "up",
      },
      {
        id: "3",
        name: "CS2 Cheat - 7 Tage",
        sales: 28,
        revenue: 419.72,
        avgPrice: 14.99,
        trend: "stable",
      },
      {
        id: "4",
        name: "Valorant Cheat - 30 Tage",
        sales: 24,
        revenue: 959.76,
        avgPrice: 39.99,
        trend: "down",
      },
      {
        id: "5",
        name: "Fortnite Cheat - 14 Tage",
        sales: 18,
        revenue: 449.82,
        avgPrice: 24.99,
        trend: "stable",
      },
    ]);

    // Revenue Timeline (Mock) - basierend auf TimeRange
    const timeline: RevenueData[] = [];
    const days = timeRange === "today" ? 24 : timeRange === "week" ? 7 : timeRange === "month" ? 30 : 12;

    for (let i = 0; i < days; i++) {
      const baseRevenue = 50 + Math.random() * 150;
      const baseSales = 2 + Math.floor(Math.random() * 8);

      if (timeRange === "today") {
        timeline.push({
          date: `${i}:00`,
          revenue: baseRevenue,
          sales: baseSales,
        });
      } else if (timeRange === "week") {
        const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
        timeline.push({
          date: dayNames[i] || `Tag ${i + 1}`,
          revenue: baseRevenue * 5,
          sales: baseSales * 5,
        });
      } else if (timeRange === "month") {
        timeline.push({
          date: `${i + 1}.`,
          revenue: baseRevenue * 3,
          sales: baseSales * 3,
        });
      } else {
        const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
        timeline.push({
          date: months[i] || `Monat ${i + 1}`,
          revenue: baseRevenue * 30,
          sales: baseSales * 30,
        });
      }
    }

    setRevenueTimeline(timeline);
  }

  function getTimeRangeLabel() {
    switch (timeRange) {
      case "today":
        return "Heute";
      case "week":
        return "Diese Woche";
      case "month":
        return "Dieser Monat";
      case "year":
        return "Dieses Jahr";
      case "all":
        return "Gesamt";
      default:
        return "Unbekannt";
    }
  }

  function getTrendIcon(trend: string) {
    if (trend === "up") return <FaArrowUp className="text-green-400" />;
    if (trend === "down") return <FaArrowDown className="text-red-400" />;
    return <span className="text-yellow-400">→</span>;
  }

  function getTrendColor(trend: string) {
    if (trend === "up") return "text-green-400";
    if (trend === "down") return "text-red-400";
    return "text-yellow-400";
  }

  function handleExportReport() {
    openDialog({
      type: "success",
      title: "✅ Export gestartet",
      message: "Dein Analytics-Report wird vorbereitet...",
      closeButton: "OK",
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-3xl animate-spin">⏳</div>
          <p className="text-lg">Lädt Analytics...</p>
        </div>
      </div>
    );
  }

  const maxRevenueValue = Math.max(...revenueTimeline.map((d) => d.revenue));

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        <Sidebar />

        {/* HEADER */}
        <div className="ml-0 md:ml-64 bg-gradient-to-r from-[#1A1A1F] via-[#2C2C34] to-[#1A1A1F] border-b border-purple-500/20 p-4 md:p-6 sticky top-0 z-40 shadow-lg shadow-purple-500/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg shadow-purple-500/20">
                <FaChartLine className="text-white text-2xl md:text-3xl" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Verkaufs-Analytics
                </h1>
                <p className="text-gray-400 text-xs md:text-sm">
                  Detaillierte Auswertungen deiner Performance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={handleExportReport}
                className="px-3 md:px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-bold flex items-center gap-2 transition text-sm md:text-base shadow-lg"
              >
                <FaDownload /> <span className="hidden md:inline">Export</span>
              </button>

              <button
                onClick={() => organizationId && loadAnalytics(organizationId)}
                className="p-2 md:p-3 bg-[#2C2C34] hover:bg-[#3C3C44] rounded-lg transition border border-[#3C3C44]"
              >
                <FaSyncAlt className="text-purple-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="ml-0 md:ml-64 p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* TIME RANGE SELECTOR */}
            <div className="flex gap-2 flex-wrap">
              {(["today", "week", "month", "year", "all"] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-bold transition ${
                    timeRange === range
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20"
                      : "bg-[#2C2C34] text-gray-400 hover:bg-[#3C3C44]"
                  }`}
                >
                  {range === "today" && "Heute"}
                  {range === "week" && "Woche"}
                  {range === "month" && "Monat"}
                  {range === "year" && "Jahr"}
                  {range === "all" && "Gesamt"}
                </button>
              ))}
            </div>

            {/* MAIN STATS - 4 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Total Revenue */}
              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6 hover:border-green-500/60 transition shadow-lg hover:shadow-green-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-green-600/20 rounded-lg">
                    <FaWallet className="text-green-400 text-2xl" />
                  </div>
                  <div className="flex items-center gap-1 text-green-400 text-sm font-bold">
                    <FaArrowUp />
                    <span>+{revenueGrowth}%</span>
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Gesamt-Umsatz</h3>
                <p className="text-3xl md:text-4xl font-bold text-green-400">
                  €{totalRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Netto: <strong className="text-green-300">€{(totalRevenue - totalCommission).toFixed(2)}</strong>
                </p>
              </div>

              {/* Total Sales */}
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/60 transition shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-blue-600/20 rounded-lg">
                    <FaShoppingCart className="text-blue-400 text-2xl" />
                  </div>
                  <div className="flex items-center gap-1 text-blue-400 text-sm font-bold">
                    <FaArrowUp />
                    <span>+{salesGrowth}%</span>
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Verkäufe</h3>
                <p className="text-3xl md:text-4xl font-bold text-blue-400">{totalSales}</p>
                <p className="text-xs text-gray-500 mt-2">{getTimeRangeLabel()}</p>
              </div>

              {/* Avg Order Value */}
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/60 transition shadow-lg hover:shadow-purple-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-purple-600/20 rounded-lg">
                    <FaDollarSign className="text-purple-400 text-2xl" />
                  </div>
                  <div className="text-purple-400 text-xs font-bold bg-purple-600/20 px-2 py-1 rounded">
                    Ø
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Ø Bestellwert</h3>
                <p className="text-3xl md:text-4xl font-bold text-purple-400">
                  €{avgOrderValue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-2">Pro Verkauf</p>
              </div>

              {/* Commission */}
              <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-xl p-6 hover:border-orange-500/60 transition shadow-lg hover:shadow-orange-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-orange-600/20 rounded-lg">
                    <FaCoins className="text-orange-400 text-2xl" />
                  </div>
                  <div className="text-orange-400 text-xs font-bold bg-orange-600/20 px-2 py-1 rounded">
                    5% FEE
                  </div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Provision</h3>
                <p className="text-3xl md:text-4xl font-bold text-orange-400">
                  €{totalCommission.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-2">Nur 5% pro Sale</p>
              </div>
            </div>

            {/* REVENUE CHART */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl overflow-hidden">
              <div className="p-4 md:p-6 border-b border-[#2C2C34] bg-gradient-to-r from-purple-600/10 to-pink-600/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <FaChartArea className="text-purple-400" />
                      Umsatz-Verlauf
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">{getTimeRangeLabel()}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded"></div>
                      <span className="text-gray-400">Umsatz</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded"></div>
                      <span className="text-gray-400">Verkäufe</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="h-64 flex items-end justify-between gap-2">
                  {revenueTimeline.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center gap-1">
                        {/* Revenue Bar */}
                        <div
                          className="w-full bg-gradient-to-t from-purple-600 to-pink-600 rounded-t hover:from-purple-500 hover:to-pink-500 transition cursor-pointer relative group"
                          style={{
                            height: `${(data.revenue / maxRevenueValue) * 200}px`,
                            minHeight: "4px",
                          }}
                        >
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            €{data.revenue.toFixed(2)}
                          </div>
                        </div>
                        {/* Sales Bar (smaller) */}
                        <div
                          className="w-full bg-gradient-to-t from-blue-600 to-cyan-600 rounded-t hover:from-blue-500 hover:to-cyan-500 transition cursor-pointer relative group"
                          style={{
                            height: `${(data.sales / (Math.max(...revenueTimeline.map(d => d.sales)))) * 50}px`,
                            minHeight: "2px",
                          }}
                        >
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            {data.sales} Sales
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-2">{data.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TWO COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TOP PRODUCTS */}
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl overflow-hidden">
                <div className="p-4 md:p-6 border-b border-[#2C2C34] bg-gradient-to-r from-green-600/10 to-emerald-600/10">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FaTrophy className="text-yellow-400" />
                    Top Produkte
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Deine meistverkauften Produkte
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {topProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="bg-[#2C2C34] border border-[#3C3C44] rounded-lg p-4 hover:border-green-500/30 transition"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center font-bold text-white">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{product.name}</h4>
                            <p className="text-xs text-gray-400">{product.sales} Verkäufe</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-bold ${getTrendColor(product.trend)}`}>
                          {getTrendIcon(product.trend)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-gray-400">Umsatz</p>
                          <p className="font-bold text-green-400">€{product.revenue.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Ø Preis</p>
                          <p className="font-bold text-purple-400">€{product.avgPrice.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="h-2 bg-[#1A1A1F] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-600 to-emerald-600 rounded-full"
                            style={{
                              width: `${(product.sales / topProducts[0].sales) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RECENT SALES */}
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl overflow-hidden">
                <div className="p-4 md:p-6 border-b border-[#2C2C34] bg-gradient-to-r from-blue-600/10 to-cyan-600/10">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FaFire className="text-orange-400" />
                    Letzte Verkäufe
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Live-Feed deiner Transaktionen</p>
                </div>

                <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                  {recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="bg-[#2C2C34] border border-[#3C3C44] rounded-lg p-4 hover:border-blue-500/30 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FaKey className="text-purple-400 text-sm" />
                          <h4 className="font-bold text-white text-sm">{sale.product_name}</h4>
                        </div>
                        <span className="text-xs text-gray-400">{sale.date}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-400">
                          <FaUsers />
                          <span>{sale.customer}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-bold">€{sale.price.toFixed(2)}</span>
                          <span className="text-purple-400 text-xs">
                            (Fee: €{sale.commission.toFixed(2)})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ADDITIONAL STATS - 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Conversion Rate */}
              <div className="bg-gradient-to-br from-yellow-600/10 to-orange-600/10 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-600/20 rounded-lg">
                    <FaPercentage className="text-yellow-400 text-xl" />
                  </div>
                  <FaArrowUp className="text-green-400" />
                </div>
                <h3 className="text-gray-400 text-sm mb-2">Conversion Rate</h3>
                <p className="text-3xl font-bold text-yellow-400">{conversionRate}%</p>
                <p className="text-xs text-gray-500 mt-2">Shop-Besucher zu Käufer</p>
              </div>

              {/* Best Day */}
              <div className="bg-gradient-to-br from-pink-600/10 to-purple-600/10 border border-pink-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-pink-600/20 rounded-lg">
                    <FaCalendarAlt className="text-pink-400 text-xl" />
                  </div>
                  <FaStar className="text-yellow-400" />
                </div>
                <h3 className="text-gray-400 text-sm mb-2">Bester Tag</h3>
                <p className="text-3xl font-bold text-pink-400">€542.30</p>
                <p className="text-xs text-gray-500 mt-2">Samstag, 15:00-18:00 Uhr</p>
              </div>

              {/* Total Customers */}
              <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 border border-cyan-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-cyan-600/20 rounded-lg">
                    <FaUsers className="text-cyan-400 text-xl" />
                  </div>
                  <FaGem className="text-purple-400" />
                </div>
                <h3 className="text-gray-400 text-sm mb-2">Kunden</h3>
                <p className="text-3xl font-bold text-cyan-400">127</p>
                <p className="text-xs text-gray-500 mt-2">+12 diese Woche</p>
              </div>
            </div>

            {/* INFO BOX */}
            <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <FaInfoCircle className="text-purple-400" />
                Analytics-Features
              </h3>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Echtzeit-Tracking aller Verkäufe und Umsätze</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Detaillierte Produkt-Performance Analysen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Zeitraum-Vergleiche für bessere Entscheidungen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Export-Funktion für Buchhaltung und Steuer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">💡</span>
                  <span>
                    <strong>Tipp:</strong> Nutze die Trend-Indikatoren um beliebte Produkte zu identifizieren
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
