// src/components/Sidebar.tsx - ULTRA MODERN SIDEBAR - SELLIX/SHOPPY STYLE 🚀
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaHome,
  FaShoppingCart,
  FaBox,
  FaKey,
  FaUsers,
  FaGem,
  FaRocket,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaChartBar,
  FaStore,
  FaShieldAlt,
  FaGift,
  FaStar,
  FaChartLine,
  FaHandshake,
  FaCrown,
  FaFire,
  FaClipboardCheck,
  FaUpload,
  FaDollarSign,
  FaBolt,
  FaChevronLeft,
  FaChevronRight,
  FaLayerGroup,
  FaMapMarkedAlt,
  FaTrophy,
} from "react-icons/fa";

type UserRole = "admin" | "developer" | "reseller" | "customer" | null;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    async function detectUserRole() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const metadata = data.user.user_metadata as any;
          setUserEmail(data.user.email || "");
          setUserName(metadata?.name || data.user.email?.split("@")[0] || "User");

          // Check for admin first
          if (metadata?.admin === true) {
            setUserRole("admin");
          } else if (metadata?.is_developer) {
            setUserRole("developer");
          } else if (metadata?.is_reseller) {
            setUserRole("reseller");
          } else {
            setUserRole("customer");
          }
        }
      } catch (err) {
        console.error("Error detecting user role:", err);
      }
    }

    detectUserRole();
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  // ADMIN MENU ITEMS
  const adminMenuItems = [
    {
      category: "🔥 ADMIN PANEL",
      items: [
        { label: "Landing Page", path: "/", icon: FaMapMarkedAlt, gradient: "from-cyan-500 to-blue-500" },
        { label: "Admin Dashboard", path: "/admin", icon: FaCrown, badge: "ADMIN", gradient: "from-yellow-500 to-orange-500" },
      ],
    },
    {
      category: "📊 MANAGEMENT",
      items: [
        { label: "Alle Kunden", path: "/admin", icon: FaUsers, gradient: "from-green-500 to-emerald-500" },
        { label: "Alle Reseller", path: "/admin", icon: FaStore, gradient: "from-purple-500 to-pink-500" },
        { label: "Alle Developer", path: "/admin", icon: FaBox, gradient: "from-blue-500 to-cyan-500" },
        { label: "Referral System", path: "/admin", icon: FaHandshake, gradient: "from-indigo-500 to-purple-500" },
      ],
    },
  ];

  // DEVELOPER MENU ITEMS
  const developerMenuItems = [
    {
      category: "🚀 HAUPTMENÜ",
      items: [
        { label: "Landing Page", path: "/", icon: FaMapMarkedAlt, gradient: "from-cyan-500 to-blue-500" },
        { label: "Dashboard", path: "/developer-dashboard", icon: FaHome, gradient: "from-green-500 to-emerald-500" },
        { label: "Produkte", path: "/dev-products", icon: FaBox, gradient: "from-purple-500 to-pink-500" },
        { label: "Lizenzen", path: "/dev-licenses", icon: FaKey, gradient: "from-yellow-500 to-orange-500" },
        { label: "Key Generator", path: "/dev-key-generator", icon: FaRocket, badge: "HOT", gradient: "from-red-500 to-pink-500" },
      ],
    },
    {
      category: "💼 VERWALTUNG",
      items: [
        { label: "Reseller", path: "/dev-resellers", icon: FaUsers, gradient: "from-blue-500 to-cyan-500" },
        { label: "Analytics", path: "/dev-analytics", icon: FaChartLine, gradient: "from-indigo-500 to-purple-500" },
      ],
    },
    {
      category: "⚙️ SYSTEM",
      items: [
        { label: "Key Validator", path: "/key-validator", icon: FaShieldAlt, gradient: "from-green-500 to-teal-500" },
        { label: "Einstellungen", path: "/profile-settings", icon: FaCog, gradient: "from-gray-500 to-gray-600" },
      ],
    },
  ];

  // RESELLER MENU ITEMS
  const resellerMenuItems = [
    {
      category: "🚀 HAUPTMENÜ",
      items: [
        { label: "Landing Page", path: "/", icon: FaMapMarkedAlt, gradient: "from-cyan-500 to-blue-500" },
        { label: "Dashboard", path: "/reseller-dashboard", icon: FaHome, gradient: "from-green-500 to-emerald-500" },
        { label: "Keys hochladen", path: "/reseller-key-upload", icon: FaUpload, badge: "NEW", gradient: "from-purple-500 to-pink-500" },
        { label: "Mein Lager", path: "/reseller-inventory", icon: FaLayerGroup, gradient: "from-yellow-500 to-orange-500" },
      ],
    },
    {
      category: "💰 VERKAUF",
      items: [
        { label: "Verkäufe", path: "/reseller-sales", icon: FaDollarSign, badge: "LIVE", gradient: "from-green-500 to-teal-500" },
        { label: "Developer", path: "/reseller-developers", icon: FaUsers, gradient: "from-blue-500 to-cyan-500" },
        { label: "Analytics", path: "/reseller-analytics", icon: FaChartBar, gradient: "from-indigo-500 to-purple-500" },
      ],
    },
    {
      category: "🎯 TOOLS",
      items: [
        { label: "Key Validator", path: "/key-validator", icon: FaShieldAlt, gradient: "from-green-500 to-teal-500" },
        { label: "Referral Program", path: "/referral", icon: FaHandshake, badge: "💰", gradient: "from-purple-500 to-pink-500" },
        { label: "Einstellungen", path: "/profile-settings", icon: FaCog, gradient: "from-gray-500 to-gray-600" },
      ],
    },
  ];

  // CUSTOMER MENU ITEMS (Default)
  const customerMenuItems = [
    {
      category: "🏠 NAVIGATION",
      items: [
        { label: "Landing Page", path: "/", icon: FaMapMarkedAlt, gradient: "from-cyan-500 to-blue-500" },
        { label: "Mein Dashboard", path: "/customer-dashboard", icon: FaHome, gradient: "from-green-500 to-emerald-500" },
        { label: "Meine Keys", path: "/customer-dashboard", icon: FaKey, gradient: "from-yellow-500 to-orange-500" },
      ],
    },
    {
      category: "🛍️ SHOPPING",
      items: [
        { label: "Reseller Shops", path: "/reseller-shops", icon: FaStore, badge: "HOT", gradient: "from-purple-500 to-pink-500" },
        { label: "Key Bundles", path: "/bundles", icon: FaGift, gradient: "from-blue-500 to-cyan-500" },
        { label: "Reviews", path: "/reviews", icon: FaStar, gradient: "from-yellow-500 to-orange-500" },
      ],
    },
    {
      category: "🎯 TOOLS",
      items: [
        { label: "Key Validator", path: "/key-validator", icon: FaShieldAlt, gradient: "from-green-500 to-teal-500" },
        { label: "Referral Program", path: "/referral", icon: FaHandshake, badge: "💰", gradient: "from-purple-500 to-pink-500" },
        { label: "Einstellungen", path: "/profile-settings", icon: FaCog, gradient: "from-gray-500 to-gray-600" },
      ],
    },
  ];

  // Select menu items based on user role
  let menuItems = customerMenuItems;
  if (userRole === "admin") {
    menuItems = adminMenuItems;
  } else if (userRole === "developer") {
    menuItems = developerMenuItems;
  } else if (userRole === "reseller") {
    menuItems = resellerMenuItems;
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-[#0A0A0F] via-[#0F0F14] to-[#0A0A0F] border-r border-[#1a1a24] overflow-y-auto transition-all duration-300 scrollbar-thin scrollbar-thumb-[#00FF9C]/20 scrollbar-track-transparent
        ${expanded ? "w-64" : "w-20"} hidden lg:block z-40 shadow-2xl`}
    >
      {/* Header Logo */}
      <div className="sticky top-0 p-4 bg-gradient-to-r from-[#0F0F14] to-[#1A1A1F] border-b border-[#00FF9C]/20 backdrop-blur-sm z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00FF9C] to-[#00D9FF] flex items-center justify-center shadow-lg shadow-[#00FF9C]/50 animate-pulse">
              <FaBolt className="text-[#0F0F14] text-xl font-bold" />
            </div>
            {expanded && (
              <div>
                <p className="text-white font-black text-base bg-gradient-to-r from-[#00FF9C] to-[#00D9FF] bg-clip-text text-transparent">
                  CloudLicense
                </p>
                <p className="text-[#00FF9C] text-xs font-bold tracking-wider">PRO V2</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg bg-[#1A1A1F] hover:bg-[#2C2C34] transition-all border border-[#00FF9C]/20 hover:border-[#00FF9C]/50"
          >
            {expanded ? (
              <FaChevronLeft className="text-[#00FF9C] text-sm" />
            ) : (
              <FaChevronRight className="text-[#00FF9C] text-sm" />
            )}
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="p-4 space-y-6 pb-32">
        {menuItems.map((menuGroup) => (
          <div key={menuGroup.category}>
            {expanded && (
              <div className="mb-3 px-3">
                <h3 className="text-xs font-black text-[#00FF9C] uppercase tracking-widest opacity-80">
                  {menuGroup.category}
                </h3>
              </div>
            )}

            <div className="space-y-1.5">
              {menuGroup.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                      ${
                        active
                          ? "bg-gradient-to-r from-[#00FF9C]/20 to-[#00D9FF]/20 border border-[#00FF9C]/50 shadow-lg shadow-[#00FF9C]/20 scale-105"
                          : "text-[#a0a0a8] hover:text-white hover:bg-[#1a1a24] hover:border hover:border-[#00FF9C]/20 hover:scale-102"
                      }
                    `}
                  >
                    {/* Gradient Background on Hover */}
                    {!active && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    )}

                    <div className={`relative z-10 w-8 h-8 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center ${active ? 'shadow-lg' : 'opacity-60 group-hover:opacity-100'} transition-all`}>
                      <item.icon className="text-white text-sm" />
                    </div>

                    {expanded && (
                      <>
                        <span className={`text-sm font-bold flex-1 text-left relative z-10 ${active ? "text-white" : ""} transition-colors`}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className={`relative z-10 ${
                            active
                              ? 'bg-[#00FF9C] text-[#0F0F14]'
                              : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                          } text-xs px-2 py-1 rounded-full font-black shadow-lg animate-pulse`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section - User Profile Card */}
      <div className="fixed bottom-0 left-0 p-4 border-t border-[#1a1a24] bg-gradient-to-r from-[#0F0F14] to-[#1A1A1F] backdrop-blur-lg" style={{ width: expanded ? '16rem' : '5rem' }}>
        {expanded && (
          <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-[#1a1a24] via-[#1A1A1F] to-[#0F0F14] border border-[#00FF9C]/30 shadow-xl hover:border-[#00FF9C]/60 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FF9C] to-[#00D9FF] flex items-center justify-center shadow-lg shadow-[#00FF9C]/50 group-hover:scale-110 transition-transform">
                <FaUser className="text-[#0F0F14] text-sm font-bold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">{userName}</p>
                <p className="text-xs font-bold truncate">
                  {userRole === "admin" && <span className="text-yellow-400">👑 ADMIN</span>}
                  {userRole === "developer" && <span className="text-blue-400">👨‍💻 Developer</span>}
                  {userRole === "reseller" && <span className="text-purple-400">💼 Reseller</span>}
                  {userRole === "customer" && <span className="text-green-400">👤 Kunde</span>}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-600/40 hover:to-red-700/40 text-red-400 hover:text-red-300 transition-all border border-red-600/30 hover:border-red-600/60 shadow-lg hover:shadow-red-600/30 group"
        >
          <FaSignOutAlt className="text-base flex-shrink-0 group-hover:scale-110 transition-transform" />
          {expanded && <span className="text-sm font-bold">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
