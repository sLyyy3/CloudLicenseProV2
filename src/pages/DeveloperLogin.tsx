// src/pages/DeveloperLogin.tsx - UPDATED DEVELOPER LOGIN
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaRocket, FaArrowLeft } from "react-icons/fa";
import { useDialog } from "../components/Dialog";

export default function DeveloperLogin() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Prüfe ob bereits eingeloggt
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) {
        const isdev = (data.user?.user_metadata as any)?.is_developer;
        if (isdev) {
          navigate("/dev-dashboard", { replace: true });
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

      // Prüfe ob Developer
      const isdev = (data.user?.user_metadata as any)?.is_developer;

      if (!isdev) {
        await supabase.auth.signOut();
        openDialog({
          type: "error",
          title: "❌ Falscher Account Typ",
          message:
            "Das ist kein Developer Account. Nutze /login für normale User.",
          closeButton: "OK",
        });
        setLoading(false);
        return;
      }

      openDialog({
        type: "success",
        title: "✅ Willkommen zurück!",
        message: "Du wirst zu deinem Dashboard weitergeleitet...",
        closeButton: "OK",
      });

      setTimeout(() => {
        navigate("/dev-dashboard", { replace: true });
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

      <div className="min-h-screen bg-gradient-to-br from-[#0E0E12] to-[#1A1A1F] text-[#E0E0E0]">
        {/* BACK BUTTON */}
        <div className="bg-[#1A1A1F] border-b border-[#2C2C34] p-6">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition"
            >
              <FaArrowLeft /> Zurück zur Startseite
            </button>
          </div>
        </div>

        {/* LOGIN FORM */}
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 w-full max-w-md shadow-xl">
            {/* HEADER */}
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <FaRocket className="text-purple-400 text-3xl" />
                <h1 className="text-2xl font-bold">CloudLicensePro</h1>
              </div>
              <h2 className="text-3xl font-bold">👨‍💻 Developer Login</h2>
              <p className="text-gray-400 mt-1">
                Melde dich an um dein Dashboard zu sehen
              </p>
            </div>

            {/* FORM */}
            <div className="space-y-4 mb-6">
              {/* Email */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  📧 Email
                </label>
                <input
                  type="email"
                  placeholder="deine@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-purple-600 outline-none transition"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  🔐 Passwort
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-purple-600 outline-none transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* LOGIN BUTTON */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 font-bold rounded-lg transition disabled:opacity-50 mb-6"
            >
              {loading ? "⏳ Wird angemeldet..." : "🚀 Anmelden"}
            </button>

            {/* REGISTER LINK */}
            <p className="text-center text-gray-400">
              Noch kein Account?{" "}
              <button
                onClick={() => navigate("/dev-register")}
                className="text-purple-400 hover:underline font-bold"
                disabled={loading}
              >
                Hier registrieren
              </button>
            </p>

            {/* DIVIDER */}
            <div className="border-t border-[#2C2C34] my-8"></div>

            {/* NORMAL USER LOGIN LINK */}
            <p className="text-center text-xs text-gray-500">
              Bist du kein Developer?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-gray-400 hover:text-[#00FF9C] transition"
              >
                Normale Anmeldung
              </button>
            </p>
          </div>

          {/* FEATURES */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 text-center">
              <p className="text-3xl mb-2">🔑</p>
              <h3 className="font-bold mb-2">License Management</h3>
              <p className="text-xs text-gray-400">
                Erstelle und verwalte Lizenzen
              </p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 text-center">
              <p className="text-3xl mb-2">📊</p>
              <h3 className="font-bold mb-2">Analytics</h3>
              <p className="text-xs text-gray-400">
                Sehe detaillierte Statistiken
              </p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 text-center">
              <p className="text-3xl mb-2">🔐</p>
              <h3 className="font-bold mb-2">API Integration</h3>
              <p className="text-xs text-gray-400">
                Integriere deine Apps einfach
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}