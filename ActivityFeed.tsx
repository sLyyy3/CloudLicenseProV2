// src/components/ActivityFeed.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FaCheckCircle, FaPlus, FaTrash, FaEdit, FaExclamationTriangle } from "react-icons/fa";

type Activity = {
  id: string;
  action: string;
  table_name: string;
  created_at: string;
  new_data?: any;
  old_data?: any;
};

export default function ActivityFeed({ organizationId }: { organizationId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Realtime subscription
    const channel = supabase
      .channel('audit_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_logs',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  async function fetchActivities() {
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setActivities(data);
    }
    setLoading(false);
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "INSERT":
        return <FaPlus className="text-[#00FF9C]" />;
      case "UPDATE":
        return <FaEdit className="text-[#3B82F6]" />;
      case "DELETE":
        return <FaTrash className="text-[#FF5C57]" />;
      default:
        return <FaCheckCircle className="text-gray-400" />;
    }
  };

  const getActionText = (activity: Activity) => {
    const tableName = activity.table_name;
    const action = activity.action;

    const tableNames: Record<string, string> = {
      licenses: "Lizenz",
      customers: "Kunde",
      products: "Produkt",
    };

    const actionNames: Record<string, string> = {
      INSERT: "erstellt",
      UPDATE: "aktualisiert",
      DELETE: "gelöscht",
    };

    const table = tableNames[tableName] || tableName;
    const verb = actionNames[action] || action;

    // Extract name from data
    let name = "";
    if (activity.new_data) {
      name = activity.new_data.name || activity.new_data.license_key || activity.new_data.id;
    } else if (activity.old_data) {
      name = activity.old_data.name || activity.old_data.license_key || activity.old_data.id;
    }

    return `${table} ${verb}${name ? `: ${name}` : ""}`;
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Gerade eben";
    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    return `vor ${diffDays} Tag${diffDays > 1 ? "en" : ""}`;
  };

  if (loading) {
    return (
      <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Aktivitäten</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-[#2C2C34] rounded" />
              <div className="flex-1">
                <div className="h-4 bg-[#2C2C34] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[#2C2C34] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Aktivitäten</h3>
        <span className="px-2 py-1 bg-[#00FF9C]/20 text-[#00FF9C] text-xs rounded">
          Live
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <FaExclamationTriangle className="text-3xl mx-auto mb-2 opacity-50" />
          <p>Noch keine Aktivitäten</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-3 p-3 rounded-lg hover:bg-[#2C2C34] transition"
            >
              <div className="w-8 h-8 rounded bg-[#2C2C34] flex items-center justify-center text-sm flex-shrink-0">
                {getActionIcon(activity.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{getActionText(activity)}</p>
                <p className="text-xs text-gray-400">{getTimeAgo(activity.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}