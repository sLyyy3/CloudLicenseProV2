// src/pages/DeveloperCustomers.tsx - CUSTOMERS MANAGEMENT
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaArrowLeft, FaUsers, FaSearch, FaEnvelope } from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type Customer = {
  email: string;
  product_names: string[];
  license_count: number;
  created_at: string;
};

export default function DeveloperCustomers() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
      await loadCustomers(orgId);
    }
    init();
  }, []);

  async function loadCustomers(orgId: string) {
    setLoading(true);
    try {
      // Lade alle Lizenzen mit Customer Email
      const { data: licenseData } = await supabase
        .from("licenses")
        .select("customer_email, product_id")
        .eq("organization_id", orgId);

      if (!licenseData) {
        setLoading(false);
        return;
      }

      // Lade Product Namen
      const { data: productData } = await supabase
        .from("products")
        .select("id, name")
        .eq("organization_id", orgId);

      // Gruppiere nach Customer Email
      const customerMap = new Map<string, Set<string>>();
      const licenseCounts = new Map<string, number>();

      licenseData.forEach((lic: any) => {
        const email =
          lic.customer_email || "Nicht zugewiesen";
        const productId = lic.product_id;

        if (!customerMap.has(email)) {
          customerMap.set(email, new Set());
          licenseCounts.set(email, 0);
        }

        const product = productData?.find((p) => p.id === productId);
        if (product) {
          customerMap.get(email)?.add(product.name);
        }

        licenseCounts.set(email, (licenseCounts.get(email) || 0) + 1);
      });

      // Konvertiere zu Array
      const customersArray: Customer[] = Array.from(customerMap.entries()).map(
        ([email, products]) => ({
          email,
          product_names: Array.from(products),
          license_count: licenseCounts.get(email) || 0,
          created_at: new Date().toISOString(),
        })
      );

      setCustomers(customersArray.sort((a, b) => b.license_count - a.license_count));
    } catch (err) {
      console.error("Error loading customers:", err);
    }
    setLoading(false);
  }

  const stats = {
    total: customers.length,
    withEmail: customers.filter((c) => c.email !== "Nicht zugewiesen").length,
    totalLicenses: customers.reduce((sum, c) => sum + c.license_count, 0),
  };

  const filtered = customers.filter(
    (c) =>
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.product_names.some((p) =>
        p.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⏳</div>
          <p>Lädt Kunden...</p>
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
              <FaUsers className="text-[#00FF9C]" />
              Customers
            </h1>
            <p className="text-gray-400 mt-1">
              Sehe welche Kunden deine Lizenzen haben
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <p className="text-gray-400 text-sm">Gesamt Kunden</p>
              <p className="text-4xl font-bold text-[#00FF9C]">{stats.withEmail}</p>
              <p className="text-xs text-gray-500 mt-2">
                + {stats.total - stats.withEmail} ohne Email
              </p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <p className="text-gray-400 text-sm">Gesamt Lizenzen</p>
              <p className="text-4xl font-bold text-blue-400">
                {stats.totalLicenses}
              </p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <p className="text-gray-400 text-sm">Ø Lizenzen/Kunde</p>
              <p className="text-4xl font-bold text-green-400">
                {(stats.totalLicenses / Math.max(stats.total, 1)).toFixed(1)}
              </p>
            </div>
          </div>

          {/* SEARCH */}
          <div className="mb-6 relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Nach Email oder Produkt suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
            />
          </div>

          {/* CUSTOMERS LIST */}
          {filtered.length === 0 ? (
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 text-center text-gray-400">
              <FaUsers className="text-4xl mb-4 mx-auto opacity-50" />
              <p className="text-lg font-semibold mb-2">Keine Kunden</p>
              <p className="text-sm">
                Erstelle Lizenzen um Kunden hier zu sehen
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((customer, idx) => (
                <div
                  key={idx}
                  className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-purple-600 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <FaEnvelope className="text-[#00FF9C]" />
                        {customer.email === "Nicht zugewiesen" ? (
                          <span className="text-gray-400 italic">
                            Keine Email zugewiesen
                          </span>
                        ) : (
                          <a
                            href={`mailto:${customer.email}`}
                            className="font-bold text-blue-400 hover:underline"
                          >
                            {customer.email}
                          </a>
                        )}
                      </div>

                      <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-2">
                          Gekaufte Produkte:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {customer.product_names.map((product, i) => (
                            <span
                              key={i}
                              className="text-xs bg-purple-600 text-white px-3 py-1 rounded"
                            >
                              {product}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-2">Lizenzen</p>
                      <p className="text-3xl font-bold text-green-400">
                        {customer.license_count}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TOP CUSTOMERS */}
          {customers.length > 0 && (
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 mt-12">
              <h2 className="text-2xl font-bold mb-6">🏆 Top Kunden</h2>

              <div className="space-y-3">
                {customers
                  .slice(0, 5)
                  .map((customer, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-[#2C2C34] p-4 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-[#00FF9C] w-8">
                          {idx + 1}.
                        </div>
                        <div>
                          <p className="font-bold">
                            {customer.email === "Nicht zugewiesen"
                              ? "Nicht zugewiesen"
                              : customer.email}
                          </p>
                          <p className="text-xs text-gray-400">
                            {customer.product_names.slice(0, 2).join(", ")}
                            {customer.product_names.length > 2
                              ? ` +${customer.product_names.length - 2}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">
                          {customer.license_count}
                        </p>
                        <p className="text-xs text-gray-400">Keys</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* INFO */}
          <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-6 mt-12">
            <h3 className="font-bold text-blue-400 mb-3">💡 Kunden-Tipps</h3>
            <ul className="text-sm text-blue-300 space-y-2">
              <li>
                ✅ Ergänze Kunden-Emails bei Lizenz-Erstellung für besseres
                Tracking
              </li>
              <li>
                ✅ Sehe schnell welche Produkte beliebt sind (Top Kunden)
              </li>
              <li>✅ Exportiere diese Liste später als CSV</li>
              <li>✅ Nutze die Daten für Vermarktung und Support</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
