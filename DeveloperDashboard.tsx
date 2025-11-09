import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaRocket,
  FaArrowLeft,
  FaSignOutAlt,
  FaBox,
  FaKey,
  FaUsers,
  FaChartBar,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type DeveloperInfo = {
  id: string;
  name: string;
  owner_email: string;
  plan: string;
};

type Stats = {
  totalProducts: number;
  totalLicenses: number;
  totalResellers: number;
  activeResellers: number;
};

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [developer, setDeveloper] = useState<DeveloperInfo | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalLicenses: 0,
    totalResellers: 0,
    activeResellers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        console.log("🚀 DeveloperDashboard Init...");

        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          console.error("❌ Auth Error:", error);
          navigate("/dev-login", { replace: true });
          return;
        }

        const isDev = (data.user?.user_metadata as any)?.is_developer;
        const orgId = (data.user?.user_metadata as any)?.organization_id;

        if (!isDev || !orgId) {
          console.error("❌ Not a developer or missing org_id!");
          navigate("/dev-login", { replace: true });
          return;
        }

        setOrganizationId(orgId);
        await loadData(orgId);
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

  async function loadData(orgId: string) {
    setLoading(true);
    try {
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, owner_email, plan")
        .eq("id", orgId)
        .maybeSingle();

      if (orgError) {
        console.error("❌ Org Load Error:", orgError);
      }

      if (orgData) {
        console.log("✅ Organization loaded:", orgData.name);
        setDeveloper(orgData as DeveloperInfo);
      } else {
        console.warn("⚠️ Organization not found");
      }

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id")
        .eq("organization_id", orgId);

      if (productsError) {
        console.error("❌ Products Load Error:", productsError);
      }

      const { data: licensesData, error: licensesError } = await supabase
        .from("licenses")
        .select("id")
        .eq("organization_id", orgId);

      if (licensesError) {
        console.error("❌ Licenses Load Error:", licensesError);
      }

      const { data: resellersData, error: resellersError } = await supabase
        .from("developer_resellers")
        .select("id, status")
        .eq("developer_id", orgId);

      if (resellersError) {
        console.error("❌ Resellers Load Error:", resellersError);
      }

      const activeResellers = (resellersData || []).filter(r => r.status === "active").length;

      setStats({
        totalProducts: productsData?.length || 0,
        totalLicenses: licensesData?.length || 0,
        totalResellers: resellersData?.length || 0,
        activeResellers,
      });
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
    navigate("/dev-login", { replace: true });
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
                className="flex items-center gap-2 px-3 py-2 bg-[#2C2C34] hover:bg-[#3C3C44] rounded-lg text-gray-400 hover:text-purple-400 transition"
                title="Zurück zur Landing Page"
              >
                <FaArrowLeft /> Home
              </button>

              <div className="border-l border-[#3C3C44] pl-4">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <FaRocket className="text-purple-400" />
                  Developer Dashboard
                </h1>
                <p className="text-gray-400 mt-1">
                  {developer?.name || "Loading..."} • Plan: <strong>{developer?.plan || "N/A"}</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-end">
              <button
                onClick={() => navigate("/dev-products")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold flex items-center gap-2 transition"
              >
                <FaBox /> Produkte
              </button>
              <button
                onClick={() => navigate("/dev-licenses")}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold flex items-center gap-2 transition"
              >
                <FaKey /> Lizenzen
              </button>
              <button
                onClick={() => navigate("/dev-resellers")}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold flex items-center gap-2 transition"
              >
                <FaUsers /> Reseller
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-blue-400 transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Produkte</p>
                <FaBox className="text-blue-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-blue-400">
                {stats.totalProducts}
              </p>
              <p className="text-xs text-gray-500 mt-2">erstellt</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-green-400 transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Lizenzen</p>
                <FaKey className="text-green-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-green-400">
                {stats.totalLicenses}
              </p>
              <p className="text-xs text-gray-500 mt-2">gesamt</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-purple-400 transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Reseller</p>
                <FaUsers className="text-purple-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-purple-400">
                {stats.activeResellers}
              </p>
              <p className="text-xs text-gray-500 mt-2">aktiv ({stats.totalResellers} gesamt)</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-yellow-400 transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Plan</p>
                <FaChartBar className="text-yellow-400 text-2xl" />
              </div>
              <p className="text-2xl font-bold text-yellow-400">
                {developer?.plan || "N/A"}
              </p>
              <p className="text-xs text-gray-500 mt-2">aktueller Plan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              onClick={() => navigate("/dev-products")}
              className="bg-[#1A1A1F] border border-blue-600 rounded-lg p-8 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <FaBox className="text-3xl text-blue-400" />
                <h3 className="text-2xl font-bold">Produkte</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Erstelle und verwalte deine Produkte
              </p>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold">
                Verwalten →
              </button>
            </div>

            <div
              onClick={() => navigate("/dev-licenses")}
              className="bg-[#1A1A1F] border border-green-600 rounded-lg p-8 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <FaKey className="text-3xl text-green-400" />
                <h3 className="text-2xl font-bold">Lizenzen</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Erstelle und verwalte deine Lizenzen
              </p>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold">
                Verwalten →
              </button>
            </div>

            <div
              onClick={() => navigate("/dev-resellers")}
              className="bg-[#1A1A1F] border border-purple-600 rounded-lg p-8 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <FaUsers className="text-3xl text-purple-400" />
                <h3 className="text-2xl font-bold">Reseller</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Verwalte deine Reseller und deren Anfragen
              </p>
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-bold">
                Ansehen →
              </button>
            </div>
          </div>

          <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-6">
            <h3 className="font-bold text-blue-400 mb-3">🚀 Schnellstart</h3>
            <ol className="text-sm text-blue-300 space-y-2">
              <li>1. 📦 Gehe zu <strong>Produkte</strong> und erstelle dein erstes Produkt</li>
              <li>2. 🔑 Gehe zu <strong>Lizenzen</strong> und erstelle Lizenzen</li>
              <li>3. 🤝 Gehe zu <strong>Reseller</strong> um Anfragen zu verwalten</li>
              <li>4. 📊 Überwache alles in deinem Dashboard</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}