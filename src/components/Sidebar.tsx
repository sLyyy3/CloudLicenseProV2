// src/components/Sidebar.tsx - DYNAMISCHE SIDEBAR MIT ROLLE & PROFIL
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
} from "react-icons/fa";

type UserRole = "developer" | "reseller" | "customer" | null;

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

          if (metadata?.is_developer) {
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
    if (userRole === "developer") {
      navigate("/dev-login");
    } else if (userRole === "reseller") {
      navigate("/reseller-login");
    } else {
      navigate("/login");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // DEVELOPER MENU ITEMS
  const developerMenuItems = [
    {
      category: "HAUPT",
      items: [
        { label: "Dashboard", path: "/developer-dashboard", icon: FaHome },
        { label: "Produkte", path: "/dev-products", icon: FaBox },
        { label: "Lizenzen", path: "/dev-licenses", icon: FaKey },
      ],
    },
    {
      category: "VERWALTUNG",
      items: [
        { label: "Reseller", path: "/dev-resellers", icon: FaUsers },
        { label: "Analytics", path: "/dev-analytics", icon: FaChartBar },
      ],
    },
    {
      category: "PROFIL",
      items: [
        { label: "Einstellungen", path: "/profile-settings", icon: FaCog },
      ],
    },
  ];

  // RESELLER MENU ITEMS
  const resellerMenuItems = [
    {
      category: "HAUPT",
      items: [
        { label: "Dashboard", path: "/reseller-dashboard", icon: FaHome },
        { label: "Marktplatz", path: "/reseller-marketplace", icon: FaStore },
        { label: "Lager", path: "/reseller-inventory", icon: FaGem },
      ],
    },
    {
      category: "VERKAUF",
      items: [
        { label: "Key Verteilung", path: "/reseller-sales", icon: FaKey, badge: "LIVE" },
        { label: "Developer", path: "/reseller-developers", icon: FaUsers },
        { label: "Analytics", path: "/reseller-analytics", icon: FaChartBar },
      ],
    },
    {
      category: "PROFIL",
      items: [
        { label: "Einstellungen", path: "/profile-settings", icon: FaCog },
      ],
    },
  ];

  // CUSTOMER MENU ITEMS (Default)
  const customerMenuItems = [
    {
      category: "HAUPT",
      items: [
        { label: "Dashboard", path: "/customer-dashboard", icon: FaHome },
        { label: "Meine Keys", path: "/licenses", icon: FaKey },
        { label: "Reseller Shops", path: "/reseller-shops", icon: FaStore },
      ],
    },
    {
      category: "PROFIL",
      items: [
        { label: "Einstellungen", path: "/profile-settings", icon: FaCog },
      ],
    },
  ];

  // Select menu items based on user role
  let menuItems = customerMenuItems;
  if (userRole === "developer") {
    menuItems = developerMenuItems;
  } else if (userRole === "reseller") {
    menuItems = resellerMenuItems;
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#0F0F14] border-r border-[#1a1a24] overflow-y-auto transition-all duration-300
        ${expanded ? "w-64" : "w-20"} hidden lg:block z-40`}
    >
      {/* Header Logo - LIKE DASHBOARD */}
      <div className="sticky top-0 p-4 bg-[#0F0F14] border-b border-[#1a1a24]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00FF9C] to-[#00D9FF] flex items-center justify-center shadow-lg shadow-[#00FF9C]/20">
            <FaKey className="text-[#0F0F14] text-lg font-bold" />
          </div>
          {expanded && (
            <div>
              <p className="text-white font-bold text-sm">CloudLicense</p>
              <p className="text-[#00FF9C] text-xs font-semibold">Pro</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <nav className="p-4 space-y-6">
        {menuItems.map((menuGroup) => (
          <div key={menuGroup.category}>
            {expanded && (
              <div className="mb-3 px-3">
                <h3 className="text-xs font-bold text-[#00FF9C] uppercase tracking-wider">
                  {menuGroup.category}
                </h3>
              </div>
            )}

            <div className="space-y-1">
              {menuGroup.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${
                      isActive(item.path)
                        ? "bg-[#1a3a33] border border-[#00FF9C]/50 shadow-lg shadow-[#00FF9C]/10"
                        : "text-[#a0a0a8] hover:text-white hover:bg-[#1a1a24]"
                    }
                  `}
                >
                  <item.icon className={`text-base flex-shrink-0 ${isActive(item.path) ? "text-[#00FF9C]" : ""}`} />
                  {expanded && (
                    <span className={`text-sm font-medium flex-1 text-left ${isActive(item.path) ? "text-[#00FF9C]" : ""}`}>
                      {item.label}
                    </span>
                  )}
                  {expanded && item.badge && (
                    <span className="bg-[#00FF9C] text-[#0F0F14] text-xs px-2 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section - Dynamic User Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#1a1a24] bg-[#0F0F14]">
        {expanded && (
          <div className="mb-4 p-3 rounded-lg bg-[#1a1a24] border border-[#00FF9C]/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF9C] to-[#00D9FF] flex items-center justify-center">
                <FaUser className="text-[#0F0F14] text-xs font-bold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{userName}</p>
                <p className="text-xs text-[#00FF9C] truncate">
                  {userRole === "developer" && "👨‍💻 Developer"}
                  {userRole === "reseller" && "💼 Reseller"}
                  {userRole === "customer" && "👤 Kunde"}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#2a1a1a] hover:bg-[#3a2a2a] text-[#ff6b6b] transition-all border border-[#ff6b6b]/20"
        >
          <FaSignOutAlt className="text-base flex-shrink-0" />
          {expanded && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}