// src/pages/DeveloperDashboard.tsx - WITH HOME BACK BUTTON + LICENSE INFO
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaArrowLeft,
  FaKey,
  FaChartBar,
  FaSignOutAlt,
  FaBox,
  FaHandshake,
  FaUsers,
  FaFileAlt,
  FaCog,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHome,
  FaInfoCircle,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type Organization = {
  id: string;
  name: string;
  plan: string;
  created_at: string;
};

type DashboardStats = {
  total_licenses: number;
  active_licenses: number;
  expired_licenses: number;
  total_customers: number;
  total_products: number;
};

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [org, setOrg] = useState<Organization | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    total_licenses: 0,
    active_licenses: 0,
    expired_licenses: 0,
    total_customers: 0,
    total_products: 0,
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
      await loadData(orgId);
    }
    init();
  }, []);

  async function loadData(orgId: string) {
    setLoading(true);
    try {
      // Load Organization
      const { data: orgData } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();

      if (orgData) setOrg(orgData);

      // Load Licenses
      const { data: licensesData } = await supabase
        .from("licenses")
        .select("status")
        .eq("organization_id", orgId);

      // Load Customers (Unique Emails)
      const { data: customersData } = await supabase
        .from("licenses")
        .select("customer_email")
        .eq("organization_id", orgId)
        .not("customer_email", "is", null);

      // Load Products
      const { data: productsData } = await supabase
        .from("products")
        .select("id")
        .eq("organization_id", orgId);

      if (licensesData) {
        const active = licensesData.filter((l) => l.status === "active").length;
        const expired = licensesData.filter(
          (l) => l.status === "expired"
        ).length;

        setStats({
          total_licenses: licensesData.length,
          active_licenses: active,
          expired_licenses: expired,
          total_customers: new Set(
            customersData?.map((c) => c.customer_email)
          ).size,
          total_products: productsData?.length || 0,
        });
      }
    } catch (err) {
      console.error("Error loading data:", err);
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
          <div className="mb-4 text-2xl">⏳</div>
          <p>Lädt Dashboard...</p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    {
      name: "Produkte",
      icon: FaBox,
      path: "/dev-products",
      color: "text-blue-400",
      description: "Verwalte deine Produkte",
    },
    {
      name: "Lizenzen",
      icon: FaKey,
      path: "/dev-licenses",
      color: "text-[#00FF9C]",
      description: "Erstelle und verwalte Keys",
    },
    {
      name: "Customers",
      icon: FaUsers,
      path: "/dev-customers",
      color: "text-purple-400",
      description: "Sehe deine Kunden",
    },
    {
      name: "Analytics",
      icon: FaChartBar,
      path: "/dev-analytics",
      color: "text-green-400",
      description: "Statistiken & Reports",
    },
    {
      name: "Reseller",
      icon: FaHandshake,
      path: "/dev-resellers",
      color: "text-yellow-400",
      description: "Verwalte Reseller",
    },
    {
      name: "API Keys",
      icon: FaCog,
      path: "/dev-api-keys",
      color: "text-pink-400",
      description: "Deine API Keys",
    },
  ];

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        {/* HEADER - WITH HOME BUTTON */}
        <div className="bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border-b border-[#3C3C44] p-6 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
            {/* LEFT: HOME + TITLE */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-4 py-2 bg-[#00FF9C] text-[#0E0E12] rounded-lg font-bold hover:bg-[#00cc80] transition"
                title="Zurück zur Landing Page"
              >
                <FaHome /> Home
              </button>
              <div className="border-l border-[#3C3C44] pl-4">
                <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                  <FaKey className="text-[#00FF9C]" />
                  Developer Dashboard
                </h1>
                <p className="text-gray-400">
                  Welcome back! 👋 <strong>{org?.name}</strong> • Plan:{" "}
                  <span className="uppercase font-bold text-[#00FF9C]">
                    {org?.plan}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-end">
              <button
                onClick={() => navigate("/dev-billing")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold flex items-center gap-2 transition"
              >
                <FaFileAlt /> Billing
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
          {/* KEY METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C] transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Gesamt Keys</p>
                <FaKey className="text-[#00FF9C] text-2xl" />
              </div>
              <p className="text-4xl font-bold text-[#00FF9C]">
                {stats.total_licenses}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {stats.active_licenses} aktiv
              </p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-green-400 transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Aktive Keys</p>
                <FaCheckCircle className="text-green-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-green-400">
                {stats.active_licenses}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {Math.round(
                  (stats.active_licenses / Math.max(stats.total_licenses, 1)) *
                    100
                )}
                % aktiv
              </p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-blue-400 transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Produkte</p>
                <FaBox className="text-blue-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-blue-400">
                {stats.total_products}
              </p>
              <p className="text-xs text-gray-500 mt-2">Zum Verkauf</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-purple-400 transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Kunden</p>
                <FaUsers className="text-purple-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-purple-400">
                {stats.total_customers}
              </p>
              <p className="text-xs text-gray-500 mt-2">Unique</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-red-400 transition">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Abgelaufen</p>
                <FaExclamationTriangle className="text-red-400 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-red-400">
                {stats.expired_licenses}
              </p>
              <p className="text-xs text-gray-500 mt-2">Zu erneuern</p>
            </div>
          </div>

          {/* MAIN NAVIGATION */}
          <h2 className="text-2xl font-bold mb-6">🚀 Schneller Zugriff</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C] hover:shadow-[0_0_20px_rgba(0,255,156,0.2)] transition cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Icon className={`text-3xl ${item.color}`} />
                    <span className="text-xs bg-[#2C2C34] px-2 py-1 rounded group-hover:bg-[#00FF9C] group-hover:text-[#0E0E12] transition">
                      Öffnen →
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              );
            })}
          </div>

          {/* LICENSE EXPLANATION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* What are Licenses? */}
            <div className="bg-blue-600/10 border border-blue-600 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-blue-400 mb-6 flex items-center gap-2">
                <FaInfoCircle /> Was sind Lizenzen?
              </h3>
              <div className="space-y-4 text-sm text-blue-300">
                <p>
                  <strong>Lizenzen (Keys)</strong> sind eindeutige Codes, die Kunden in deinen Produkten eingeben können, um diese freizuschalten oder zu aktivieren.
                </p>

                <div className="bg-blue-600/20 rounded p-3 border-l-4 border-blue-400">
                  <p className="font-bold mb-2">🎯 Beispiel:</p>
                  <p className="text-xs">
                    Du verkaufst "MyGame Pro" → Kunde kauft eine Lizenz → Erhält Key "GAME-XXXX-XXXX" → Gibt den Key im Spiel ein → Spiel wird freigeschaltet
                  </p>
                </div>

                <div className="space-y-2">
                  <p><strong>✅ Was der Kunde damit machen kann:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Den Key im Produkt eingeben</li>
                    <li>• Das Produkt/Spiel freischalten</li>
                    <li>• Features/Inhalte aktivieren</li>
                    <li>• Dauer: Je nach Lizenztyp (1 Tag - Lebenszeit)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-green-600/10 border border-green-600 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-green-400 mb-6">📋 Nächste Schritte</h3>
              <ol className="space-y-4 text-sm text-green-300">
                <li className="flex gap-3">
                  <span className="font-bold text-green-400 flex-shrink-0">1.</span>
                  <span>
                    Erstelle dein erstes{" "}
                    <button
                      onClick={() => navigate("/dev-products")}
                      className="text-green-200 hover:underline font-bold"
                    >
                      Produkt
                    </button>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-green-400 flex-shrink-0">2.</span>
                  <span>
                    Definiere einen Preis für dein Produkt
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-green-400 flex-shrink-0">3.</span>
                  <span>
                    Generiere{" "}
                    <button
                      onClick={() => navigate("/dev-licenses")}
                      className="text-green-200 hover:underline font-bold"
                    >
                      Lizenzen Keys
                    </button>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-green-400 flex-shrink-0">4.</span>
                  <span>
                    Kopiere dein{" "}
                    <button
                      onClick={() => navigate("/dev-api-keys")}
                      className="text-green-200 hover:underline font-bold"
                    >
                      API Key
                    </button>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-green-400 flex-shrink-0">5.</span>
                  <span>
                    Integriere die API in dein Programm zur Validierung
                  </span>
                </li>
              </ol>
            </div>
          </div>

          {/* FEATURES */}
          <div className="bg-purple-600/10 border border-purple-600 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-purple-400 mb-6">✨ Was du als Developer machen kannst</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ul className="space-y-3 text-sm text-purple-300">
                <li className="flex gap-2">
                  <span>✅</span>
                  <span>Mehrere Produkte erstellen und verwalten</span>
                </li>
                <li className="flex gap-2">
                  <span>✅</span>
                  <span>Bulk Lizenzen generieren</span>
                </li>
                <li className="flex gap-2">
                  <span>✅</span>
                  <span>Reseller akzeptieren und verwalten</span>
                </li>
                <li className="flex gap-2">
                  <span>✅</span>
                  <span>Keys tracken und deaktivieren</span>
                </li>
              </ul>
              <ul className="space-y-3 text-sm text-purple-300">
                <li className="flex gap-2">
                  <span>✅</span>
                  <span>Kunden und Statistiken überwachen</span>
                </li>
                <li className="flex gap-2">
                  <span>✅</span>
                  <span>API für automatische Validierung nutzen</span>
                </li>
                <li className="flex gap-2">
                  <span>✅</span>
                  <span>Pricing und Reseller-Provisionen steuern</span>
                </li>
                <li className="flex gap-2">
                  <span>✅</span>
                  <span>Premium Support und Updates erhalten</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}