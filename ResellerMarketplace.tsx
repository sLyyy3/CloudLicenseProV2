// src/pages/ResellerMarketplace.tsx - FIXED: Auto-lookup reseller_id from DB
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaArrowLeft, FaSearch, FaHandshake, FaShoppingBag } from "react-icons/fa";
import { useDialog } from "../components/Dialog";

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
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;
      let reId = (data.user?.user_metadata as any)?.reseller_id;
      const isReseller = (data.user?.user_metadata as any)?.is_reseller;

      console.log("🔍 Reseller Marketplace Init");
      console.log("   Org ID:", orgId);
      console.log("   Reseller ID (from metadata):", reId);
      console.log("   Is Reseller:", isReseller);

      if (!orgId || !isReseller) {
        console.log("❌ Not a reseller, redirecting...");
        navigate("/reseller-login", { replace: true });
        return;
      }

      // Falls reseller_id fehlt, suche sie in der DB
      if (!reId) {
        console.log("⚠️ No reseller_id in metadata, looking up in DB...");
        try {
          const { data: resellerData, error } = await supabase
            .from("resellers")
            .select("id")
            .eq("organization_id", orgId)
            .single();

          if (error) {
            console.error("❌ Error looking up reseller:", error);
            openDialog({
              type: "error",
              title: "❌ Problem",
              message: "Dein Reseller Account konnte nicht gefunden werden. Bitte registriere dich neu.",
              closeButton: "OK",
            });
            setTimeout(() => navigate("/reseller-register", { replace: true }), 2000);
            return;
          }

          if (resellerData) {
            reId = resellerData.id;
            console.log("✅ Found reseller_id in DB:", reId);

            // Speichere reseller_id im Metadata für nächste Male
            console.log("💾 Saving reseller_id to metadata...");
            await supabase.auth.updateUser({
              data: {
                is_reseller: true,
                organization_id: orgId,
                reseller_id: reId,
              },
            });
            console.log("✅ Metadata updated");
          }
        } catch (err) {
          console.error("❌ Error during lookup:", err);
          openDialog({
            type: "error",
            title: "❌ Fehler",
            message: "Ein Fehler ist aufgetreten",
            closeButton: "OK",
          });
          return;
        }
      }

      setOrganizationId(orgId);
      setResellerId(reId);
      await loadMarketplace();
    }
    init();
  }, []);

  async function loadMarketplace() {
    setLoading(true);
    try {
      // 1. Lade alle aktiven Produkte
      console.log("📦 Loading active products...");
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (productsError) {
        console.error("❌ Products Error:", productsError);
        throw productsError;
      }

      console.log("✅ Got products:", productsData?.length || 0);
      setProducts(productsData || []);

      // 2. Lade Developer Info
      if (productsData && productsData.length > 0) {
        console.log("👨‍💻 Loading developer info...");

        const developerIds = [...new Set(productsData.map((p) => p.organization_id))];

        const { data: orgsData, error: orgsError } = await supabase
          .from("organizations")
          .select("id, name, owner_email")
          .in("id", developerIds);

        if (orgsError) {
          console.error("❌ Orgs Error:", orgsError);
        } else {
          console.log("✅ Got developer info:", orgsData?.length || 0);

          const devMap: Record<string, Organization> = {};
          orgsData?.forEach((org) => {
            devMap[org.id] = org;
          });
          setDevelopers(devMap);
        }
      }
    } catch (err) {
      console.error("❌ Error loading marketplace:", err);
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
      console.error("❌ No reseller_id!");
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Deine Reseller ID konnte nicht geladen werden",
        closeButton: "OK",
      });
      return;
    }

    try {
      console.log("🤝 Sending reseller request...");
      console.log("   Reseller ID:", resellerId);
      console.log("   Developer ID:", productOrgId);

      // Prüfe ob bereits eine Anfrage existiert
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
            title: "⏳ Anfrage läuft noch",
            message: "Du hast bereits eine ausstehende Anfrage bei diesem Developer",
            closeButton: "OK",
          });
          return;
        } else if (existingRequest.status === "accepted") {
          openDialog({
            type: "success",
            title: "✅ Bereits akzeptiert",
            message: "Du bist bereits Reseller bei diesem Developer",
            closeButton: "OK",
          });
          return;
        }
      }

      // Sende neue Anfrage
      const { error } = await supabase
        .from("reseller_requests")
        .insert({
          reseller_id: resellerId,
          developer_id: productOrgId,
          status: "pending",
        });

      if (error) {
        console.error("❌ Insert Error:", error);
        throw error;
      }

      console.log("✅ Request sent successfully!");

      openDialog({
        type: "success",
        title: "✅ Anfrage versendet!",
        message: (
          <div className="text-left space-y-2">
            <p>Deine Anfrage wurde an den Developer gesendet.</p>
            <p className="text-sm text-gray-400">
              Der Developer wird sie überprüfen und akzeptieren oder ablehnen.
            </p>
          </div>
        ),
        closeButton: "OK",
      });

      setTimeout(() => loadMarketplace(), 1500);
    } catch (err: any) {
      console.error("❌ Error:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message || "Anfrage konnte nicht versendet werden",
        closeButton: "OK",
      });
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      developers[p.organization_id]?.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⏳</div>
          <p>Lädt Marketplace...</p>
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
              onClick={() => navigate("/reseller-dashboard")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition mb-4"
            >
              <FaArrowLeft /> Zurück zum Dashboard
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FaShoppingBag className="text-[#00FF9C]" />
              Developer Marketplace
            </h1>
            <p className="text-gray-400 mt-1">
              Finde Developer und werde ihr Reseller um Keys zu verkaufen
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {/* SEARCH */}
          <div className="mb-8">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Nach Produkten oder Developer suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {filtered.length} Produkt{filtered.length !== 1 ? "e" : ""} gefunden
            </p>
          </div>

          {/* PRODUCTS GRID */}
          {filtered.length === 0 ? (
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 text-center">
              <FaShoppingBag className="text-4xl mb-4 mx-auto opacity-50 text-gray-400" />
              <p className="text-lg font-semibold mb-2">Keine Produkte gefunden</p>
              <p className="text-gray-400">
                Versuche eine andere Suche oder komme später wieder
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((product) => {
                const dev = developers[product.organization_id];
                return (
                  <div
                    key={product.id}
                    className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C] transition flex flex-col"
                  >
                    {/* Product Info */}
                    <div className="flex-1 mb-4">
                      <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                      <p className="text-xs text-gray-400 mb-3">
                        von <strong>{dev?.name || "Unbekannter Developer"}</strong>
                      </p>
                      <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                        {product.description || "Keine Beschreibung"}
                      </p>
                    </div>

                    {/* Prices */}
                    <div className="bg-[#2C2C34] rounded p-3 mb-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Base Preis:</span>
                        <span className="font-bold text-[#00FF9C]">
                          €{product.base_price}
                        </span>
                      </div>
                      {product.reseller_price && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Dein Preis:</span>
                          <span className="font-bold text-blue-400">
                            €{product.reseller_price}
                          </span>
                        </div>
                      )}
                      <div className="text-xs text-green-400 pt-2 border-t border-[#3C3C44]">
                        💰 Gewinn pro Key: €{(product.reseller_price - product.base_price).toFixed(2)}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleBecomeReseller(product.organization_id)}
                      className="w-full px-4 py-2 bg-[#00FF9C] text-[#0E0E12] rounded font-bold hover:bg-[#00cc80] transition flex items-center justify-center gap-2"
                    >
                      <FaHandshake /> Reseller werden
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* INFO BOX */}
          <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-6 mt-12">
            <h3 className="font-bold text-blue-400 mb-3">ℹ️ Wie werde ich Reseller?</h3>
            <ol className="text-sm text-blue-300 space-y-2">
              <li>1. 👀 Wähle ein Produkt aus der Liste</li>
              <li>2. 🤝 Klick "Reseller werden"</li>
              <li>3. ⏳ Warte auf Bestätigung vom Developer</li>
              <li>4. ✅ Nach Bestätigung kannst du Keys kaufen</li>
              <li>5. 💰 Verkaufe die Keys und verdiene Geld!</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}