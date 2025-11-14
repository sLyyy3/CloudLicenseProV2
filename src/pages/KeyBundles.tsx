// src/pages/KeyBundles.tsx - KEY BUNDLES MIT RABATT
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FaGift, FaPercent, FaShoppingCart } from "react-icons/fa";

type Bundle = {
  id: string;
  name: string;
  description: string;
  items: { product_id: string; quantity: number }[];
  bundle_price: number;
  regular_price: number;
  discount_percent: number;
  image?: string;
};

export default function KeyBundles() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Bundle[]>([]);

  useEffect(() => {
    loadBundles();
  }, []);

  async function loadBundles() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("key_bundles").select("*");

      if (error) throw error;

      // Beispiel Bundles wenn leer
      if (!data || data.length === 0) {
        const exampleBundles: Bundle[] = [
          {
            id: "1",
            name: "🎮 Gamer Pack",
            description: "Perfekt für Gaming! Alle beliebten Tools.",
            items: [
              { product_id: "aimbot", quantity: 2 },
              { product_id: "wallhack", quantity: 1 },
              { product_id: "esp", quantity: 1 },
            ],
            bundle_price: 49.99,
            regular_price: 69.99,
            discount_percent: 29,
          },
          {
            id: "2",
            name: "📹 Creator Bundle",
            description: "Alles für Content Creators!",
            items: [
              { product_id: "videoedit", quantity: 3 },
              { product_id: "screenrecord", quantity: 2 },
            ],
            bundle_price: 39.99,
            regular_price: 54.99,
            discount_percent: 27,
          },
          {
            id: "3",
            name: "🚀 Pro Bundle",
            description: "Das komplette Pro-Paket!",
            items: [
              { product_id: "aimbot", quantity: 5 },
              { product_id: "videoedit", quantity: 5 },
              { product_id: "other", quantity: 5 },
            ],
            bundle_price: 149.99,
            regular_price: 219.99,
            discount_percent: 32,
          },
        ];
        setBundles(exampleBundles);
      } else {
        setBundles(data);
      }
    } catch (err) {
      console.error("Error loading bundles:", err);
    }
    setLoading(false);
  }

  function addBundleToCart(bundle: Bundle) {
    setCart([...cart, bundle]);
    alert(`✅ ${bundle.name} zum Warenkorb hinzugefügt!`);
  }

  const cartTotal = cart.reduce((sum, b) => sum + b.bundle_price, 0);
  const regularTotal = cart.reduce((sum, b) => sum + b.regular_price, 0);
  const totalSavings = regularTotal - cartTotal;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <p>Lädt Bundles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
      {/* HEADER */}
      <div className="bg-[#1A1A1F] border-b border-[#2C2C34] p-6 mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <FaGift className="text-[#00FF9C]" />
            🎁 Key Bundles - Sparen Sie mehr!
          </h1>
          <p className="text-gray-400">
            Kaufen Sie mehrere Keys zusammen und erhalten Sie großartige Rabatte
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* BUNDLES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C] transition relative"
            >
              {/* DISCOUNT BADGE */}
              <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 rounded-full flex items-center gap-1">
                <FaPercent className="text-sm" />
                <span className="font-bold">{bundle.discount_percent}%</span>
              </div>

              <h3 className="text-xl font-bold mb-2">{bundle.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{bundle.description}</p>

              {/* ITEMS IN BUNDLE */}
              <div className="bg-[#2C2C34] rounded p-3 mb-4">
                <p className="text-xs text-gray-400 mb-2">📦 Enthält:</p>
                <ul className="text-sm space-y-1">
                  {bundle.items.map((item, idx) => (
                    <li key={idx}>
                      • {item.quantity}x {item.product_id}
                    </li>
                  ))}
                </ul>
              </div>

              {/* PRICES */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Normalpreis:</span>
                  <span className="line-through text-gray-500">
                    €{bundle.regular_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Bundle Preis:</span>
                  <span className="text-[#00FF9C]">€{bundle.bundle_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-400">
                  <span>💚 Du sparst:</span>
                  <span className="font-bold">
                    €{(bundle.regular_price - bundle.bundle_price).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => addBundleToCart(bundle)}
                className="w-full px-4 py-2 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] rounded font-bold flex items-center justify-center gap-2 transition"
              >
                <FaShoppingCart /> Bundle kaufen
              </button>
            </div>
          ))}
        </div>

        {/* CART SUMMARY */}
        {cart.length > 0 && (
          <div className="bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border border-[#00FF9C] rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">📦 Warenkorb ({cart.length})</h2>

            <div className="space-y-2 mb-4">
              {cart.map((bundle, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{bundle.name}</span>
                  <span className="font-bold">€{bundle.bundle_price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#3C3C44] pt-4 space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Normalpreis:</span>
                <span>€{regularTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-green-400">
                <span>💚 Du sparst insgesamt:</span>
                <span>€{totalSavings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-[#00FF9C]">
                <span>Gesamt:</span>
                <span>€{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button className="w-full mt-4 px-4 py-3 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] rounded font-bold transition">
              🛒 Zur Kasse
            </button>
          </div>
        )}

        {/* INFO */}
        <div className="mt-8 bg-blue-600/20 border border-blue-600 rounded-lg p-6">
          <h3 className="font-bold text-blue-400 mb-3">ℹ️ Bundle Vorteile</h3>
          <ul className="text-sm text-blue-300 space-y-2">
            <li>✅ Sparen Sie bis zu 32% bei Bundle-Käufen</li>
            <li>✅ Alle Keys sind sofort verfügbar</li>
            <li>✅ Keine versteckten Gebühren</li>
            <li>✅ Kombinieren Sie Bundles für noch mehr Rabatt</li>
          </ul>
        </div>
      </div>
    </div>
  );
}