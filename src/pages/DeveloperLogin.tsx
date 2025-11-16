// src/pages/DeveloperLogin.tsx - RESELLER LOGIN
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaRocket, FaArrowLeft, FaStore, FaShieldAlt, FaChartLine } from "react-icons/fa";
import { useDialog } from "../components/Dialog";

export default function DeveloperLogin() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Prüfe ob bereits eingeloggt
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) {
        const isReseller = (data.user?.user_metadata as any)?.is_reseller;
        if (isReseller) {
          navigate("/reseller-dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    }
    checkAuth();
  }, [navigate]);

  async function handleLogin() {
    if (!email || !password) {
      openDialog({
        type: "warning",
        title: "⚠️ Felder erforderlich",
        message: "Bitte gib Email und Passwort ein",
        closeButton: "OK",
      });
      return;
    }

    setLoading(true);

    try {
      // Versuche zu authentifizieren
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        openDialog({
          type: "error",
          title: "❌ Login fehlgeschlagen",
          message: error.message || "Email oder Passwort ist falsch",
          closeButton: "OK",
        });
        setLoading(false);
        return;
      }

      if (!data.user) {
        openDialog({
          type: "error",
          title: "❌ Fehler",
          message: "User konnte nicht geladen werden",
          closeButton: "OK",
        });
        setLoading(false);
        return;
      }

      // Prüfe ob Reseller
      const isReseller = (data.user?.user_metadata as any)?.is_reseller;

      if (!isReseller) {
        await supabase.auth.signOut();
        openDialog({
          type: "error",
          title: "❌ Falscher Account Typ",
          message:
            "Das ist kein Reseller Account. Nutze /login für normale User.",
          closeButton: "OK",
        });
        setLoading(false);
        return;
      }

      const shopName = (data.user?.user_metadata as any)?.shop_name || "Reseller";

      openDialog({
        type: "success",
        title: `✅ Willkommen zurück, ${shopName}!`,
        message: "Du wirst zu deinem Dashboard weitergeleitet...",
        closeButton: "OK",
      });

      setTimeout(() => {
        navigate("/reseller-dashboard", { replace: true });
      }, 1500);
    } catch (err: any) {
      console.error("Unexpected error:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message || "Etwas ist schiefgelaufen",
        closeButton: "OK",
      });
      setLoading(false);
    }
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-gradient-to-br from-[#0E0E12] via-[#1A1A1F] to-[#0E0E12] text-[#E0E0E0]">
        {/* HEADER */}
        <div className="bg-[#1A1A1F]/80 backdrop-blur-sm border-b border-purple-500/20 p-6 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition"
            >
              <FaArrowLeft /> Zurück zur Startseite
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <FaShieldAlt className="text-green-400" />
              <span>SSL verschlüsselt</span>
            </div>
          </div>
        </div>

        {/* MAIN CONTAINER */}
        <div className="min-h-screen flex items-center justify-center p-4 py-12">
          <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

            {/* LEFT SIDE - LOGIN FORM */}
            <div className="bg-[#1A1A1F] border border-purple-500/30 rounded-2xl p-8 shadow-2xl shadow-purple-500/10">
              {/* HEADER */}
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg shadow-purple-500/20">
                    <FaStore className="text-3xl text-white" />
                  </div>
                  <div className="text-left">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Reseller Login
                    </h1>
                    <p className="text-gray-400 text-sm">CloudLicensePro</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">
                  Melde dich an um dein Dashboard zu öffnen
                </p>
              </div>

              {/* FORM */}
              <div className="space-y-5 mb-6">
                {/* Email */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">
                    📧 Email
                  </label>
                  <input
                    type="email"
                    placeholder="deine@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-[#3C3C44] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">
                    🔐 Passwort
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-[#3C3C44] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#3C3C44] bg-[#2C2C34] text-purple-600 focus:ring-purple-500"
                      disabled={loading}
                    />
                    <label htmlFor="remember" className="text-gray-400">
                      Angemeldet bleiben
                    </label>
                  </div>
                  <button
                    onClick={() => {/* TODO: Implement password reset */}}
                    className="text-purple-400 hover:underline"
                    disabled={loading}
                  >
                    Passwort vergessen?
                  </button>
                </div>
              </div>

              {/* LOGIN BUTTON */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold rounded-lg transition disabled:opacity-50 shadow-lg shadow-purple-500/20 text-white text-lg mb-6"
              >
                {loading ? "⏳ Wird angemeldet..." : "🚀 Jetzt anmelden"}
              </button>

              {/* REGISTER LINK */}
              <p className="text-center text-gray-400 text-sm mb-6">
                Noch kein Account?{" "}
                <button
                  onClick={() => navigate("/reseller-register")}
                  className="text-purple-400 hover:underline font-bold"
                  disabled={loading}
                >
                  Kostenlos registrieren
                </button>
              </p>

              {/* DIVIDER */}
              <div className="border-t border-[#2C2C34] my-6"></div>

              {/* CUSTOMER LOGIN LINK */}
              <p className="text-center text-xs text-gray-500">
                Bist du Kunde und möchtest Keys kaufen?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-gray-400 hover:text-[#00FF9C] transition font-medium"
                >
                  Zur Kunden-Anmeldung
                </button>
              </p>
            </div>

            {/* RIGHT SIDE - INFO & BENEFITS */}
            <div className="space-y-6">
              {/* QUICK STATS */}
              <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                  <FaChartLine /> Dein Reseller Dashboard
                </h3>
                <p className="text-gray-300 mb-4">
                  Nach dem Login hast du Zugriff auf:
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400">📊</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">Live Analytics</p>
                      <p className="text-xs text-gray-400">Verkäufe, Umsätze & Statistiken in Echtzeit</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-400">💰</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">Umsatz-Übersicht</p>
                      <p className="text-xs text-gray-400">Detaillierte Einnahmen & Provisionen</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400">🔑</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">Key-Verwaltung</p>
                      <p className="text-xs text-gray-400">Verwalte dein Inventar professionell</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-yellow-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-400">⚡</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">Automatische Auslieferung</p>
                      <p className="text-xs text-gray-400">Keys werden automatisch versendet</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SUCCESS STORIES */}
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">💡 Erfolgreiche Reseller</h3>
                <div className="space-y-4 text-sm">
                  <div className="bg-[#2C2C34] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xs">
                        MK
                      </div>
                      <div>
                        <p className="font-bold text-white">MaxKeys</p>
                        <p className="text-xs text-gray-400">Seit 3 Monaten</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-xs italic">
                      "Über 500 Keys verkauft. Die Plattform macht den Verkauf super einfach!"
                    </p>
                    <div className="mt-2 flex gap-2">
                      <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded text-xs font-bold">
                        €2,450 Umsatz
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#2C2C34] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-xs">
                        KP
                      </div>
                      <div>
                        <p className="font-bold text-white">KeyParadise</p>
                        <p className="text-xs text-gray-400">Seit 6 Monaten</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-xs italic">
                      "Beste Entscheidung! Automatische Auslieferung spart mir Stunden."
                    </p>
                    <div className="mt-2 flex gap-2">
                      <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded text-xs font-bold">
                        €5,890 Umsatz
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Noch kein Account?</h3>
                <p className="text-purple-100 text-sm mb-4">
                  Starte jetzt kostenlos und verkaufe deine Keys mit nur 5% Fee!
                </p>
                <button
                  onClick={() => navigate("/reseller-register")}
                  className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
                  disabled={loading}
                >
                  Jetzt kostenlos registrieren →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}