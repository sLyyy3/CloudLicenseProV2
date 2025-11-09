// src/pages/Home.tsx - ULTRA MODERN LANDING PAGE V3
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaRocket,
  FaKey,
  FaStar,
  FaGift,
  FaDollarSign,
  FaUsers,
  FaArrowRight,
  FaShieldAlt,
  FaTrophy,
  FaCheckCircle,
  FaCode,
  FaChartLine,
  FaBolt,
  FaGlobe,
  FaCog,
  FaLock,
  FaFire,
  FaHeart,
} from "react-icons/fa";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      } catch (err) {
        console.error("Auth check error:", err);
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const handleLogin = (type: 'customer' | 'developer' | 'reseller' | 'admin') => {
    if (type === 'customer') navigate('/login');
    else if (type === 'developer') navigate('/dev-login');
    else if (type === 'reseller') navigate('/reseller-login');
    else if (type === 'admin') navigate('/admin-login');
  };

  const handleRegister = (type: 'customer' | 'developer' | 'reseller') => {
    if (type === 'customer') navigate('/signup');
    else if (type === 'developer') navigate('/dev-register');
    else if (type === 'reseller') navigate('/reseller-register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F14] via-[#1A1A1F] to-[#0F0F14] text-[#E0E0E0] overflow-x-hidden">
      {/* ANIMATED BACKGROUND */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full bg-[#0F0F14]/90 backdrop-blur-xl border-b border-[#2C2C34]/50 z-50 shadow-xl shadow-black/20">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-2xl font-black cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-gradient-to-br from-[#00FF9C] to-green-400 p-2 rounded-xl shadow-lg">
              <FaRocket className="text-black" />
            </div>
            <span className="bg-gradient-to-r from-[#00FF9C] to-green-400 bg-clip-text text-transparent">
              CloudLicensePro
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <button onClick={() => navigate('/shop')} className="text-gray-400 hover:text-[#00FF9C] transition font-bold">
              Shop
            </button>
            <button onClick={() => navigate('/validate-key')} className="text-gray-400 hover:text-blue-400 transition font-bold">
              Validator
            </button>
            <button onClick={() => navigate('/bundles')} className="text-gray-400 hover:text-green-400 transition font-bold">
              Bundles
            </button>
            <button onClick={() => navigate('/referral')} className="text-gray-400 hover:text-purple-400 transition font-bold">
              Referral
            </button>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-5 py-2 text-gray-300 hover:text-white transition font-bold"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition shadow-lg hover:shadow-red-500/50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="relative group">
                  <button className="px-5 py-2 text-gray-300 hover:text-white transition font-bold">
                    Login ▼
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-[#1A1A1F] border border-[#2C2C34] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <button onClick={() => handleLogin('customer')} className="block w-full text-left px-4 py-3 hover:bg-[#2C2C34] rounded-t-xl transition">
                      👤 Als Kunde
                    </button>
                    <button onClick={() => handleLogin('developer')} className="block w-full text-left px-4 py-3 hover:bg-[#2C2C34] transition">
                      👨‍💻 Als Developer
                    </button>
                    <button onClick={() => handleLogin('reseller')} className="block w-full text-left px-4 py-3 hover:bg-[#2C2C34] transition">
                      💼 Als Reseller
                    </button>
                    <button onClick={() => handleLogin('admin')} className="block w-full text-left px-4 py-3 hover:bg-[#2C2C34] rounded-b-xl transition">
                      🛡️ Als Admin
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-6 py-2 bg-gradient-to-r from-[#00FF9C] to-green-500 text-black rounded-xl font-black hover:shadow-2xl hover:shadow-[#00FF9C]/50 transition transform hover:scale-105"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="relative pt-40 pb-32 px-8 z-10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/50 rounded-full text-sm font-bold text-purple-300 animate-pulse">
              🚀 Die nächste Generation ist hier
            </span>
          </div>

          <h1 className="text-7xl md:text-8xl font-black mb-8 leading-tight">
            <span className="bg-gradient-to-r from-[#00FF9C] via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              Lizenz-Plattform
            </span>
            <br />
            <span className="text-white">neu gedacht.</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Verkaufe digitale Produkte, verwalte License Keys, verdiene als Reseller -
            <strong className="text-[#00FF9C]"> alles an einem Ort</strong>, komplett automatisiert.
          </p>

          <div className="flex gap-4 justify-center flex-wrap mb-12">
            <button
              onClick={() => navigate("/shop")}
              className="group px-8 py-4 bg-gradient-to-r from-[#00FF9C] to-green-500 text-black rounded-2xl font-black hover:shadow-2xl hover:shadow-[#00FF9C]/50 transition transform hover:scale-105 flex items-center gap-2"
            >
              🛍️ Zum Shop
              <FaArrowRight className="group-hover:translate-x-1 transition" />
            </button>
            <button
              onClick={() => navigate("/dev-register")}
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl font-black hover:shadow-2xl hover:shadow-purple-500/50 transition transform hover:scale-105 flex items-center gap-2"
            >
              👨‍💻 Developer Werden
              <FaArrowRight className="group-hover:translate-x-1 transition" />
            </button>
            <button
              onClick={() => navigate("/reseller-register")}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl font-black hover:shadow-2xl hover:shadow-blue-500/50 transition transform hover:scale-105 flex items-center gap-2"
            >
              💼 Reseller Werden
              <FaArrowRight className="group-hover:translate-x-1 transition" />
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <FaShieldAlt className="text-green-400" />
              <span>100% Sicher</span>
            </div>
            <div className="flex items-center gap-2">
              <FaBolt className="text-yellow-400" />
              <span>Instant Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <FaGlobe className="text-blue-400" />
              <span>Weltweit</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="relative py-20 px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border border-[#3C3C44] rounded-3xl p-12 shadow-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center group hover:scale-110 transition">
                <div className="text-5xl font-black bg-gradient-to-r from-[#00FF9C] to-green-400 bg-clip-text text-transparent mb-2">
                  10,000+
                </div>
                <p className="text-gray-400 font-bold">Keys verkauft</p>
              </div>
              <div className="text-center group hover:scale-110 transition">
                <div className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  500+
                </div>
                <p className="text-gray-400 font-bold">Active Users</p>
              </div>
              <div className="text-center group hover:scale-110 transition">
                <div className="text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  €50K+
                </div>
                <p className="text-gray-400 font-bold">Umsatz</p>
              </div>
              <div className="text-center group hover:scale-110 transition">
                <div className="text-5xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                  24/7
                </div>
                <p className="text-gray-400 font-bold">Support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES GRID */}
      <div className="relative py-20 px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-[#00FF9C] to-blue-400 bg-clip-text text-transparent">
                Alle Features
              </span>
            </h2>
            <p className="text-xl text-gray-400">Alles was du brauchst, an einem Ort</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Shop */}
            <div className="group bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-[#00FF9C]/30 rounded-2xl p-8 hover:border-[#00FF9C] hover:shadow-2xl hover:shadow-[#00FF9C]/20 transition transform hover:scale-105">
              <div className="text-5xl mb-4 group-hover:scale-110 transition">🛍️</div>
              <h3 className="text-2xl font-black mb-3 text-[#00FF9C]">Public Shop</h3>
              <p className="text-gray-400 mb-6">
                Kunden kaufen Keys direkt. Keine Zahlung nötig im Test Mode!
              </p>
              <button
                onClick={() => navigate("/shop")}
                className="text-[#00FF9C] hover:text-green-300 font-bold flex items-center gap-2 group-hover:translate-x-2 transition"
              >
                Jetzt shoppen <FaArrowRight />
              </button>
            </div>

            {/* Validator */}
            <div className="group bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-blue-400/30 rounded-2xl p-8 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-400/20 transition transform hover:scale-105">
              <div className="text-5xl mb-4 group-hover:scale-110 transition">🔑</div>
              <h3 className="text-2xl font-black mb-3 text-blue-400">Key Validator</h3>
              <p className="text-gray-400 mb-6">
                Instant License Key Validierung. Alle Formate supported!
              </p>
              <button
                onClick={() => navigate("/validate-key")}
                className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-2 group-hover:translate-x-2 transition"
              >
                Jetzt validieren <FaArrowRight />
              </button>
            </div>

            {/* Bundles */}
            <div className="group bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-green-400/30 rounded-2xl p-8 hover:border-green-400 hover:shadow-2xl hover:shadow-green-400/20 transition transform hover:scale-105">
              <div className="text-5xl mb-4 group-hover:scale-110 transition">🎁</div>
              <h3 className="text-2xl font-black mb-3 text-green-400">Key Bundles</h3>
              <p className="text-gray-400 mb-6">
                Kaufe mehrere Keys und spare bis zu 32%! Mega Deals!
              </p>
              <button
                onClick={() => navigate("/bundles")}
                className="text-green-400 hover:text-green-300 font-bold flex items-center gap-2 group-hover:translate-x-2 transition"
              >
                Bundles ansehen <FaArrowRight />
              </button>
            </div>

            {/* Reviews */}
            <div className="group bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-yellow-400/30 rounded-2xl p-8 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-400/20 transition transform hover:scale-105">
              <div className="text-5xl mb-4 group-hover:scale-110 transition">⭐</div>
              <h3 className="text-2xl font-black mb-3 text-yellow-400">Reviews</h3>
              <p className="text-gray-400 mb-6">
                Echte Kundenbewertungen. Transparent und ehrlich!
              </p>
              <button
                onClick={() => navigate("/reviews")}
                className="text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-2 group-hover:translate-x-2 transition"
              >
                Bewertungen lesen <FaArrowRight />
              </button>
            </div>

            {/* Referral */}
            <div className="group bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-purple-400/30 rounded-2xl p-8 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-400/20 transition transform hover:scale-105">
              <div className="text-5xl mb-4 group-hover:scale-110 transition">💰</div>
              <h3 className="text-2xl font-black mb-3 text-purple-400">Referral Program</h3>
              <p className="text-gray-400 mb-6">
                Verdiene 20-25% Commission! Passives Einkommen!
              </p>
              <button
                onClick={() => navigate("/referral")}
                className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-2 group-hover:translate-x-2 transition"
              >
                Geld verdienen <FaArrowRight />
              </button>
            </div>

            {/* Admin */}
            <div className="group bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-orange-400/30 rounded-2xl p-8 hover:border-orange-400 hover:shadow-2xl hover:shadow-orange-400/20 transition transform hover:scale-105">
              <div className="text-5xl mb-4 group-hover:scale-110 transition">🛡️</div>
              <h3 className="text-2xl font-black mb-3 text-orange-400">Admin Panel</h3>
              <p className="text-gray-400 mb-6">
                Vollständige Kontrolle. Orders, Revenue, Analytics!
              </p>
              <button
                onClick={() => navigate("/admin")}
                className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-2 group-hover:translate-x-2 transition"
              >
                Admin Login <FaArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ROLE SELECTION */}
      <div className="relative py-20 px-8 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-y-2 border-purple-500/30 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Wähle deine Rolle
              </span>
            </h2>
            <p className="text-xl text-gray-400">Für jeden ist etwas dabei!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Customers */}
            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-[#00FF9C]/50 rounded-3xl p-10 hover:border-[#00FF9C] hover:shadow-2xl hover:shadow-[#00FF9C]/20 transition transform hover:scale-105">
              <div className="text-6xl mb-6 text-center">👤</div>
              <h3 className="text-3xl font-black mb-6 text-center text-[#00FF9C]">Kunden</h3>
              <ul className="space-y-4 text-gray-300 mb-8">
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-[#00FF9C] text-xl flex-shrink-0" />
                  <span>Keys kaufen & validieren</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-[#00FF9C] text-xl flex-shrink-0" />
                  <span>Bundle Rabatte (bis 32%)</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-[#00FF9C] text-xl flex-shrink-0" />
                  <span>Bewertungen schreiben</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-[#00FF9C] text-xl flex-shrink-0" />
                  <span>Referral Bonus verdienen</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/shop")}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#00FF9C] to-green-500 text-black rounded-2xl font-black hover:shadow-2xl hover:shadow-[#00FF9C]/50 transition transform hover:scale-105"
              >
                Jetzt kaufen 🛍️
              </button>
            </div>

            {/* Developers */}
            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-purple-400/50 rounded-3xl p-10 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-400/20 transition transform hover:scale-105">
              <div className="text-6xl mb-6 text-center">👨‍💻</div>
              <h3 className="text-3xl font-black mb-6 text-center text-purple-400">Developer</h3>
              <ul className="space-y-4 text-gray-300 mb-8">
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-purple-400 text-xl flex-shrink-0" />
                  <span>Produkte & Keys erstellen</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-purple-400 text-xl flex-shrink-0" />
                  <span>Reseller verwalten</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-purple-400 text-xl flex-shrink-0" />
                  <span>API Integration</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-purple-400 text-xl flex-shrink-0" />
                  <span>Revenue Analytics</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/dev-register")}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl font-black hover:shadow-2xl hover:shadow-purple-500/50 transition transform hover:scale-105"
              >
                Developer werden 🚀
              </button>
            </div>

            {/* Resellers */}
            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-blue-400/50 rounded-3xl p-10 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-400/20 transition transform hover:scale-105">
              <div className="text-6xl mb-6 text-center">💼</div>
              <h3 className="text-3xl font-black mb-6 text-center text-blue-400">Reseller</h3>
              <ul className="space-y-4 text-gray-300 mb-8">
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-blue-400 text-xl flex-shrink-0" />
                  <span>Keys günstig einkaufen</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-blue-400 text-xl flex-shrink-0" />
                  <span>Eigene Preise setzen</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-blue-400 text-xl flex-shrink-0" />
                  <span>Lagerverwaltung</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaCheckCircle className="text-blue-400 text-xl flex-shrink-0" />
                  <span>Profit maximieren</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/reseller-register")}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl font-black hover:shadow-2xl hover:shadow-blue-500/50 transition transform hover:scale-105"
              >
                Reseller werden 💰
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div className="relative py-20 px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Was unsere User sagen
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3C3C44] rounded-2xl p-8 hover:border-[#00FF9C] transition">
              <div className="flex items-center gap-2 mb-4">
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
              </div>
              <p className="text-gray-300 mb-4">
                "Einfach die beste Lizenz-Plattform! Mega schnell und zuverlässig. Verdiene jetzt passiv als Referral!"
              </p>
              <p className="text-sm text-gray-500 font-bold">- Max M., Kunde</p>
            </div>

            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3C3C44] rounded-2xl p-8 hover:border-purple-400 transition">
              <div className="flex items-center gap-2 mb-4">
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
              </div>
              <p className="text-gray-300 mb-4">
                "Als Developer verdiene ich endlich Geld mit meinen Produkten! Das Reseller-System ist genial."
              </p>
              <p className="text-sm text-gray-500 font-bold">- Sarah K., Developer</p>
            </div>

            <div className="bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border border-[#3C3C44] rounded-2xl p-8 hover:border-blue-400 transition">
              <div className="flex items-center gap-2 mb-4">
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
                <FaStar className="text-yellow-400" />
              </div>
              <p className="text-gray-300 mb-4">
                "Ich kaufe Keys günstig ein und verkaufe sie mit Profit! Seit 3 Monaten mache ich 2K€/Monat!"
              </p>
              <p className="text-sm text-gray-500 font-bold">- Tom L., Reseller</p>
            </div>
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="relative py-20 px-8 z-10">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-r from-[#00FF9C]/20 via-purple-600/20 to-blue-600/20 border-2 border-[#00FF9C]/50 rounded-3xl p-16 text-center overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00FF9C]/5 to-purple-600/5 animate-pulse"></div>

            <div className="relative z-10">
              <h2 className="text-6xl font-black mb-6">
                <span className="bg-gradient-to-r from-[#00FF9C] to-blue-400 bg-clip-text text-transparent">
                  Bereit durchzustarten?
                </span>
              </h2>
              <p className="text-2xl text-gray-300 mb-10">
                Wähle deine Rolle und beginne <strong className="text-[#00FF9C]">sofort</strong>. Kostenlos, sicher, einfach!
              </p>

              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={() => navigate("/shop")}
                  className="group px-10 py-5 bg-gradient-to-r from-[#00FF9C] to-green-500 text-black rounded-2xl font-black hover:shadow-2xl hover:shadow-[#00FF9C]/50 transition transform hover:scale-110 text-lg"
                >
                  Als Kunde starten 🛍️
                </button>
                <button
                  onClick={() => navigate("/dev-register")}
                  className="group px-10 py-5 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl font-black hover:shadow-2xl hover:shadow-purple-500/50 transition transform hover:scale-110 text-lg"
                >
                  Developer werden 👨‍💻
                </button>
                <button
                  onClick={() => navigate("/reseller-register")}
                  className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl font-black hover:shadow-2xl hover:shadow-blue-500/50 transition transform hover:scale-110 text-lg"
                >
                  Reseller werden 💼
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="relative border-t border-[#2C2C34] py-16 px-8 bg-[#0F0F14] z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-[#00FF9C] to-green-400 p-2 rounded-xl">
                  <FaRocket className="text-black text-xl" />
                </div>
                <span className="text-2xl font-black">CloudLicensePro</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                Die moderne Lizenz-Plattform für Entwickler, Reseller und Endkunden. Automatisiert, sicher und profitabel.
              </p>
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-[#1A1A1F] border border-[#2C2C34] rounded-lg flex items-center justify-center hover:border-[#00FF9C] cursor-pointer transition">
                  <FaHeart className="text-red-400" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-black mb-4 text-lg">Features</h4>
              <ul className="space-y-3 text-gray-400">
                <li><button onClick={() => navigate("/shop")} className="hover:text-[#00FF9C] transition">Shop</button></li>
                <li><button onClick={() => navigate("/bundles")} className="hover:text-[#00FF9C] transition">Bundles</button></li>
                <li><button onClick={() => navigate("/validate-key")} className="hover:text-blue-400 transition">Validator</button></li>
                <li><button onClick={() => navigate("/reviews")} className="hover:text-yellow-400 transition">Reviews</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-4 text-lg">Developer</h4>
              <ul className="space-y-3 text-gray-400">
                <li><button onClick={() => navigate("/dev-register")} className="hover:text-purple-400 transition">Registrieren</button></li>
                <li><button onClick={() => navigate("/dev-login")} className="hover:text-purple-400 transition">Login</button></li>
                <li><button onClick={() => navigate("/dev-api-keys")} className="hover:text-purple-400 transition">API Docs</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-4 text-lg">Reseller</h4>
              <ul className="space-y-3 text-gray-400">
                <li><button onClick={() => navigate("/reseller-register")} className="hover:text-blue-400 transition">Registrieren</button></li>
                <li><button onClick={() => navigate("/reseller-login")} className="hover:text-blue-400 transition">Login</button></li>
                <li><button onClick={() => navigate("/referral")} className="hover:text-blue-400 transition">Verdienste</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#2C2C34] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2025 CloudLicensePro. Alle Rechte vorbehalten.
            </p>
            <p className="text-sm text-gray-500">
              Made with <FaHeart className="inline text-red-400 animate-pulse" /> by the{" "}
              <span className="text-[#00FF9C] font-bold">CloudLicensePro Team</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
