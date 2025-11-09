import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaArrowLeft,
  FaStore,
  FaSignOutAlt,
  FaShoppingBag,
  FaKey,
  FaChartBar,
  FaCreditCard,
  FaShoppingCart,
  FaUsers,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type ResellerInfo = {
  id: string;
  shop_name: string;
  owner_email: string;
  balance: number;
  status: string;
};

type Stats = {
  totalKeys: number;
  keysInStock: number;
  keysSold: number;
  totalRevenue: number;
  acceptedDevelopers: number;
};

export default function ResellerDashboard() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [reseller, setReseller] = useState<ResellerInfo | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalKeys: 0,
    keysInStock: 0,
    keysSold: 0,
    totalRevenue: 0,
    acceptedDevelopers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [resellerId, setResellerId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        console.log("🚀 ResellerDashboard Init...");
        
        const { data, error } = await supabase.auth.getUser();
        
        if (error || !data.user) {
          console.error("❌ Auth Error:", error);
          navigate("/reseller-login", { replace: true });
          return;
        }

        const orgId = (data.user?.user_metadata as any)?.organization_id;
        let reId = (data.user?.user_metadata as any)?.reseller_id;

        if (!orgId) {
          console.error("❌ No organization_id!");
          navigate("/reseller-login", { replace: true });
          return;
        }

        if (!reId) {
          console.log("🔍 Looking up reseller_id...");
          const { data: resellerData, error: resellerError } = await supabase
            .from("resellers")
            .select("id")
            .eq("organization_id", orgId)
            .maybeSingle();

          if (resellerError) {
            console.error("❌ Lookup Error:", resellerError);
          }

          if (resellerData) {
            reId = resellerData.id;
            console.log("✅ Found reseller_id:", reId);
            
            await supabase.auth.updateUser({
              data: {
                is_reseller: true,
                organization_id: orgId,
                reseller_id: reId,
              },
            });
          } else {
            console.error("❌ No reseller found for org:", orgId);
            openDialog({
              type: "error",
              title: "❌ Reseller nicht gefunden",
              message: "Dein Reseller-Profil konnte nicht gefunden werden.",
              closeButton: "OK",
            });
            return;
          }
        }

        setOrganizationId(orgId);
        setResellerId(reId);
        await loadData(orgId, reId);
      } catch (err) {
        console.error("❌ Init Error:", err);
        openDialog({
          type: "error",
          title: "❌ Fehler",
          message: `${err}`,
          closeButton: "OK",
        });
      }
    }
    init();
  }, []);

  async function loadData(orgId: string, reId: string) {
    setLoading(true);
    try {
      const { data: resellerData, error: resellerError } = await supabase
        .from("resellers")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle();

      if (resellerError) {
        console.error("❌ Reseller Load Error:", resellerError);
      }

      if (resellerData) {
        console.log("✅ Reseller loaded:", resellerData.shop_name);
        setReseller(resellerData);
      }

      const { data: productsData, error: productsError } = await supabase
        .from("reseller_products")
        .select("quantity_available, quantity_sold")
        .eq("reseller_id", reId);

      if (productsError) {
        console.error("❌ Products Error:", productsError);
      }

      const { data: devData, error: devError } = await supabase
        .from("developer_resellers")
        .select("id")
        .eq("reseller_id", reId)
        .eq("status", "active");

      if (devError) {
        console.error("❌ Developers Error:", devError);
      }

      if (productsData) {
        const totalKeys = productsData.reduce((sum, p) => sum + (p.quantity_available || 0), 0);
        const sold = productsData.reduce((sum, p) => sum + (p.quantity_sold || 0), 0);

        setStats({
          totalKeys: totalKeys + sold,
          keysInStock: totalKeys,
          keysSold: sold,
          totalRevenue: 0,
          acceptedDevelopers: devData?.length || 0,
        });
      }
    } catch (err) {
      console.error("❌ Error loading data:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler beim Laden",
        message: "Dashboard-Daten konnten nicht geladen werden",
        closeButton: "OK",
      });
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
          <p className="text-lg">Lädt Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        <div className="bg-[#1A1A1F] border-b border-[#2C2C34] p-6 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-3 py-2 bg-[#2C2C34] hover:bg-[#3C3C44] rounded-lg text-gray-400 hover:text-[#00FF9C] transition"
                title="Zurück zur Landing Page"
              >
                <FaArrowLeft /> Home
              </button>

              <div className="border-l border-[#3C3C44] pl-4">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <FaStore className="text-[#00FF9C]" />
                  Reseller Dashboard
                </h1>
                <p className="text-gray-400 mt-1">
                  Shop: <strong>{reseller?.shop_name || "Loading..."}</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-end">
              <button
                onClick={() => navigate("/reseller-developers")}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold flex items-center gap-2 transition"
              >
                <FaUsers /> Meine Developer
              </button>
              <button
                onClick={() => navigate("/reseller-marketplace")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold flex items-center gap-2 transition"
              >
                <FaShoppingBag /> Marketplace
              </button>
              <button
                onClick={() => navigate("/reseller-inventory")}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold flex items-center gap-2 transition"
              >
                <FaShoppingCart /> Lager
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold flex items-center gap-2 transition"
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-purple-600 transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Developer</p>
                <FaUsers className="text-purple-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-purple-400">
                {stats.acceptedDevelopers}
              </p>
              <p className="text-xs text-gray-500 mt-2">akzeptiert</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C] transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Gesamt Keys</p>
                <FaKey className="text-[#00FF9C] text-2xl" />
              </div>
              <p className="text-4xl font-bold text-[#00FF9C]">
                {stats.totalKeys}
              </p>
              <p className="text-xs text-gray-500 mt-2">gekauft</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-green-400 transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Im Lager</p>
                <FaShoppingCart className="text-green-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-green-400">
                {stats.keysInStock}
              </p>
              <p className="text-xs text-gray-500 mt-2">verfügbar</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-blue-400 transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Verkauft</p>
                <FaChartBar className="text-blue-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-blue-400">
                {stats.keysSold}
              </p>
              <p className="text-xs text-gray-500 mt-2">gesamt</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-yellow-400 transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Kontostand</p>
                <FaCreditCard className="text-yellow-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-yellow-400">
                €{reseller?.balance.toFixed(2) || "0.00"}
              </p>
              <p className="text-xs text-gray-500 mt-2">Verfügbar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              onClick={() => navigate("/reseller-developers")}
              className="bg-[#1A1A1F] border border-purple-600 rounded-lg p-8 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <FaUsers className="text-3xl text-purple-400" />
                <h3 className="text-2xl font-bold">Meine Developer</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Sehe deine akzeptierten Developer und kaufe neue Keys
              </p>
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-bold">
                Öffnen →
              </button>
            </div>

            <div
              onClick={() => navigate("/reseller-marketplace")}
              className="bg-[#1A1A1F] border border-blue-600 rounded-lg p-8 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <FaShoppingBag className="text-3xl text-blue-400" />
                <h3 className="text-2xl font-bold">Marketplace</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Finde neue Developer und werde ihr Reseller
              </p>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold">
                Durchsuchen →
              </button>
            </div>

            <div
              onClick={() => navigate("/reseller-inventory")}
              className="bg-[#1A1A1F] border border-green-600 rounded-lg p-8 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <FaShoppingCart className="text-3xl text-green-400" />
                <h3 className="text-2xl font-bold">Meine Lagerverwaltung</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Verwalte deine Keys und stelle Preise ein
              </p>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold">
                Verwalten →
              </button>
            </div>
          </div>

          <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-6">
            <h3 className="font-bold text-blue-400 mb-3">📋 Workflow</h3>
            <ol className="text-sm text-blue-300 space-y-2">
              <li>1. 👥 Gehe zu <strong>Marketplace</strong> und finde Developer</li>
              <li>2. 🤝 Klick "Reseller werden"</li>
              <li>3. ⏳ Warte auf Developer Bestätigung</li>
              <li>4. 🛍 Gehe zu <strong>Meine Developer</strong> und kaufe Keys</li>
              <li>5. 💰 Gehe zu <strong>Lagerverwaltung</strong> und stelle Preise ein</li>
              <li>6. 📦 Verkaufe Keys an End-Kunden</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}