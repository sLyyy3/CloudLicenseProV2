// src/pages/Login.tsx - Mit Dialog Popups + Andere Login Optionen
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaArrowLeft, FaRocket } from "react-icons/fa";
import { Dialog, useDialog } from "../components/Dialog";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  useEffect(() => {
    // Prüfe ob User schon eingeloggt ist
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) {
        navigate("/dashboard", { replace: true });
      }
    }
    checkAuth();
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      openDialog({
        type: "warning",
        title: "❌ Email & Passwort erforderlich",
        message: "Bitte gib deine Email und Passwort ein!",
        closeButton: "OK",
      });
      return;
    }

    setLoading(true);

    try {
      console.log("🚀 Login: Authentifiziere User...");

      // SCHRITT 1: User authentifizieren
      const { error: loginError, data: loginData } = 
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        console.error("❌ Login Error:", loginError);

        // Spezifische Error Messages
        let errorTitle = "❌ Login fehlgeschlagen";
        let errorMessage = "Unbekannter Fehler";

        if (loginError.message.includes("Email not confirmed")) {
          errorTitle = "📧 Email nicht bestätigt";
          errorMessage = (
            <div className="text-left space-y-2">
              <p className="font-bold">Deine Email wurde noch nicht bestätigt!</p>
              <p className="text-sm text-gray-400">
                Du hast eine Bestätigungs-Email erhalten.
              </p>
              <p className="text-sm text-gray-400">
                Bitte öffne den Link in deiner Email und versuche dann erneut einzuloggen.
              </p>
              <p className="text-xs text-gray-500 mt-3">
                💡 Tipp: Vergiss nicht, im Spam-Ordner nachzuschauen!
              </p>
            </div>
          );
        } else if (loginError.message.includes("Invalid login credentials")) {
          errorTitle = "❌ Ungültige Anmeldedaten";
          errorMessage = (
            <div className="text-left space-y-2">
              <p className="font-bold">Email oder Passwort ist falsch!</p>
              <p className="text-sm text-gray-400">
                Bitte überprüfe deine Eingaben und versuche es erneut.
              </p>
              <p className="text-xs text-gray-500 mt-3">
                💡 Tipp:
                <ul className="ml-4 mt-1">
                  <li>• Beachte Groß- und Kleinschreibung</li>
                  <li>• Email muss genau so sein wie bei der Registrierung</li>
                </ul>
              </p>
            </div>
          );
        } else if (loginError.message.includes("too many requests")) {
          errorTitle = "⏱️ Zu viele Versuche";
          errorMessage = (
            <div className="text-left space-y-2">
              <p className="font-bold">Du hast zu viele Login-Versuche gemacht!</p>
              <p className="text-sm text-gray-400">
                Bitte warte ein paar Minuten und versuche es dann erneut.
              </p>
            </div>
          );
        } else {
          errorMessage = (
            <div className="text-left space-y-2">
              <p className="font-bold">Login fehlgeschlagen</p>
              <p className="text-sm text-gray-400">{loginError.message}</p>
            </div>
          );
        }

        openDialog({
          type: "error",
          title: errorTitle,
          message: errorMessage,
          closeButton: "Zurück",
        });

        setLoading(false);
        return;
      }

      console.log("✅ User authentifiziert:", loginData.user?.id);

      // SCHRITT 2: organization_id prüfen
      console.log("🔍 Prüfe organization_id...");

      const { data: userData } = await supabase.auth.getUser();
      const organizationId = userData.user?.user_metadata?.organization_id;

      if (!organizationId) {
        console.error("❌ organization_id fehlt!");
        openDialog({
          type: "error",
          title: "❌ Account-Fehler",
          message: (
            <div className="text-left space-y-2">
              <p className="font-bold">Dein Account hat ein Problem!</p>
              <p className="text-sm text-gray-400">
                Deine Organisation konnte nicht gefunden werden.
              </p>
              <p className="text-sm text-gray-400 mt-3">
                Bitte melde dich ab und registriere dich neu.
              </p>
            </div>
          ),
          closeButton: "OK",
          actionButton: {
            label: "Neu registrieren",
            onClick: () => navigate("/signup"),
          },
        });

        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      console.log("✅ Organization ID gefunden:", organizationId);

      // SCHRITT 3: Rolle prüfen (Admin?)
      const isAdmin = userData.user?.user_metadata?.admin === true;

      // SUCCESS Dialog!
      openDialog({
        type: "success",
        title: "✅ Login erfolgreich!",
        message: (
          <div className="text-left space-y-3">
            <div className="bg-green-600/20 border border-green-600 rounded p-3">
              <p className="font-bold text-green-400">🎉 Willkommen zurück!</p>
            </div>
            <p className="text-sm text-gray-400">
              {isAdmin ? "👑 Du bist angemeldet als Admin" : "👤 Du bist angemeldet"}
            </p>
            <p className="text-xs text-gray-500 italic">
              Du wirst gleich weitergeleitet...
            </p>
          </div>
        ),
        closeButton: "Schließen",
      });

      setTimeout(() => {
        if (isAdmin) {
          navigate("/admin", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }, 2000);

    } catch (err: any) {
      console.error("💥 Unexpected error:", err);
      openDialog({
        type: "error",
        title: "💥 Fehler",
        message: `Unerwarteter Fehler: ${err.message}`,
        closeButton: "OK",
      });
    } finally {
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
              className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition"
            >
              <FaArrowLeft /> Zurück zur Startseite
            </button>
          </div>
        </div>

        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 w-full max-w-md shadow-xl">
            {/* HEADER */}
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <FaRocket className="text-[#00FF9C] text-3xl" />
                <h1 className="text-2xl font-bold">CloudLicensePro</h1>
              </div>
              <h2 className="text-3xl font-bold">🔐 Login</h2>
              <p className="text-gray-400 mt-1">Melde dich an um weiterzumachen</p>
            </div>

            {/* FORM */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input
                className="border p-3 rounded bg-[#2C2C34] border-[#3C3C44] text-white focus:border-[#00FF9C] outline-none transition"
                type="email"
                placeholder="📧 E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />

              <input
                className="border p-3 rounded bg-[#2C2C34] border-[#3C3C44] text-white focus:border-[#00FF9C] outline-none transition"
                type="password"
                placeholder="🔑 Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="bg-[#00FF9C] text-[#0E0E12] p-3 rounded font-bold hover:bg-[#00cc80] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "⏳ Wird angemeldet..." : "🚀 Login"}
              </button>
            </form>

            {/* REGISTER LINK */}
            <p className="text-gray-400 mt-6 text-center">
              Kein Account?{" "}
              <button 
                onClick={() => navigate("/signup")}
                className="text-[#00FF9C] hover:underline font-bold"
                disabled={loading}
              >
                Hier registrieren
              </button>
            </p>

            {/* DIVIDER */}
            <div className="border-t border-[#2C2C34] my-8"></div>

            {/* OTHER LOGIN OPTIONS */}
            <div className="space-y-3">
              <p className="text-center text-sm text-gray-500 mb-4">💡 Oder als etwas anderes anmelden:</p>
              
              <button
                type="button"
                onClick={() => navigate("/dev-login")}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded font-bold transition text-sm"
                disabled={loading}
              >
                👨‍💻 Developer Login
              </button>

              <button
                type="button"
                onClick={() => navigate("/reseller-login")}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded font-bold transition text-sm"
                disabled={loading}
              >
                🏪 Reseller Login
              </button>
            </div>
          </div>

          {/* INFO */}
          <div className="mt-12 max-w-md bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
            <h3 className="font-bold text-[#00FF9C] mb-3">✨ Mit deinem Account kannst du:</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>✅ Keys von Entwicklern kaufen</li>
              <li>✅ Keys validieren</li>
              <li>✅ Deine Lizenzen verwalten</li>
              <li>✅ Kunden verwalten</li>
              <li>✅ Im Referral Program verdienen</li>
            </ul>
          </div>

          {/* FOOTER */}
          <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-[#1A1A1F] p-3 rounded border border-[#2C2C34]">
            <p className="font-bold">CloudLicensePro v2.0</p>
            <p className="text-gray-600">Lizenz Management</p>
          </div>
        </div>
      </div>
    </>
  );
}