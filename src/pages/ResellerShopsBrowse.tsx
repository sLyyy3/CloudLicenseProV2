// src/pages/ResellerShopsBrowse.tsx - BROWSE ALL RESELLER SHOPS
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaStore, FaArrowRight, FaCheckCircle, FaStar } from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type ResellerWithProducts = {
  id: string;
  shop_name: string;
  organization_id: string;
  created_at: string;
  product_count: number;
  total_sales: number;
};

export default function ResellerShopsBrowse() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [resellers, setResellers] = useState<ResellerWithProducts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResellers() {
      setLoading(true);
      try {
        // Load all resellers with product counts
        const { data: resellersData, error: resellersError } = await supabase
          .from("resellers")
          .select("*")
          .order("created_at", { ascending: false });

        if (resellersError) throw resellersError;

        // For each reseller, get product count and sales
        const resellersWithData = await Promise.all(
          (resellersData || []).map(async (reseller) => {
            // Get product count (only available products)
            const { count: productCount } = await supabase
              .from("reseller_products")
              .select("*", { count: "exact", head: true })
              .eq("reseller_id", reseller.id)
              .gt("quantity_available", 0);

            // Get total sales from reseller_products.quantity_sold instead of reseller_sales table
            let totalSales = 0;
            const { data: productsData } = await supabase
              .from("reseller_products")
              .select("quantity_sold")
              .eq("reseller_id", reseller.id);

            if (productsData) {
              totalSales = productsData.reduce((sum, p) => sum + (p.quantity_sold || 0), 0);
            }

            return {
              id: reseller.id,
              shop_name: reseller.shop_name,
              organization_id: reseller.organization_id,
              created_at: reseller.created_at,
              product_count: productCount || 0,
              total_sales: totalSales,
            };
          })
        );

        // Filter only resellers with available products
        const activeResellers = resellersWithData.filter((r) => r.product_count > 0);

        setResellers(activeResellers);
      } catch (err: any) {
        console.error("Error loading resellers:", err);
        openDialog({
          type: "error",
          title: "❌ Fehler",
          message: "Reseller Shops konnten nicht geladen werden",
          closeButton: "OK",
        });
      }
      setLoading(false);
    }

    loadResellers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🛒</div>
          <p className="text-xl">Lädt Shops...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#1A1A1F] via-[#2C2C34] to-[#1A1A1F] border-b border-[#00FF9C]/20 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-5xl font-black bg-gradient-to-r from-[#00FF9C] via-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
              🛒 Reseller Shops
            </h1>
            <p className="text-gray-400 text-lg">Kaufe License Keys direkt von verifizierten Resellern</p>
          </div>
        </div>

        {/* CONTENT */}
        <div className="max-w-7xl mx-auto p-8">
          {/* INFO BANNER */}
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/20 p-4 rounded-xl">
                <FaCheckCircle className="text-blue-400 text-3xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-blue-400 mb-2">Verifizierte Partner</h2>
                <p className="text-blue-300 text-sm">
                  Alle Reseller sind offiziell autorisiert. Du erhältst 100% originale License Keys.
                </p>
              </div>
            </div>
          </div>

          {/* RESELLER GRID */}
          {resellers.length === 0 ? (
            <div className="text-center py-12">
              <FaStore className="text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Momentan keine Reseller Shops verfügbar</p>
            </div>
          ) : (
            <div>
              <h2 className="text-3xl font-bold mb-6">📦 Verfügbare Shops ({resellers.length})</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resellers.map((reseller) => (
                  <div
                    key={reseller.id}
                    className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-6 hover:border-[#00FF9C] transition shadow-xl cursor-pointer group"
                    onClick={() => navigate(`/reseller-shop/${reseller.id}`)}
                  >
                    {/* SHOP HEADER */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-[#00FF9C]/20 p-3 rounded-xl group-hover:bg-[#00FF9C]/30 transition">
                        <FaStore className="text-[#00FF9C] text-2xl" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1 group-hover:text-[#00FF9C] transition">
                          {reseller.shop_name}
                        </h3>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <FaCheckCircle className="text-green-400" /> Verifiziert
                        </p>
                      </div>
                    </div>

                    {/* STATS */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-[#2C2C34] rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Produkte</p>
                        <p className="text-2xl font-bold text-blue-400">{reseller.product_count}</p>
                      </div>
                      <div className="bg-[#2C2C34] rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Verkäufe</p>
                        <p className="text-2xl font-bold text-[#00FF9C]">{reseller.total_sales}</p>
                      </div>
                    </div>

                    {/* RATING */}
                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} className="text-yellow-400" />
                      ))}
                      <span className="text-sm text-gray-400 ml-2">(5.0)</span>
                    </div>

                    {/* BUTTON */}
                    <button
                      onClick={() => navigate(`/reseller-shop/${reseller.id}`)}
                      className="w-full py-3 bg-gradient-to-r from-[#00FF9C] to-green-500 text-[#0E0E12] hover:from-[#00cc80] hover:to-green-600 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg group-hover:shadow-[#00FF9C]/50"
                    >
                      Shop besuchen <FaArrowRight />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BENEFITS */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/50 rounded-2xl p-6">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-xl font-bold text-green-400 mb-2">100% Original</h3>
              <p className="text-green-300 text-sm">
                Alle Keys stammen direkt vom Entwickler
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-2 border-blue-500/50 rounded-2xl p-6">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-xl font-bold text-blue-400 mb-2">Sofort verfügbar</h3>
              <p className="text-blue-300 text-sm">
                Keys werden direkt nach dem Kauf geliefert
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 rounded-2xl p-6">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="text-xl font-bold text-purple-400 mb-2">Sicher</h3>
              <p className="text-purple-300 text-sm">
                Sichere Zahlung und verschlüsselte Übertragung
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
