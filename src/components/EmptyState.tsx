// src/components/EmptyState.tsx
import { FaPlus, FaKey, FaUsers, FaBoxes, FaChartLine } from "react-icons/fa";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        {/* Animated circles */}
        <div className="absolute inset-0 animate-ping opacity-20">
          <div className="w-24 h-24 rounded-full bg-[#00FF9C]" />
        </div>
        <div className="relative w-24 h-24 rounded-full bg-[#1A1A1F] border-2 border-[#2C2C34] flex items-center justify-center text-4xl text-[#00FF9C]">
          {icon}
        </div>
      </div>
      
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-center max-w-md mb-6">{description}</p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-6 py-3 bg-[#00FF9C] text-[#0E0E12] rounded-lg hover:bg-[#00cc80] transition font-semibold"
        >
          <FaPlus />
          {action.label}
        </button>
      )}
    </div>
  );
}

// Predefined Empty States
export function NoLicensesState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<FaKey />}
      title="Noch keine Lizenzen"
      description="Erstelle deine erste Lizenz um loszulegen. Lizenzen ermöglichen es deinen Kunden, deine Produkte zu nutzen."
      action={{
        label: "Erste Lizenz erstellen",
        onClick: onCreate,
      }}
    />
  );
}

export function NoCustomersState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<FaUsers />}
      title="Keine Kunden vorhanden"
      description="Füge deinen ersten Kunden hinzu. Kunden können mehrere Lizenzen für verschiedene Produkte haben."
      action={{
        label: "Ersten Kunden anlegen",
        onClick: onCreate,
      }}
    />
  );
}

export function NoProductsState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<FaBoxes />}
      title="Keine Produkte angelegt"
      description="Erstelle dein erstes Produkt. Produkte sind die Basis für deine Lizenzen."
      action={{
        label: "Erstes Produkt erstellen",
        onClick: onCreate,
      }}
    />
  );
}

export function NoAnalyticsState() {
  return (
    <EmptyState
      icon={<FaChartLine />}
      title="Noch keine Daten"
      description="Sobald Lizenzen validiert werden, erscheinen hier detaillierte Statistiken und Analysen."
    />
  );
}

export function NoSearchResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-xl font-bold mb-2">Keine Ergebnisse</h3>
      <p className="text-gray-400 text-center">
        Keine Treffer für <span className="text-white font-mono">"{query}"</span>
      </p>
    </div>
  );
}