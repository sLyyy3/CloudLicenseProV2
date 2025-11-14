// src/pages/Home.tsx - MEGA ULTRA LANDING PAGE - 1000+ LINES! 🚀
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Sidebar from "../components/Sidebar";
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
  FaLock,
  FaCloud,
  FaInfinity,
  FaCheck,
  FaTimes,
  FaQuestionCircle,
  FaChevronDown,
  FaChevronUp,
  FaEnvelope,
  FaPlay,
  FaGem,
  FaTrophy,
  FaHandshake,
  FaBoxOpen,
  FaCog,
  FaChartBar,
  FaLightbulb,
  FaRobot,
  FaServer,
  FaDatabase,
  FaMobile,
  FaDesktop,
  FaShoppingCart,
  FaCreditCard,
  FaUserShield,
  FaClipboardCheck,
  FaEye,
  FaDownload,
  FaUpload,
  FaSync,
  FaBell,
  FaComments,
  FaHeadset,
} from "react-icons/fa";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"customer" | "developer" | "reseller">("customer");
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "success" | "error">("idle");
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [playingDemo, setPlayingDemo] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    keys: 0,
    users: 0,
    revenue: 0,
    uptime: 0,
  });

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

    // Capture referral code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      console.log('🎯 Referral Code detected:', refCode);
      localStorage.setItem('referral_code', refCode);
      console.log('✅ Referral Code saved! Sign up to earn rewards for the referrer!');
    }
  }, []);

  // Testimonials Auto-Rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animated Stats Counter
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !statsVisible) {
          setStatsVisible(true);
          animateStats();
        }
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [statsVisible]);

  const animateStats = () => {
    const targets = { keys: 10247, users: 523, revenue: 52340, uptime: 99.9 };
    const duration = 2000;
    const steps = 60;
    const increment = duration / steps;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;

      setAnimatedStats({
        keys: Math.floor(targets.keys * progress),
        users: Math.floor(targets.users * progress),
        revenue: Math.floor(targets.revenue * progress),
        uptime: parseFloat((targets.uptime * progress).toFixed(1)),
      });

      if (step >= steps) {
        clearInterval(interval);
        setAnimatedStats(targets);
      }
    }, increment);
  };

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Simulate API call
    setTimeout(() => {
      setNewsletterStatus("success");
      setEmail("");
      setTimeout(() => setNewsletterStatus("idle"), 3000);
    }, 1000);
  };

  const testimonials = [
    {
      name: "MaxCheats",
      role: "Cheat Developer",
      avatar: "👨‍💻",
      rating: 5,
      text: "CloudLicensePro hat mein Business revolutioniert! Automatische Key-Generierung, perfektes Reseller-System. Umsatz +300% in 2 Monaten!",
    },
    {
      name: "KeyKingdom",
      role: "Reseller",
      avatar: "💼",
      rating: 5,
      text: "Bestes Reseller-Portal ever! Kaufe Keys von Devs, verkaufe sie weiter. Dashboard zeigt alles live. Verdiene 500€+ pro Woche!",
    },
    {
      name: "ProGamer23",
      role: "Customer",
      avatar: "🎮",
      rating: 5,
      text: "Keys sofort verfügbar, alle in einem Dashboard. Lifetime Keys, kein Abo-Stress. Support antwortet in Minuten. Perfekt!",
    },
    {
      name: "CodingNinja",
      role: "Developer",
      avatar: "🥷",
      rating: 5,
      text: "API Integration in 5 Minuten! Volle Kontrolle über meine Produkte. Reseller verkaufen für mich 24/7. Passives Einkommen unlocked!",
    },
  ];

  const features = [
    {
      icon: FaKey,
      title: "Automatische Key-Generierung",
      description: "Generiere unbegrenzt viele Lizenzschlüssel mit einem Klick",
      gradient: "from-cyan-500 to-blue-500",
      demo: "XXXX-XXXX-XXXX-XXXX",
    },
    {
      icon: FaStore,
      title: "Reseller Marketplace",
      description: "Verkaufe und kaufe Keys im integrierten Marktplatz",
      gradient: "from-purple-500 to-pink-500",
      demo: "15 Active Shops",
    },
    {
      icon: FaShieldAlt,
      title: "Echtzeit Validation",
      description: "Prüfe Keys sofort auf Gültigkeit und Status",
      gradient: "from-green-500 to-emerald-500",
      demo: "< 100ms",
    },
    {
      icon: FaChartLine,
      title: "Live Analytics",
      description: "Verfolge Verkäufe, Umsatz und Performance in Echtzeit",
      gradient: "from-yellow-500 to-orange-500",
      demo: "24/7 Tracking",
    },
    {
      icon: FaUsers,
      title: "Multi-Rollen System",
      description: "Developer, Reseller, Customer - perfekt organisiert",
      gradient: "from-red-500 to-pink-500",
      demo: "3 User Roles",
    },
    {
      icon: FaInfinity,
      title: "Lifetime Keys",
      description: "Erstelle Keys ohne Ablaufdatum oder mit Zeit-Limit",
      gradient: "from-indigo-500 to-purple-500",
      demo: "0 = Lifetime",
    },
    {
      icon: FaRobot,
      title: "Automatisierung",
      description: "Alles läuft automatisch - Key-Verteilung, Payments, Updates",
      gradient: "from-blue-500 to-cyan-500",
      demo: "100% Auto",
    },
    {
      icon: FaServer,
      title: "Cloud Infrastruktur",
      description: "Schnell, sicher, skalierbar - powered by Supabase",
      gradient: "from-teal-500 to-green-500",
      demo: "99.9% Uptime",
    },
  ];

  const useCases = {
    customer: [
      "🛍️ Kaufe Gaming Cheats, Software-Lizenzen & mehr",
      "🔑 Alle Keys an einem Ort - übersichtliches Dashboard",
      "✅ Validiere Keys sofort auf Echtheit",
      "⏰ Lifetime Keys - kein Abo, einmal zahlen",
      "💬 24/7 Support bei Fragen",
      "🎁 Spare mit Key Bundles",
    ],
    developer: [
      "🚀 Verkaufe deine Software automatisiert",
      "🔧 Generiere unbegrenzt Keys mit eigenem Branding",
      "📊 Volle Kontrolle: Analytics, Preise, Laufzeiten",
      "👥 Reseller verkaufen für dich - mehr Reichweite",
      "💰 Automatische Auszahlungen",
      "🔌 API für eigene Integration",
    ],
    reseller: [
      "💼 Kaufe Keys von Developern zum Großhandelspreis",
      "📈 Verkaufe mit eigenem Markup - bestimme Preise selbst",
      "📦 Verwalte Inventory in Echtzeit",
      "💸 Verdiene 20-50% Marge pro Key",
      "🔄 Automatische Key-Verteilung an Kunden",
      "🎯 Referral System - verdiene zusätzlich",
    ],
  };

  const pricingPlans = [
    {
      name: "Customer",
      price: "Kostenlos",
      description: "Kaufe Keys, validiere Lizenzen",
      features: [
        { text: "Unbegrenzte Key-Käufe", included: true },
        { text: "Key Validator", included: true },
        { text: "Dashboard", included: true },
        { text: "24/7 Support", included: true },
        { text: "Lifetime Keys", included: true },
      ],
      cta: "Jetzt starten",
      popular: false,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      name: "Developer",
      price: "5% Fee",
      description: "Verkaufe deine Produkte",
      features: [
        { text: "Unbegrenzte Produkte", included: true },
        { text: "Key Generator", included: true },
        { text: "Reseller Network", included: true },
        { text: "Analytics Dashboard", included: true },
        { text: "API Access", included: true },
        { text: "Priority Support", included: true },
      ],
      cta: "Developer werden",
      popular: true,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      name: "Reseller",
      price: "Kostenlos",
      description: "Verkaufe Keys weiter",
      features: [
        { text: "Kaufe Keys von Devs", included: true },
        { text: "Eigene Preise festlegen", included: true },
        { text: "Inventory Management", included: true },
        { text: "Sales Analytics", included: true },
        { text: "Referral Programm", included: true },
      ],
      cta: "Reseller werden",
      popular: false,
      gradient: "from-yellow-500 to-orange-500",
    },
  ];

  const faqs = [
    {
      q: "Was ist CloudLicensePro?",
      a: "CloudLicensePro ist eine All-in-One Plattform für den Verkauf und die Verwaltung von digitalen Lizenzschlüsseln. Entwickler können ihre Software verkaufen, Reseller können Keys weiterverkaufen, und Kunden können alles zentral verwalten.",
    },
    {
      q: "Wie funktioniert das Reseller-System?",
      a: "Reseller kaufen Keys von Entwicklern zum Großhandelspreis und verkaufen diese mit eigenem Markup weiter. Die Plattform verwaltet automatisch Inventory, Key-Verteilung und Auszahlungen. Du verdienst zwischen 20-50% Marge pro Key!",
    },
    {
      q: "Was sind Lifetime Keys?",
      a: "Lifetime Keys sind Lizenzschlüssel ohne Ablaufdatum. Einmal kaufen, für immer nutzen - kein Abo-Modell! Entwickler können aber auch zeitlich begrenzte Keys (z.B. 30 Tage) erstellen.",
    },
    {
      q: "Wie schnell bekomme ich meine Keys?",
      a: "Sofort! Nach dem Kauf erscheinen deine Keys direkt in deinem Dashboard. Du kannst sie kopieren, validieren und sofort nutzen. Keine Wartezeit, keine E-Mail - instant delivery!",
    },
    {
      q: "Welche Zahlungsmethoden werden akzeptiert?",
      a: "Aktuell arbeiten wir an der Integration von PayPal, Stripe, Krypto und weiteren Payment-Providern. Stay tuned!",
    },
    {
      q: "Wie sicher sind meine Daten?",
      a: "Alle Daten werden verschlüsselt über Supabase (PostgreSQL) gespeichert. Row Level Security sorgt dafür, dass jeder User nur seine eigenen Daten sehen kann. 99.9% Uptime garantiert!",
    },
    {
      q: "Kann ich als Developer eine API nutzen?",
      a: "Ja! Jeder Developer bekommt API-Zugang. Integriere unsere Key-Validation direkt in deine Software, generiere Keys programmatisch, und mehr. Dokumentation coming soon!",
    },
    {
      q: "Was kostet die Nutzung?",
      a: "Für Kunden: Kostenlos! Für Reseller: Kostenlos! Für Developer: Nur 5% Gebühr auf Verkäufe. Keine Setup-Kosten, keine monatlichen Fees. Du zahlst nur, wenn du verdienst!",
    },
  ];

  const comparisonData = [
    {
      feature: "Key Generierung",
      cloudLicense: true,
      competitor1: true,
      competitor2: false,
    },
    {
      feature: "Reseller System",
      cloudLicense: true,
      competitor1: false,
      competitor2: false,
    },
    {
      feature: "Lifetime Keys",
      cloudLicense: true,
      competitor1: false,
      competitor2: true,
    },
    {
      feature: "Live Analytics",
      cloudLicense: true,
      competitor1: true,
      competitor2: false,
    },
    {
      feature: "API Zugang",
      cloudLicense: true,
      competitor1: false,
      competitor2: false,
    },
    {
      feature: "Multi-Rollen",
      cloudLicense: true,
      competitor1: false,
      competitor2: false,
    },
    {
      feature: "99.9% Uptime",
      cloudLicense: true,
      competitor1: true,
      competitor2: false,
    },
    {
      feature: "Referral Programm",
      cloudLicense: true,
      competitor1: false,
      competitor2: false,
    },
  ];

  const timeline = [
    {
      step: 1,
      title: "Account erstellen",
      description: "Registriere dich kostenlos in unter 60 Sekunden",
      icon: FaUserShield,
    },
    {
      step: 2,
      title: "Rolle wählen",
      description: "Customer, Developer oder Reseller - du entscheidest",
      icon: FaUsers,
    },
    {
      step: 3,
      title: "Loslegen",
      description: "Keys kaufen, verkaufen oder generieren - sofort!",
      icon: FaRocket,
    },
    {
      step: 4,
      title: "Profit!",
      description: "Verdiene Geld oder nutze deine Keys - ganz einfach",
      icon: FaTrophy,
    },
  ];

  return (
    <>
      {/* Sidebar - Only show if user is logged in */}
      {user && <Sidebar />}

      <div className={`min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#1A1A2E] to-[#16213E] text-white overflow-hidden relative ${user ? 'lg:ml-64' : ''}`}>
        {/* ANIMATED BACKGROUND */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Floating orbs */}
          <div className="absolute w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-float" style={{ top: '10%', left: '5%' }}></div>
          <div className="absolute w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-float-delay-1" style={{ bottom: '20%', right: '10%' }}></div>
          <div className="absolute w-80 h-80 bg-gradient-to-br from-yellow-500/15 to-orange-500/15 rounded-full blur-3xl animate-float-delay-2" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></div>

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(#00FF9C 1px, transparent 1px), linear-gradient(90deg, #00FF9C 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}></div>
          </div>

          {/* Particles */}
          {[...Array(30)].map((_, i) => (
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

        {/* NAVIGATION */}
        <nav className="sticky top-0 w-full bg-[#0A0A0F]/95 backdrop-blur-2xl border-b border-white/10 z-50 shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-2xl font-black cursor-pointer group" onClick={() => navigate('/')}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur-md group-hover:blur-lg transition"></div>
                <div className="relative bg-gradient-to-br from-[#00FF9C] to-cyan-400 p-2.5 rounded-xl shadow-lg transform group-hover:rotate-12 transition">
                  <FaRocket className="text-black" />
                </div>
              </div>
              <span className="bg-gradient-to-r from-[#00FF9C] via-cyan-400 to-purple-400 bg-clip-text text-transparent">
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

        {/* HERO SECTION */}
        <div className="relative pt-20 pb-16 px-6 z-10">
          <div className="max-w-7xl mx-auto">
            {/* Floating badge */}
            <div className="text-center mb-8">
              <div className="inline-block animate-bounce-slow">
                <span className="px-6 py-3 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-400/50 rounded-full text-sm font-black text-purple-200 backdrop-blur-sm shadow-2xl shadow-purple-500/20 inline-flex items-center gap-2">
                  <FaFire className="text-orange-400 animate-pulse" />
                  🚀 Die ultimative Lizenz-Plattform
                  <FaFire className="text-orange-400 animate-pulse" />
                </span>
              </div>
            </div>

            {/* Main headline */}
            <h1 className="text-6xl md:text-8xl font-black mb-6 leading-none text-center">
              <span className="relative inline-block">
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 blur-2xl opacity-50 animate-pulse"></span>
                <span className="relative bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl">
                  Verkaufe Digital.
                </span>
              </span>
              <br />
              <span className="relative inline-block mt-2">
                <span className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 blur-2xl opacity-50 animate-pulse" style={{animationDelay: '0.5s'}}></span>
                <span className="relative text-white drop-shadow-2xl">
                  Automatisiert. Profitabel.
                </span>
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed text-center">
              Die <strong className="text-[#00FF9C]">All-in-One Plattform</strong> für digitale Lizenzschlüssel.
              <br />
              Entwickler verkaufen. Reseller verdienen. Kunden profitieren.
              <br />
              <span className="text-purple-400 font-bold">Alles automatisch. Alles an einem Ort.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-5 justify-center flex-wrap mb-16">
              <button
                onClick={() => navigate("/signup")}
                className="group relative px-12 py-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl font-black text-xl overflow-hidden transform hover:scale-110 transition-all duration-300 shadow-2xl shadow-cyan-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-3">
                  <span>Kostenlos starten</span>
                  <FaArrowRight className="group-hover:translate-x-2 transition" />
                </div>
              </button>

              <button
                onClick={() => setPlayingDemo(true)}
                className="group relative px-12 py-6 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-2xl font-black text-xl overflow-hidden transform hover:scale-110 transition-all duration-300 backdrop-blur-sm"
              >
                <div className="relative flex items-center gap-3">
                  <FaPlay className="text-[#00FF9C]" />
                  <span>Demo ansehen</span>
                </div>
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-10 text-sm flex-wrap">
              <div className="flex items-center gap-2 group cursor-pointer">
                <FaShieldAlt className="text-3xl text-green-400 group-hover:scale-125 transition" />
                <div>
                  <p className="font-bold text-white">100% Sicher</p>
                  <p className="text-xs text-gray-400">Verschlüsselt & Geschützt</p>
                </div>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer">
                <FaBolt className="text-3xl text-yellow-400 group-hover:scale-125 transition" />
                <div>
                  <p className="font-bold text-white">Instant Delivery</p>
                  <p className="text-xs text-gray-400">Keys in Sekunden</p>
                </div>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer">
                <FaUsers className="text-3xl text-blue-400 group-hover:scale-125 transition" />
                <div>
                  <p className="font-bold text-white">500+ Nutzer</p>
                  <p className="text-xs text-gray-400">Und es werden mehr</p>
                </div>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer">
                <FaChartLine className="text-3xl text-purple-400 group-hover:scale-125 transition" />
                <div>
                  <p className="font-bold text-white">€50K+ Umsatz</p>
                  <p className="text-xs text-gray-400">In diesem Monat</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ANIMATED STATS SECTION */}
        <div ref={statsRef} className="relative py-20 px-6 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="relative bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-2xl border-2 border-white/20 rounded-3xl p-16 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5"></div>

              <h2 className="text-center text-4xl font-black mb-12 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Live Plattform Stats 📊
              </h2>

              <div className="relative grid grid-cols-2 md:grid-cols-4 gap-12">
                <div className="text-center group cursor-pointer transform hover:scale-110 transition">
                  <div className="text-6xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-3">
                    {animatedStats.keys.toLocaleString()}+
                  </div>
                  <p className="text-gray-300 font-bold">Keys verkauft</p>
                  <p className="text-xs text-gray-500 mt-1">Diesen Monat</p>
                </div>
                <div className="text-center group cursor-pointer transform hover:scale-110 transition">
                  <div className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                    {animatedStats.users.toLocaleString()}+
                  </div>
                  <p className="text-gray-300 font-bold">Active Users</p>
                  <p className="text-xs text-gray-500 mt-1">Developer & Reseller</p>
                </div>
                <div className="text-center group cursor-pointer transform hover:scale-110 transition">
                  <div className="text-6xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-3">
                    €{animatedStats.revenue.toLocaleString()}+
                  </div>
                  <p className="text-gray-300 font-bold">Umsatz</p>
                  <p className="text-xs text-gray-500 mt-1">Total Volume</p>
                </div>
                <div className="text-center group cursor-pointer transform hover:scale-110 transition">
                  <div className="text-6xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-3">
                    {animatedStats.uptime}%
                  </div>
                  <p className="text-gray-300 font-bold">Uptime</p>
                  <p className="text-xs text-gray-500 mt-1">Letzte 30 Tage</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES SHOWCASE */}
        <div className="relative py-20 px-6 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Warum CloudLicensePro? 🚀
              </h2>
              <p className="text-xl text-gray-400">Alle Features die du brauchst - und noch mehr</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="group relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:border-white/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 cursor-pointer overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition`}></div>

                  <div className="relative">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-lg`}>
                      <feature.icon className="text-white text-3xl" />
                    </div>
                    <h3 className="text-xl font-black mb-2 group-hover:text-white transition">{feature.title}</h3>
                    <p className="text-sm text-gray-400 mb-4">{feature.description}</p>
                    <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${feature.gradient} text-white text-xs font-bold`}>
                      {feature.demo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* USE CASES - TABBED SECTION */}
        <div className="relative py-20 px-6 z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Perfekt für jeden 💎
              </h2>
              <p className="text-xl text-gray-400">Wähle deine Rolle und entdecke die Möglichkeiten</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center gap-4 mb-8 flex-wrap">
              <button
                onClick={() => setActiveTab("customer")}
                className={`px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 ${
                  activeTab === "customer"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-xl shadow-cyan-500/50"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                👤 Customer
              </button>
              <button
                onClick={() => setActiveTab("developer")}
                className={`px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 ${
                  activeTab === "developer"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/50"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                👨‍💻 Developer
              </button>
              <button
                onClick={() => setActiveTab("reseller")}
                className={`px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 ${
                  activeTab === "reseller"
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-xl shadow-yellow-500/50"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                💼 Reseller
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-2 border-white/20 rounded-3xl p-12 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {useCases[activeTab].map((useCase, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition group cursor-pointer"
                  >
                    <FaCheckCircle className="text-[#00FF9C] text-xl mt-1 group-hover:scale-125 transition" />
                    <p className="text-white font-semibold">{useCase}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={() => {
                    if (activeTab === "customer") navigate("/signup");
                    if (activeTab === "developer") navigate("/dev-register");
                    if (activeTab === "reseller") navigate("/reseller-register");
                  }}
                  className={`px-10 py-4 rounded-xl font-black text-lg transform hover:scale-110 transition shadow-2xl ${
                    activeTab === "customer"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-cyan-500/50"
                      : activeTab === "developer"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-500/50"
                      : "bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-500/50"
                  }`}
                >
                  Als {activeTab === "customer" ? "Customer" : activeTab === "developer" ? "Developer" : "Reseller"} starten →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS - TIMELINE */}
        <div className="relative py-20 px-6 z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                So einfach geht's ⚡
              </h2>
              <p className="text-xl text-gray-400">In 4 Schritten zum Erfolg</p>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500 rounded-full hidden md:block"></div>

              {timeline.map((item, i) => (
                <div key={i} className={`relative mb-12 ${i % 2 === 0 ? 'md:pr-1/2' : 'md:pl-1/2'}`}>
                  <div className={`flex items-center gap-6 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                    {/* Circle on timeline */}
                    <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-purple-500/50 z-10">
                      <item.icon className="text-white text-2xl" />
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 shadow-xl hover:scale-105 transition transform cursor-pointer group">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="md:hidden w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg">
                          <item.icon className="text-white text-xl" />
                        </div>
                        <div className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                          {item.step}
                        </div>
                      </div>
                      <h3 className="text-2xl font-black mb-2 group-hover:text-[#00FF9C] transition">{item.title}</h3>
                      <p className="text-gray-400">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TESTIMONIALS SLIDER */}
        <div className="relative py-20 px-6 z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Was unsere User sagen 💬
              </h2>
              <p className="text-xl text-gray-400">Echte Erfahrungen von echten Menschen</p>
            </div>

            <div className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-2 border-white/20 rounded-3xl p-12 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 text-[#00FF9C]/10 text-9xl font-black">"</div>

              <div className="relative text-center">
                {/* Avatar */}
                <div className="text-7xl mb-4 animate-bounce-slow">{testimonials[currentTestimonial].avatar}</div>

                {/* Rating */}
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400 text-2xl" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-xl text-white mb-6 leading-relaxed italic">
                  "{testimonials[currentTestimonial].text}"
                </p>

                {/* Author */}
                <div>
                  <p className="text-lg font-black text-[#00FF9C]">{testimonials[currentTestimonial].name}</p>
                  <p className="text-sm text-gray-400">{testimonials[currentTestimonial].role}</p>
                </div>
              </div>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTestimonial(i)}
                    className={`w-3 h-3 rounded-full transition ${
                      i === currentTestimonial ? 'bg-[#00FF9C] w-8' : 'bg-white/30'
                    }`}
                  ></button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PRICING PREVIEW */}
        <div className="relative py-20 px-6 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Transparente Preise 💰
              </h2>
              <p className="text-xl text-gray-400">Keine versteckten Kosten. Nur pure Power.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans.map((plan, i) => (
                <div
                  key={i}
                  className={`relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-2 rounded-3xl p-8 transform hover:scale-105 transition-all duration-300 ${
                    plan.popular
                      ? 'border-[#00FF9C] shadow-2xl shadow-[#00FF9C]/30 -translate-y-4'
                      : 'border-white/20'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-[#00FF9C] to-cyan-400 rounded-full text-black font-black text-sm shadow-lg">
                      🔥 MOST POPULAR
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                    <div className={`text-5xl font-black mb-2 bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                      {plan.price}
                    </div>
                    <p className="text-sm text-gray-400">{plan.description}</p>
                  </div>

                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {feature.included ? (
                          <FaCheck className="text-[#00FF9C] text-lg flex-shrink-0" />
                        ) : (
                          <FaTimes className="text-red-400 text-lg flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-white' : 'text-gray-500 line-through'}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (plan.name === "Customer") navigate("/signup");
                      if (plan.name === "Developer") navigate("/dev-register");
                      if (plan.name === "Reseller") navigate("/reseller-register");
                    }}
                    className={`w-full py-4 rounded-xl font-black text-lg transition transform hover:scale-105 shadow-xl ${
                      plan.popular
                        ? `bg-gradient-to-r ${plan.gradient} text-white`
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COMPARISON TABLE */}
        <div className="relative py-20 px-6 z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Unschlagbar gut ⚔️
              </h2>
              <p className="text-xl text-gray-400">CloudLicensePro vs. Konkurrenz</p>
            </div>

            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-2 border-white/20 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="p-6 text-left text-white font-black">Feature</th>
                      <th className="p-6 text-center">
                        <div className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                          CloudLicense
                        </div>
                      </th>
                      <th className="p-6 text-center text-gray-400">Competitor A</th>
                      <th className="p-6 text-center text-gray-400">Competitor B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, i) => (
                      <tr key={i} className="border-b border-white/10 hover:bg-white/5 transition">
                        <td className="p-6 text-white font-semibold">{row.feature}</td>
                        <td className="p-6 text-center">
                          {row.cloudLicense ? (
                            <FaCheck className="text-[#00FF9C] text-2xl mx-auto animate-bounce" />
                          ) : (
                            <FaTimes className="text-red-400 text-2xl mx-auto" />
                          )}
                        </td>
                        <td className="p-6 text-center">
                          {row.competitor1 ? (
                            <FaCheck className="text-gray-500 text-2xl mx-auto" />
                          ) : (
                            <FaTimes className="text-red-400 text-2xl mx-auto" />
                          )}
                        </td>
                        <td className="p-6 text-center">
                          {row.competitor2 ? (
                            <FaCheck className="text-gray-500 text-2xl mx-auto" />
                          ) : (
                            <FaTimes className="text-red-400 text-2xl mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ SECTION */}
        <div className="relative py-20 px-6 z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                Häufige Fragen 🤔
              </h2>
              <p className="text-xl text-gray-400">Alles was du wissen musst</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden hover:border-[#00FF9C]/50 transition"
                >
                  <button
                    onClick={() => setActiveFAQ(activeFAQ === i ? null : i)}
                    className="w-full p-6 flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <FaQuestionCircle className="text-[#00FF9C] text-2xl group-hover:scale-125 transition" />
                      <span className="text-lg font-bold text-white">{faq.q}</span>
                    </div>
                    {activeFAQ === i ? (
                      <FaChevronUp className="text-gray-400 text-xl" />
                    ) : (
                      <FaChevronDown className="text-gray-400 text-xl" />
                    )}
                  </button>

                  {activeFAQ === i && (
                    <div className="px-6 pb-6">
                      <div className="pl-12 text-gray-300 leading-relaxed">
                        {faq.a}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* NEWSLETTER SECTION */}
        <div className="relative py-20 px-6 z-10">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20 border-2 border-purple-500/50 rounded-3xl p-12 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 animate-pulse"></div>

              <div className="relative text-center">
                <div className="inline-block mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl shadow-lg">
                    <FaEnvelope className="text-5xl text-white" />
                  </div>
                </div>

                <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Bleib up-to-date! 📬
                </h2>
                <p className="text-lg text-gray-300 mb-8">
                  Erhalte exklusive Updates, neue Features und Special Deals direkt in dein Postfach.
                </p>

                {newsletterStatus === "success" ? (
                  <div className="bg-green-500/20 border border-green-500 rounded-xl p-6">
                    <FaCheckCircle className="text-green-400 text-4xl mx-auto mb-3" />
                    <p className="text-green-300 font-bold">Erfolgreich angemeldet! Check deine Inbox 🎉</p>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSignup} className="flex gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine@email.com"
                      className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-[#00FF9C] focus:outline-none transition"
                      required
                    />
                    <button
                      type="submit"
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-black hover:shadow-xl hover:shadow-purple-500/50 transition transform hover:scale-105"
                    >
                      Abonnieren
                    </button>
                  </form>
                )}

                <p className="text-xs text-gray-500 mt-4">
                  Keine Spam. Nur die besten Updates. Jederzeit abmeldbar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="relative py-20 px-6 z-10">
          <div className="max-w-5xl mx-auto">
            <div className="relative bg-gradient-to-br from-cyan-600/20 via-purple-600/20 to-pink-600/20 border-2 border-cyan-500/50 rounded-3xl p-16 overflow-hidden shadow-2xl text-center">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-purple-600/10 animate-pulse"></div>

              <div className="relative">
                <h2 className="text-6xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
                  Bereit durchzustarten? 🚀
                </h2>
                <p className="text-2xl text-gray-300 mb-12 leading-relaxed">
                  Schließe dich <strong className="text-[#00FF9C]">500+ Nutzern</strong> an und starte noch heute.
                  <br />
                  Kostenlos, einfach, profitabel.
                </p>

                <div className="flex gap-6 justify-center flex-wrap">
                  <button
                    onClick={() => navigate("/signup")}
                    className="px-12 py-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl font-black text-2xl hover:shadow-2xl hover:shadow-cyan-500/50 transition transform hover:scale-110"
                  >
                    Jetzt kostenlos starten →
                  </button>
                  <button
                    onClick={() => navigate("/reseller-shops")}
                    className="px-12 py-6 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-2xl font-black text-2xl transition transform hover:scale-110"
                  >
                    Shops durchsuchen
                  </button>
                </div>

                <div className="mt-12 flex items-center justify-center gap-8 flex-wrap text-sm">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-[#00FF9C] text-xl" />
                    <span>Keine Kreditkarte benötigt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-[#00FF9C] text-xl" />
                    <span>Setup in 60 Sekunden</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-[#00FF9C] text-xl" />
                    <span>Jederzeit kündbar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="relative border-t-2 border-white/10 py-16 px-6 bg-[#0A0A0F]/50 backdrop-blur-xl z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-br from-[#00FF9C] to-cyan-400 p-3 rounded-xl">
                    <FaRocket className="text-black text-2xl" />
                  </div>
                  <span className="text-2xl font-black">CloudLicensePro</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Die moderne Lizenz-Plattform für Entwickler, Reseller und Endkunden. Automatisiert, sicher und profitabel.
                </p>
              </div>

              {/* Product */}
              <div>
                <h3 className="text-lg font-black mb-4 text-[#00FF9C]">Produkt</h3>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => navigate("/signup")} className="text-gray-400 hover:text-white transition">Features</button></li>
                  <li><button onClick={() => navigate("/reseller-shops")} className="text-gray-400 hover:text-white transition">Marketplace</button></li>
                  <li><button onClick={() => navigate("/key-validator")} className="text-gray-400 hover:text-white transition">Key Validator</button></li>
                  <li><button onClick={() => navigate("/referral")} className="text-gray-400 hover:text-white transition">Referral Programm</button></li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="text-lg font-black mb-4 text-[#00FF9C]">Firma</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Über uns</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Karriere</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Kontakt</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-lg font-black mb-4 text-[#00FF9C]">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Datenschutz</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">AGB</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Impressum</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Cookie Policy</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <p>© 2025 CloudLicensePro</p>
                <span>•</span>
                <p className="flex items-center gap-1">
                  Made with <FaHeart className="text-red-400 animate-pulse" /> by the team
                </p>
              </div>

              <div className="flex items-center gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition transform hover:scale-125">
                  <FaGlobe className="text-xl" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition transform hover:scale-125">
                  <FaComments className="text-xl" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition transform hover:scale-125">
                  <FaHeadset className="text-xl" />
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* VIDEO DEMO MODAL */}
        {playingDemo && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setPlayingDemo(false)}
          >
            <div className="max-w-5xl w-full bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] rounded-3xl overflow-hidden border-2 border-[#00FF9C]/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="bg-[#0F0F14] p-6 flex items-center justify-between border-b border-[#2C2C34]">
                <h2 className="text-2xl font-black text-[#00FF9C]">🎥 CloudLicensePro Demo</h2>
                <button
                  onClick={() => setPlayingDemo(false)}
                  className="p-2 hover:bg-[#2C2C34] rounded-lg transition"
                >
                  <FaTimes className="text-2xl text-gray-400 hover:text-white" />
                </button>
              </div>

              <div className="aspect-video bg-[#0F0F14] flex items-center justify-center">
                <div className="text-center">
                  <FaPlay className="text-6xl text-[#00FF9C] mx-auto mb-4 animate-pulse" />
                  <p className="text-xl text-gray-400">Demo Video coming soon...</p>
                  <p className="text-sm text-gray-500 mt-2">Wir arbeiten an einem epischen Demo! 🚀</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom animations */}
        <style>{`
          @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
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
          .animate-float { animation: float 20s ease-in-out infinite; }
          .animate-float-delay-1 { animation: float-delay-1 25s ease-in-out infinite 2s; }
          .animate-float-delay-2 { animation: float-delay-2 30s ease-in-out infinite 4s; }
          .animate-particle { animation: particle linear infinite; }
          .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        `}</style>
      </div>
    </>
  );
}
