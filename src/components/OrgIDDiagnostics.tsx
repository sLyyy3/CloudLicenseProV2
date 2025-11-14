// src/components/OrgIDDiagnostics.tsx - Debug Helper
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface DiagnosticInfo {
  userId: string | null;
  email: string | null;
  organizationId: string | null;
  isAdmin: boolean;
  status: "ok" | "error" | "warning";
  message: string;
}

export function useOrgIDDiagnostics() {
  const [diag, setDiag] = useState<DiagnosticInfo>({
    userId: null,
    email: null,
    organizationId: null,
    isAdmin: false,
    status: "warning",
    message: "Lädt...",
  });

  useEffect(() => {
    async function runDiagnostics() {
      try {
        const { data } = await supabase.auth.getUser();
        
        if (!data.user?.id) {
          setDiag({
            userId: null,
            email: null,
            organizationId: null,
            isAdmin: false,
            status: "error",
            message: "❌ Nicht angemeldet",
          });
          return;
        }

        const userId = data.user.id;
        const email = data.user.email;
        const organizationId = data.user.user_metadata?.organization_id;
        const isAdmin = data.user.user_metadata?.admin === true;

        // Diagnostics
        if (!organizationId) {
          setDiag({
            userId,
            email,
            organizationId: null,
            isAdmin,
            status: "error",
            message: "❌ KRITISCH: organization_id fehlt! Bitte neu registrieren.",
          });
          console.error("❌ DIAGNOSTICS: organization_id ist NULL!");
          return;
        }

        // Prüfe ob Organization existiert
        const { data: orgExists } = await supabase
          .from("organizations")
          .select("id")
          .eq("id", organizationId)
          .single();

        if (!orgExists) {
          setDiag({
            userId,
            email,
            organizationId,
            isAdmin,
            status: "error",
            message: "❌ Organisation existiert nicht in der DB!",
          });
          console.error("❌ DIAGNOSTICS: Organisation nicht in DB!");
          return;
        }

        // Alles OK!
        setDiag({
          userId,
          email,
          organizationId,
          isAdmin,
          status: "ok",
          message: "✅ Alles OK! organization_id ist korrekt gespeichert.",
        });
        console.log("✅ DIAGNOSTICS: Alles in Ordnung!");

      } catch (err: any) {
        setDiag({
          userId: null,
          email: null,
          organizationId: null,
          isAdmin: false,
          status: "error",
          message: "💥 Error: " + err.message,
        });
        console.error("💥 DIAGNOSTICS Error:", err);
      }
    }

    runDiagnostics();
  }, []);

  return diag;
}

// Component für Oben im Dashboard
export function OrgIDDiagnosticsPanel() {
  const diag = useOrgIDDiagnostics();

  const bgColor = {
    ok: "bg-green-600/20 border-green-600",
    error: "bg-red-600/20 border-red-600",
    warning: "bg-yellow-600/20 border-yellow-600",
  }[diag.status];

  const textColor = {
    ok: "text-green-400",
    error: "text-red-400",
    warning: "text-yellow-400",
  }[diag.status];

  return (
    <div className={`${bgColor} border rounded p-3 mb-4 text-sm ${textColor}`}>
      <div className="font-bold mb-1">{diag.message}</div>
      {diag.organizationId ? (
        <div className="text-xs opacity-75">
          <div>User: {diag.userId}</div>
          <div>Email: {diag.email}</div>
          <div>Org ID: {diag.organizationId}</div>
          <div>Admin: {diag.isAdmin ? "Ja" : "Nein"}</div>
        </div>
      ) : (
        <div className="text-xs opacity-75">
          <div>❌ Keine organization_id gefunden</div>
          <div className="mt-2">
            <strong>Lösungen:</strong>
            <ol className="ml-4">
              <li>1. Melde dich aus (Logout)</li>
              <li>2. Registriere dich neu</li>
              <li>3. Melde dich an</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
