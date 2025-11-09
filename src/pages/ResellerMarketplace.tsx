// src/pages/ResellerMarketplace.tsx - REDESIGNED: Marktplatz mit neuem Design
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaArrowLeft, FaSearch, FaHandshake, FaShoppingBag, FaStar, FaFilter } from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

type Product = {
  id: string;
  name: string;
  description: string;
  organization_id: string;
  base_price: number;
  reseller_price: number;
  status: string;
};

type Organization = {
  id: string;
  name: string;
  owner_email: string;
};

export default function ResellerMarketplace() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [products, setProducts] = useState<Product[]>([]);
  const [developers, setDevelopers] = useState<Record<string, Organization>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [resellerId, setResellerId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const { data, error: authError } = await supabase.auth.getUser();

        if (authError || !data.user) {
          setLoading(false);
          navigate("/reseller-login", { replace: true });
          return;
        }

        const orgId = (data.user?.user_metadata as any)?.organization_id;
        let reId = (data.user?.user_metadata as any)?.reseller_id;
        const isReseller = (data.user?.user_metadata as any)?.is_reseller;

        if (!orgId || !isReseller) {
          setLoading(false);
          navigate("/reseller-login", { replace: true });
          return;
        }

        if (!reId) {
          const { data: resellerData, error } = await supabase
            .from("resellers")
            .select("id")
            .eq("organization_id", orgId)
            .maybeSingle();

          if (error || !resellerData) {
            setLoading(false);
            navigate("/reseller-register", { replace: true });
            return;
          }

          reId = resellerData.id;
          await supabase.auth.updateUser({
            data: { is_reseller: true, organization_id: orgId, reseller_id: reId },
          });
        }

        setOrganizationId(orgId);
        setResellerId(reId);
        await loadMarketplace();
      } catch (err) {
        setLoading(false);
        console.error("Init error:", err);
      }
    }
    init();
  }, []);

  async function loadMarketplace() {
    setLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      setProducts(productsData || []);

      if (productsData && productsData.length > 0) {
        const developerIds = [...new Set(productsData.map((p) => p.organization_id))];

        const { data: orgsData, error: orgsError } = await supabase
          .from("organizations")
          .select("id, name, owner_email")
          .in("id", developerIds);

        if (!orgsError && orgsData) {
          const devMap: Record<string, Organization> = {};
          orgsData.forEach((org) => {
            devMap[org.id] = org;
          });
          setDevelopers(devMap);
        }
      }
    } catch (err) {
      console.error("Error:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Marketplace konnte nicht geladen werden",
        closeButton: "OK",
      });
    }
    setLoading(false);
  }

  async function handleBecomeReseller(productOrgId: string) {
    if (!resellerId) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Deine Reseller ID konnte nicht geladen werden",
        closeButton: "OK",
      });
      return;
    }

    try {
      const { data: existingRequest } = await supabase
        .from("reseller_requests")
        .select("id, status")
        .eq("developer_id", productOrgId)
        .eq("reseller_id", resellerId)
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          openDialog({
            type: "warning",
            title: "⏳ Anfrage läuft",
            message: "Du hast bereits eine ausstehende Anfrage",
            closeButton: "OK",
          });
          return;
        } else if (existingRequest.status === "accepted") {
          openDialog({
            type: "success",
            title: "✅ Bereits akzeptiert",
            message: "Du bist bereits Reseller!",
            closeButton: "OK",
          });
          return;
        }
      }

      const { error } = await supabase
        .from("reseller_requests")
        .insert({
          reseller_id: resellerId,
          developer_id: productOrgId,
          status: "pending",
        });

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Anfrage versendet!",
        message: "Der Developer wird sie überprüfen",
        closeButton: "OK",
      });

      setTimeout(() => loadMarketplace(), 1500);
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      developers[p.organization_id]?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-4 animate-spin">⏳</div>
          <p>Lädt Marketplace...</p>
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
        <div className="ml-0 md:ml-64 bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border-b border-[#00FF9C]/20 p-6 sticky top-0 z-40 shadow-lg shadow-[#00FF9C]/10">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate("/reseller-dashboard")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition mb-4 text-sm"
            >
              <FaArrowLeft /> Zurück
            </button>
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
                <div className="p-3 bg-[#00FF9C]/20 rounded-lg">
                  <FaShoppingBag className="text-[#00FF9C] text-2xl" />
                </div>
                Developer Marketplace
              </h1>
              <p className="text-gray-400">Finde Developer und werde ihr Reseller</p>
            </div>
          </div>
        </div>

        <div className="ml-0 md:ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            {/* SEARCH & FILTER */}
            <div className="mb-8">
              <div className="relative">
                <FaSearch className="absolute left-4 top-3 text-[#00FF9C]" />
                <input
                  type="text"
                  placeholder="Nach Produkten oder Developer suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#1A1A1F] border border-[#2C2C34] rounded-lg focus:border-[#00FF9C] focus:shadow-lg focus:shadow-[#00FF9C]/20 outline-none transition"
                />
              </div>
              <p className="text-sm text-gray-400 mt-3">
                🎯 {filtered.length} Produkt{filtered.length !== 1 ? "e" : ""} gefunden
              </p>
            </div>

            {/* PRODUCTS GRID */}
            {filtered.length === 0 ? (
              <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#2C2C34] rounded-lg p-12 text-center">
                <FaShoppingBag className="text-6xl mb-4 mx-auto opacity-30 text-gray-400" />
                <p className="text-xl font-semibold mb-2">Keine Produkte gefunden</p>
                <p className="text-gray-400">Versuche eine andere Suche</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((product) => {
                  const dev = developers[product.organization_id];
                  const profit = product.reseller_price - product.base_price;
                  const profitPercent = ((profit / product.base_price) * 100).toFixed(0);

                  return (
                    <div
                      key={product.id}
                      className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C]/50 hover:shadow-lg hover:shadow-[#00FF9C]/10 transition flex flex-col h-full"
                    >
                      {/* Header mit Developer Badge */}
                      <div className="mb-4 pb-4 border-b border-[#2C2C34]">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-2xl font-bold">{product.name}</h3>
                          <FaStar className="text-yellow-400" />
                        </div>
                        <p className="text-sm text-[#00FF9C] font-semibold">
                          👨‍💼 {dev?.name || "Developer"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{dev?.owner_email}</p>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-300 mb-4 line-clamp-2 flex-1">
                        {product.description || "Keine Beschreibung vorhanden"}
                      </p>

                      {/* Price Info */}
                      <div className="space-y-3 mb-6 bg-[#0E0E12]/50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">💳 Einkaufspreis</span>
                          <span className="text-lg font-bold text-gray-300">
                            €{product.base_price}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">📊 Dein Verkaufspreis</span>
                          <span className="text-lg font-bold text-[#00FF9C]">
                            €{product.reseller_price}
                          </span>
                        </div>
                        <div className="border-t border-[#2C2C34] pt-3 flex justify-between items-center">
                          <span className="text-[#00FF9C] font-bold text-sm">💰 Gewinn pro Key</span>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-400">€{profit.toFixed(2)}</p>
                            <p className="text-xs text-green-400">{profitPercent}% Margin</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleBecomeReseller(product.organization_id)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-[#00FF9C] to-[#00E88A] text-[#0E0E12] rounded-lg font-bold hover:shadow-lg hover:shadow-[#00FF9C]/30 transition flex items-center justify-center gap-2"
                      >
                        <FaHandshake /> Reseller werden
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* INFO */}
            <div className="mt-12 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 rounded-lg p-6">
              <h3 className="font-bold text-blue-400 mb-4 flex items-center gap-2">
                ℹ️ Wie werde ich Reseller?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-300">
                <div>
                  <p className="font-bold mb-2">📋 5 Schritte zum Erfolg:</p>
                  <ol className="space-y-1 text-xs">
                    <li>1️⃣ Wähle ein Produkt aus</li>
                    <li>2️⃣ Klick "Reseller werden"</li>
                    <li>3️⃣ Warte auf Bestätigung</li>
                    <li>4️⃣ Kaufe Keys ins Lager</li>
                    <li>5️⃣ Verkaufe & verdiene!</li>
                  </ol>
                </div>
                <div>
                  <p className="font-bold mb-2">💡 Pro-Tipps:</p>
                  <ul className="space-y-1 text-xs">
                    <li>✅ Diverse Produkte = mehr Umsatz</li>
                    <li>✅ Beliebte Produkte zuerst</li>
                    <li>✅ Mit Developern kommunizieren</li>
                    <li>✅ Preislich konkurrenzfähig bleiben</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}