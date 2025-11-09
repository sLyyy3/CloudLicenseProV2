// src/components/Sidebar.tsx - VERBESSERT mit Active States & Smooth Transitions
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaHome,
  FaUsers,
  FaBox,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaKey,
} from "react-icons/fa";

type NavItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
  label: string;
};

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { name: "Dashboard", path: "/dashboard", icon: <FaHome />, label: "dashboard" },
    { name: "Lizenzen", path: "/licenses", icon: <FaKey />, label: "licenses" },
    { name: "Kunden", path: "/customers", icon: <FaUsers />, label: "customers" },
    { name: "Produkte", path: "/products", icon: <FaBox />, label: "products" },
    { name: "Analytics", path: "/analytics", icon: <FaChartBar />, label: "analytics" },
    { name: "Einstellungen", path: "/settings", icon: <FaCog />, label: "settings" },
  ];

  function isActive(path: string): boolean {
    return location.pathname === path;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  return (
    <>
      {/* MOBILE MENU BUTTON */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-[#1A1A1F] rounded-lg border border-[#2C2C34]"
      >
        {mobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* SIDEBAR */}
      <aside
        className={`
          fixed left-0 top-0 h-screen bg-[#1A1A1F] border-r border-[#2C2C34]
          transition-all duration-300 ease-out
          ${open ? "w-64" : "w-20"}
          md:relative md:w-64
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          z-40 overflow-y-auto
        `}
      >
        {/* LOGO SECTION */}
        <div className="h-20 border-b border-[#2C2C34] flex items-center justify-between px-4">
          {open && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-[#00FF9C] flex items-center justify-center">
                <FaKey className="text-[#0E0E12] text-lg" />
              </div>
              <div className={`transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}>
                <p className="font-bold text-[#00FF9C] text-sm">CloudLicense</p>
                <p className="text-xs text-gray-400">Pro</p>
              </div>
            </div>
          )}
          
          {/* Toggle Button */}
          <button
            onClick={() => setOpen(!open)}
            className="hidden md:block p-2 hover:bg-[#2C2C34] rounded-lg transition"
          >
            {open ? "◀" : "▶"}
          </button>
        </div>

        {/* NAVIGATION ITEMS */}
        <nav className="mt-8 px-4 space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${
                    active
                      ? "bg-[#00FF9C]/20 text-[#00FF9C] border-l-4 border-[#00FF9C]"
                      : "text-gray-400 hover:text-[#E0E0E0] hover:bg-[#2C2C34]"
                  }
                `}
              >
                <span className="text-lg min-w-6 flex justify-center">{item.icon}</span>
                <span
                  className={`
                    font-medium transition-opacity duration-300
                    ${open ? "opacity-100" : "opacity-0 hidden"}
                  `}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>

        {/* SEPARATOR */}
        <div className="my-8 mx-4 border-t border-[#2C2C34]"></div>

        {/* LOGOUT BUTTON - at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#2C2C34] bg-[#1A1A1F]">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-4 px-4 py-3 rounded-lg
              text-red-400 hover:bg-red-600/10 transition-all duration-200
            `}
          >
            <span className="text-lg min-w-6 flex justify-center">
              <FaSignOutAlt />
            </span>
            <span
              className={`
                font-medium transition-opacity duration-300
                ${open ? "opacity-100" : "opacity-0 hidden"}
              `}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}