// src/pages/Settings.tsx
// User Settings & Profile

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Sidebar from "../components/Sidebar";
import { FaUser, FaEnvelope, FaLock, FaBell, FaPalette } from "react-icons/fa";
import { useDialog } from "../components/Dialog";

export default function Settings() {
  const { Dialog: DialogComponent, open: openDialog } = useDialog();
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email || "");
    }
    loadUser();
  }, []);

  async function handleChangePassword() {
    if (!newPassword || !confirmPassword) {
      openDialog({
        type: "warning",
        title: "⚠️ Passwort erforderlich",
        message: "Bitte fülle beide Passwort-Felder aus!",
        closeButton: "OK",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      openDialog({
        type: "error",
        title: "❌ Passwörter stimmen nicht überein",
        message: "Die Passwörter müssen identisch sein!",
        closeButton: "OK",
      });
      return;
    }

    if (newPassword.length < 6) {
      openDialog({
        type: "warning",
        title: "⚠️ Passwort zu kurz",
        message: "Passwort muss mindestens 6 Zeichen lang sein!",
        closeButton: "OK",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: error.message,
        closeButton: "OK",
      });
    } else {
      openDialog({
        type: "success",
        title: "✅ Passwort geändert",
        message: "Dein Passwort wurde erfolgreich geändert!",
        closeButton: "OK",
      });
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
    }

    setLoading(false);
  }

  return (
    <>
      {DialogComponent}

      <div className="flex">
        <Sidebar />

        <main className="flex-1 bg-[#0E0E12] text-[#E0E0E0]">
          {/* HEADER */}
          <div className="border-b border-[#2C2C34] p-8">
            <h1 className="text-4xl font-bold mb-2">⚙️ Einstellungen</h1>
            <p className="text-gray-400">Verwalte dein Profil und Einstellungen</p>
          </div>

          <div className="p-8 max-w-2xl space-y-8">
            {/* PROFILE SECTION */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <FaUser className="text-2xl text-[#00FF9C]" />
                <h2 className="text-2xl font-bold">Profil</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={userEmail}
                    disabled
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email-Änderungen sind derzeit nicht verfügbar
                  </p>
                </div>
              </div>
            </div>

            {/* PASSWORD SECTION */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <FaLock className="text-2xl text-yellow-400" />
                <h2 className="text-2xl font-bold">Passwort ändern</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Neues Passwort
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Passwort bestätigen
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-yellow-600 text-white rounded font-bold hover:bg-yellow-700 transition disabled:opacity-50"
                >
                  {loading ? "Wird aktualisiert..." : "Passwort ändern"}
                </button>
              </div>
            </div>

            {/* NOTIFICATIONS SECTION */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <FaBell className="text-2xl text-blue-400" />
                <h2 className="text-2xl font-bold">Benachrichtigungen</h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span>Lizenz läuft bald ab</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span>Neue Validierungen</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span>Team-Änderungen</span>
                </label>
              </div>
            </div>

            {/* THEME SECTION */}
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <FaPalette className="text-2xl text-purple-400" />
                <h2 className="text-2xl font-bold">Erscheinungsbild</h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="theme" defaultChecked className="w-4 h-4" />
                  <span>🌙 Dark Mode (Standard)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="theme" disabled className="w-4 h-4" />
                  <span className="text-gray-500">☀️ Light Mode (Bald verfügbar)</span>
                </label>
              </div>
            </div>

            {/* DANGER ZONE */}
            <div className="bg-red-600/10 border border-red-600 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-400 mb-4">🚨 Gefahrenzone</h2>
              <p className="text-sm text-gray-400 mb-4">
                Vorsicht: Diese Aktionen können nicht rückgängig gemacht werden.
              </p>
              <button className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition">
                Account löschen
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
