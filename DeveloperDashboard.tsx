// src/pages/DeveloperDashboard.tsx - REDESIGNED: Developer Dashboard mit neuem Design
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaRocket,
  FaSignOutAlt,
  FaBox,
  FaKey,
  FaUsers,
  FaChartBar,
  FaFire,
  FaLightbulb,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

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
          <p className="text-lg">Lädt Developer Dashboard...</p>
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
        <div className="ml-0 md:ml-64 bg-gradient-to-r from-[#1A1A1F] via-[#2C2C34] to-[#1A1A1F] border-b border-purple-500/20 p-6 sticky top-0 z-40 shadow-lg shadow-purple-500/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <FaRocket className="text-purple-400 text-3xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Developer Dashboard</h1>
                <p className="text-gray-400 text-sm">
                  {developer?.name || "Loading..."} • Plan: <strong>{developer?.plan || "N/A"}</strong>
                </p>
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

        <div className="ml-0 md:ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            {/* MAIN STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {/* Produkte */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-blue-500/20 rounded-lg p-6 hover:border-blue-500/50 transition shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm">📦 Produkte</p>
                  <FaBox className="text-blue-400 text-2xl" />
                </div>
                <p className="text-4xl font-bold text-blue-400">{stats.totalProducts}</p>
                <p className="text-xs text-gray-500 mt-2">erstellt</p>
              </div>

              {/* Lizenzen */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-green-500/20 rounded-lg p-6 hover:border-green-500/50 transition shadow-lg hover:shadow-green-500/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm">🔑 Lizenzen</p>
                  <FaKey className="text-green-400 text-2xl" />
                </div>
                <p className="text-4xl font-bold text-green-400">{stats.totalLicenses}</p>
                <p className="text-xs text-gray-500 mt-2">gesamt</p>
              </div>

              {/* Reseller */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/50 transition shadow-lg hover:shadow-purple-500/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm">👥 Reseller</p>
                  <FaUsers className="text-purple-400 text-2xl" />
                </div>
                <p className="text-4xl font-bold text-purple-400">{stats.activeResellers}</p>
                <p className="text-xs text-gray-500 mt-2">aktiv ({stats.totalResellers} gesamt)</p>
              </div>

              {/* Plan */}
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-yellow-500/20 rounded-lg p-6 hover:border-yellow-500/50 transition shadow-lg hover:shadow-yellow-500/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm">🎯 Plan</p>
                  <FaChartBar className="text-yellow-400 text-2xl" />
                </div>
                <p className="text-2xl font-bold text-yellow-400">
                  {developer?.plan || "N/A"}
                </p>
                <p className="text-xs text-gray-500 mt-2">aktueller Plan</p>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Produkte */}
              <div
                onClick={() => navigate("/dev-products")}
                className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-blue-600/30 rounded-lg p-8 hover:border-blue-600/80 hover:shadow-lg hover:shadow-blue-600/20 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <FaBox className="text-4xl text-blue-400" />
                  <h3 className="text-2xl font-bold">Produkte</h3>
                </div>
                <p className="text-gray-400 mb-6">Erstelle und verwalte deine Produkte</p>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold transition w-full">
                  Verwalten →
                </button>
              </div>

              {/* Lizenzen */}
              <div
                onClick={() => navigate("/dev-licenses")}
                className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-green-600/30 rounded-lg p-8 hover:border-green-600/80 hover:shadow-lg hover:shadow-green-600/20 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <FaKey className="text-4xl text-green-400" />
                  <h3 className="text-2xl font-bold">Lizenzen</h3>
                </div>
                <p className="text-gray-400 mb-6">Erstelle und verwalte deine Lizenzen</p>
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold transition w-full">
                  Verwalten →
                </button>
              </div>

              {/* Reseller */}
              <div
                onClick={() => navigate("/dev-resellers")}
                className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-purple-600/30 rounded-lg p-8 hover:border-purple-600/80 hover:shadow-lg hover:shadow-purple-600/20 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <FaUsers className="text-4xl text-purple-400" />
                  <h3 className="text-2xl font-bold">Reseller</h3>
                </div>
                <p className="text-gray-400 mb-6">Verwalte deine Reseller und deren Anfragen</p>
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-bold transition w-full">
                  Ansehen →
                </button>
              </div>
            </div>

            {/* QUICK NAVIGATION */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <button
                onClick={() => navigate("/dev-products")}
                className="bg-[#1A1A1F] hover:bg-[#2C2C34] border border-[#2C2C34] hover:border-blue-500/50 rounded-lg p-4 transition flex items-center gap-2 text-sm font-bold"
              >
                <FaBox className="text-blue-400" /> Produkte
              </button>
              <button
                onClick={() => navigate("/dev-licenses")}
                className="bg-[#1A1A1F] hover:bg-[#2C2C34] border border-[#2C2C34] hover:border-green-500/50 rounded-lg p-4 transition flex items-center gap-2 text-sm font-bold"
              >
                <FaKey className="text-green-400" /> Lizenzen
              </button>
              <button
                onClick={() => navigate("/dev-resellers")}
                className="bg-[#1A1A1F] hover:bg-[#2C2C34] border border-[#2C2C34] hover:border-purple-500/50 rounded-lg p-4 transition flex items-center gap-2 text-sm font-bold"
              >
                <FaUsers className="text-purple-400" /> Reseller
              </button>
              <button
                onClick={() => navigate("/dev-analytics")}
                className="bg-[#1A1A1F] hover:bg-[#2C2C34] border border-[#2C2C34] hover:border-yellow-500/50 rounded-lg p-4 transition flex items-center gap-2 text-sm font-bold"
              >
                <FaChartBar className="text-yellow-400" /> Analytics
              </button>
            </div>

            {/* INFO BOXES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/50 rounded-lg p-6">
                <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                  <FaFire /> Schnellstart
                </h3>
                <ol className="text-sm text-blue-300 space-y-2 text-xs">
                  <li>1️⃣ Gehe zu <strong>Produkte</strong> und erstelle dein erstes Produkt</li>
                  <li>2️⃣ Gehe zu <strong>Lizenzen</strong> und erstelle Lizenzen</li>
                  <li>3️⃣ Gehe zu <strong>Reseller</strong> um Anfragen zu verwalten</li>
                  <li>4️⃣ Überwache alles in deinem Dashboard</li>
                </ol>
              </div>

              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-lg p-6">
                <h3 className="font-bold text-green-400 mb-3 flex items-center gap-2">
                  <FaLightbulb /> Pro-Tipps
                </h3>
                <ul className="text-sm text-green-300 space-y-2 text-xs">
                  <li>✅ Mehrere Produkte = mehr Umsatz</li>
                  <li>✅ Reseller sind dein Vertriebskanal</li>
                  <li>✅ Kommuniziere mit deinen Resellern</li>
                  <li>✅ Überwache Analytics regelmäßig</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}