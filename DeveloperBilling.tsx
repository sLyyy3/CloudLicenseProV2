// src/pages/DeveloperBilling.tsx - BILLING & SUBSCRIPTIONS
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaCreditCard,
  FaArrowLeft,
  FaCheck,
  FaRedo,
  FaXmark,
  FaCalendar,
} from "react-icons/fa";
import { useDialog } from "../components/Dialog";

type Subscription = {
  id: string;
  plan: string;
  price: number;
  status: string;
  billing_date: string;
};

export default function DeveloperBilling() {
  const navigate = useNavigate();
  const { Dialog: DialogComponent, open: openDialog } = useDialog();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;

      if (!orgId) {
        navigate("/dev-login", { replace: true });
        return;
      }

      setOrganizationId(orgId);
      await loadSubscription(orgId);
    }
    init();
  }, []);

  async function loadSubscription(orgId: string) {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("organization_id", orgId) // ← NUR SEINE Subscription!
        .single();

      if (data) setSubscription(data);
    } catch (err) {
      console.error("Error loading subscription:", err);
    }
    setLoading(false);
  }

  const planDetails: Record<string, { features: string[]; price: number }> = {
    starter: {
      price: 29,
      features: [
        "Bis zu 50 Lizenzen",
        "1 Produkt",
        "Basic Analytics",
        "Email Support",
        "License Validation API",
      ],
    },
    pro: {
      price: 99,
      features: [
        "Bis zu 500 Lizenzen",
        "10 Produkte",
        "Advanced Analytics",
        "Priority Support",
        "Volle REST API",
        "Webhook Support",
      ],
    },
    enterprise: {
      price: 499,
      features: [
        "Unlimitiert Lizenzen",
        "Unlimitiert Produkte",
        "Custom Analytics",
        "Dedicated Support",
        "Webhooks & Integrations",
        "SLA Guarantee",
      ],
    },
  };

  async function handleUpgradePlan(newPlan: string) {
    if (!subscription || subscription.plan === newPlan) {
      openDialog({
        type: "warning",
        title: "⚠️ Bereits aktiv",
        message: "Dieser Plan ist bereits aktiv",
        closeButton: "OK",
      });
      return;
    }

    openDialog({
      type: "info",
      title: "🎯 Plan Upgrade",
      message: (
        <div className="text-left space-y-2">
          <p>
            Du wechselst von <strong>{subscription.plan}</strong> zu{" "}
            <strong>{newPlan}</strong>
          </p>
          <p className="text-sm text-gray-400">
            Die Änderung wird sofort wirksam. Du zahlst nur für die verbleibenden Tage.
          </p>
          <p className="text-xs text-gray-500 italic mt-2">
            Stripe Integration würde hier stattfinden
          </p>
        </div>
      ),
      closeButton: "Abbrechen",
      actionButton: {
        label: "🚀 Upgrade durchführen",
        onClick: async () => {
          // In Produktion: Stripe Integration
          openDialog({
            type: "success",
            title: "✅ Upgrade erfolgreich",
            message: "Dein Plan wurde aktualisiert",
            closeButton: "OK",
          });
        },
      },
    });
  }

  async function handleCancelSubscription() {
    if (
      !confirm(
        "❌ Wirklich kündigen? Dein Account bleibt aktiv bis Ende des Abrechnungszeitraums."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("organization_id", organizationId);

      if (error) throw error;

      openDialog({
        type: "success",
        title: "✅ Gekündigt",
        message:
          "Dein Abonnement wurde gekündigt. Dein Account ist noch bis Ende dieses Monats aktiv.",
        closeButton: "OK",
      });

      if (organizationId) await loadSubscription(organizationId);
    } catch (err: any) {
      openDialog({
        type: "error",
        title: "❌ Fehler",
        message: err.message,
        closeButton: "OK",
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] flex items-center justify-center">
        <div>⏳ Lädt...</div>
      </div>
    );
  }

  return (
    <>
      {DialogComponent}

      <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0]">
        {/* HEADER */}
        <div className="bg-[#1A1A1F] border-b border-[#2C2C34] p-6">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => navigate("/dev-dashboard")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#00FF9C] transition mb-4"
            >
              <FaArrowLeft /> Zurück
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FaCreditCard className="text-[#00FF9C]" />
              Abrechnung & Abonnement
            </h1>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-8">
          {/* CURRENT SUBSCRIPTION */}
          {subscription && (
            <div className="bg-[#1A1A1F] border-2 border-purple-600 rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">📋 Aktuelles Abonnement</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Plan</p>
                  <p className="text-3xl font-bold uppercase text-purple-400">
                    {subscription.plan}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-1">Monatlicher Preis</p>
                  <p className="text-3xl font-bold text-[#00FF9C]">
                    ${subscription.price}
                    <span className="text-sm">/Monat</span>
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <p
                    className={`text-2xl font-bold ${
                      subscription.status === "active"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {subscription.status === "active" ? "🟢 Aktiv" : "🔴 Inaktiv"}
                  </p>
                </div>
              </div>

              <div className="bg-blue-600/20 border border-blue-600 rounded p-4 mb-6">
                <p className="text-sm text-blue-300">
                  <FaCalendar className="inline mr-2" />
                  Nächste Abrechnung: <strong>{subscription.billing_date}</strong>
                </p>
              </div>

              {subscription.status === "active" && (
                <button
                  onClick={handleCancelSubscription}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded font-bold transition"
                >
                  ❌ Abonnement kündigen
                </button>
              )}
            </div>
          )}

          {/* PLAN COMPARISON */}
          <h2 className="text-2xl font-bold mb-6">🎯 Verfügbare Pläne</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(planDetails).map(([planName, details]) => (
              <div
                key={planName}
                className={`border-2 rounded-lg p-6 ${
                  subscription?.plan === planName
                    ? "border-purple-600 bg-purple-600/10"
                    : "border-[#2C2C34] hover:border-purple-600"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold uppercase">{planName}</h3>
                  {subscription?.plan === planName && (
                    <div className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">
                      Aktuell
                    </div>
                  )}
                </div>

                <p className="text-3xl font-bold text-[#00FF9C] mb-6">
                  ${details.price}
                  <span className="text-sm text-gray-400">/Monat</span>
                </p>

                <ul className="space-y-2 mb-6">
                  {details.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <FaCheck className="text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgradePlan(planName)}
                  disabled={subscription?.plan === planName}
                  className={`w-full py-2 rounded font-bold transition disabled:opacity-50 ${
                    subscription?.plan === planName
                      ? "bg-gray-600"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {subscription?.plan === planName
                    ? "✅ Aktueller Plan"
                    : subscription &&
                      ["starter", "pro", "enterprise"].indexOf(planName) >
                        ["starter", "pro", "enterprise"].indexOf(
                          subscription.plan
                        )
                    ? "🚀 Upgrade"
                    : "🔄 Wechseln"}
                </button>
              </div>
            ))}
          </div>

          {/* INVOICES */}
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 mt-12">
            <h2 className="text-2xl font-bold mb-4">📄 Rechnungen</h2>

            <div className="bg-gray-600/20 border border-gray-600 rounded p-4 text-center">
              <p className="text-gray-400">
                Rechnungen werden automatisch generiert und per Email verschickt
              </p>
              <p className="text-xs text-gray-500 mt-2">
                (In Produktion: Integration mit Stripe oder anderen Payment Providern)
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between items-center p-3 rounded bg-[#2C2C34]">
                <span>Rechnung November 2024</span>
                <button className="text-[#00FF9C] hover:underline text-sm">
                  📥 Download
                </button>
              </div>
              <div className="flex justify-between items-center p-3 rounded bg-[#2C2C34]">
                <span>Rechnung Oktober 2024</span>
                <button className="text-[#00FF9C] hover:underline text-sm">
                  📥 Download
                </button>
              </div>
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-lg p-8 mt-8">
            <h2 className="text-2xl font-bold mb-4">💳 Zahlungsmethode</h2>

            <div className="bg-gray-600/20 border border-gray-600 rounded p-4">
              <p className="text-sm mb-3">
                Deine aktuelle Zahlungsmethode:
              </p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-xs font-bold">
                  CARD
                </div>
                <span>Visa endet auf •••• 4242</span>
              </div>

              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold transition text-sm">
                🔄 Zahlungsmethode ändern
              </button>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-8 mt-12">
            <h3 className="font-bold text-blue-400 mb-4">❓ Häufige Fragen</h3>

            <div className="space-y-4 text-sm">
              <div>
                <p className="font-bold text-blue-300 mb-2">
                  Kann ich meinen Plan jederzeit ändern?
                </p>
                <p className="text-gray-300">
                  Ja, du kannst deinen Plan jederzeit wechseln. Die Änderung wird sofort wirksam.
                  Bei Upgrade zahlst du die Differenz, bei Downgrade erhältst du eine Gutschrift.
                </p>
              </div>

              <div>
                <p className="font-bold text-blue-300 mb-2">
                  Wie funktioniert die Kündigung?
                </p>
                <p className="text-gray-300">
                  Klick auf "Abonnement kündigen". Dein Account bleibt bis zum Ende deines
                  Abrechnungszeitraums aktiv. Es gibt keine versteckten Gebühren.
                </p>
              </div>

              <div>
                <p className="font-bold text-blue-300 mb-2">
                  Bekomme ich Rechnungen?
                </p>
                <p className="text-gray-300">
                  Ja, für jede Zahlungsperiode wird automatisch eine Rechnung generiert und per
                  Email versendet. Du kannst diese auch hier herunterladen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
