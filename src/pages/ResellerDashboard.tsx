// src/pages/ResellerDashboard.tsx - REDESIGNED: Dashboard mit neuem Design (FIXED)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaStore,
  FaSignOutAlt,
  FaBox,
  FaShoppingBag,
  FaChartBar,
  FaUsers,
  FaRocket,
  FaFire,
  FaArrowLeft,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

type ResellerStats = {
  totalProducts: number;
  totalKeysAvailable: number;
  totalSales: number;
  totalRevenue: number;
  recentSales: any[];
};

export default function ResellerDashboard() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [reseller, setReseller] = useState<any>(null);
  const [stats, setStats] = useState<ResellerStats>({
    totalProducts: 0,
    totalKeysAvailable: 0,
    totalSales: 0,
    totalRevenue: 0,
    recentSales: [],
  });
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [resellerId, setResellerId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          navigate("/reseller-login", { replace: true });
          return;
        }

        const isReseller = (data.user?.user_metadata as any)?.is_reseller;
        const orgId = (data.user?.user_metadata as any)?.organization_id;

        if (!isReseller || !orgId) {
          navigate("/reseller-login", { replace: true });
          return;
        }

        setOrganizationId(orgId);

        const { data: resellerData } = await supabase
          .from("resellers")
          .select("id, shop_name, balance")
          .eq("organization_id", orgId)
          .single();

        if (resellerData) {
          setResellerId(resellerData.id);
          setReseller(resellerData);
          await loadStats(resellerData.id);
        }
      } catch (err) {
        console.error("Error:", err);
        openDialog({
          type: "error",
          title: "❌ Fehler",
          message: "Dashboard konnte nicht geladen werden",
          closeButton: "OK",
        });
      }
    }
    init();
  }, []);

  async function loadStats(reId: string) {
    setLoading(true);
    try {
      // Get products with sales and price info
      const { data: productsData } = await supabase
        .from("reseller_products")
        .select("quantity_available, quantity_sold, reseller_price, product_name")
        .eq("reseller_id", reId);

      let totalKeysAvailable = 0;
      let totalSales = 0;
      let totalRevenue = 0;

      if (productsData) {
        totalKeysAvailable = productsData.reduce((sum, p) => sum + (p.quantity_available || 0), 0);
        totalSales = productsData.reduce((sum, p) => sum + (p.quantity_sold || 0), 0);
        // Calculate revenue from products: quantity_sold * price
        totalRevenue = productsData.reduce((sum, p) => sum + ((p.quantity_sold || 0) * (p.reseller_price || 0)), 0);
      }

      // Get recent sales from customer_orders
      const { data: recentSalesData } = await supabase
        .from("customer_keys")
        .select(`
          id,
          key_code,
          created_at,
          customer_email,
          reseller_product_id
        `)
        .eq("reseller_product_id", reId ? reId : "null")
        .order("created_at", { ascending: false })
        .limit(5);

      // Enrich sales data with product info
      const enrichedSales = (recentSalesData || []).map((sale: any) => {
        const product = productsData?.find(p => p.product_name);
        return {
          product_name: product?.product_name || "Unbekannt",
          customer_name: sale.customer_email?.split('@')[0] || "Kunde",
          customer_email: sale.customer_email,
          quantity: 1,
          total_price: product?.reseller_price || 0,
          created_at: sale.created_at,
        };
      });

      setStats({
        totalProducts: productsData?.length || 0,
        totalKeysAvailable,
        totalSales,
        totalRevenue,
        recentSales: enrichedSales,
      });
    } catch (err) {
      console.error("Error loading stats:", err);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/reseller-login", { replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-3xl animate-spin">⏳</div>
          <p className="text-lg">Lädt Reseller Dashboard...</p>
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
        <div className="ml-0 md:ml-64 bg-gradient-to-r from-[#1A1A1F] via-[#2C2C34] to-[#1A1A1F] border-b border-[#00FF9C]/20 p-6 sticky top-0 z-40 shadow-lg shadow-[#00FF9C]/10">
          <div className="max-w-7xl mx-auto">
            {/* BACK BUTTON */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition mb-4 text-sm font-semibold"
            >
              <FaArrowLeft /> Zurück zur Startseite
            </button>

            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00FF9C]/20 rounded-lg">
                  <FaStore className="text-[#00FF9C] text-3xl" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{reseller?.shop_name || "Mein Shop"}</h1>
                  <p className="text-gray-400 text-sm">Reseller Dashboard</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold flex items-center gap-2 transition"
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        </div>

        <div className="ml-0 md:ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            {/* STATS CARDS - Mit fließendem Design */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {/* Produkte */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-blue-500/20 rounded-lg p-6 hover:border-blue-500/50 transition shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm">📦 Produkte</p>
                  <FaBox className="text-blue-400 text-2xl" />
                </div>
                <p className="text-4xl font-bold text-blue-400">{stats.totalProducts}</p>
                <p className="text-xs text-gray-500 mt-2">im Lager</p>
              </div>

              {/* Keys verfügbar */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#00FF9C]/20 rounded-lg p-6 hover:border-[#00FF9C]/50 transition shadow-lg hover:shadow-[#00FF9C]/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm">🔑 Keys verfügbar</p>
                  <FaShoppingBag className="text-[#00FF9C] text-2xl" />
                </div>
                <p className="text-4xl font-bold text-[#00FF9C]">{stats.totalKeysAvailable}</p>
                <p className="text-xs text-gray-500 mt-2">zum Verkauf</p>
              </div>

              {/* Verkäufe */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-green-500/20 rounded-lg p-6 hover:border-green-500/50 transition shadow-lg hover:shadow-green-500/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm">📊 Verkäufe</p>
                  <FaChartBar className="text-green-400 text-2xl" />
                </div>
                <p className="text-4xl font-bold text-green-400">{stats.totalSales}</p>
                <p className="text-xs text-gray-500 mt-2">insgesamt</p>
              </div>

              {/* Einnahmen */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-yellow-500/20 rounded-lg p-6 hover:border-yellow-500/50 transition shadow-lg hover:shadow-yellow-500/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm">💰 Einnahmen</p>
                  <FaRocket className="text-yellow-400 text-2xl" />
                </div>
                <p className="text-4xl font-bold text-yellow-400">€{stats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">verdient</p>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Lager */}
              <div
                onClick={() => navigate("/reseller-inventory")}
                className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-blue-600/30 rounded-lg p-8 hover:border-blue-600/80 hover:shadow-lg hover:shadow-blue-600/20 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <FaBox className="text-4xl text-blue-400" />
                  <h3 className="text-2xl font-bold">Lager</h3>
                </div>
                <p className="text-gray-400 mb-6">Verwalte deine Produkte und Preise</p>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold transition w-full">
                  Zum Lager →
                </button>
              </div>

              {/* Verkaufen */}
              <div
                onClick={() => navigate("/reseller-sales")}
                className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#00FF9C]/30 rounded-lg p-8 hover:border-[#00FF9C]/80 hover:shadow-lg hover:shadow-[#00FF9C]/20 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <FaShoppingBag className="text-4xl text-[#00FF9C]" />
                  <h3 className="text-2xl font-bold">Verkaufen</h3>
                </div>
                <p className="text-gray-400 mb-6">Verkaufe Keys an deine Kunden</p>
                <button className="px-4 py-2 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] rounded font-bold transition w-full">
                  Jetzt verkaufen →
                </button>
              </div>

              {/* Keys hochladen */}
              <div
                onClick={() => navigate("/reseller-key-upload")}
                className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-purple-600/30 rounded-lg p-8 hover:border-purple-600/80 hover:shadow-lg hover:shadow-purple-600/20 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <FaRocket className="text-4xl text-purple-400" />
                  <h3 className="text-2xl font-bold">Keys hochladen</h3>
                </div>
                <p className="text-gray-400 mb-6">Lade neue Keys hoch die du erhalten hast</p>
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-bold transition w-full">
                  Keys hochladen →
                </button>
              </div>
            </div>

            {/* QUICK NAVIGATION */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <button
                onClick={() => navigate("/reseller-inventory")}
                className="bg-[#1A1A1F] hover:bg-[#2C2C34] border border-[#2C2C34] hover:border-blue-500/50 rounded-lg p-4 transition flex items-center gap-2 text-sm font-bold"
              >
                <FaBox className="text-blue-400" /> Lager
              </button>
              <button
                onClick={() => navigate("/reseller-key-upload")}
                className="bg-[#1A1A1F] hover:bg-[#2C2C34] border border-[#2C2C34] hover:border-purple-500/50 rounded-lg p-4 transition flex items-center gap-2 text-sm font-bold"
              >
                <FaRocket className="text-purple-400" /> Keys hochladen
              </button>
              <button
                onClick={() => navigate("/reseller-sales")}
                className="bg-[#1A1A1F] hover:bg-[#2C2C34] border border-[#2C2C34] hover:border-[#00FF9C]/50 rounded-lg p-4 transition flex items-center gap-2 text-sm font-bold"
              >
                <FaShoppingBag className="text-[#00FF9C]" /> Verkaufen
              </button>
              <button
                onClick={() => navigate("/reseller-analytics")}
                className="bg-[#1A1A1F] hover:bg-[#2C2C34] border border-[#2C2C34] hover:border-yellow-500/50 rounded-lg p-4 transition flex items-center gap-2 text-sm font-bold"
              >
                <FaChartBar className="text-yellow-400" /> Analytics
              </button>
            </div>

            {/* RECENT SALES */}
            {stats.recentSales.length > 0 && (
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#2C2C34] rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  📊 Letzte Verkäufe
                </h2>

                <div className="space-y-3">
                  {stats.recentSales.map((sale, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-[#0E0E12]/50 p-4 rounded-lg hover:bg-[#1A1A1F]/50 transition"
                    >
                      <div>
                        <p className="font-bold">{sale.product_name}</p>
                        <p className="text-xs text-gray-400">
                          {sale.customer_name} • {sale.quantity} Key{sale.quantity !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#00FF9C]">€{sale.total_price?.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          {sale.created_at ? new Date(sale.created_at).toLocaleDateString("de-DE") : "-"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate("/reseller-sales")}
                  className="mt-6 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded font-bold transition"
                >
                  Alle Verkäufe ansehen →
                </button>
              </div>
            )}

            {/* INFO BOXES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/50 rounded-lg p-6">
                <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                  🚀 Schnellstart
                </h3>
                <ol className="text-sm text-blue-300 space-y-2 text-xs">
                  <li>1️⃣ Gehe zu <strong>Marketplace</strong></li>
                  <li>2️⃣ Wähle Developer und werde Reseller</li>
                  <li>3️⃣ Kaufe Produkte ins Lager</li>
                  <li>4️⃣ Verkaufe Keys an Kunden</li>
                  <li>5️⃣ Verdiene Provisionen!</li>
                </ol>
              </div>

              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-lg p-6">
                <h3 className="font-bold text-green-400 mb-3 flex items-center gap-2">
                  💡 Tipps zum Erfolg
                </h3>
                <ul className="text-sm text-green-300 space-y-2 text-xs">
                  <li>✅ Preis strategisch setzen</li>
                  <li>✅ Beliebte Produkte im Auge behalten</li>
                  <li>✅ Mit Developern kommunizieren</li>
                  <li>✅ Regelmäßig Lager überprüfen</li>
                  <li>✅ Guter Kundenservice = mehr Umsatz</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}