// src/pages/Signup.tsx - KOMPLETT FIXED - NO user_id in organizations!
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useDialog } from "../components/Dialog";
import { FaArrowLeft, FaRocket } from "react-icons/fa";

export default function Signup() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) {
        navigate("/dashboard", { replace: true });
      }
    }
    checkAuth();
  }, [navigate]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password || !organization) {
      openDialog({
        type: "warning",
        title: "⚠️ Alle Felder erforderlich",
        message: "Bitte fülle alle Felder aus!",
        closeButton: "OK",
      });
      return;
    }

    if (password !== confirmPassword) {
      openDialog({
        type: "error",
        title: "❌ Passwörter stimmen nicht überein",
        message: "Die Passwörter müssen identisch sein!",
        closeButton: "OK",
      });
      return;
    }

    if (password.length < 6) {
      openDialog({
        type: "warning",
        title: "⚠️ Passwort zu kurz",
        message: "Passwort muss mindestens 6 Zeichen lang sein!",
        closeButton: "OK",
      });
      return;
    }

    setLoading(true);

    try {
      console.log("🚀 Signup: Starte Registrierung...");
      console.log("📧 Email:", email);
      console.log("🏢 Organization:", organization);

      // SCHRITT 1: Erstelle User
      console.log("📝 Schritt 1: Erstelle Auth User...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            organization_name: organization,
          },
        },
      });

      if (authError) {
        console.error("❌ Auth Error:", authError);
        openDialog({
          type: "error",
          title: "❌ Registrierung fehlgeschlagen",
          message: authError.message || "Fehler bei der Registrierung",
          closeButton: "OK",
        });
        setLoading(false);
        return;
      }

      if (!authData.user?.id) {
        openDialog({
          type: "error",
          title: "❌ Fehler",
          message: "User konnte nicht erstellt werden",
          closeButton: "OK",
        });
        setLoading(false);
        return;
      }

      console.log("✅ Auth User erstellt:", authData.user.id);

      // SCHRITT 2: Erstelle Organization (✅ FIX: KEIN user_id!)
      console.log("📦 Schritt 2: Erstelle Organization...");
      console.log("   - name:", organization);
      console.log("   - owner_email:", email);
      console.log("   - plan: starter");

      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: organization,
          owner_email: email,
          // ❌ NICHT MEHR: user_id: authData.user.id,
          // ✅ NUR DIESE FELDER!
          plan: "starter",
        })
        .select()
        .single();

      if (orgError) {
        console.error("❌ Organization Error:", orgError);
        console.error("   Code:", orgError.code);
        console.error("   Message:", orgError.message);
        
        // Lösche User wenn Org fehlschlägt
        await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
        
        openDialog({
          type: "error",
          title: "❌ Registrierung fehlgeschlagen",
          message: `Organisation konnte nicht erstellt werden! Fehler: ${orgError.message}`,
          closeButton: "OK",
        });
        setLoading(false);
        return;
      }

      console.log("✅ Organization erstellt:", orgData?.id);

      // SCHRITT 3: Update User Metadata mit organization_id
      console.log("📝 Schritt 3: Update User Metadata...");
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          organization_id: orgData.id,
          organization_name: organization,
        },
      });

      if (updateError) {
        console.error("❌ Metadata Update Error:", updateError);
      } else {
        console.log("✅ User Metadata updated");
      }

      // SCHRITT 4: Process Referral Code (if exists)
      const refCode = localStorage.getItem('referral_code');
      if (refCode) {
        console.log("🎯 Processing Referral Code:", refCode);

        try {
          // Find the referrer by code
          const { data: referrer, error: referrerError } = await supabase
            .from("referral_users")
            .select("*")
            .eq("referral_code", refCode)
            .single();

          if (!referrerError && referrer) {
            console.log("✅ Referrer found:", referrer.email);

            // Create referral entry
            const { error: refInsertError } = await supabase
              .from("referrals")
              .insert({
                referrer_email: referrer.email,
                referred_email: email,
                status: "pending", // Will be "active" after first purchase
                commission: 0,
              });

            if (!refInsertError) {
              // Increment referral count
              await supabase
                .from("referral_users")
                .update({
                  referral_count: (referrer.referral_count || 0) + 1
                })
                .eq("email", referrer.email);

              console.log("🎉 Referral created successfully!");

              // Clear the referral code
              localStorage.removeItem('referral_code');
            } else {
              console.error("❌ Error creating referral:", refInsertError);
            }
          } else {
            console.log("⚠️ Referrer not found for code:", refCode);
          }
        } catch (refError) {
          console.error("❌ Referral processing error:", refError);
        }
      }

      // SUCCESS!
      console.log("🎉 SIGNUP ERFOLGREICH!");
      
      openDialog({
        type: "success",
        title: "✅ Registrierung erfolgreich!",
        message: (
          <div className="text-left space-y-3">
            <div className="bg-green-600/20 border border-green-600 rounded p-3">
              <p className="font-bold text-green-400">🎉 Willkommen!</p>
            </div>
            <p className="text-sm text-gray-400">
              Dein Account wurde erstellt.
            </p>
            <p className="text-sm text-gray-400 font-bold">
              Organisation: {organization}
            </p>
            <p className="text-xs text-gray-500 italic">
              Du wirst in 2 Sekunden weitergeleitet...
            </p>
          </div>
        ),
        closeButton: "OK",
      });

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
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

        {/* SIGNUP FORM */}
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 w-full max-w-md shadow-xl">
            {/* HEADER */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold mb-2">🚀 CloudLicensePro</h1>
              <h2 className="text-3xl font-bold">Registrierung</h2>
              <p className="text-gray-400 mt-1">Erstelle deinen Account</p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Organization Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  🏢 Organisation/Shop Name
                </label>
                <input
                  type="text"
                  placeholder="z.B. Mein Software Shop"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  disabled={loading}
                  required
                />
              </div>

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
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  disabled={loading}
                  required
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
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  disabled={loading}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  ✓ Passwort wiederholen
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  disabled={loading}
                  required
                />
              </div>

              {/* SIGNUP BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] font-bold rounded-lg transition disabled:opacity-50 mt-6"
              >
                {loading ? "⏳ Wird registriert..." : "✅ Registrieren"}
              </button>
            </form>

            {/* LOGIN LINK */}
            <p className="text-center text-gray-400 mt-6">
              Schon einen Account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-[#00FF9C] hover:underline font-bold"
                disabled={loading}
              >
                Hier anmelden
              </button>
            </p>

            {/* DIVIDER */}
            <div className="border-t border-[#2C2C34] my-8"></div>

            {/* OTHER OPTIONS */}
            <div className="space-y-2 text-sm text-center">
              <p className="text-gray-500">Du möchtest als Developer starten?</p>
              <button
                onClick={() => navigate("/dev-register")}
                className="block w-full text-gray-400 hover:text-purple-400 transition font-bold"
              >
                👨‍💻 Developer Registrierung
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
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}