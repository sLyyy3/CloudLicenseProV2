// src/pages/Home.tsx - ULTRA CREATIVE LANDING PAGE - PICASSO STYLE 🎨
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaRocket,
  FaKey,
  FaStar,
  FaGift,
  FaUsers,
  FaArrowRight,
  FaShieldAlt,
  FaBolt,
  FaGlobe,
  FaFire,
  FaHeart,
  FaStore,
  FaChartLine,
  FaCrown,
  FaMagic,
  FaCheckCircle,
  FaCode,
  FaDollarSign,
} from "react-icons/fa";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

    // Track mouse for artistic effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const quickLinks = [
    { icon: FaStore, label: "Reseller Shops", path: "/reseller-shops", color: "from-cyan-500 to-blue-500", emoji: "🛍️" },
    { icon: FaKey, label: "Lizenz-Bibliothek", path: "/customer-dashboard", color: "from-green-500 to-emerald-500", emoji: "📚" },
    { icon: FaShieldAlt, label: "Key Validator", path: "/key-validator", color: "from-purple-500 to-pink-500", emoji: "✅" },
    { icon: FaGift, label: "Key Bundles", path: "/bundles", color: "from-yellow-500 to-orange-500", emoji: "🎁" },
    { icon: FaStar, label: "Reviews", path: "/reviews", color: "from-red-500 to-pink-500", emoji: "⭐" },
    { icon: FaDollarSign, label: "Referral Program", path: "/referral", color: "from-indigo-500 to-purple-500", emoji: "💰" },
  ];

  const devLinks = [
    { icon: FaCode, label: "Key Generator", path: "/dev-key-generator", emoji: "⚙️" },
    { icon: FaChartLine, label: "Developer Dashboard", path: "/dev-dashboard", emoji: "📊" },
    { icon: FaUsers, label: "Manage Licenses", path: "/dev-licenses", emoji: "📜" },
  ];

  const resellerLinks = [
    { icon: FaRocket, label: "Key Upload", path: "/reseller-key-upload", emoji: "⬆️" },
    { icon: FaStore, label: "Mein Inventory", path: "/reseller-inventory", emoji: "📦" },
    { icon: FaChartLine, label: "Reseller Dashboard", path: "/reseller-dashboard", emoji: "💼" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#1A1A2E] to-[#16213E] text-white overflow-hidden relative">
      {/* ARTISTIC BACKGROUND - Picasso Inspired */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Floating geometric shapes */}
        <div
          className="absolute w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-float"
          style={{
            top: '10%',
            left: '5%',
            transform: `translate(${mousePosition.x * 0.0001}px, ${mousePosition.y * 0.0001}px)`,
            transition: 'transform 0.5s ease-out'
          }}
        ></div>
        <div
          className="absolute w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-3xl animate-float-delay-1"
          style={{
            bottom: '20%',
            right: '10%',
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            transform: `translate(${mousePosition.x * -0.00015}px, ${mousePosition.y * -0.00015}px)`,
            transition: 'transform 0.5s ease-out'
          }}
        ></div>
        <div
          className="absolute w-80 h-80 bg-gradient-to-br from-yellow-500/15 to-orange-500/15 blur-3xl animate-float-delay-2"
          style={{
            top: '50%',
            left: '50%',
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
            transform: `translate(${mousePosition.x * 0.00008}px, ${mousePosition.y * 0.00008}px)`,
            transition: 'transform 0.5s ease-out'
          }}
        ></div>

        {/* Artistic lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="url(#gradient1)" strokeWidth="2" className="animate-pulse"/>
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="url(#gradient2)" strokeWidth="2" className="animate-pulse"/>
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{stopColor: '#00FF9C', stopOpacity: 0}} />
              <stop offset="50%" style={{stopColor: '#00FF9C', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#00FF9C', stopOpacity: 0}} />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#A78BFA', stopOpacity: 0}} />
              <stop offset="50%" style={{stopColor: '#A78BFA', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: '#A78BFA', stopOpacity: 0}} />
            </linearGradient>
          </defs>
        </svg>

        {/* Animated particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-[#00FF9C] rounded-full animate-particle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>

      {/* STICKY NAVIGATION */}
      <nav className="sticky top-0 w-full bg-[#0A0A0F]/80 backdrop-blur-2xl border-b border-white/10 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-2xl font-black cursor-pointer group" onClick={() => navigate('/')}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur-md group-hover:blur-lg transition"></div>
              <div className="relative bg-gradient-to-br from-[#00FF9C] to-cyan-400 p-2.5 rounded-xl shadow-lg transform group-hover:rotate-12 transition">
                <FaRocket className="text-black" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-[#00FF9C] via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x">
              CloudLicensePro
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => navigate("/customer-dashboard")}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#00FF9C] to-cyan-400 text-black rounded-xl font-black hover:shadow-xl hover:shadow-cyan-500/50 transition transform hover:scale-105"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                  className="px-5 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl font-bold transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-5 py-2 text-gray-300 hover:text-white transition font-bold"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#00FF9C] to-cyan-400 text-black rounded-xl font-black hover:shadow-xl hover:shadow-cyan-500/50 transition transform hover:scale-105"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION - Artistic & Creative */}
      <div className="relative pt-20 pb-16 px-6 z-10">
        <div className="max-w-7xl mx-auto text-center">
          {/* Floating badge */}
          <div className="inline-block mb-8 animate-bounce-slow">
            <span className="px-6 py-3 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-400/50 rounded-full text-sm font-black text-purple-200 backdrop-blur-sm shadow-2xl shadow-purple-500/20">
              🎨 Die Kunst der Lizenzierung
            </span>
          </div>

          {/* Main headline - Artistic typography */}
          <h1 className="text-7xl md:text-9xl font-black mb-6 leading-none relative">
            <span className="relative inline-block">
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 blur-2xl opacity-50 animate-pulse"></span>
              <span className="relative bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x drop-shadow-2xl">
                License
              </span>
            </span>
            <br />
            <span className="relative inline-block mt-2">
              <span className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 blur-2xl opacity-50 animate-pulse" style={{animationDelay: '0.5s'}}></span>
              <span className="relative text-white drop-shadow-2xl">
                Revolution
              </span>
            </span>
          </h1>

          <p className="text-2xl md:text-3xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed font-light">
            Verkaufe digitale Produkte. Verwalte Keys. Verdiene als Reseller.
            <br />
            <strong className="font-black bg-gradient-to-r from-[#00FF9C] to-cyan-400 bg-clip-text text-transparent">
              Alles automatisiert. Alles profitabel.
            </strong>
          </p>

          {/* CTA Buttons - Creative design */}
          <div className="flex gap-5 justify-center flex-wrap mb-16">
            <button
              onClick={() => navigate("/reseller-shops")}
              className="group relative px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl font-black text-xl overflow-hidden transform hover:scale-110 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-3">
                <span>🛍️ Zum Shop</span>
                <FaArrowRight className="group-hover:translate-x-2 transition" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 blur opacity-50 group-hover:opacity-75 -z-10"></div>
            </button>

            <button
              onClick={() => navigate("/dev-register")}
              className="group relative px-10 py-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-black text-xl overflow-hidden transform hover:scale-110 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-3">
                <span>👨‍💻 Developer</span>
                <FaCode className="group-hover:rotate-12 transition" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 blur opacity-50 group-hover:opacity-75 -z-10"></div>
            </button>

            <button
              onClick={() => navigate("/reseller-register")}
              className="group relative px-10 py-5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl font-black text-xl text-black overflow-hidden transform hover:scale-110 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-3">
                <span>💰 Reseller</span>
                <FaDollarSign className="group-hover:scale-125 transition" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 blur opacity-50 group-hover:opacity-75 -z-10"></div>
            </button>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-10 text-sm">
            <div className="flex items-center gap-2 group cursor-pointer">
              <FaShieldAlt className="text-2xl text-green-400 group-hover:scale-125 transition" />
              <span className="font-bold text-gray-300 group-hover:text-white">100% Sicher</span>
            </div>
            <div className="flex items-center gap-2 group cursor-pointer">
              <FaBolt className="text-2xl text-yellow-400 group-hover:scale-125 transition" />
              <span className="font-bold text-gray-300 group-hover:text-white">Instant Delivery</span>
            </div>
            <div className="flex items-center gap-2 group cursor-pointer">
              <FaGlobe className="text-2xl text-blue-400 group-hover:scale-125 transition" />
              <span className="font-bold text-gray-300 group-hover:text-white">Weltweit verfügbar</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK LINKS - Creative Grid */}
      <div className="relative py-16 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Schnellzugriff
              </span>
            </h2>
            <p className="text-xl text-gray-400">Alle wichtigen Bereiche auf einen Blick</p>
          </div>

          {/* Customer Links */}
          <div className="mb-12">
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                👤 Kunden
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickLinks.map((link, i) => (
                <button
                  key={i}
                  onClick={() => navigate(link.path)}
                  className="group relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 hover:border-white/40 transition-all duration-300 transform hover:scale-105 hover:rotate-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-10 rounded-2xl transition`}></div>
                  <div className="relative">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition">{link.emoji}</div>
                    <h4 className="text-xl font-black mb-2 group-hover:text-white transition">{link.label}</h4>
                    <FaArrowRight className="text-gray-400 group-hover:text-white group-hover:translate-x-2 transition" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Developer Links */}
          <div className="mb-12">
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                👨‍💻 Developer
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {devLinks.map((link, i) => (
                <button
                  key={i}
                  onClick={() => navigate(link.path)}
                  className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-400/30 rounded-2xl p-8 hover:border-purple-400/60 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="text-6xl mb-4 group-hover:scale-110 transition">{link.emoji}</div>
                  <h4 className="text-xl font-black mb-2 text-purple-300 group-hover:text-white transition">{link.label}</h4>
                  <FaArrowRight className="text-purple-400 group-hover:text-white group-hover:translate-x-2 transition" />
                </button>
              ))}
            </div>
          </div>

          {/* Reseller Links */}
          <div>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                💼 Reseller
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {resellerLinks.map((link, i) => (
                <button
                  key={i}
                  onClick={() => navigate(link.path)}
                  className="group relative bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-xl border border-yellow-400/30 rounded-2xl p-8 hover:border-yellow-400/60 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="text-6xl mb-4 group-hover:scale-110 transition">{link.emoji}</div>
                  <h4 className="text-xl font-black mb-2 text-yellow-300 group-hover:text-white transition">{link.label}</h4>
                  <FaArrowRight className="text-yellow-400 group-hover:text-white group-hover:translate-x-2 transition" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STATS - Creative Design */}
      <div className="relative py-20 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-2xl border-2 border-white/20 rounded-3xl p-16 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 animate-gradient-xy"></div>
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-12">
              <div className="text-center group cursor-pointer">
                <div className="text-6xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-3 group-hover:scale-125 transition">
                  10K+
                </div>
                <p className="text-gray-300 font-bold group-hover:text-white transition">Keys verkauft</p>
              </div>
              <div className="text-center group cursor-pointer">
                <div className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 group-hover:scale-125 transition">
                  500+
                </div>
                <p className="text-gray-300 font-bold group-hover:text-white transition">Active Users</p>
              </div>
              <div className="text-center group cursor-pointer">
                <div className="text-6xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-3 group-hover:scale-125 transition">
                  €50K+
                </div>
                <p className="text-gray-300 font-bold group-hover:text-white transition">Umsatz</p>
              </div>
              <div className="text-center group cursor-pointer">
                <div className="text-6xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-3 group-hover:scale-125 transition">
                  24/7
                </div>
                <p className="text-gray-300 font-bold group-hover:text-white transition">Support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER - Creative */}
      <footer className="relative border-t-2 border-white/10 py-16 px-6 bg-[#0A0A0F]/50 backdrop-blur-xl z-10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-[#00FF9C] to-cyan-400 p-3 rounded-xl">
              <FaRocket className="text-black text-2xl" />
            </div>
            <span className="text-3xl font-black">CloudLicensePro</span>
          </div>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Die moderne Lizenz-Plattform für Entwickler, Reseller und Endkunden.
            Automatisiert, sicher und profitabel.
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <p>© 2025 CloudLicensePro</p>
            <span>•</span>
            <p className="flex items-center gap-1">
              Made with <FaHeart className="text-red-400 animate-pulse" /> by the team
            </p>
          </div>
        </div>
      </footer>

      {/* Custom animations */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 0%; }
          25% { background-position: 100% 0%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0px) rotate(0deg); }
          50% { transform: translate(30px, 30px) rotate(180deg); }
        }
        @keyframes float-delay-1 {
          0%, 100% { transform: translate(0, 0px) scale(1); }
          50% { transform: translate(-20px, -40px) scale(1.1); }
        }
        @keyframes float-delay-2 {
          0%, 100% { transform: translate(0, 0px) rotate(0deg) scale(1); }
          50% { transform: translate(40px, -30px) rotate(-90deg) scale(0.9); }
        }
        @keyframes particle {
          0% { opacity: 0; transform: translateY(0); }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-100vh); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 10s ease infinite;
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delay-1 { animation: float-delay-1 8s ease-in-out infinite; }
        .animate-float-delay-2 { animation: float-delay-2 10s ease-in-out infinite; }
        .animate-particle { animation: particle linear infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
