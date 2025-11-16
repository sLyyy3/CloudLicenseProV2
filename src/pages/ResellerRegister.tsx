// src/pages/ResellerRegister.tsx - RESELLER REGISTRATION
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaRocket, FaArrowLeft, FaStore } from "react-icons/fa";
import { useDialog } from "../components/Dialog";

export default function ResellerRegister() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [formData, setFormData] = useState({
    shopName: "",
    email: "",
    password: "",
    passwordConfirm: "",
    paymentMethod: "stripe", // oder paypal
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
        title: "⚠️ Shopname erforderlich",
        message: "Bitte gib deinen Shop Namen ein",
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
      // Schritt 1: Erstelle Auth User mit is_reseller Flag
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            is_reseller: true, // ← RESELLER FLAG
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

      // Schritt 2: Erstelle Reseller Organization
      const { data: resellerData, error: resellerError } = await supabase
        .from("organizations")
        .insert({
          name: formData.shopName,
          owner_email: formData.email,
          plan: "reseller-starter",
          status: "active",
        })
        .select()
        .single();

      if (resellerError) {
        console.error("Error creating reseller org:", resellerError);
        openDialog({
          type: "error",
          title: "❌ Shop konnte nicht erstellt werden",
          message: resellerError.message,
          closeButton: "OK",
        });
        setLoading(false);
        return;
      }

      // Schritt 3: Erstelle Reseller Profile
      const { error: resellerProfileError } = await supabase
        .from("resellers")
        .insert({
          organization_id: resellerData.id,
          shop_name: formData.shopName,
          owner_email: formData.email,
          payment_method: formData.paymentMethod,
          status: "active",
          balance: 0,
        });

      if (resellerProfileError) {
        console.error("Error creating reseller profile:", resellerProfileError);
      }

      // Schritt 4: Update User Metadata
      await supabase.auth.updateUser({
        data: {
          is_reseller: true,
          organization_id: resellerData.id,
        },
      });

      openDialog({
        type: "success",
        title: "✅ Reseller Account erstellt!",
        message: (
          <div className="text-left space-y-3">
            <p>
              Willkommen <strong>{formData.shopName}</strong>! 🎉
            </p>
            <p className="text-sm text-gray-400">
              Dein Reseller Shop wurde erstellt.
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
                <FaStore className="text-[#00FF9C] text-3xl" />
                <h1 className="text-2xl font-bold">CloudLicensePro</h1>
              </div>
              <h2 className="text-2xl font-bold mb-2">🏪 Reseller Registration</h2>
              <p className="text-gray-400 text-sm">Starte deinen Reseller Shop</p>
            </div>

            {/* FORM */}
            <div className="space-y-4 mb-6">
              {/* Shop Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  🏪 Shop Name *
                </label>
                <input
                  type="text"
                  placeholder="z.B. Elite Cheats Shop"
                  value={formData.shopName}
                  onChange={(e) =>
                    setFormData({ ...formData, shopName: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
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
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
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
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
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
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  disabled={loading}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  💳 Zahlungsmethode
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value })
                  }
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  disabled={loading}
                >
                  <option value="stripe">Stripe (Kreditkarte)</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
            </div>

            {/* REGISTER BUTTON */}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-3 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] font-bold rounded-lg transition disabled:opacity-50 mb-6"
            >
              {loading ? "⏳ Wird registriert..." : "✅ Shop erstellen"}
            </button>

            {/* LOGIN LINK */}
            <p className="text-center text-gray-400">
              Du hast schon einen Account?{" "}
              <button
                onClick={() => navigate("/reseller-login")}
                className="text-[#00FF9C] hover:underline font-bold"
                disabled={loading}
              >
                Hier anmelden
              </button>
            </p>

            {/* INFO BOX */}
            <div className="bg-green-600/20 border border-green-600 rounded p-4 mt-6 text-xs text-green-300">
              <p className="font-bold mb-2">✅ Was bekommst du?</p>
              <ul className="space-y-1 text-xs">
                <li>✅ Reseller Dashboard</li>
                <li>✅ Marketplace Zugang</li>
                <li>✅ Keys kaufen & verkaufen</li>
                <li>✅ Automatic Validierung</li>
                <li>✅ Auszahlungen</li>
              </ul>
            </div>
          </div>

          {/* FEATURES */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded p-4 text-center text-sm">
              <p className="text-2xl mb-2">🏪</p>
              <p className="font-bold">Dein Shop</p>
              <p className="text-xs text-gray-400 mt-1">Verkaufe eigene Keys</p>
            </div>
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded p-4 text-center text-sm">
              <p className="text-2xl mb-2">🔑</p>
              <p className="font-bold">Viele Developer</p>
              <p className="text-xs text-gray-400 mt-1">Verbinde dich mit Devs</p>
            </div>
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded p-4 text-center text-sm">
              <p className="text-2xl mb-2">💰</p>
              <p className="font-bold">Verdiene Geld</p>
              <p className="text-xs text-gray-400 mt-1">Mit Key Verkäufen</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}