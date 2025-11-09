// src/pages/CustomerPortal.tsx - LICENSE ACTIVATION PORTAL
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FaKey, FaDownload, FaCheckCircle, FaCopy } from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type ActivationRecord = {
  id: string;
  email: string;
  password_hash: string;
  license_key: string;
  program_name: string;
  activated_at: string;
  last_login: string;
  status: "active" | "inactive";
};

export default function CustomerPortal() {
  const { Dialog: DialogComponent, open: openDialog } = useDialog();
  const [tab, setTab] = useState<"register" | "activate" | "manage">("register");
  const [loading, setLoading] = useState(false);

  // Register State
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    programName: "",
  });

  // Activate State
  const [activateData, setActivateData] = useState({
    email: "",
    password: "",
    programName: "",
  });

  // Manage State
  const [manageData, setManageData] = useState({
    email: "",
    password: "",
  });
  const [activations, setActivations] = useState<ActivationRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<ActivationRecord | null>(null);

  // ===== REGISTER =====
  async function handleRegister() {
    if (
      !registerData.email ||
      !registerData.password ||
      !registerData.passwordConfirm
    ) {
      openDialog({
        type: "warning",
        title: "⚠️ Felder erforderlich",
        message: "Bitte fülle alle Felder aus",
        closeButton: "OK",
      });
      return;
    }

    if (registerData.password !== registerData.passwordConfirm) {
      openDialog({
        type: "error",
        title: "❌ Passwörter stimmen nicht überein",
        message: "Die Passwörter müssen identisch sein",
        closeButton: "OK",
      });
      return;
    }

    if (registerData.password.length < 6) {
      openDialog({
        type: "warning",
        title: "⚠️ Passwort zu kurz",
        message: "Passwort muss mindestens 6 Zeichen sein",
        closeButton: "OK",
      });
      return;
    }

    setLoading(true);

    try {
      // Hash password (simple - in production use bcrypt!)
      const passwordHash = btoa(registerData.password); // base64 encode

      // Create activation record
      const { error } = await supabase
        .from("activations")
        .insert({
          email: registerData.email,
          password_hash: passwordHash,
          program_name: registerData.programName || "Default Program",
          license_key: generateLicenseKey(),
          status: "active",
          activated_at: new Date().toISOString(),
        });

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Registrierung erfolgreich!",
        message: (
          <div className="text-left space-y-2">
            <p>
              Dein Account wurde erstellt!
            </p>
            <p className="text-sm text-gray-400">
              Nutze deine Email und Passwort zum Einloggen.
            </p>
            <p className="text-xs text-gray-500 mt-3">
              Du kannst jetzt in dein Programm gehen und dich dort anmelden.
            </p>
          </div>
        ),
        closeButton: "OK",
      });

      setRegisterData({
        email: "",
        password: "",
        passwordConfirm: "",
        programName: "",
      });
      setTab("activate");
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    } finally {
      setLoading(false);
    }
  }

  // ===== ACTIVATE LICENSE =====
  async function handleActivate() {
    if (!activateData.email || !activateData.password) {
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
      const passwordHash = btoa(activateData.password);

      const { data, error } = await supabase
        .from("activations")
        .select("*")
        .eq("email", activateData.email)
        .eq("password_hash", passwordHash)
        .single();

      if (error || !data) {
        openDialog({
          type: "error",
          title: "❌ Login fehlgeschlagen",
          message: "Email oder Passwort falsch",
          closeButton: "OK",
        });
        return;
      }

      // Update last login
      await supabase
        .from("activations")
        .update({ last_login: new Date().toISOString() })
        .eq("id", data.id);

      openDialog({
        type: "success",
        title: "✅ License aktiviert!",
        message: (
          <div className="text-left space-y-3">
            <div className="bg-green-600/20 border border-green-600 rounded p-3">
              <p className="font-bold text-green-400">Dein License Key:</p>
              <code className="text-sm bg-black px-2 py-1 rounded block mt-2">
                {data.license_key}
              </code>
            </div>
            <p className="text-sm text-gray-400">
              Kopiere diesen Key in dein Programm um dich anzumelden.
            </p>
          </div>
        ),
        closeButton: "OK",
      });

      setActivateData({
        email: "",
        password: "",
        programName: "",
      });
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    } finally {
      setLoading(false);
    }
  }

  // ===== MANAGE LICENSES =====
  async function handleManage() {
    if (!manageData.email || !manageData.password) {
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
      const passwordHash = btoa(manageData.password);

      const { data, error } = await supabase
        .from("activations")
        .select("*")
        .eq("email", manageData.email)
        .eq("password_hash", passwordHash)
        .single();

      if (error || !data) {
        openDialog({
          type: "error",
          title: "❌ Login fehlgeschlagen",
          message: "Email oder Passwort falsch",
          closeButton: "OK",
        });
        return;
      }

      setCurrentUser(data);
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    } finally {
      setLoading(false);
    }
  }

  function generateLicenseKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
      if ((i + 1) % 8 === 0 && i < 31) key += "-";
    }
    return key;
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        {/* HEADER */}
        <div className="border-b border-[#2C2C34] p-8 bg-gradient-to-r from-[#00FF9C]/10 to-transparent">
          <h1 className="text-4xl font-extrabold flex items-center gap-2 mb-2">
            <FaKey className="text-[#00FF9C]" />
            CloudLicense Portal
          </h1>
          <p className="text-gray-400">
            Aktiviere deine License und verwalte deine Programminstanzen
          </p>
        </div>

        {/* TABS */}
        <div className="border-b border-[#2C2C34] px-8 py-4">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setTab("register");
                setCurrentUser(null);
              }}
              className={`px-6 py-2 rounded-lg font-bold transition ${
                tab === "register"
                  ? "bg-[#00FF9C] text-[#0E0E12]"
                  : "bg-[#2C2C34] text-gray-400 hover:text-white"
              }`}
            >
              📝 Registrieren
            </button>
            <button
              onClick={() => {
                setTab("activate");
                setCurrentUser(null);
              }}
              className={`px-6 py-2 rounded-lg font-bold transition ${
                tab === "activate"
                  ? "bg-[#00FF9C] text-[#0E0E12]"
                  : "bg-[#2C2C34] text-gray-400 hover:text-white"
              }`}
            >
              🔓 License aktivieren
            </button>
            <button
              onClick={() => setTab("manage")}
              className={`px-6 py-2 rounded-lg font-bold transition ${
                tab === "manage"
                  ? "bg-[#00FF9C] text-[#0E0E12]"
                  : "bg-[#2C2C34] text-gray-400 hover:text-white"
              }`}
            >
              ⚙️ Meine Lizenzen
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8 max-w-2xl mx-auto">
          {/* REGISTER TAB */}
          {tab === "register" && (
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">📝 Neuer Account</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, email: e.target.value })
                    }
                    placeholder="dein@email.com"
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Programm Name
                  </label>
                  <input
                    type="text"
                    value={registerData.programName}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        programName: e.target.value,
                      })
                    }
                    placeholder="z.B. Mein Cheat v1.0"
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Passwort</label>
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Passwort bestätigen
                  </label>
                  <input
                    type="password"
                    value={registerData.passwordConfirm}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        passwordConfirm: e.target.value,
                      })
                    }
                    placeholder="••••••••"
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full px-6 py-3 bg-[#00FF9C] text-[#0E0E12] font-bold rounded-lg hover:bg-[#00cc80] transition disabled:opacity-50"
              >
                {loading ? "Wird registriert..." : "✅ Registrieren"}
              </button>
            </div>
          )}

          {/* ACTIVATE TAB */}
          {tab === "activate" && (
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">🔓 License aktivieren</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={activateData.email}
                    onChange={(e) =>
                      setActivateData({ ...activateData, email: e.target.value })
                    }
                    placeholder="dein@email.com"
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Passwort</label>
                  <input
                    type="password"
                    value={activateData.password}
                    onChange={(e) =>
                      setActivateData({ ...activateData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>
              </div>

              <button
                onClick={handleActivate}
                disabled={loading}
                className="w-full px-6 py-3 bg-[#00FF9C] text-[#0E0E12] font-bold rounded-lg hover:bg-[#00cc80] transition disabled:opacity-50"
              >
                {loading ? "Wird aktiviert..." : "🔑 License anzeigen"}
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Nach der Aktivierung erhältst du deinen License Key zum Einfügen in dein
                Programm
              </p>
            </div>
          )}

          {/* MANAGE TAB */}
          {tab === "manage" && !currentUser && (
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">⚙️ Meine Lizenzen</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={manageData.email}
                    onChange={(e) =>
                      setManageData({ ...manageData, email: e.target.value })
                    }
                    placeholder="dein@email.com"
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Passwort</label>
                  <input
                    type="password"
                    value={manageData.password}
                    onChange={(e) =>
                      setManageData({ ...manageData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>
              </div>

              <button
                onClick={handleManage}
                disabled={loading}
                className="w-full px-6 py-3 bg-[#00FF9C] text-[#0E0E12] font-bold rounded-lg hover:bg-[#00cc80] transition disabled:opacity-50"
              >
                {loading ? "Wird geladen..." : "🔓 Einloggen"}
              </button>
            </div>
          )}

          {/* MANAGE TAB - AFTER LOGIN */}
          {tab === "manage" && currentUser && (
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">✅ Deine License</h2>
                <button
                  onClick={() => setCurrentUser(null)}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition"
                >
                  Logout
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-[#2C2C34] rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Email</p>
                  <p className="font-bold">{currentUser.email}</p>
                </div>

                <div className="bg-[#2C2C34] rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Programm</p>
                  <p className="font-bold">{currentUser.program_name}</p>
                </div>

                <div className="bg-[#2C2C34] rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">License Key</p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="font-mono text-sm bg-black px-3 py-2 rounded flex-1">
                      {currentUser.license_key}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentUser.license_key);
                        alert("✅ Kopiert!");
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>

                <div className="bg-[#2C2C34] rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <p className="font-bold">
                      {currentUser.status === "active" ? "🟢 Aktiv" : "🔴 Inaktiv"}
                    </p>
                  </div>
                </div>

                <div className="bg-[#2C2C34] rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Letzter Login</p>
                  <p className="font-mono text-sm">
                    {currentUser.last_login
                      ? new Date(currentUser.last_login).toLocaleString("de-DE")
                      : "Nie"}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-600/10 border border-blue-600 rounded-lg">
                <p className="text-sm text-blue-400">
                  💡 Kopiere deinen License Key und füge ihn in dein Programm ein um
                  dich anzumelden.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}