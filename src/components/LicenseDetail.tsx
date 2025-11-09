// src/pages/LicenseDetail.tsx - Enhanced Version
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

type License = {
  id: string;
  license_key: string;
  status: string;
  type: string;
  expires_at?: string;
  max_activations?: number;
  product_name: string;
  customer_name: string;
  customer_email: string;
};

type Props = {
  license: License;
  onClose: () => void;
  refresh: () => void;
};

export default function LicenseDetail({ license, onClose, refresh }: Props) {
  const [status, setStatus] = useState(license.status);
  const [type, setType] = useState(license.type);
  const [expiresAt, setExpiresAt] = useState(license.expires_at || "");
  const [maxActivations, setMaxActivations] = useState(license.max_activations || 1);
  const [loading, setLoading] = useState(false);

  // Mapping für Farben
  const statusColors: Record<string, string> = {
    active: "#00FF9C",
    expired: "#FF5C57",
    revoked: "#FFCD3C",
  };

  const typeColors: Record<string, string> = {
    Trial: "#00FF9C",
    Subscription: "#3B82F6",
    Lifetime: "#A855F7",
    Floating: "#FFA500",
  };

  const [statusBg, setStatusBg] = useState(statusColors[status]);
  const [typeBg, setTypeBg] = useState(typeColors[type]);

  useEffect(() => {
    setStatusBg(statusColors[status]);
  }, [status]);

  useEffect(() => {
    setTypeBg(typeColors[type]);
  }, [type]);

  async function saveChanges() {
    setLoading(true);
    
    const updateData: any = { status, type };
    
    if (expiresAt) {
      updateData.expires_at = expiresAt;
    }
    
    if (type === "Floating") {
      updateData.max_activations = maxActivations;
    }

    const { error } = await supabase
      .from("licenses")
      .update(updateData)
      .eq("id", license.id);
    
    setLoading(false);

    if (error) {
      console.error(error);
      alert("Fehler beim Speichern!");
      return;
    }
    refresh();
    onClose();
  }

  async function deleteLicense() {
    if (!confirm("Willst du diese Lizenz wirklich löschen?")) return;
    setLoading(true);
    const { error } = await supabase.from("licenses").delete().eq("id", license.id);
    setLoading(false);

    if (error) {
      console.error(error);
      alert("Fehler beim Löschen!");
      return;
    }
    refresh();
    onClose();
  }

  // Berechne verbleibende Tage
  const daysRemaining = expiresAt 
    ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
      <div className="bg-[#1A1A1F] p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Lizenz Details</h2>
        
        {/* Lizenz Key */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-1">Lizenz Key:</p>
          <div className="flex gap-2">
            <input 
              type="text"
              value={license.license_key}
              readOnly
              className="flex-1 p-2 rounded bg-[#2C2C34] border border-[#3C3C44] text-[#00FF9C] font-mono"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(license.license_key);
                alert("In Zwischenablage kopiert!");
              }}
              className="px-4 py-2 bg-[#00FF9C] text-[#0E0E12] rounded hover:bg-[#00cc80] transition"
            >
              Kopieren
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-1">Status:</p>
          <select
            className="w-full p-2 rounded text-white border border-[#3C3C44]"
            style={{ backgroundColor: statusBg }}
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {Object.keys(statusColors).map(key => (
              <option
                key={key}
                value={key}
                style={{ color: statusColors[key] }}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Typ */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-1">Typ:</p>
          <select
            className="w-full p-2 rounded text-white border border-[#3C3C44]"
            style={{ backgroundColor: typeBg }}
            value={type}
            onChange={e => setType(e.target.value)}
          >
            {Object.keys(typeColors).map(key => (
              <option
                key={key}
                value={key}
                style={{ color: typeColors[key] }}
              >
                {key}
              </option>
            ))}
          </select>
        </div>

        {/* Ablaufdatum */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-1">Ablaufdatum:</p>
          <input
            type="date"
            className="w-full p-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
          />
          {daysRemaining !== null && (
            <p className={`text-xs mt-1 ${daysRemaining < 7 ? 'text-[#FF5C57]' : 'text-gray-400'}`}>
              {daysRemaining > 0 
                ? `Läuft in ${daysRemaining} Tagen ab`
                : `Vor ${Math.abs(daysRemaining)} Tagen abgelaufen`
              }
            </p>
          )}
        </div>

        {/* Max Activations (nur für Floating) */}
        {type === "Floating" && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-1">Max. Aktivierungen:</p>
            <input
              type="number"
              min="1"
              className="w-full p-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
              value={maxActivations}
              onChange={e => setMaxActivations(parseInt(e.target.value))}
            />
          </div>
        )}

        {/* Produkt & Kunde Info */}
        <div className="bg-[#2C2C34] rounded p-4 mb-4">
          <p className="text-sm text-gray-400 mb-1">Produkt:</p>
          <p className="text-[#E0E0E0] font-semibold mb-3">{license.product_name}</p>
          
          <p className="text-sm text-gray-400 mb-1">Kunde:</p>
          <p className="text-[#E0E0E0] font-semibold">{license.customer_name}</p>
          <p className="text-sm text-gray-400">{license.customer_email}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition"
            disabled={loading}
          >
            Abbrechen
          </button>
          <button
            onClick={saveChanges}
            className="px-4 py-2 rounded bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] transition"
            disabled={loading}
          >
            {loading ? "Speichert..." : "Speichern"}
          </button>
          <button
            onClick={deleteLicense}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
            disabled={loading}
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}