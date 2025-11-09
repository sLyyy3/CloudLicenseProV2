// src/pages/ReferralProgram.tsx - ULTRA MODERN REFERRAL SYSTEM V2
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaShare, FaLink, FaGift, FaDollarSign, FaUsers, FaArrowLeft, FaCopy, FaCheck, FaTrophy, FaChartLine, FaFire } from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();

      if (!data.user?.email) {
        setLoading(false);
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

      // Get or create referral user
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

        // Load referrals
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    openDialog({
      type: "success",
      title: "✅ Kopiert!",
      message: "Referral Link wurde in die Zwischenablage kopiert!",
      closeButton: "OK",
    });
  }

  function shareOnTwitter() {
    const text = `🚀 Verdiene Geld mit dem CloudLicense Referral-Programm! 💰 20% Provision auf jeden Kauf! ${referralLink}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }

  function shareOnDiscord() {
    const text = `🎉 **CloudLicense Referral Program** 🎉\n💰 Verdiene 20% Provision auf jeden Kauf!\n🔗 ${referralLink}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    openDialog({
      type: "success",
      title: "✅ Discord Text kopiert!",
      message: "Paste den Text jetzt in Discord!",
      closeButton: "OK",
    });
  }

  if (loading) {
    return (
      <div className="flex w-full min-h-screen bg-gradient-to-br from-[#0F0F14] via-[#1A1A1F] to-[#0F0F14]">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <p className="text-xl text-gray-300">Lädt Referral-Programm...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!referralUser) {
    return (
      <div className="flex w-full min-h-screen bg-gradient-to-br from-[#0F0F14] via-[#1A1A1F] to-[#0F0F14]">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <p className="text-xl text-gray-300">Fehler beim Laden der Referral-Daten</p>
          </div>
        </main>
      </div>
    );
  }

  // Calculate tier level based on referral count
  const getTier = () => {
    if (referralUser.referral_count >= 100) return { name: "💎 Diamond", color: "from-cyan-400 to-blue-600", bonus: "25%" };
    if (referralUser.referral_count >= 50) return { name: "🏆 Platinum", color: "from-purple-400 to-pink-600", bonus: "22%" };
    if (referralUser.referral_count >= 20) return { name: "🥇 Gold", color: "from-yellow-400 to-orange-600", bonus: "20%" };
    if (referralUser.referral_count >= 5) return { name: "🥈 Silver", color: "from-gray-300 to-gray-500", bonus: "20%" };
    return { name: "🥉 Bronze", color: "from-orange-300 to-orange-600", bonus: "20%" };
  };

  const tier = getTier();
  const nextTierAt = referralUser.referral_count < 5 ? 5 : referralUser.referral_count < 20 ? 20 : referralUser.referral_count < 50 ? 50 : 100;
  const progressToNextTier = (referralUser.referral_count / nextTierAt) * 100;

  return (
    <>
      {DialogComponent}

      <div className="flex w-full min-h-screen bg-gradient-to-br from-[#0F0F14] via-[#1A1A1F] to-[#0F0F14]">
        <Sidebar />

        <main className="ml-64 flex-1 p-8 text-[#E0E0E0]">
          {/* ANIMATED HEADER */}
          <div className="relative mb-8 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 border-2 border-purple-500/50 rounded-3xl p-8 overflow-hidden shadow-2xl shadow-purple-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl shadow-lg animate-bounce">
                    <FaGift className="text-4xl text-white" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                      Referral Programm
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Verdiene Geld mit jedem Referral! 💰</p>
                  </div>
                </div>
                <div className={`text-right bg-gradient-to-br ${tier.color} bg-clip-text text-transparent`}>
                  <p className="text-3xl font-black">{tier.name}</p>
                  <p className="text-lg font-bold mt-1">{tier.bonus} Provision</p>
                </div>
              </div>

              {/* Progress to Next Tier */}
              {referralUser.referral_count < 100 && (
                <div className="mt-6 bg-black/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">
                      Fortschritt zum nächsten Level: {referralUser.referral_count} / {nextTierAt}
                    </span>
                    <span className="text-purple-400 font-bold">{Math.min(progressToNextTier, 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-500 rounded-full shadow-lg shadow-purple-500/50"
                      style={{ width: `${Math.min(progressToNextTier, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="group relative bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-[#3C3C44] hover:border-[#00FF9C] rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#00FF9C]/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#00FF9C]/20 p-3 rounded-xl group-hover:animate-pulse">
                  <FaUsers className="text-[#00FF9C] text-3xl" />
                </div>
                <p className="text-gray-400 text-lg">Eingeladene Personen</p>
              </div>
              <p className="text-5xl font-black text-[#00FF9C] mb-2">
                {referralUser.referral_count}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FaChartLine className="text-green-400" />
                <span>Aktive Referrals</span>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-[#1A1A1F] to-[#2C2C34] border-2 border-[#3C3C44] hover:border-green-400 rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-green-400/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-400/20 p-3 rounded-xl group-hover:animate-pulse">
                  <FaDollarSign className="text-green-400 text-3xl" />
                </div>
                <p className="text-gray-400 text-lg">Gesamt Verdient</p>
              </div>
              <p className="text-5xl font-black text-green-400 mb-2">
                €{referralUser.earnings.toFixed(2)}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FaFire className="text-orange-400" />
                <span>Lifetime Earnings</span>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-2 border-yellow-500/50 hover:border-yellow-400 rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-yellow-400/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-400/20 p-3 rounded-xl group-hover:animate-bounce">
                  <FaTrophy className="text-yellow-400 text-3xl" />
                </div>
                <p className="text-gray-400 text-lg">Provisionsrate</p>
              </div>
              <p className="text-5xl font-black text-yellow-400 mb-2">{tier.bonus}</p>
              <div className="flex items-center gap-2 text-xs text-yellow-300">
                <FaGift />
                <span>Pro erfolgreichem Kauf</span>
              </div>
            </div>
          </div>

          {/* REFERRAL LINK SECTION - ULTRA MODERN */}
          <div className="relative mb-8 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 border-2 border-blue-500/50 rounded-3xl p-8 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 animate-pulse"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-3 rounded-xl">
                  <FaLink className="text-white text-2xl" />
                </div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Dein Persönlicher Referral Link
                </h2>
              </div>

              <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-blue-500/30">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <code className="font-mono text-sm md:text-base break-all flex-1 text-blue-300 font-bold">
                    {referralLink}
                  </code>
                  <button
                    onClick={copyReferralLink}
                    className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                      copied
                        ? "bg-green-500 text-white shadow-lg shadow-green-500/50"
                        : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-blue-500/50"
                    }`}
                  >
                    {copied ? (
                      <>
                        <FaCheck /> Kopiert!
                      </>
                    ) : (
                      <>
                        <FaCopy /> Kopieren
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={copyReferralLink}
                    className="px-5 py-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-xl font-bold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                  >
                    <FaCopy /> Link Kopieren
                  </button>
                  <button
                    onClick={shareOnTwitter}
                    className="px-5 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-bold transition-all hover:scale-105 shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-2"
                  >
                    𝕏 Twitter
                  </button>
                  <button
                    onClick={shareOnDiscord}
                    className="px-5 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl font-bold transition-all hover:scale-105 shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-2"
                  >
                    💬 Discord
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* HOW IT WORKS */}
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-8 mb-8 shadow-xl">
            <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
              <span className="text-3xl">💡</span>
              So funktioniert's
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-600/10 to-green-600/5 rounded-xl p-6 border-l-4 border-green-400 hover:shadow-lg hover:shadow-green-500/20 transition">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">1️⃣</span>
                  <span className="font-bold text-xl text-green-400">Link Teilen</span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Kopiere deinen einzigartigen Referral-Link und teile ihn auf Social Media, in Foren oder per E-Mail.
                </p>
              </div>

              <div className="bg-gradient-to-br from-yellow-600/10 to-yellow-600/5 rounded-xl p-6 border-l-4 border-yellow-400 hover:shadow-lg hover:shadow-yellow-500/20 transition">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">2️⃣</span>
                  <span className="font-bold text-xl text-yellow-400">User Registrieren</span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Wenn jemand deinen Link klickt und sich registriert, wird die Verbindung automatisch hergestellt.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-600/10 to-blue-600/5 rounded-xl p-6 border-l-4 border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">3️⃣</span>
                  <span className="font-bold text-xl text-blue-400">Käufe Generieren</span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Deine Referrals kaufen Lizenzen, werden Reseller oder Developer - du profitierst von allem!
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-600/10 to-purple-600/5 rounded-xl p-6 border-l-4 border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">4️⃣</span>
                  <span className="font-bold text-xl text-purple-400">Geld Verdienen</span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Du erhältst automatisch {tier.bonus} Provision auf jeden Kauf - direkt auf dein Konto!
                </p>
              </div>
            </div>
          </div>

          {/* EARNINGS CALCULATOR */}
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/50 rounded-3xl p-8 mb-8 shadow-2xl shadow-green-500/20">
            <h2 className="text-3xl font-black text-green-400 mb-6 flex items-center gap-3">
              📊 Verdienst-Rechner
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 hover:scale-105 transition-all border border-green-500/30">
                <p className="text-sm text-gray-300 mb-2">10 Referrals à €50</p>
                <p className="text-4xl font-black text-green-400 mb-1">€100</p>
                <p className="text-xs text-green-300/70">20% von €500</p>
              </div>

              <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 hover:scale-105 transition-all border border-green-500/30">
                <p className="text-sm text-gray-300 mb-2">50 Referrals à €100</p>
                <p className="text-4xl font-black text-green-400 mb-1">€1.000</p>
                <p className="text-xs text-green-300/70">20% von €5.000</p>
              </div>

              <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 hover:scale-105 transition-all border-2 border-yellow-400 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-bl-lg">
                  🔥 TOP
                </div>
                <p className="text-sm text-gray-300 mb-2">100 Referrals à €200</p>
                <p className="text-4xl font-black text-yellow-400 mb-1">€4.000</p>
                <p className="text-xs text-yellow-300/70">20% von €20.000</p>
              </div>
            </div>
          </div>

          {/* REFERRALS LIST */}
          {referrals.length > 0 && (
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-8 shadow-xl">
              <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
                🎯 Deine Referrals ({referrals.length})
              </h2>

              <div className="overflow-x-auto rounded-xl">
                <table className="w-full">
                  <thead className="bg-[#2C2C34]">
                    <tr className="text-gray-300 text-sm">
                      <th className="px-6 py-4 text-left font-bold">Email</th>
                      <th className="px-6 py-4 text-left font-bold">Status</th>
                      <th className="px-6 py-4 text-right font-bold">Verdient</th>
                      <th className="px-6 py-4 text-left font-bold">Datum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((ref, index) => (
                      <tr
                        key={ref.id}
                        className="border-b border-[#2C2C34] hover:bg-[#2C2C34]/50 transition"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <td className="px-6 py-4 font-medium">{ref.referred_email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                              ref.status === "active"
                                ? "bg-green-600/20 text-green-400 border border-green-500/30"
                                : "bg-gray-600/20 text-gray-400 border border-gray-500/30"
                            }`}
                          >
                            {ref.status === "active" ? "✅ Aktiv" : "⏳ Ausstehend"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-green-400 text-lg">
                          €{ref.commission.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(ref.created_at).toLocaleDateString("de-DE", {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {referrals.length === 0 && (
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 rounded-3xl p-12 text-center shadow-xl">
              <div className="text-7xl mb-4">📭</div>
              <p className="text-2xl font-black text-blue-300 mb-3">Noch keine Referrals</p>
              <p className="text-gray-300 text-lg mb-6">
                Teile deinen Link oben und starte dein passives Einkommen!
              </p>
              <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/50 px-6 py-3 rounded-xl">
                <FaFire className="text-orange-400" />
                <span className="text-blue-300">Erste 5 Referrals = Silver Status!</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
