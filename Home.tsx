// src/pages/Home.tsx - MEGA LANDING PAGE WITH FIXED BUBBLES
import { useEffect, useState, useRef } from "react";
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
  FaCheck,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

// Animated Counter Hook
function useAnimatedCounter(targetValue: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * targetValue));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, targetValue, duration]);

  return { count, elementRef };
}

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"customer" | "developer" | "reseller">("customer");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // Animated Counters
  const keysCounter = useAnimatedCounter(10247);
  const usersCounter = useAnimatedCounter(523);
  const revenueCounter = useAnimatedCounter(52340);
  const uptimeCounter = useAnimatedCounter(999);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    }
    checkAuth();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      name: "MaxCheats",
      role: "Game Tools Developer",
      text: "CloudLicensePro hat mein Business revolutioniert! Früher hatte ich ständig Probleme mit Key-Management. Jetzt läuft alles automatisch.",
      rating: 5,
      avatar: "👨‍💻",
    },
    {
      name: "KeyKingdom",
      role: "Reseller Pro",
      text: "Als Reseller verdiene ich jetzt das Doppelte! Die Plattform ist mega einfach zu bedienen und der Support antwortet innerhalb von Minuten.",
      rating: 5,
      avatar: "💼",
    },
    {
      name: "ProGamer23",
      role: "Customer",
      text: "Keys instant erhalten, Validierung funktioniert perfekt. Hab schon 5 Freunden empfohlen!",
      rating: 5,
      avatar: "🎮",
    },
    {
      name: "CodingNinja",
      role: "Developer",
      text: "Die API ist super einfach zu integrieren. In 10 Minuten hatte ich mein erstes Produkt live!",
      rating: 5,
      avatar: "🥷",
    },
  ];

  const faqs = [
    {
      q: "Was ist CloudLicensePro?",
      a: "CloudLicensePro ist eine All-in-One Plattform für digitale Produkte. Du kannst Keys verkaufen, kaufen, validieren und als Reseller Geld verdienen.",
    },
    {
      q: "Wie funktioniert das Reseller-System?",
      a: "Als Reseller kaufst du Keys von Developern zu einem günstigeren Preis und verkaufst sie weiter. Du bestimmst deinen eigenen Preis und Gewinnmarge!",
    },
    {
      q: "Gibt es eine Lifetime License?",
      a: "Ja! Alle Keys können als Lifetime-Lizenzen verkauft werden. Du entscheidest, ob deine Produkte zeitlich begrenzt oder unbegrenzt gültig sind.",
    },
    {
      q: "Wie schnell erhalte ich meine Keys?",
      a: "Sofort! Nach dem Kauf werden Keys automatisch generiert und dir per Email zugeschickt. Validierung funktioniert in Echtzeit.",
    },
    {
      q: "Welche Zahlungsmethoden werden akzeptiert?",
      a: "Aktuell im TEST MODE - keine echte Zahlung erforderlich. In Produktion: Kreditkarte, PayPal, Crypto und mehr!",
    },
    {
      q: "Ist meine Zahlung sicher?",
      a: "Absolut! Wir nutzen Stripe und PayPal für sichere Zahlungsabwicklung. Deine Daten werden verschlüsselt übertragen.",
    },
    {
      q: "Gibt es eine API für Entwickler?",
      a: "Ja! Vollständige REST API mit Dokumentation. Du kannst Keys generieren, validieren und verwalten - alles programmgesteuert.",
    },
    {
      q: "Was kostet CloudLicensePro?",
      a: "Für Kunden: Kostenlos! Für Developer: 5% Fee pro Verkauf. Für Reseller: Kostenlos + eigene Preise festlegen.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] relative overflow-hidden">
      {/* FLOATING BUBBLES - CSS ONLY (No re-render!) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="bubble absolute rounded-full opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${20 + Math.random() * 80}px`,
              height: `${20 + Math.random() * 80}px`,
              background: `radial-gradient(circle, ${
                i % 3 === 0 ? "#00FF9C" : i % 3 === 1 ? "#A855F7" : "#3B82F6"
              }, transparent)`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 20}s`,
              bottom: `-${Math.random() * 100}px`,
            }}
          />
        ))}
      </div>

      {/* BACKGROUND GRID */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(44, 44, 52, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(44, 44, 52, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* CONTENT - Higher z-index */}
      <div className="relative z-10">
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
            <div className="inline-block mb-4 px-4 py-2 bg-[#00FF9C]/10 border border-[#00FF9C]/30 rounded-full text-[#00FF9C] text-sm font-bold animate-pulse">
              🔥 Die nächste Generation ist hier
            </div>

            <h1 className="text-7xl md:text-8xl font-black mb-6 bg-gradient-to-r from-[#00FF9C] via-purple-400 to-blue-400 bg-clip-text text-transparent leading-tight">
              Lizenz-Management
              <br />
              neu definiert
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-8">
              Verkaufe digitale Produkte, verwalte Keys, verdiene Geld als Reseller -
              <span className="text-[#00FF9C] font-bold"> alles an einem Ort</span>
            </p>

            <div className="flex gap-4 justify-center flex-wrap mb-12">
              <button
                onClick={() => navigate("/signup")}
                className="px-8 py-4 bg-[#00FF9C] text-[#0E0E12] rounded-lg font-bold text-lg hover:bg-[#00cc80] transition hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#00FF9C]/20"
              >
                Kostenlos starten <FaArrowRight />
              </button>
              <button
                onClick={() => navigate("/shop")}
                className="px-8 py-4 bg-[#1A1A1F] border border-[#2C2C34] text-white rounded-lg font-bold text-lg hover:border-[#00FF9C] transition hover:scale-105 flex items-center gap-2"
              >
                Shop ansehen <FaShoppingCart />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex gap-6 justify-center flex-wrap text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <FaShieldAlt className="text-green-400" />
                <span>100% Sicher</span>
              </div>
              <div className="flex items-center gap-2">
                <FaRocket className="text-[#00FF9C]" />
                <span>Instant Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <FaUsers className="text-blue-400" />
                <span>500+ Nutzer</span>
              </div>
              <div className="flex items-center gap-2">
                <FaDollarSign className="text-purple-400" />
                <span>€50k+ Revenue</span>
              </div>
            </div>
          </div>
        </div>

        {/* ANIMATED STATS SECTION */}
        <div className="py-20 px-8 bg-[#1A1A1F]/30 border-y border-[#2C2C34] backdrop-blur">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Keys Sold */}
              <div ref={keysCounter.elementRef} className="text-center p-6 bg-[#1A1A1F]/50 rounded-lg border border-[#2C2C34] hover:scale-105 transition">
                <div className="text-5xl font-bold text-[#00FF9C] mb-2">
                  {keysCounter.count.toLocaleString()}+
                </div>
                <p className="text-gray-400">Keys verkauft</p>
              </div>

              {/* Users */}
              <div ref={usersCounter.elementRef} className="text-center p-6 bg-[#1A1A1F]/50 rounded-lg border border-[#2C2C34] hover:scale-105 transition">
                <div className="text-5xl font-bold text-purple-400 mb-2">
                  {usersCounter.count}+
                </div>
                <p className="text-gray-400">Developer & Reseller</p>
              </div>

              {/* Revenue */}
              <div ref={revenueCounter.elementRef} className="text-center p-6 bg-[#1A1A1F]/50 rounded-lg border border-[#2C2C34] hover:scale-105 transition">
                <div className="text-5xl font-bold text-blue-400 mb-2">
                  €{revenueCounter.count.toLocaleString()}+
                </div>
                <p className="text-gray-400">Umsatz generiert</p>
              </div>

              {/* Uptime */}
              <div ref={uptimeCounter.elementRef} className="text-center p-6 bg-[#1A1A1F]/50 rounded-lg border border-[#2C2C34] hover:scale-105 transition">
                <div className="text-5xl font-bold text-green-400 mb-2">
                  {(uptimeCounter.count / 10).toFixed(1)}%
                </div>
                <p className="text-gray-400">Uptime</p>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES SHOWCASE */}
        <div className="py-20 px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-4">
              <span className="bg-gradient-to-r from-[#00FF9C] to-blue-400 bg-clip-text text-transparent">
                Alles was du brauchst
              </span>
            </h2>
            <p className="text-center text-gray-400 text-xl mb-16">
              Eine Plattform. Unendliche Möglichkeiten.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <FaKey />, title: "Key Generation", desc: "Generiere unbegrenzt Keys", color: "text-[#00FF9C]", badge: "< 1s" },
                { icon: <FaShoppingCart />, title: "Marketplace", desc: "Verkaufe deine Produkte", color: "text-purple-400", badge: "5% Fee" },
                { icon: <FaShieldAlt />, title: "Validation", desc: "Echtzeit Key-Prüfung", color: "text-blue-400", badge: "< 100ms" },
                { icon: <FaChartBar />, title: "Analytics", desc: "Detaillierte Statistiken", color: "text-green-400", badge: "Live" },
                { icon: <FaUsers />, title: "Multi-Rollen", desc: "Customer, Dev, Reseller", color: "text-yellow-400", badge: "3 Rollen" },
                { icon: <FaTrophy />, title: "Lifetime Keys", desc: "Keine monatlichen Gebühren", color: "text-red-400", badge: "Forever" },
                { icon: <FaCode />, title: "API First", desc: "Vollständige REST API", color: "text-cyan-400", badge: "Docs" },
                { icon: <FaRocket />, title: "Cloud Native", desc: "99.9% Uptime garantiert", color: "text-pink-400", badge: "24/7" },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="relative group bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C] transition hover:scale-105 hover:-translate-y-1"
                >
                  <div className="absolute top-4 right-4 text-xs px-2 py-1 bg-[#00FF9C]/10 text-[#00FF9C] rounded-full font-bold">
                    {feature.badge}
                  </div>
                  <div className={`text-4xl mb-4 ${feature.color} group-hover:scale-110 transition`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* USE CASES - TABBED */}
        <div className="py-20 px-8 bg-[#1A1A1F]/30 border-y border-[#2C2C34]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Für jeden perfekt
              </span>
            </h2>
            <p className="text-center text-gray-400 text-xl mb-12">
              Wähle deine Rolle und starte durch
            </p>

            {/* Tabs */}
            <div className="flex justify-center gap-4 mb-12 flex-wrap">
              {[
                { id: "customer", label: "👤 Kunde", color: "bg-[#00FF9C]" },
                { id: "developer", label: "👨‍💻 Developer", color: "bg-purple-500" },
                { id: "reseller", label: "💼 Reseller", color: "bg-blue-500" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`px-6 py-3 rounded-lg font-bold transition ${
                    selectedTab === tab.id
                      ? `${tab.color} text-black`
                      : "bg-[#1A1A1F] border border-[#2C2C34] text-gray-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="max-w-3xl mx-auto bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8">
              {selectedTab === "customer" && (
                <div>
                  <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    👤 Als Kunde
                  </h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3 text-lg">
                      <FaCheckCircle className="text-green-400 flex-shrink-0" />
                      <span>Keys sofort kaufen und erhalten</span>
                    </li>
                    <li className="flex items-center gap-3 text-lg">
                      <FaCheckCircle className="text-green-400 flex-shrink-0" />
                      <span>Bundles mit bis zu 32% Rabatt</span>
                    </li>
                    <li className="flex items-center gap-3 text-lg">
                      <FaCheckCircle className="text-green-400 flex-shrink-0" />
                      <span>Instant Validierung deiner Keys</span>
                    </li>
                    <li className="flex items-center gap-3 text-lg">
                      <FaCheckCircle className="text-green-400 flex-shrink-0" />
                      <span>Bewertungen schreiben und lesen</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => navigate("/shop")}
                    className="w-full py-3 bg-[#00FF9C] text-black rounded-lg font-bold text-lg hover:bg-[#00cc80] transition"
                  >
                    Zum Shop →
                  </button>
                </div>
              )}

              {selectedTab === "developer" && (
                <div>
                  <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    👨‍💻 Als Developer
                  </h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3 text-lg">
                      <FaCheckCircle className="text-green-400 flex-shrink-0" />
                      <span>Unbegrenzt Keys generieren</span>
                    </li>
                    <li className="flex items-center gap-3 text-lg">
                      <FaCheckCircle className="text-green-400 flex-shrink-0" />
                      <span>Reseller-Netzwerk aufbauen</span>
                    </li>
                    <li className="flex items-center gap-3 text-lg">
                      <FaCheckCircle className="text-green-400 flex-shrink-0" />
                      <span>REST API für Integration</span>
                    </li>
                    <li className="flex items-center gap-3 text-lg">
                      <FaCheckCircle className="text-green-400 flex-shrink-0" />
                      <span>Verdienste in Echtzeit tracken</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => navigate("/dev-register")}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold text-lg hover:bg-purple-700 transition"
                  >
                    Developer werden →
                  </button>
                </div>
              )}

              {selectedTab === "reseller" && (
                <div>
                  <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    💼 Als Reseller
                  </h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3 text-lg">
                      <FaCheckCircle className="text-green-400 flex-shrink-0" />
                      <span>Keys günstig einkaufen</span>
                    </li>
                    <li className="flex items-center gap-3 text-lg">
                      <FaCheckCircle className="text-green-400 flex-shrink-0" />
                      <span>Eigene Preise festlegen</span>
                    </li>
                    <li className="flex items-center gap-3 text-lg">
                      <FaCheckCircle className="text-green-400 flex-shrink-0" />
                      <span>Inventory Management Tools</span>
                    </li>
                    <li className="flex items-center gap-3 text-lg">
                      <FaCheckCircle className="text-green-400 flex-shrink-0" />
                      <span>Gewinn verdoppeln und mehr!</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => navigate("/reseller-register")}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition"
                  >
                    Reseller werden →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TESTIMONIALS SLIDER */}
        <div className="py-20 px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-4">
              <span className="bg-gradient-to-r from-[#00FF9C] to-purple-400 bg-clip-text text-transparent">
                Was unsere Nutzer sagen
              </span>
            </h2>
            <p className="text-center text-gray-400 text-xl mb-12">
              Über 500 zufriedene Nutzer weltweit
            </p>

            <div className="relative">
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 md:p-12">
                <div className="text-6xl mb-4 animate-bounce">
                  {testimonials[testimonialIndex].avatar}
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonials[testimonialIndex].rating)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400" />
                  ))}
                </div>
                <p className="text-xl text-gray-300 mb-6 italic">
                  "{testimonials[testimonialIndex].text}"
                </p>
                <div>
                  <p className="font-bold text-lg">{testimonials[testimonialIndex].name}</p>
                  <p className="text-gray-400">{testimonials[testimonialIndex].role}</p>
                </div>
              </div>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-6">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTestimonialIndex(idx)}
                    className={`w-3 h-3 rounded-full transition ${
                      idx === testimonialIndex ? "bg-[#00FF9C]" : "bg-[#2C2C34]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PRICING PREVIEW */}
        <div className="py-20 px-8 bg-[#1A1A1F]/30 border-y border-[#2C2C34]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Transparente Preise
              </span>
            </h2>
            <p className="text-center text-gray-400 text-xl mb-12">
              Keine versteckten Gebühren. Nur fair.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Customer */}
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 hover:border-[#00FF9C] transition">
                <div className="text-4xl mb-4">👤</div>
                <h3 className="text-2xl font-bold mb-2">Kunde</h3>
                <div className="text-4xl font-bold mb-4 text-[#00FF9C]">Kostenlos</div>
                <p className="text-gray-400 mb-6">Kaufe Keys und spare mit Bundles</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-green-400" />
                    <span className="text-sm">Instant Key Delivery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-green-400" />
                    <span className="text-sm">Bundle Discounts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-green-400" />
                    <span className="text-sm">Key Validation</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate("/shop")}
                  className="w-full py-3 bg-[#2C2C34] rounded-lg font-bold hover:bg-[#3C3C44] transition"
                >
                  Zum Shop
                </button>
              </div>

              {/* Developer - MOST POPULAR */}
              <div className="bg-[#1A1A1F] border-2 border-[#00FF9C] rounded-lg p-8 relative hover:scale-105 transition">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#00FF9C] text-black text-xs font-bold rounded-full">
                  MOST POPULAR
                </div>
                <div className="text-4xl mb-4">👨‍💻</div>
                <h3 className="text-2xl font-bold mb-2">Developer</h3>
                <div className="text-4xl font-bold mb-4 text-[#00FF9C]">5% Fee</div>
                <p className="text-gray-400 mb-6">Pro Verkauf - keine monatlichen Kosten</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-green-400" />
                    <span className="text-sm">Unbegrenzte Keys</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-green-400" />
                    <span className="text-sm">Reseller Network</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-green-400" />
                    <span className="text-sm">Full API Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-green-400" />
                    <span className="text-sm">Analytics Dashboard</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate("/dev-register")}
                  className="w-full py-3 bg-[#00FF9C] text-black rounded-lg font-bold hover:bg-[#00cc80] transition"
                >
                  Developer werden
                </button>
              </div>

              {/* Reseller */}
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 hover:border-blue-400 transition">
                <div className="text-4xl mb-4">💼</div>
                <h3 className="text-2xl font-bold mb-2">Reseller</h3>
                <div className="text-4xl font-bold mb-4 text-[#00FF9C]">Kostenlos</div>
                <p className="text-gray-400 mb-6">Verdiene an deiner Marge</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-green-400" />
                    <span className="text-sm">Günstig Einkaufen</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-green-400" />
                    <span className="text-sm">Eigene Preise</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCheck className="text-green-400" />
                    <span className="text-sm">Inventory Tools</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate("/reseller-register")}
                  className="w-full py-3 bg-[#2C2C34] rounded-lg font-bold hover:bg-[#3C3C44] transition"
                >
                  Reseller werden
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ ACCORDION */}
        <div className="py-20 px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-[#00FF9C] bg-clip-text text-transparent">
                Häufige Fragen
              </span>
            </h2>
            <p className="text-center text-gray-400 text-xl mb-12">
              Alles was du wissen musst
            </p>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg overflow-hidden hover:border-[#00FF9C] transition"
                >
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-lg hover:bg-[#2C2C34]/30 transition"
                  >
                    <span>{faq.q}</span>
                    {openFaqIndex === idx ? (
                      <FaChevronUp className="text-[#00FF9C]" />
                    ) : (
                      <FaChevronDown className="text-gray-400" />
                    )}
                  </button>
                  {openFaqIndex === idx && (
                    <div className="px-6 py-4 border-t border-[#2C2C34] text-gray-400">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="py-20 px-8 bg-gradient-to-r from-[#00FF9C]/10 to-purple-600/10 border-y border-[#00FF9C]/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-[#00FF9C] to-purple-400 bg-clip-text text-transparent">
                Bereit durchzustarten?
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Werde Teil der Community. Kostenlos, sicher und in 60 Sekunden startklar!
            </p>

            <div className="flex gap-4 justify-center flex-wrap mb-8">
              <button
                onClick={() => navigate("/signup")}
                className="px-10 py-4 bg-[#00FF9C] text-[#0E0E12] rounded-lg font-bold text-xl hover:bg-[#00cc80] transition hover:scale-105 shadow-lg shadow-[#00FF9C]/30"
              >
                Jetzt kostenlos starten
              </button>
              <button
                onClick={() => navigate("/shop")}
                className="px-10 py-4 bg-[#1A1A1F] border border-[#2C2C34] text-white rounded-lg font-bold text-xl hover:border-[#00FF9C] transition hover:scale-105"
              >
                Shops durchstöbern
              </button>
            </div>

            <div className="flex gap-6 justify-center text-sm text-gray-400 flex-wrap">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400" />
                <span>Keine Kreditkarte erforderlich</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400" />
                <span>Setup in 60 Sekunden</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400" />
                <span>Jederzeit kündbar</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="border-t border-[#2C2C34] py-12 px-8 bg-[#0E0E12]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4 text-xl font-bold">
                  <FaRocket className="text-[#00FF9C]" />
                  <span>CloudLicensePro</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Die nächste Generation Lizenz-Management Plattform
                </p>
                <div className="flex gap-3">
                  <button className="w-10 h-10 bg-[#2C2C34] rounded-lg flex items-center justify-center hover:bg-[#00FF9C] hover:text-black transition">
                    🌐
                  </button>
                  <button className="w-10 h-10 bg-[#2C2C34] rounded-lg flex items-center justify-center hover:bg-[#00FF9C] hover:text-black transition">
                    💬
                  </button>
                  <button className="w-10 h-10 bg-[#2C2C34] rounded-lg flex items-center justify-center hover:bg-[#00FF9C] hover:text-black transition">
                    🎧
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-4 text-white">Produkt</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <button onClick={() => navigate("/shop")} className="hover:text-[#00FF9C] transition">
                      Shop
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("/bundles")} className="hover:text-[#00FF9C] transition">
                      Bundles
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("/reviews")} className="hover:text-[#00FF9C] transition">
                      Reviews
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("/validate-key")} className="hover:text-[#00FF9C] transition">
                      Validator
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-4 text-white">Entwickler</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <button onClick={() => navigate("/dev-register")} className="hover:text-[#00FF9C] transition">
                      Registrieren
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("/dev-docs")} className="hover:text-[#00FF9C] transition">
                      API Docs
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate("/dev-api-keys")} className="hover:text-[#00FF9C] transition">
                      API Keys
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-4 text-white">Rechtliches</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <button className="hover:text-[#00FF9C] transition">
                      Datenschutz
                    </button>
                  </li>
                  <li>
                    <button className="hover:text-[#00FF9C] transition">
                      AGB
                    </button>
                  </li>
                  <li>
                    <button className="hover:text-[#00FF9C] transition">
                      Impressum
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

      {/* CSS for Floating Bubbles */}
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(100vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-100vh) translateX(${Math.random() > 0.5 ? '' : '-'}${20 + Math.random() * 40}px) rotate(360deg);
            opacity: 0;
          }
        }

        .bubble {
          animation: float-up linear infinite;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
}
