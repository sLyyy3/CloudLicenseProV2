// src/components/GlobalSearch.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FaSearch, FaKey, FaUsers, FaBoxes, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

type SearchResult = {
  type: "license" | "customer" | "product";
  id: string;
  title: string;
  subtitle: string;
  metadata?: string;
};

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Get organization ID
  useEffect(() => {
    async function getOrg() {
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;
      setOrganizationId(orgId);
    }
    getOrg();
  }, []);

  // Search function
  useEffect(() => {
    if (!query || !organizationId) {
      setResults([]);
      return;
    }

    const searchDebounce = setTimeout(async () => {
      setLoading(true);
      const searchResults: SearchResult[] = [];

      // Search Licenses
      const { data: licenses } = await supabase
        .from("licenses")
        .select(`
          id,
          license_key,
          status,
          type,
          customer:customers(name),
          product:products(name)
        `)
        .eq("organization_id", organizationId)
        .ilike("license_key", `%${query}%`)
        .limit(5);

      if (licenses) {
        licenses.forEach((l: any) => {
          searchResults.push({
            type: "license",
            id: l.id,
            title: l.license_key,
            subtitle: `${l.customer?.name || "Unknown"} - ${l.product?.name || "Unknown"}`,
            metadata: l.status,
          });
        });
      }

      // Search Customers
      const { data: customers } = await supabase
        .from("customers")
        .select("id, name, email")
        .eq("organization_id", organizationId)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);

      if (customers) {
        customers.forEach((c: any) => {
          searchResults.push({
            type: "customer",
            id: c.id,
            title: c.name,
            subtitle: c.email,
          });
        });
      }

      // Search Products
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .eq("organization_id", organizationId)
        .ilike("name", `%${query}%`)
        .limit(5);

      if (products) {
        products.forEach((p: any) => {
          searchResults.push({
            type: "product",
            id: p.id,
            title: p.name,
            subtitle: "Produkt",
          });
        });
      }

      setResults(searchResults);
      setLoading(false);
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [query, organizationId]);

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    
    // Navigate based on type (für später wenn wir Detail-Pages haben)
    // navigate(`/${result.type}/${result.id}`);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "license":
        return <FaKey className="text-[#A855F7]" />;
      case "customer":
        return <FaUsers className="text-[#3B82F6]" />;
      case "product":
        return <FaBoxes className="text-[#00FF9C]" />;
      default:
        return <FaSearch />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const colors: Record<string, string> = {
      active: "bg-[#00FF9C]/20 text-[#00FF9C]",
      expired: "bg-[#FF5C57]/20 text-[#FF5C57]",
      revoked: "bg-[#FFCD3C]/20 text-[#FFCD3C]",
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs ${colors[status] || ""}`}>
        {status}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh] px-4">
      <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl w-full max-w-2xl shadow-2xl animate-scale-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2C2C34]">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suche nach Lizenzen, Kunden, Produkten..."
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-500"
            autoFocus
          />
          <button
            onClick={() => {
              setIsOpen(false);
              setQuery("");
            }}
            className="text-gray-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-[#00FF9C] border-t-transparent rounded-full" />
            </div>
          ) : results.length === 0 && query ? (
            <div className="p-8 text-center text-gray-400">
              Keine Ergebnisse für "{query}"
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <FaSearch className="text-4xl mx-auto mb-2 opacity-50" />
              <p>Starte mit der Suche...</p>
              <p className="text-sm mt-2">
                Tipp: Drücke <kbd className="px-2 py-1 bg-[#2C2C34] rounded text-xs">Cmd+K</kbd> überall
              </p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2C2C34] transition text-left"
                >
                  <div className="text-xl">{getIcon(result.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{result.title}</p>
                      {getStatusBadge(result.metadata)}
                    </div>
                    <p className="text-sm text-gray-400">{result.subtitle}</p>
                  </div>
                  <div className="text-xs text-gray-500 uppercase">
                    {result.type}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#2C2C34] flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigieren</span>
            <span>↵ Auswählen</span>
          </div>
          <div>ESC zum Schließen</div>
        </div>
      </div>
    </div>
  );
}

// Add to index.css:
/*
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}

kbd {
  font-family: inherit;
  font-size: inherit;
}
*/