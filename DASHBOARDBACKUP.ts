// src/pages/Dashboard.tsx - Complete Fixed Version
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaUsers, FaKey, FaPlus, FaSignOutAlt, FaSearch, FaDownload } from "react-icons/fa";
import LicenseDetail from "./LicenseDetail";
import { toast } from "../components/Toaster";
import { DashboardSkeleton } from "../components/Skeleton";
import { NoLicensesState, NoCustomersState, NoProductsState } from "../components/EmptyState";
import GlobalSearch from "../components/GlobalSearch";
import QuickActions from "../components/QuickActions";
import ActivityFeed from "../components/ActivityFeed";

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

type Customer = { id: string; name: string; email: string };
type Product = { id: string; name: string };

type Stats = {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  revokedLicenses: number;
  totalCustomers: number;
  totalProducts: number;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalLicenses: 0,
    activeLicenses: 0,
    expiredLicenses: 0,
    revokedLicenses: 0,
    totalCustomers: 0,
    totalProducts: 0
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const [showCreateLicense, setShowCreateLicense] = useState(false);
  const [newLicense, setNewLicense] = useState({ 
    product_id: "", 
    customer_id: "", 
    type: "Trial",
    expires_at: "",
    max_activations: 1
  });

  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");

  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");

  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);

  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  useEffect(() => {
    async function fetchOrg() {
      const { data } = await supabase.auth.getUser();
      const orgId = (data.user?.user_metadata as any)?.organization_id;
      if (!orgId) {
        toast.error("Keine Organisation gefunden!");
      } else {
        setOrganizationId(orgId);
      }
    }
    fetchOrg();
  }, []);

  useEffect(() => {
    if (!organizationId) return;
    fetchData();
  }, [organizationId]);

  async function fetchData() {
    setLoading(true);
    await Promise.all([fetchLicenses(), fetchCustomers(), fetchProducts()]);
    setLoading(false);
  }

  async function fetchLicenses() {
    if (!organizationId) return;
    const { data } = await supabase.from("licenses").select(`
      id, license_key, status, type, expires_at, max_activations,
      product:products(name),
      customer:customers(name,email)
    `).eq("organization_id", organizationId);
    
    if (data) {
      const mappedLicenses = data.map((l: any) => ({
        id: l.id,
        license_key: l.license_key,
        status: l.status,
        type: l.type || "Trial",
        expires_at: l.expires_at,
        max_activations: l.max_activations,
        product_name: l.product?.name,
        customer_name: l.customer?.name,
        customer_email: l.customer?.email,
      }));
      setLicenses(mappedLicenses);
      setFilteredLicenses(mappedLicenses);
      calculateStats(mappedLicenses);
    }
  }

  async function fetchCustomers() {
    if (!organizationId) return;
    const { data } = await supabase.from("customers").select("*").eq("organization_id", organizationId);
    if (data) setCustomers(data);
  }

  async function fetchProducts() {
    if (!organizationId) return;
    const { data } = await supabase.from("products").select("*").eq("organization_id", organizationId);
    if (data) setProducts(data);
  }

  function calculateStats(licensesData: License[]) {
    setStats({
      totalLicenses: licensesData.length,
      activeLicenses: licensesData.filter(l => l.status === "active").length,
      expiredLicenses: licensesData.filter(l => l.status === "expired").length,
      revokedLicenses: licensesData.filter(l => l.status === "revoked").length,
      totalCustomers: customers.length,
      totalProducts: products.length
    });
  }

  useEffect(() => {
    let filtered = licenses;

    if (searchTerm) {
      filtered = filtered.filter(l => 
        l.license_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(l => l.status === filterStatus);
    }

    if (filterType !== "all") {
      filtered = filtered.filter(l => l.type === filterType);
    }

    setFilteredLicenses(filtered);
  }, [searchTerm, filterStatus, filterType, licenses]);

  async function createLicense() {
    if (!newLicense.product_id || !newLicense.customer_id) {
      toast.error("Bitte Produkt und Kunde auswählen!");
      return;
    }

    const license_key =
      Math.random().toString(36).substring(2, 10).toUpperCase() + "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const licenseData: any = {
      license_key,
      status: "active",
      product_id: newLicense.product_id,
      customer_id: newLicense.customer_id,
      type: newLicense.type,
      organization_id: organizationId
    };

    if (newLicense.expires_at) {
      licenseData.expires_at = newLicense.expires_at;
    }

    if (newLicense.type === "Floating" && newLicense.max_activations) {
      licenseData.max_activations = newLicense.max_activations;
    }

    const { error } = await supabase.from("licenses").insert([licenseData]);

    if (error) {
      toast.error("Fehler beim Erstellen der Lizenz!");
      return;
    }

    toast.success("Lizenz erfolgreich erstellt!");
    await fetchLicenses();
    setShowCreateLicense(false);
    setNewLicense({ product_id: "", customer_id: "", type: "Trial", expires_at: "", max_activations: 1 });
  }

  async function createCustomer() {
    if (!newCustomerName || !newCustomerEmail) {
      toast.error("Bitte Name und E-Mail eingeben!");
      return;
    }

    // Prüfe ob Customer bereits existiert
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("email", newCustomerEmail)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (existing) {
      toast.error("Kunde mit dieser Email existiert bereits!");
      return;
    }

    const { error } = await supabase.from("customers").insert([{ 
      name: newCustomerName, 
      email: newCustomerEmail,
      organization_id: organizationId 
    }]);

    if (error) {
      console.error("Customer Insert Error:", error);
      if (error.code === '23505' || error.message.includes('duplicate')) {
        toast.error("Kunde existiert bereits!");
      } else {
        toast.error("Fehler beim Erstellen: " + error.message);
      }
      return;
    }

    toast.success("Kunde erfolgreich erstellt!");
    await fetchCustomers();
    setNewCustomerName("");
    setNewCustomerEmail("");
    setShowCreateCustomer(false);
  }

  async function createProduct() {
    if (!newProductName) {
      toast.error("Bitte Produktnamen eingeben!");
      return;
    }

    // Prüfe ob Product bereits existiert
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("name", newProductName)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (existing) {
      toast.error("Produkt mit diesem Namen existiert bereits!");
      return;
    }

    const { error } = await supabase.from("products").insert([{ 
      name: newProductName,
      organization_id: organizationId 
    }]);

    if (error) {
      console.error("Product Insert Error:", error);
      if (error.code === '23505' || error.message.includes('duplicate')) {
        toast.error("Produkt existiert bereits!");
      } else {
        toast.error("Fehler beim Erstellen: " + error.message);
      }
      return;
    }

    toast.success("Produkt erfolgreich erstellt!");
    await fetchProducts();
    setNewProductName("");
    setShowCreateProduct(false);
  }

  async function bulkUpdateStatus(newStatus: string) {
    if (selectedLicenses.length === 0) return;

    const { error } = await supabase.from("licenses").update({ status: newStatus }).in("id", selectedLicenses);

    if (error) {
      toast.error("Fehler beim Aktualisieren!");
      return;
    }

    toast.success(`${selectedLicenses.length} Lizenz(en) aktualisiert!`);
    await fetchLicenses();
    setSelectedLicenses([]);
  }

  async function bulkDelete() {
    if (selectedLicenses.length === 0) return;
    if (!confirm(`${selectedLicenses.length} Lizenz(en) wirklich löschen?`)) return;

    const { error } = await supabase.from("licenses").delete().in("id", selectedLicenses);

    if (error) {
      toast.error("Fehler beim Löschen!");
      return;
    }

    toast.success(`${selectedLicenses.length} Lizenz(en) gelöscht!`);
    await fetchLicenses();
    setSelectedLicenses([]);
  }

  function exportToCSV() {
    const headers = ["Lizenz Key", "Status", "Typ", "Produkt", "Kunde", "Email", "Ablaufdatum"];
    const rows = filteredLicenses.map(l => [
      l.license_key,
      l.status,
      l.type,
      l.product_name,
      l.customer_name,
      l.customer_email,
      l.expires_at || "Keine"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lizenzen_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("CSV Export erfolgreich!");
  }

  function getStatusColor(status: string) {
    if (status === "active") return "text-[#00FF9C]";
    if (status === "expired") return "text-[#FF5C57]";
    if (status === "revoked") return "text-[#FFCD3C]";
    return "text-gray-400";
  }

  function getTypeColor(type: string) {
    if (type === "Trial") return "text-[#00FF9C]";
    if (type === "Subscription") return "text-[#3B82F6]";
    if (type === "Lifetime") return "text-[#A855F7]";
    if (type === "Floating") return "text-[#FFA500]";
    return "text-gray-400";
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex min-h-screen bg-[#0E0E12] text-[#E0E0E0] font-sans">
      {showGlobalSearch && <GlobalSearch />}

      <QuickActions
        onCreateLicense={() => setShowCreateLicense(true)}
        onCreateCustomer={() => setShowCreateCustomer(true)}
        onCreateProduct={() => setShowCreateProduct(true)}
        onOpenSearch={() => setShowGlobalSearch(true)}
      />

      <aside className="w-64 bg-[#1A1A1F] border-r border-[#2C2C34] p-6 flex flex-col gap-4">
        <h2 className="text-2xl font-bold mb-8 gradient-text">CloudLicensePro</h2>
        
        <button 
          onClick={() => navigate("/dashboard")} 
          className="flex items-center gap-2 px-3 py-2 rounded bg-[#2C2C34] text-white hover:bg-[#3C3C44] transition btn-press"
        >
          📊 Dashboard
        </button>
        <button 
          onClick={() => navigate("/analytics")} 
          className="flex items-center gap-2 px-3 py-2 rounded bg-[#2C2C34] text-white hover:bg-[#3C3C44] transition btn-press"
        >
          📈 Analytics
        </button>
        
        <div className="border-t border-[#2C2C34] my-2"></div>
        
        <button 
          onClick={() => setShowCreateLicense(true)} 
          className="flex items-center gap-2 px-3 py-2 rounded bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] transition hover-lift btn-press"
        >
          <FaPlus /> Neue Lizenz
        </button>
        <button 
          onClick={() => setShowCreateCustomer(true)} 
          className="flex items-center gap-2 px-3 py-2 rounded bg-[#3B82F6] text-white hover:bg-[#2563eb] transition btn-press"
        >
          <FaUsers /> Neuer Kunde
        </button>
        <button 
          onClick={() => setShowCreateProduct(true)} 
          className="flex items-center gap-2 px-3 py-2 rounded bg-[#A855F7] text-white hover:bg-[#9333ea] transition btn-press"
        >
          <FaKey /> Neues Produkt
        </button>
        <button 
          onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}
          className="flex items-center gap-2 px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700 mt-auto transition btn-press"
        >
          <FaSignOutAlt /> Logout
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-4xl font-extrabold mb-6 animate-fade-in">📊 Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Gesamt", value: stats.totalLicenses, color: "text-[#00FF9C]" },
            { label: "Aktiv", value: stats.activeLicenses, color: "text-[#00FF9C]" },
            { label: "Abgelaufen", value: stats.expiredLicenses, color: "text-[#FF5C57]" },
            { label: "Widerrufen", value: stats.revokedLicenses, color: "text-[#FFCD3C]" },
            { label: "Kunden", value: stats.totalCustomers, color: "text-[#3B82F6]" },
            { label: "Produkte", value: stats.totalProducts, color: "text-[#A855F7]" }
          ].map((stat, index) => (
            <div 
              key={stat.label}
              className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-4 hover-lift stagger-item"
            >
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Suche..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[#2C2C34] rounded border border-[#3C3C44] focus:border-[#00FF9C] outline-none transition"
                    />
                  </div>
                </div>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-[#2C2C34] rounded border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                >
                  <option value="all">Alle Status</option>
                  <option value="active">Aktiv</option>
                  <option value="expired">Abgelaufen</option>
                  <option value="revoked">Widerrufen</option>
                </select>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="px-4 py-2 bg-[#2C2C34] rounded border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                >
                  <option value="all">Alle Typen</option>
                  <option value="Trial">Trial</option>
                  <option value="Subscription">Subscription</option>
                  <option value="Lifetime">Lifetime</option>
                  <option value="Floating">Floating</option>
                </select>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00FF9C] text-[#0E0E12] rounded hover:bg-[#00cc80] transition btn-press"
                >
                  <FaDownload /> CSV
                </button>
              </div>
            </div>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Lizenzen ({filteredLicenses.length})
              </h2>

              {selectedLicenses.length > 0 && (
                <div className="mb-4 flex gap-2 flex-wrap animate-slide-up">
                  <button onClick={() => bulkUpdateStatus("expired")} className="px-3 py-1 rounded bg-[#FF5C57] text-white hover:bg-[#ff4444] transition btn-press">Auf Expired</button>
                  <button onClick={() => bulkUpdateStatus("active")} className="px-3 py-1 rounded bg-[#00FF9C] text-black hover:bg-[#00cc80] transition btn-press">Auf Active</button>
                  <button onClick={() => setSelectedLicenses([])} className="px-3 py-1 rounded bg-gray-500 text-white hover:bg-gray-600 transition btn-press">Zurücksetzen</button>
                  <button onClick={bulkDelete} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition btn-press">Löschen ({selectedLicenses.length})</button>
                </div>
              )}

              {filteredLicenses.length === 0 ? (
                <NoLicensesState onCreate={() => setShowCreateLicense(true)} />
              ) : (
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                  {filteredLicenses.map((l, index) => {
                    const isSelected = selectedLicenses.includes(l.id);
                    const isExpiringSoon = l.expires_at && new Date(l.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    
                    return (
                      <div 
                        key={l.id} 
                        className={`bg-[#1A1A1F] border rounded-xl p-6 transition cursor-pointer card-hover stagger-item ${
                          isSelected ? "border-[#00FF9C] glow-green" : "border-[#2C2C34]"
                        } ${isExpiringSoon ? "ring-2 ring-[#FFCD3C]" : ""}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                        onClick={() => {
                          if (isSelected) setSelectedLicenses(selectedLicenses.filter(id => id !== l.id));
                          else setSelectedLicenses([...selectedLicenses, l.id]);
                        }}
                      >
                        {isExpiringSoon && (
                          <div className="mb-2 px-2 py-1 bg-[#FFCD3C] text-black text-xs rounded inline-block animate-pulse">
                            ⚠️ Läuft bald ab
                          </div>
                        )}
                        <p className={`font-bold ${getStatusColor(l.status)} mb-2`}>{l.status.toUpperCase()}</p>
                        <p className="text-xl font-semibold mb-1 font-mono">{l.license_key}</p>
                        <p className={`mb-2 ${getTypeColor(l.type)}`}>Typ: {l.type}</p>
                        {l.expires_at && (
                          <p className="text-sm text-gray-400 mb-1">
                            Läuft ab: <span className="text-[#FFCD3C]">{new Date(l.expires_at).toLocaleDateString('de-DE')}</span>
                          </p>
                        )}
                        <p className="text-sm text-gray-400">Produkt: <span className="text-[#E0E0E0]">{l.product_name}</span></p>
                        <p className="text-sm text-gray-400">Kunde: <span className="text-[#E0E0E0]">{l.customer_name}</span></p>
                        <div className="flex gap-2 mt-3">
                          <button 
                            className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-600 transition btn-press"
                            onClick={(e) => { e.stopPropagation(); setSelectedLicense(l); setShowDetail(true); }}
                          >
                            Details
                          </button>
                          <button 
                            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition btn-press"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm("Lizenz löschen?")) return;
                              const { error } = await supabase.from("licenses").delete().eq("id", l.id);
                              if (error) {
                                toast.error("Fehler beim Löschen!");
                                return;
                              }
                              toast.success("Lizenz gelöscht!");
                              await fetchLicenses();
                            }}
                          >
                            Löschen
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            {organizationId && <ActivityFeed organizationId={organizationId} />}

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Kunden ({customers.length})</h3>
              {customers.length === 0 ? (
                <NoCustomersState onCreate={() => setShowCreateCustomer(true)} />
              ) : (
                <div className="space-y-2">
                  {customers.slice(0, 5).map(c => (
                    <div key={c.id} className="p-2 rounded hover:bg-[#2C2C34] transition">
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </div>
                  ))}
                  {customers.length > 5 && (
                    <p className="text-xs text-gray-400 text-center pt-2">
                      +{customers.length - 5} weitere
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Produkte ({products.length})</h3>
              {products.length === 0 ? (
                <NoProductsState onCreate={() => setShowCreateProduct(true)} />
              ) : (
                <div className="space-y-2">
                  {products.map(p => (
                    <div key={p.id} className="p-2 rounded hover:bg-[#2C2C34] transition">
                      <p className="font-semibold text-sm">{p.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {showCreateLicense && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-[#1A1A1F] p-6 rounded-xl w-full max-w-md animate-scale-in">
              <h2 className="text-2xl font-bold mb-4">Neue Lizenz erstellen</h2>
              
              <label className="block mb-2 text-sm">Produkt:</label>
              <select 
                className="w-full mb-4 p-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                value={newLicense.product_id}
                onChange={e => setNewLicense({ ...newLicense, product_id: e.target.value })}
              >
                <option value="">-- wählen --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              <label className="block mb-2 text-sm">Kunde:</label>
              <select 
                className="w-full mb-4 p-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                value={newLicense.customer_id}
                onChange={e => setNewLicense({ ...newLicense, customer_id: e.target.value })}
              >
                <option value="">-- wählen --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>

              <label className="block mb-2 text-sm">Typ:</label>
              <select 
                className="w-full mb-4 p-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                value={newLicense.type}
                onChange={e => setNewLicense({ ...newLicense, type: e.target.value })}
              >
                <option value="Trial">Trial</option>
                <option value="Subscription">Subscription</option>
                <option value="Lifetime">Lifetime</option>
                <option value="Floating">Floating</option>
              </select>

              <label className="block mb-2 text-sm">Ablaufdatum (optional):</label>
              <input
                type="date"
                className="w-full mb-4 p-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                value={newLicense.expires_at}
                onChange={e => setNewLicense({ ...newLicense, expires_at: e.target.value })}
              />

              {newLicense.type === "Floating" && (
                <>
                  <label className="block mb-2 text-sm">Max. Aktivierungen:</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full mb-4 p-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none"
                    value={newLicense.max_activations}
                    onChange={e => setNewLicense({ ...newLicense, max_activations: parseInt(e.target.value) })}
                  />
                </>
              )}

              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setShowCreateLicense(false)} 
                  className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition btn-press"
                >
                  Abbrechen
                </button>
                <button 
                  onClick={createLicense} 
                  className="px-4 py-2 rounded bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] transition btn-press"
                >
                  Erstellen
                </button>
              </div>
            </div>
          </div>
        )}

        {showCreateCustomer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-[#1A1A1F] p-6 rounded-xl w-full max-w-md animate-scale-in">
              <h2 className="text-2xl font-bold mb-4">Neuen Kunden erstellen</h2>
              <input 
                className="w-full mb-4 p-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none" 
                placeholder="Name" 
                value={newCustomerName} 
                onChange={e => setNewCustomerName(e.target.value)} 
              />
              <input 
                type="email"
                className="w-full mb-4 p-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none" 
                placeholder="E-Mail" 
                value={newCustomerEmail} 
                onChange={e => setNewCustomerEmail(e.target.value)} 
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreateCustomer(false)} className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition btn-press">Abbrechen</button>
                <button onClick={createCustomer} className="px-4 py-2 rounded bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] transition btn-press">Erstellen</button>
              </div>
            </div>
          </div>
        )}

        {showCreateProduct && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-[#1A1A1F] p-6 rounded-xl w-full max-w-md animate-scale-in">
              <h2 className="text-2xl font-bold mb-4">Neues Produkt erstellen</h2>
              <input 
                className="w-full mb-4 p-2 rounded bg-[#2C2C34] border border-[#3C3C44] focus:border-[#00FF9C] outline-none" 
                placeholder="Produktname" 
                value={newProductName} 
                onChange={e => setNewProductName(e.target.value)} 
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreateProduct(false)} className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition btn-press">Abbrechen</button>
                <button onClick={createProduct} className="px-4 py-2 rounded bg-[#00FF9C] text-[#0E0E12] hover:bg-[#00cc80] transition btn-press">Erstellen</button>
              </div>
            </div>
          </div>
        )}

        {showDetail && selectedLicense && (
          <LicenseDetail license={selectedLicense} onClose={() => setShowDetail(false)} refresh={fetchLicenses} />
        )}

      </main>
    </div>
  );
}