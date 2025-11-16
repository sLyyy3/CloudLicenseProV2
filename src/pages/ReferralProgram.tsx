// src/pages/ReferralProgram.tsx - FIXED REFERRAL SYSTEM
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaShare, FaLink, FaGift, FaDollarSign, FaUsers, FaArrowLeft } from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type ReferralUser = {
  email: string;
  referral_code: string;
  referral_count: number;
  earnings: number;
  status: string;
};

type Referral = {
  id: string;
  referrer_email: string;
  referred_email: string;
  status: string;
  commission: number;
  created_at: string;
};

export default function ReferralProgram() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [userEmail, setUserEmail] = useState<string>("");
  const [referralUser, setReferralUser] = useState<ReferralUser | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState<string>("");

  useEffect(() => {
    async function init() {
      // ✅ FIX: Check if authenticated
      const { data } = await supabase.auth.getUser();
      
      if (!data.user?.email) {
        openDialog({
          type: "warning",
          title: "🔒 Anmeldung erforderlich",
          message: "Du musst angemeldet sein um Referrals zu nutzen!",
          closeButton: "Anmelden",
        });
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1500);
        return;
      }

      console.log("👤 Referral Init - User:", data.user.email);
      setUserEmail(data.user.email);
      await loadReferralData(data.user.email);
    }
    init();
  }, []);

  async function loadReferralData(email: string) {
    setLoading(true);
    try {
      console.log("📡 Loading referral data for:", email);

      // ✅ FIX: Try to get existing referral user
      const { data: userData, error: userError } = await supabase
        .from("referral_users")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (userError && userError.code !== "PGRST116") {
        console.error("❌ User query error:", userError);
        throw userError;
      }

      let referralUserData = userData;

      if (!userData) {
        // ✅ FIX: Create new referral user if not exists
        console.log("✅ Creating new referral user...");
        const code = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        const { data: newUser, error: createError } = await supabase
          .from("referral_users")
          .insert({
            email,
            referral_code: code,
            referral_count: 0,
            earnings: 0,
            status: "active",
          })
          .select()
          .single();

        if (createError) {
          console.error("❌ Create error:", createError);
          throw createError;
        }

        console.log("✅ Created referral user:", newUser);
        referralUserData = newUser;
      } else {
        console.log("✅ Found existing referral user");
      }

      if (referralUserData) {
        setReferralUser(referralUserData);
        const link = `${window.location.origin}/?ref=${referralUserData.referral_code}`;
        setReferralLink(link);
        console.log("📎 Referral Link:", link);

        // Lade Referrals
        const { data: referralsData, error: refError } = await supabase
          .from("referrals")
          .select("*")
          .eq("referrer_email", email)
          .order("created_at", { ascending: false });

        if (refError) {
          console.error("❌ Referrals query error:", refError);
        } else {
          console.log("✅ Loaded referrals:", referralsData?.length || 0);
          setReferrals(referralsData || []);
        }
      }
    } catch (err) {
      console.error("❌ Error loading referral data:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Referral-Daten konnten nicht geladen werden",
        closeButton: "OK",
      });
    }
    setLoading(false);
  }

  function copyReferralLink() {
    navigator.clipboard.writeText(referralLink);
    openDialog({
      type: "success",
      title: "✅ Kopiert!",
      message: "Referral Link wurde kopiert!",
      closeButton: "OK",
    });
  }

  function shareOnTwitter() {
    const text = `🎉 Verdiene Geld mit Referrals! ${referralLink}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }

  function shareOnDiscord() {
    const text = `🎉 Verdiene Geld mit Referrals! ${referralLink}`;
    navigator.clipboard.writeText(text);
    openDialog({
      type: "success",
      title: "✅ Discord Text kopiert!",
      message: "Paste den Text jetzt in Discord!",
      closeButton: "OK",
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <p>⏳ Lädt Referral-Daten...</p>
      </div>
    );
  }

  if (!referralUser) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <p>❌ Fehler beim Laden der Daten</p>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        {/* HEADER */}
        <div className="bg-[#1A1A1F] border-b border-[#2C2C34] p-6 mb-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition"
              >
                <FaArrowLeft />
              </button>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FaShare className="text-[#00FF9C]" />
                💰 Referral Program
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C] transition">
              <div className="flex items-center gap-2 mb-2">
                <FaUsers className="text-[#00FF9C] text-2xl" />
                <p className="text-gray-400">Eingeladene</p>
              </div>
              <p className="text-4xl font-bold text-[#00FF9C]">
                {referralUser.referral_count}
              </p>
              <p className="text-xs text-gray-500 mt-1">Personen</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-green-400 transition">
              <div className="flex items-center gap-2 mb-2">
                <FaDollarSign className="text-green-400 text-2xl" />
                <p className="text-gray-400">Verdient</p>
              </div>
              <p className="text-4xl font-bold text-green-400">
                €{referralUser.earnings.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Gesamt</p>
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-yellow-400 transition">
              <div className="flex items-center gap-2 mb-2">
                <FaGift className="text-yellow-400 text-2xl" />
                <p className="text-gray-400">Provisionsrate</p>
              </div>
              <p className="text-4xl font-bold text-yellow-400">20%</p>
              <p className="text-xs text-gray-500 mt-1">pro Kauf</p>
            </div>
          </div>

          {/* REFERRAL LINK SECTION */}
          <div className="bg-gradient-to-r from-[#1A1A1F] to-[#2C2C34] border border-[#00FF9C] rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaLink className="text-[#00FF9C]" />
              🔗 Dein Referral Link
            </h2>

            <div className="bg-[#0E0E12] rounded-lg p-4 mb-6 flex items-center justify-between gap-4 border border-[#2C2C34]">
              <code className="font-mono text-sm break-all flex-1 text-[#00FF9C]">
                {referralLink}
              </code>
              <button
                onClick={copyReferralLink}
                className="ml-4 px-4 py-2 bg-[#00FF9C] text-[#0E0E12] rounded hover:bg-[#00cc80] transition font-bold whitespace-nowrap flex-shrink-0"
              >
                📋 Kopieren
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={copyReferralLink}
                className="px-4 py-3 bg-[#3C3C44] hover:bg-[#4C4C54] rounded-lg font-bold transition"
              >
                📋 Link Kopieren
              </button>
              <button
                onClick={shareOnTwitter}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition"
              >
                𝕏 Auf Twitter Teilen
              </button>
              <button
                onClick={shareOnDiscord}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition"
              >
                💬 Discord Kopieren
              </button>
            </div>
          </div>

          {/* COMMISSION STRUCTURE */}
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">💡 Wie funktioniert es?</h2>

            <div className="space-y-4">
              <div className="bg-[#2C2C34] rounded-lg p-4 border-l-4 border-green-400">
                <div className="font-bold text-green-400 mb-2">1️⃣ Link Teilen</div>
                <p className="text-sm text-gray-300">
                  Kopiere deinen Referral Link und teile ihn überall (Twitter, Discord, Email, etc.)
                </p>
              </div>

              <div className="bg-[#2C2C34] rounded-lg p-4 border-l-4 border-yellow-400">
                <div className="font-bold text-yellow-400 mb-2">2️⃣ Freunde Registrieren</div>
                <p className="text-sm text-gray-300">
                  Wenn jemand deinen Link klickt und sich registriert, wirst du sein Referrer
                </p>
              </div>

              <div className="bg-[#2C2C34] rounded-lg p-4 border-l-4 border-blue-400">
                <div className="font-bold text-blue-400 mb-2">3️⃣ Sie Kaufen Keys</div>
                <p className="text-sm text-gray-300">
                  Deine Referrals kaufen Keys im Shop (oder werden Reseller/Developer)
                </p>
              </div>

              <div className="bg-[#2C2C34] rounded-lg p-4 border-l-4 border-purple-400">
                <div className="font-bold text-purple-400 mb-2">4️⃣ Du Verdienst 20%</div>
                <p className="text-sm text-gray-300">
                  Du erhältst automatisch 20% Provision auf jeden Kauf!
                </p>
              </div>
            </div>
          </div>

          {/* EARNINGS EXAMPLES */}
          <div className="bg-green-600/10 border border-green-600 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-green-400 mb-4">📊 Verdienst-Beispiele</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#2C2C34] rounded p-4">
                <p className="text-sm text-gray-400 mb-1">1 Referral kauft €50</p>
                <p className="text-2xl font-bold text-green-400">€10 Gewinn</p>
                <p className="text-xs text-gray-500 mt-1">20% von €50</p>
              </div>

              <div className="bg-[#2C2C34] rounded p-4">
                <p className="text-sm text-gray-400 mb-1">10 Referrals à €100</p>
                <p className="text-2xl font-bold text-green-400">€200 Gewinn</p>
                <p className="text-xs text-gray-500 mt-1">20% von €1.000</p>
              </div>

              <div className="bg-[#2C2C34] rounded p-4">
                <p className="text-sm text-gray-400 mb-1">100 Referrals à €50</p>
                <p className="text-2xl font-bold text-green-400">€1.000 Gewinn</p>
                <p className="text-xs text-gray-500 mt-1">20% von €5.000</p>
              </div>
            </div>
          </div>

          {/* REFERRALS LIST */}
          {referrals.length > 0 && (
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">🎯 Deine Referrals ({referrals.length})</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-[#2C2C34]">
                    <tr className="text-gray-400 text-sm">
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-right">Verdient</th>
                      <th className="px-4 py-2 text-left">Datum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((ref) => (
                      <tr key={ref.id} className="border-b border-[#2C2C34] hover:bg-[#2C2C34]/50 transition">
                        <td className="px-4 py-3 text-sm">{ref.referred_email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              ref.status === "active"
                                ? "bg-green-600/20 text-green-400"
                                : "bg-gray-600/20 text-gray-400"
                            }`}
                          >
                            {ref.status === "active" ? "✅ Aktiv" : "⏳ Ausstehend"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-400">
                          €{ref.commission.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {new Date(ref.created_at).toLocaleDateString("de-DE")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {referrals.length === 0 && (
            <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-6 text-center">
              <p className="text-blue-300 text-lg font-bold mb-2">📭 Noch keine Referrals</p>
              <p className="text-gray-400">
                Teile deinen Link oben um Referrals zu verdienen!
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}