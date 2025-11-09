// src/pages/DeveloperAPIKeys.tsx - DEVELOPER API KEYS MANAGEMENT
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaArrowLeft, FaKey, FaPlus, FaCopy, FaTrash, FaCode } from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type APIKey = {
  id: string;
  name: string;
  key: string;
  secret: string;
  status: string;
  created_at: string;
  last_used?: string;
  requests_count: number;
};

export default function DeveloperAPIKeys() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Create Modal
  const [createModal, setCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);

  // Copy State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;

      if (!orgId) {
        navigate("/dev-login", { replace: true });
        return;
      }

      setOrganizationId(orgId);
      await loadAPIKeys(orgId);
    }
    init();
  }, []);

  async function loadAPIKeys(orgId: string) {
    setLoading(true);
    try {
      console.log("🔑 Loading API keys for org:", orgId);

      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("✅ Loaded keys:", data?.length || 0);
      setApiKeys(data || []);
    } catch (err) {
      console.error("❌ Error:", err);
    }
    setLoading(false);
  }

  async function handleCreateKey() {
    if (!newKeyName || !organizationId) {
      openDialog({
        type: "warning",
        title: "⚠️ Fehler",
        message: "Bitte gib einen Namen für den Key ein",
        closeButton: "OK",
      });
      return;
    }

    setCreatingKey(true);

    try {
      const keyCode = generateKeyCode();
      const secretCode = generateKeyCode();

      console.log("🔑 Creating API key:", newKeyName);

      const { error } = await supabase.from("api_keys").insert({
        organization_id: organizationId,
        name: newKeyName,
        key: keyCode,
        secret: secretCode,
        status: "active",
        requests_count: 0,
      });

      if (error) throw error;

      console.log("✅ Key created!");

      openDialog({
        type: "success",
        title: "✅ API Key erstellt!",
        message: (
          <div className="text-left space-y-2">
            <p>
              Key Name: <strong>{newKeyName}</strong>
            </p>
            <p className="text-sm text-gray-400">
              Speichere den Secret sofort, er wird nicht nochmal angezeigt!
            </p>
          </div>
        ),
        closeButton: "OK",
      });

      setNewKeyName("");
      setCreateModal(false);

      if (organizationId) await loadAPIKeys(organizationId);
    } catch (err: any) {
      console.error("❌ Error:", err);
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    }

    setCreatingKey(false);
  }

  async function handleDeleteKey(keyId: string) {
    if (!confirm("⚠️ Wirklich löschen?")) return;

    try {
      const { error } = await supabase.from("api_keys").delete().eq("id", keyId);

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Gelöscht!",
        message: "API Key wurde gelöscht",
        closeButton: "OK",
      });

      if (organizationId) await loadAPIKeys(organizationId);
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    }
  }

  function generateKeyCode(): string {
    return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⏳</div>
          <p>Lädt API Keys...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        {/* HEADER */}
        <div className="bg-[#1A1A1F] border-b border-[#2C2C34] p-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate("/dev-dashboard")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition mb-4"
            >
              <FaArrowLeft /> Zurück zum Dashboard
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FaKey className="text-[#00FF9C]" />
              API Keys
            </h1>
            <p className="text-gray-400 mt-1">
              Verwalte deine API Keys für die Integration
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {/* CREATE BUTTON */}
          <button
            onClick={() => setCreateModal(true)}
            className="mb-8 px-6 py-2 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] rounded font-bold flex items-center gap-2"
          >
            <FaPlus /> Neuer Key
          </button>

          {/* API KEYS LIST */}
          {apiKeys.length === 0 ? (
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 text-center text-gray-400">
              <FaKey className="text-4xl mb-4 mx-auto opacity-50" />
              <p className="text-lg font-semibold mb-2">Keine API Keys</p>
              <p className="text-sm mb-4">Erstelle deinen ersten Key um mit der API zu starten</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-6 hover:border-[#00FF9C] transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{apiKey.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Erstellt: {new Date(apiKey.created_at).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          apiKey.status === "active"
                            ? "bg-green-600 text-white"
                            : "bg-gray-600 text-white"
                        }`}
                      >
                        {apiKey.status === "active" ? "✅ Aktiv" : "❌ Inaktiv"}
                      </span>
                      <span className="px-3 py-1 bg-[#2C2C34] rounded text-xs font-bold">
                        📊 {apiKey.requests_count} Requests
                      </span>
                    </div>
                  </div>

                  {/* KEY INFO */}
                  <div className="space-y-3 mb-4">
                    <div className="bg-[#2C2C34] rounded p-3">
                      <p className="text-xs text-gray-400 mb-1">Key</p>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm flex-1 break-all">
                          {apiKey.key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(apiKey.key, apiKey.id + "_key")}
                          className="px-2 py-1 bg-[#3C3C44] hover:bg-[#4C4C54] rounded text-xs"
                        >
                          {copiedId === apiKey.id + "_key" ? "✅ Kopiert!" : <FaCopy />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#2C2C34] rounded p-3">
                      <p className="text-xs text-gray-400 mb-1">Secret</p>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm flex-1 break-all">
                          {apiKey.secret}
                        </code>
                        <button
                          onClick={() => copyToClipboard(apiKey.secret, apiKey.id + "_secret")}
                          className="px-2 py-1 bg-[#3C3C44] hover:bg-[#4C4C54] rounded text-xs"
                        >
                          {copiedId === apiKey.id + "_secret" ? "✅ Kopiert!" : <FaCopy />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteKey(apiKey.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold flex items-center gap-2 text-sm"
                  >
                    <FaTrash /> Löschen
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* DOCUMENTATION */}
          <div className="mt-12 bg-blue-600/20 border border-blue-600 rounded-lg p-6">
            <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
              <FaCode /> API Dokumentation
            </h3>
            <div className="text-sm text-blue-300 space-y-3 font-mono">
              <p>
                <strong>Base URL:</strong> https://api.cloudlicensepro.com
              </p>
              <p>
                <strong>Authentication:</strong> Nutze Key + Secret im Header
              </p>
              <div className="bg-[#0E0E12] rounded p-2 mt-2">
                <p>GET /api/validate-key</p>
                <p className="text-gray-400 text-xs mt-1">
                  Validiere einen Key. Query Parameter: key, product_id
                </p>
              </div>
              <div className="bg-[#0E0E12] rounded p-2">
                <p>POST /api/generate-keys</p>
                <p className="text-gray-400 text-xs mt-1">
                  Generiere neue Keys. Body: quantity, product_id
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CREATE MODAL */}
        {createModal && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">🔑 Neuer API Key</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Key Name</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="z.B. Production Key"
                    className="w-full p-3 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCreateModal(false)}
                    disabled={creatingKey}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-bold"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleCreateKey}
                    disabled={creatingKey}
                    className="flex-1 px-4 py-2 bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] rounded font-bold disabled:opacity-50"
                  >
                    {creatingKey ? "⏳..." : "✅ Erstellen"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}