// src/pages/ProfileSettings.tsx - PROFILE EINSTELLUNGEN
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaUser,
  FaEnvelope,
  FaBuilding,
  FaShieldAlt,
  FaKey,
  FaSave,
  FaArrowLeft,
  FaUserCircle,
  FaLock,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";
import Sidebar from "../components/Sidebar";

type UserProfile = {
  email: string;
  name: string;
  organization_name: string;
  role: string;
  is_developer: boolean;
  is_reseller: boolean;
  organization_id: string;
};

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          setLoading(false);
          navigate("/login", { replace: true });
          return;
        }

        const metadata = data.user.user_metadata as any;
        const orgId = metadata?.organization_id;

        // Load organization name
        let orgName = "N/A";
        if (orgId) {
          const { data: orgData } = await supabase
            .from("organizations")
            .select("name")
            .eq("id", orgId)
            .maybeSingle();

          if (orgData) {
            orgName = orgData.name;
          }
        }

        const userProfile: UserProfile = {
          email: data.user.email || "",
          name: metadata?.name || data.user.email?.split("@")[0] || "User",
          organization_name: orgName,
          role: metadata?.role || "customer",
          is_developer: metadata?.is_developer || false,
          is_reseller: metadata?.is_reseller || false,
          organization_id: orgId || "",
        };

        setProfile(userProfile);
        setDisplayName(userProfile.name);
      } catch (err) {
        console.error("Error loading profile:", err);
        openDialog({
          type: "error",
          title: "❌ Fehler",
          message: "Profil konnte nicht geladen werden",
          closeButton: "OK",
        });
      }
      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      // Update user metadata with new display name
      const { error } = await supabase.auth.updateUser({
        data: { name: displayName },
      });

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Gespeichert",
        message: "Dein Profil wurde erfolgreich aktualisiert!",
        closeButton: "OK",
      });

      // Refresh profile
      if (profile) {
        setProfile({ ...profile, name: displayName });
      }
    } catch (err: any) {
      console.error("Error saving profile:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message || "Profil konnte nicht gespeichert werden",
        closeButton: "OK",
      });
    }
    setSaving(false);
  }

  async function handleChangePassword() {
    if (!newPassword || !confirmPassword) {
      openDialog({
        type: "warning",
        title: "⚠️ Unvollständig",
        message: "Bitte fülle alle Passwort-Felder aus!",
        closeButton: "OK",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: "Die Passwörter stimmen nicht überein!",
        closeButton: "OK",
      });
      return;
    }

    if (newPassword.length < 6) {
      openDialog({
        type: "warning",
        title: "⚠️ Zu kurz",
        message: "Das Passwort muss mindestens 6 Zeichen lang sein!",
        closeButton: "OK",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Passwort geändert",
        message: "Dein Passwort wurde erfolgreich geändert!",
        closeButton: "OK",
      });

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Error changing password:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message || "Passwort konnte nicht geändert werden",
        closeButton: "OK",
      });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex w-full min-h-screen bg-gradient-to-br from-[#0F0F14] via-[#1A1A1F] to-[#0F0F14]">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <p className="text-xl text-gray-300">Lädt Profil...</p>
          </div>
        </main>
      </div>
    );
  }

  const getRoleBadge = () => {
    if (profile?.is_developer) {
      return <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-bold">👨‍💻 Developer</span>;
    }
    if (profile?.is_reseller) {
      return <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-bold">💼 Reseller</span>;
    }
    return <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold">👤 Kunde</span>;
  };

  return (
    <>
      {DialogComponent}

      <div className="flex w-full min-h-screen bg-gradient-to-br from-[#0F0F14] via-[#1A1A1F] to-[#0F0F14]">
        <Sidebar />

        <main className="ml-64 flex-1 p-8 text-[#E0E0E0]">
          {/* HEADER */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="mb-4 px-4 py-2 bg-[#1A1A1F] hover:bg-[#2C2C34] border border-[#2C2C34] rounded-lg transition flex items-center gap-2"
            >
              <FaArrowLeft /> Zurück
            </button>

            <div className="relative bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border-2 border-blue-500/50 rounded-3xl p-8 overflow-hidden shadow-2xl shadow-blue-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 animate-pulse"></div>
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <FaUserCircle className="text-5xl text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    Profil Einstellungen
                  </h1>
                  <div className="flex items-center gap-3">
                    <p className="text-gray-400 text-lg">{profile?.email}</p>
                    {getRoleBadge()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PROFIL INFORMATIONEN */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                <FaUser className="text-blue-400" />
                Profil Informationen
              </h2>

              <div className="space-y-6">
                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                    <FaEnvelope className="text-blue-400" />
                    E-Mail Adresse
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="w-full px-4 py-3 bg-[#0F0F14] border border-[#2C2C34] rounded-lg text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">E-Mail kann nicht geändert werden</p>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                    <FaUser className="text-green-400" />
                    Anzeigename
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Dein Name"
                    className="w-full px-4 py-3 bg-[#0F0F14] border border-[#2C2C34] focus:border-[#00FF9C] rounded-lg text-white outline-none transition"
                  />
                </div>

                {/* Organization (Read-only) */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                    <FaBuilding className="text-purple-400" />
                    Organisation
                  </label>
                  <input
                    type="text"
                    value={profile?.organization_name || "Keine Organisation"}
                    disabled
                    className="w-full px-4 py-3 bg-[#0F0F14] border border-[#2C2C34] rounded-lg text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Role (Read-only) */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                    <FaShieldAlt className="text-yellow-400" />
                    Rolle
                  </label>
                  <div className="w-full px-4 py-3 bg-[#0F0F14] border border-[#2C2C34] rounded-lg flex items-center gap-2">
                    {getRoleBadge()}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSave /> {saving ? "Speichert..." : "Profil speichern"}
                </button>
              </div>
            </div>

            {/* PASSWORT ÄNDERN */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                <FaLock className="text-red-400" />
                Passwort ändern
              </h2>

              <div className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                    <FaKey className="text-gray-400" />
                    Aktuelles Passwort
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-[#0F0F14] border border-[#2C2C34] focus:border-[#00FF9C] rounded-lg text-white outline-none transition"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                    <FaKey className="text-green-400" />
                    Neues Passwort
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-[#0F0F14] border border-[#2C2C34] focus:border-[#00FF9C] rounded-lg text-white outline-none transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">Mindestens 6 Zeichen</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                    <FaKey className="text-yellow-400" />
                    Passwort bestätigen
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-[#0F0F14] border border-[#2C2C34] focus:border-[#00FF9C] rounded-lg text-white outline-none transition"
                  />
                </div>

                {/* Change Password Button */}
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaLock /> {saving ? "Ändert..." : "Passwort ändern"}
                </button>
              </div>
            </div>
          </div>

          {/* SECURITY INFO */}
          <div className="mt-6 bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-2 border-yellow-500/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <FaShieldAlt /> Sicherheitshinweis
            </h3>
            <ul className="text-yellow-300 space-y-2 text-sm">
              <li>🔒 Dein Passwort wird verschlüsselt gespeichert</li>
              <li>🔑 Verwende ein starkes, einzigartiges Passwort</li>
              <li>⚠️ Gib deine Zugangsdaten niemals an Dritte weiter</li>
              <li>✅ Ändere dein Passwort regelmäßig für mehr Sicherheit</li>
            </ul>
          </div>
        </main>
      </div>
    </>
  );
}
