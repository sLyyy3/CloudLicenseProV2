// src/pages/ProductDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaArrowLeft, FaBoxes, FaKey } from "react-icons/fa";

type Product = {
  id: string;
  name: string;
  licenses_count: number;
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from("products")
        .select(`id, name, licenses(id)`)
        .eq("id", id)
        .single();

      if (error) console.error("Error fetching product:", error);
      else
        setProduct({
          id: data.id,
          name: data.name,
          licenses_count: data.licenses?.length || 0,
        });
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] p-8 font-sans">
      <Link
        to="/"
        className="flex items-center gap-2 text-blue-500 hover:text-blue-400 mb-6"
      >
        <FaArrowLeft /> Zurück
      </Link>

      {loading ? (
        <p>Lädt Produkt…</p>
      ) : product ? (
        <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-6 shadow-[0_0_15px_rgba(0,255,156,0.3)]">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
            <FaBoxes /> {product.name}
          </h1>
          <p className="text-gray-400 text-lg">
            Lizenzen: <span className="text-[#00FF9C]">{product.licenses_count}</span>
          </p>
        </div>
      ) : (
        <p>Produkt nicht gefunden.</p>
      )}
    </div>
  );
}
