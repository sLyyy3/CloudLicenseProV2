// src/pages/ProductsPage.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import { FaBoxes, FaKey } from "react-icons/fa";

type Product = {
  id: string;
  name: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from("products").select("id,name");
      if (error) console.error(error);
      else setProducts(data || []);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] p-8 font-sans">
      <h1 className="text-4xl font-extrabold mb-6 flex items-center gap-2">
        <FaKey /> Produkte
      </h1>
      {loading ? (
        <p>Lädt Produkte…</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6 hover:shadow-[0_0_15px_rgba(0,255,156,0.5)] transition-shadow"
            >
              <p className="text-xl font-semibold mb-2">{p.name}</p>
              <Link
                to={`/product/${p.id}`}
                className="inline-block mt-2 px-4 py-2 bg-[#00FF9C] text-[#0E0E12] rounded hover:bg-[#00d68f] transition"
              >
                Ansehen
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
