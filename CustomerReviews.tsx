// src/pages/CustomerReviews.tsx - REVIEWS & RATINGS
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FaStar, FaComment, FaThumbsUp } from "react-icons/fa";

type Review = {
  id: string;
  product_name: string;
  customer_email: string;
  rating: number;
  comment: string;
  created_at: string;
  helpful_count: number;
};

type Product = {
  name: string;
  average_rating: number;
  total_reviews: number;
  reviews: Review[];
};

export default function CustomerReviews() {
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    product: "",
    rating: 5,
    comment: "",
  });

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customer_reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const grouped: Record<string, Product> = {};

      data?.forEach((review) => {
        if (!grouped[review.product_name]) {
          grouped[review.product_name] = {
            name: review.product_name,
            average_rating: 0,
            total_reviews: 0,
            reviews: [],
          };
        }

        grouped[review.product_name].reviews.push(review);
      });

      // Berechne Durchschnitt
      Object.values(grouped).forEach((product) => {
        const sum = product.reviews.reduce((acc, r) => acc + r.rating, 0);
        product.average_rating = sum / product.reviews.length;
        product.total_reviews = product.reviews.length;
      });

      setProducts(grouped);
    } catch (err) {
      console.error("Error loading reviews:", err);
    }
    setLoading(false);
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { error } = await supabase.from("customer_reviews").insert({
        product_name: formData.product,
        customer_email: formData.email,
        rating: formData.rating,
        comment: formData.comment,
      });

      if (error) throw error;

      alert("✅ Bewertung veröffentlicht!");
      setShowReviewForm(false);
      setFormData({ email: "", product: "", rating: 5, comment: "" });
      await loadReviews();
    } catch (err: any) {
      alert("Fehler: " + err.message);
    }
  }

  function renderStars(rating: number) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <FaStar
            key={i}
            className={i <= Math.round(rating) ? "text-yellow-400" : "text-gray-600"}
          />
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <p>Lädt Bewertungen...</p>
      </div>
    );
  }

  const productList = Object.values(products);

  return (
    <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
      {/* HEADER */}
      <div className="bg-[#1A1A1F] border-b border-[#2C2C34] p-6 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FaStar className="text-yellow-400" />
              Kundenbewertungen
            </h1>
            <p className="text-gray-400 mt-1">Echte Bewertungen von echten Kunden</p>
          </div>
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-6 py-2 bg-[#00FF9C] text-[#0E0E12] rounded-lg font-bold hover:bg-[#00cc80] transition"
          >
            ✍️ Bewertung schreiben
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {productList.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <FaComment className="text-4xl mb-4 mx-auto opacity-50" />
            <p>Noch keine Bewertungen vorhanden</p>
          </div>
        ) : (
          <div className="space-y-8">
            {productList.map((product) => (
              <div
                key={product.name}
                className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6"
              >
                {/* PRODUCT HEADER */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#2C2C34]">
                  <div>
                    <h2 className="text-2xl font-bold">{product.name}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      {renderStars(product.average_rating)}
                      <span className="text-lg font-bold text-yellow-400">
                        {product.average_rating.toFixed(1)}/5
                      </span>
                      <span className="text-gray-400">
                        ({product.total_reviews} Bewertungen)
                      </span>
                    </div>
                  </div>
                </div>

                {/* REVIEWS */}
                <div className="space-y-4">
                  {product.reviews.map((review) => (
                    <div key={review.id} className="bg-[#2C2C34] rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-400">
                              {review.rating} von 5
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{review.customer_email}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString("de-DE")}
                        </span>
                      </div>

                      <p className="text-sm mb-3 mt-2">{review.comment}</p>

                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#00FF9C] transition">
                          <FaThumbsUp /> Hilfreich ({review.helpful_count})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REVIEW FORM MODAL */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">✍️ Bewertung schreiben</h2>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">📧 Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full p-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">📦 Produkt</label>
                <select
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  required
                  className="w-full p-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                >
                  <option value="">Wähle ein Produkt...</option>
                  {Object.keys(products).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">⭐ Bewertung</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: i })}
                      className={`px-3 py-1 rounded ${
                        i <= formData.rating
                          ? "bg-yellow-400 text-[#0E0E12]"
                          : "bg-[#2C2C34] text-gray-400"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">💬 Kommentar</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  required
                  rows={4}
                  className="w-full p-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                  placeholder="Teile deine Erfahrung..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-bold transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] rounded font-bold transition"
                >
                  ✅ Veröffentlichen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
