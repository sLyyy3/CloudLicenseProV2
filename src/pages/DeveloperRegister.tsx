// src/pages/DeveloperRegister.tsx - DEVELOPER REGISTRATION
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaRocket, FaArrowLeft } from "react-icons/fa";
import { useDialog } from "../components/Dialog";

export default function DeveloperRegister() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Prüfe ob bereits eingeloggt
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) {
        navigate("/", { replace: true });
      }
    }
    checkAuth();
  }, [navigate]);

  async function handleRegister() {
    // Validierung
    if (!formData.companyName) {
      openDialog({
        type: "warning",
        title: "⚠️ Firmenname erforderlich",
        message: "Bitte gib deinen Firmennamen ein",
        closeButton: "OK",
      });
      return;
    }

    if (!formData.email) {
      openDialog({
        type: "warning",
        title: "⚠️ Email erforderlich",
        message: "Bitte gib deine Email ein",
        closeButton: "OK",
      });
      return;
    }

    if (formData.password.length < 6) {
      openDialog({
        type: "warning",
        title: "⚠️ Passwort zu kurz",
        message: "Das Passwort muss mindestens 6 Zeichen lang sein",
        closeButton: "OK",
      });
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      openDialog({
        type: "warning",
        title: "⚠️ Passwörter stimmen nicht überein",
        message: "Bitte überprüfe deine Passwörter",
        closeButton: "OK",
      });
      return;
    }

    setLoading(true);

    try {
      // Schritt 1: Erstelle Auth User MIT is_developer Flag
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            is_developer: true, // ← WICHTIG! Developer Flag
          },
        },
      });

      if (authError) {
        openDialog({
          type: "error",
          title: "❌ Registrierung fehlgeschlagen",
          message: authError.message,
          closeButton: "OK",
        });
        setLoading(false);
        return;
      }

      if (!authData.user) {
        openDialog({
          type: "error",
          title: "❌ Fehler",
          message: "User konnte nicht erstellt werden",
          closeButton: "OK",
        });
        setLoading(false);
        return;
      }

      // Schritt 2: Erstelle Organization für Developer
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: formData.companyName,
          owner_email: formData.email,
          plan: "starter", // Default Plan
          status: "active",
        })
        .select()
        .single();

      if (orgError) {
        console.error("Error creating organization:", orgError);
        openDialog({
          type: "error",
          title: "❌ Organisation konnte nicht erstellt werden",
          message: orgError.message,
          closeButton: "OK",
        });
        setLoading(false);
        return;
      }

      // Schritt 3: Update User Metadata mit organization_id
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          is_developer: true,
          organization_id: orgData.id, // ← Speichere org_id im metadata
        },
      });

      if (updateError) {
        console.error("Error updating user:", updateError);
      }

      // Schritt 4: Erstelle Standard Subscription für Developer
      await supabase.from("subscriptions").insert({
        organization_id: orgData.id,
        plan: "starter",
        price: 29,
        billing_date: new Date(new Date().setMonth(new Date().getMonth() + 1))
          .toISOString()
          .split("T")[0],
        status: "active",
      });

      openDialog({
        type: "success",
        title: "✅ Registrierung erfolgreich!",
        message: (
          <div className="text-left space-y-3">
            <p>
              Willkommen <strong>{formData.companyName}</strong>! 🎉
            </p>
            <p className="text-sm text-gray-400">
              Dein Developer Account wurde erstellt.
            </p>
            <p className="text-sm font-bold text-[#00FF9C]">
              Du wirst jetzt zum Login weitergeleitet...
            </p>
          </div>
        ),
        closeButton: "OK",
      });

      setTimeout(() => {
        navigate("/dev-login", { replace: true });
      }, 2000);
    } catch (err: any) {
      console.error("Unexpected error:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message || "Etwas ist schiefgelaufen",
        closeButton: "OK",
      });
    }

    setLoading(false);
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

        {/* REGISTRATION FORM */}
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 w-full max-w-md shadow-xl">
            {/* HEADER */}
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <FaRocket className="text-[#00FF9C] text-3xl" />
                <h1 className="text-2xl font-bold">CloudLicensePro</h1>
              </div>
              <h2 className="text-2xl font-bold mb-2">👨‍💻 Developer Registration</h2>
              <p className="text-gray-400 text-sm">Erstelle deinen Developer Account</p>
            </div>

            {/* FORM */}
            <div className="space-y-4 mb-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  🏢 Firmenname / Projektname *
                </label>
                <input
                  type="text"
                  placeholder="z.B. MyCompany GmbH"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-purple-600 outline-none transition"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  📧 Email *
                </label>
                <input
                  type="email"
                  placeholder="deine@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-purple-600 outline-none transition"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  🔐 Passwort *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-purple-600 outline-none transition"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">Min. 6 Zeichen</p>
              </div>

              {/* Password Confirm */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  🔐 Passwort wiederholen *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.passwordConfirm}
                  onChange={(e) =>
                    setFormData({ ...formData, passwordConfirm: e.target.value })
                  }
                  onKeyPress={(e) => e.key === "Enter" && handleRegister()}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-purple-600 outline-none transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* REGISTER BUTTON */}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 font-bold rounded-lg transition disabled:opacity-50 mb-6"
            >
              {loading ? "⏳ Wird registriert..." : "✅ Account erstellen"}
            </button>

            {/* LOGIN LINK */}
            <p className="text-center text-gray-400">
              Du hast schon einen Account?{" "}
              <button
                onClick={() => navigate("/dev-login")}
                className="text-purple-400 hover:underline font-bold"
                disabled={loading}
              >
                Hier anmelden
              </button>
            </p>

            {/* INFO BOX */}
            <div className="bg-blue-600/20 border border-blue-600 rounded p-4 mt-6 text-xs text-blue-300">
              <p className="font-bold mb-2">📋 Was passiert bei der Registrierung?</p>
              <ul className="space-y-1 text-xs">
                <li>✅ Dein Developer Account wird erstellt</li>
                <li>✅ Automatisch eine Organisation für dich</li>
                <li>✅ Starter Plan (29€/Monat) wird aktiviert</li>
                <li>✅ Du bekommst API Keys zum Verwalten</li>
              </ul>
            </div>
          </div>

          {/* FEATURES PREVIEW */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded p-4 text-center text-sm">
              <p className="text-2xl mb-2">🔑</p>
              <p className="font-bold">API Keys</p>
              <p className="text-xs text-gray-400 mt-1">Für Lizenz-Validierung</p>
            </div>
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded p-4 text-center text-sm">
              <p className="text-2xl mb-2">📊</p>
              <p className="font-bold">Dashboard</p>
              <p className="text-xs text-gray-400 mt-1">Verwalte deine Lizenzen</p>
            </div>
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded p-4 text-center text-sm">
              <p className="text-2xl mb-2">💳</p>
              <p className="font-bold">Billing</p>
              <p className="text-xs text-gray-400 mt-1">Plan & Abrechnung</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}