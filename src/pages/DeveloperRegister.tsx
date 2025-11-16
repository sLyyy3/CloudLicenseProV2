// src/pages/DeveloperRegister.tsx - RESELLER REGISTRATION
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaRocket, FaArrowLeft, FaStore, FaCoins, FaUserCircle, FaShieldAlt } from "react-icons/fa";
import { useDialog } from "../components/Dialog";

export default function DeveloperRegister() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [formData, setFormData] = useState({
    shopName: "",
    email: "",
    password: "",
    passwordConfirm: "",
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

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
    if (!formData.shopName) {
      openDialog({
        type: "warning",
        title: "⚠️ Shop-Name erforderlich",
        message: "Bitte gib deinen Shop-Namen ein",
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

    if (!formData.acceptTerms) {
      openDialog({
        type: "warning",
        title: "⚠️ AGB akzeptieren",
        message: "Bitte akzeptiere die AGB und Datenschutzerklärung",
        closeButton: "OK",
      });
      return;
    }

    setLoading(true);

    try {
      // Schritt 1: Erstelle Auth User MIT is_reseller Flag
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            is_reseller: true, // ← WICHTIG! Reseller Flag
            shop_name: formData.shopName,
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

      // Schritt 2: Erstelle Organization für Reseller
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: formData.shopName,
          owner_email: formData.email,
          plan: "reseller_free", // Reseller haben kostenlosen Zugang, zahlen nur 5% Fee
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
          is_reseller: true,
          organization_id: orgData.id, // ← Speichere org_id im metadata
          shop_name: formData.shopName,
        },
      });

      if (updateError) {
        console.error("Error updating user:", updateError);
      }

      openDialog({
        type: "success",
        title: "✅ Registrierung erfolgreich!",
        message: (
          <div className="text-left space-y-3">
            <p>
              Willkommen <strong>{formData.shopName}</strong>! 🎉
            </p>
            <p className="text-sm text-gray-400">
              Dein Reseller Account wurde erstellt.
            </p>
            <p className="text-sm text-purple-400">
              💰 Nur 5% Fee pro Verkauf · Kostenlose Nutzung
            </p>
            <p className="text-sm font-bold text-[#00FF9C]">
              Du wirst jetzt zum Login weitergeleitet...
            </p>
          </div>
        ),
        closeButton: "OK",
      });

      setTimeout(() => {
        navigate("/reseller-login", { replace: true });
      }, 2500);
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

      <div className="min-h-screen bg-gradient-to-br from-[#0E0E12] via-[#1A1A1F] to-[#0E0E12] text-[#E0E0E0]">
        {/* BACK BUTTON */}
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
          <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

            {/* LEFT SIDE - INFO */}
            <div className="space-y-6 order-2 lg:order-1">
              {/* HERO */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg shadow-purple-500/20">
                    <FaStore className="text-3xl text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Reseller werden
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Starte dein Key-Business</p>
                  </div>
                </div>
                <p className="text-gray-300 text-lg">
                  Kaufe Keys extern (ePVP, UnknownCheats, etc.) und verkaufe sie auf unserer Plattform.
                  <strong className="text-purple-400"> Nur 5% Fee pro Verkauf.</strong>
                </p>
              </div>

              {/* BENEFITS */}
              <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-xl p-6 space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-purple-400">
                  <FaCoins /> Vorteile als Reseller
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">Kostenlose Nutzung</p>
                      <p className="text-gray-400 text-xs">Keine monatlichen Fixkosten - nur 5% Fee pro Verkauf</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">Automatische Auslieferung</p>
                      <p className="text-gray-400 text-xs">Keys werden automatisch an Kunden versendet</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">Live Analytics</p>
                      <p className="text-gray-400 text-xs">Verfolge deine Verkäufe in Echtzeit</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">Marktplatz-Zugang</p>
                      <p className="text-gray-400 text-xs">Erreiche tausende Kunden auf unserer Plattform</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">Inventory Management</p>
                      <p className="text-gray-400 text-xs">Verwalte dein Key-Lager professionell</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* HOW IT WORKS */}
              <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">🚀 So funktioniert's</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 font-bold text-white">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-white">Account erstellen</p>
                      <p className="text-gray-400">Kostenlose Registrierung in 2 Minuten</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 font-bold text-white">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-white">Keys hochladen</p>
                      <p className="text-gray-400">Füge deine extern gekauften Keys hinzu</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 font-bold text-white">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-white">Verkaufen & Geld verdienen</p>
                      <p className="text-gray-400">Keys verkaufen sich automatisch - du bekommst 95%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#1A1A1F] border border-green-500/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">95%</p>
                  <p className="text-xs text-gray-400 mt-1">Dein Gewinn</p>
                </div>
                <div className="bg-[#1A1A1F] border border-blue-500/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">24/7</p>
                  <p className="text-xs text-gray-400 mt-1">Automatisch</p>
                </div>
                <div className="bg-[#1A1A1F] border border-purple-500/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-400">0€</p>
                  <p className="text-xs text-gray-400 mt-1">Fixkosten</p>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - REGISTRATION FORM */}
            <div className="bg-[#1A1A1F] border border-purple-500/30 rounded-2xl p-8 shadow-2xl shadow-purple-500/10 order-1 lg:order-2">
              {/* HEADER */}
              <div className="mb-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <FaUserCircle className="text-purple-400 text-3xl" />
                  <h2 className="text-2xl font-bold">Reseller Registration</h2>
                </div>
                <p className="text-gray-400 text-sm">Erstelle deinen kostenlosen Reseller Account</p>
              </div>

              {/* FORM */}
              <div className="space-y-4 mb-6">
                {/* Shop Name */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">
                    🏪 Shop-Name *
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. KeyParadise"
                    value={formData.shopName}
                    onChange={(e) =>
                      setFormData({ ...formData, shopName: e.target.value })
                    }
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-[#3C3C44] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Dieser Name wird im Marktplatz angezeigt</p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">
                    📧 Email *
                  </label>
                  <input
                    type="email"
                    placeholder="deine@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-[#3C3C44] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    disabled={loading}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">
                    🔐 Passwort *
                  </label>
                  <input
                    type="password"
                    placeholder="Min. 6 Zeichen"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-[#3C3C44] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    disabled={loading}
                  />
                </div>

                {/* Password Confirm */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">
                    🔐 Passwort wiederholen *
                  </label>
                  <input
                    type="password"
                    placeholder="Passwort bestätigen"
                    value={formData.passwordConfirm}
                    onChange={(e) =>
                      setFormData({ ...formData, passwordConfirm: e.target.value })
                    }
                    onKeyPress={(e) => e.key === "Enter" && handleRegister()}
                    className="w-full p-3 rounded-lg bg-[#2C2C34] border border-[#3C3C44] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    disabled={loading}
                  />
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.acceptTerms}
                    onChange={(e) =>
                      setFormData({ ...formData, acceptTerms: e.target.checked })
                    }
                    className="mt-1 w-4 h-4 rounded border-[#3C3C44] bg-[#2C2C34] text-purple-600 focus:ring-purple-500"
                    disabled={loading}
                  />
                  <label htmlFor="terms" className="text-xs text-gray-400">
                    Ich akzeptiere die{" "}
                    <a href="#" className="text-purple-400 hover:underline">AGB</a>
                    {" "}und{" "}
                    <a href="#" className="text-purple-400 hover:underline">Datenschutzerklärung</a>
                  </label>
                </div>
              </div>

              {/* REGISTER BUTTON */}
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold rounded-lg transition disabled:opacity-50 shadow-lg shadow-purple-500/20 text-white text-lg"
              >
                {loading ? "⏳ Wird registriert..." : "🚀 Jetzt kostenlos starten"}
              </button>

              {/* LOGIN LINK */}
              <p className="text-center text-gray-400 text-sm mt-6">
                Du hast schon einen Account?{" "}
                <button
                  onClick={() => navigate("/reseller-login")}
                  className="text-purple-400 hover:underline font-bold"
                  disabled={loading}
                >
                  Hier anmelden
                </button>
              </p>

              {/* SECURITY INFO */}
              <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-3 mt-6 text-xs text-green-300 text-center">
                <FaShieldAlt className="inline mr-2" />
                Deine Daten sind bei uns sicher verschlüsselt
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}