// src/pages/Home.tsx - EPIC LANDING PAGE
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaRocket,
  FaShoppingCart,
  FaKey,
  FaStar,
  FaGift,
  FaDollarSign,
  FaChartBar,
  FaUsers,
  FaArrowRight,
  FaShieldAlt,
  FaLightbulb,
  FaTrophy,
  FaCode,
  FaCheckCircle,
} from "react-icons/fa";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    }
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0E0E12] via-[#1A1A1F] to-[#0E0E12] text-[#E0E0E0]">
      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full bg-[#0E0E12]/95 backdrop-blur border-b border-[#2C2C34] z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <FaRocket className="text-[#00FF9C]" />
            <span>CloudLicensePro</span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-4 py-2 bg-[#00FF9C] text-[#0E0E12] rounded-lg font-bold hover:bg-[#00cc80] transition"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="pt-32 pb-20 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl font-black mb-6 bg-gradient-to-r from-[#00FF9C] via-purple-400 to-[#00FF9C] bg-clip-text text-transparent">
            🚀 Die nächste Generation Lizenz-Plattform
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Verkaufe digitale Produkte, verwalte Keys, verdiene Geld als Reseller - alles an einem Ort
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate("/shop")}
              className="px-8 py-3 bg-[#00FF9C] text-[#0E0E12] rounded-lg font-bold hover:bg-[#00cc80] transition flex items-center gap-2"
            >
              🛍️ Zum Shop <FaArrowRight />
            </button>
            <button
              onClick={() => navigate("/dev-register")}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition flex items-center gap-2"
            >
              👨‍💻 Developer Werden <FaArrowRight />
            </button>
            <button
              onClick={() => navigate("/reseller-register")}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition flex items-center gap-2"
            >
              💼 Reseller Werden <FaArrowRight />
            </button>
          </div>
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="py-16 px-8 bg-[#1A1A1F]/50 border-y border-[#2C2C34]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#00FF9C] mb-2">10,000+</div>
              <p className="text-gray-400">Keys verkauft</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">500+</div>
              <p className="text-gray-400">Developer & Reseller</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">€50,000+</div>
              <p className="text-gray-400">Umsatz generiert</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">24/7</div>
              <p className="text-gray-400">Support verfügbar</p>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">✨ Alle Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Shop */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C] transition group">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🛍️</div>
                <h3 className="text-xl font-bold">Öffentlicher Shop</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Kunden können Keys direkt kaufen. TEST MODE - keine echte Zahlung.
              </p>
              <button
                onClick={() => navigate("/shop")}
                className="text-[#00FF9C] hover:text-[#00cc80] font-bold flex items-center gap-2 group-hover:translate-x-2 transition"
              >
                Zum Shop <FaArrowRight className="text-sm" />
              </button>
            </div>

            {/* Validator */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-blue-400 transition group">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🔑</div>
                <h3 className="text-xl font-bold">Key Validator</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Kunden validieren ihre gekauften Keys. Instant Überprüfung!
              </p>
              <button
                onClick={() => navigate("/validate-key")}
                className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-2 group-hover:translate-x-2 transition"
              >
                Validieren <FaArrowRight className="text-sm" />
              </button>
            </div>

            {/* Bundles */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-green-400 transition group">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🎁</div>
                <h3 className="text-xl font-bold">Key Bundles</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Kaufe mehrere Keys zusammen und spare bis zu 32%!
              </p>
              <button
                onClick={() => navigate("/bundles")}
                className="text-green-400 hover:text-green-300 font-bold flex items-center gap-2 group-hover:translate-x-2 transition"
              >
                Bundles sehen <FaArrowRight className="text-sm" />
              </button>
            </div>

            {/* Reviews */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-yellow-400 transition group">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">⭐</div>
                <h3 className="text-xl font-bold">Bewertungen</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Echte Kundenbewertungen und Feedback zu Produkten.
              </p>
              <button
                onClick={() => navigate("/reviews")}
                className="text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-2 group-hover:translate-x-2 transition"
              >
                Bewertungen <FaArrowRight className="text-sm" />
              </button>
            </div>

            {/* Referral */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-red-400 transition group">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">💰</div>
                <h3 className="text-xl font-bold">Referral Program</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Verdiene 20% Provision auf jeden Referral!
              </p>
              <button
                onClick={() => navigate("/referral")}
                className="text-red-400 hover:text-red-300 font-bold flex items-center gap-2 group-hover:translate-x-2 transition"
              >
                Verdienen <FaArrowRight className="text-sm" />
              </button>
            </div>

            {/* Admin */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-orange-400 transition group">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🛡️</div>
                <h3 className="text-xl font-bold">Admin Dashboard</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Verwalte Orders, Orgs und überwache Revenue.
              </p>
              <button
                onClick={() => navigate("/admin")}
                className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-2 group-hover:translate-x-2 transition"
              >
                Admin Panel <FaArrowRight className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ROLE SECTION */}
      <div className="py-20 px-8 bg-[#1A1A1F]/50 border-y border-[#2C2C34]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">👥 Für jeden was dabei</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Customers */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 hover:border-[#00FF9C] transition">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-2xl font-bold mb-4">Kunden</h3>
              <ul className="space-y-2 text-gray-400 mb-6">
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Keys kaufen
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Mit Rabatt (Bundles)
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Keys validieren
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Bewertungen schreiben
                </li>
              </ul>
              <button
                onClick={() => navigate("/shop")}
                className="w-full px-4 py-2 bg-[#00FF9C] text-[#0E0E12] rounded font-bold hover:bg-[#00cc80] transition"
              >
                Jetzt kaufen
              </button>
            </div>

            {/* Developers */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 hover:border-purple-400 transition">
              <div className="text-4xl mb-4">👨‍💻</div>
              <h3 className="text-2xl font-bold mb-4">Developer</h3>
              <ul className="space-y-2 text-gray-400 mb-6">
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Keys generieren
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Reseller verwalten
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> API Keys nutzen
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Verdienste tracken
                </li>
              </ul>
              <button
                onClick={() => navigate("/dev-register")}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 transition"
              >
                Als Developer starten
              </button>
            </div>

            {/* Resellers */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 hover:border-blue-400 transition">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-2xl font-bold mb-4">Reseller</h3>
              <ul className="space-y-2 text-gray-400 mb-6">
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Keys einkaufen
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Preise einstellen
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Lagerverwaltung
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Verdienste verdoppeln
                </li>
              </ul>
              <button
                onClick={() => navigate("/reseller-register")}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition"
              >
                Als Reseller starten
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="py-20 px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#00FF9C]/10 to-purple-600/10 border border-[#00FF9C]/30 rounded-lg p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">🚀 Bereit zu starten?</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Wähle deine Rolle und beginne sofort. Kostenlos, sicher und einfach!
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate("/shop")}
              className="px-8 py-3 bg-[#00FF9C] text-[#0E0E12] rounded-lg font-bold hover:bg-[#00cc80] transition"
            >
              Als Kunde kaufen
            </button>
            <button
              onClick={() => navigate("/dev-register")}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition"
            >
              Developer werden
            </button>
            <button
              onClick={() => navigate("/reseller-register")}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition"
            >
              Reseller werden
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#2C2C34] py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FaRocket className="text-[#00FF9C]" />
                <span className="font-bold">CloudLicensePro</span>
              </div>
              <p className="text-sm text-gray-400">
                Die nächste Generation Lizenz-Plattform
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button onClick={() => navigate("/shop")} className="hover:text-white">
                    Shop
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/bundles")} className="hover:text-white">
                    Bundles
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/reviews")} className="hover:text-white">
                    Reviews
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Für Developer</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button onClick={() => navigate("/dev-register")} className="hover:text-white">
                    Registrieren
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/dev-api-keys")} className="hover:text-white">
                    API Docs
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Für Reseller</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button onClick={() => navigate("/reseller-register")} className="hover:text-white">
                    Registrieren
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("/referral")} className="hover:text-white">
                    Verdienste
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#2C2C34] pt-8 text-center text-sm text-gray-400">
            <p>© 2025 CloudLicensePro. Alle Rechte vorbehalten.</p>
            <p className="mt-2">
              Made with 💚 by{" "}
              <span className="text-[#00FF9C] font-bold">CloudLicensePro Team</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}