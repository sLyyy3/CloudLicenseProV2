// src/pages/ResellerSales.tsx - FIXED LAYOUT - KEINE OVERLAPS!
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaCopy,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaTimes,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";

type TransactionRecord = {
  id: string;
  reseller_id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  license_keys: string[];
  quantity: number;
  amount: number;
  transaction_type: string;
  status: string;
  created_at: string;
};

type ProductInventory = {
  id: string;
  reseller_id: string;
  developer_id: string;
  product_id: string;
  purchase_price: number;
  resale_price: number;
  quantity_purchased: number;
  quantity_available: number;
  quantity_sold: number;
  developer_name?: string;
  product_name?: string;
  created_at: string;
  updated_at: string;
};

type SalesStats = {
  total_sales: number;
  total_revenue: number;
  average_sale: number;
  keys_distributed: number;
};

export default function ResellerSales() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<ProductInventory[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    total_sales: 0,
    total_revenue: 0,
    average_sale: 0,
    keys_distributed: 0,
  });

  const [selectedProduct, setSelectedProduct] = useState<ProductInventory | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [quantity, setQuantity] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [viewingKeys, setViewingKeys] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate("/login");
        return;
      }
      setUser(user);
    };
    loadUser();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: productsData, error: productsError } = await supabase
        .from("reseller_products")
        .select("*")
        .eq("reseller_id", user.id)
        .gt("quantity_available", 0);

      if (productsError) throw productsError;

      const developerIds = [...new Set(productsData?.map((p: any) => p.developer_id) || [])];
      let developerMap = new Map();
      if (developerIds.length > 0) {
        const { data: developersData } = await supabase
          .from("developers")
          .select("id, name")
          .in("id", developerIds);
        developerMap = new Map(developersData?.map((d: any) => [d.id, d.name]) || []);
      }

      const productIds = [...new Set(productsData?.map((p: any) => p.product_id) || [])];
      let productMap = new Map();
      if (productIds.length > 0) {
        const { data: productsDetailsData } = await supabase
          .from("products")
          .select("id, name")
          .in("id", productIds);
        productMap = new Map(productsDetailsData?.map((p: any) => [p.id, p.name]) || []);
      }

      const formattedInventory = (productsData || []).map((item: any) => ({
        ...item,
        developer_name: developerMap.get(item.developer_id) || "Developer",
        product_name: productMap.get(item.product_id) || "Produkt",
      }));

      setInventory(formattedInventory);

      const { data: transactionsData, error: transError } = await supabase
        .from("reseller_transactions")
        .select("*")
        .eq("reseller_id", user.id)
        .eq("transaction_type", "sale")
        .order("created_at", { ascending: false });

      if (transError) throw transError;

      const formattedTransactions = (transactionsData || []) as TransactionRecord[];
      setTransactions(formattedTransactions);

      const totalSales = formattedTransactions.length;
      const totalRevenue = formattedTransactions.reduce((sum, trans) => sum + Number(trans.amount), 0);
      const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
      const keysDistributed = formattedTransactions.reduce((sum, trans) => sum + trans.quantity, 0);

      setStats({
        total_sales: totalSales,
        total_revenue: totalRevenue,
        average_sale: averageSale,
        keys_distributed: keysDistributed,
      });

      setMessage(null);
    } catch (error) {
      console.error("Error loading data:", error);
      setMessage({ type: "error", text: "Fehler beim Laden der Daten" });
    } finally {
      setLoading(false);
    }
  };

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct || !customerName || !customerEmail || !quantity) {
      setMessage({ type: "error", text: "Bitte alle Felder ausfüllen" });
      return;
    }

    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0 || quantityNum > selectedProduct.quantity_available) {
      setMessage({
        type: "error",
        text: `Ungültige Menge. Verfügbar: ${selectedProduct.quantity_available}`,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const licenseKeys = Array.from({ length: quantityNum }, () => generateLicenseKey());
      const totalPrice = quantityNum * selectedProduct.resale_price;

      const { error: transError } = await supabase
        .from("reseller_transactions")
        .insert({
          reseller_id: user.id,
          product_id: selectedProduct.product_id,
          customer_name: customerName,
          customer_email: customerEmail,
          license_keys: licenseKeys,
          quantity: quantityNum,
          amount: totalPrice,
          transaction_type: "sale",
          status: "completed",
          created_at: new Date().toISOString(),
        });

      if (transError) throw transError;

      const { error: updateError } = await supabase
        .from("reseller_products")
        .update({
          quantity_available: selectedProduct.quantity_available - quantityNum,
          quantity_sold: selectedProduct.quantity_sold + quantityNum,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedProduct.id);

      if (updateError) throw updateError;

      setCustomerName("");
      setCustomerEmail("");
      setQuantity("");
      setSelectedProduct(null);
      setShowForm(false);
      setMessage({
        type: "success",
        text: `✅ ${quantityNum} Key(s) erfolgreich an ${customerName} verteilt!`,
      });

      await loadData();
    } catch (error) {
      console.error("Error processing sale:", error);
      setMessage({ type: "error", text: "Fehler beim Speichern des Verkaufs" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateLicenseKey = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";
    for (let i = 0; i < 24; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
      if ((i + 1) % 6 === 0 && i !== 23) key += "-";
    }
    return key;
  };

  const deleteTransaction = async (transId: string, restoreQuantity: number) => {
    if (!window.confirm("Verkauf wirklich löschen?")) return;

    try {
      const transaction = transactions.find((t) => t.id === transId);
      if (!transaction) return;

      const product = inventory.find((inv) => inv.product_id === transaction.product_id);

      if (product) {
        await supabase
          .from("reseller_products")
          .update({
            quantity_available: product.quantity_available + restoreQuantity,
            quantity_sold: Math.max(0, product.quantity_sold - restoreQuantity),
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);
      }

      const { error } = await supabase.from("reseller_transactions").delete().eq("id", transId);
      if (error) throw error;

      setMessage({ type: "success", text: "✅ Verkauf gelöscht" });
      await loadData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setMessage({ type: "error", text: "Fehler beim Löschen" });
    }
  };

  const copyTransactionKeys = (keys: string[]) => {
    navigator.clipboard.writeText(keys.join("\n"));
    setMessage({ type: "success", text: "✅ Keys kopiert!" });
  };

  const filteredTransactions = transactions
    .filter((trans) => {
      const matchesSearch =
        trans.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trans.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "price-desc":
          return Number(b.amount) - Number(a.amount);
        case "quantity-desc":
          return b.quantity - a.quantity;
        default:
          return 0;
      }
    });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  if (loading) {
    return (
      <div className="fixed inset-0 ml-64 flex items-center justify-center bg-[#0F0F14]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00FF9C]"></div>
      </div>
    );
  }

  return (
    <div className="flex w-screen h-screen bg-[#0F0F14] overflow-hidden">
      {/* Sidebar - Fixed */}
      <Sidebar />

      {/* Main Content - Fixed Layout */}
      <main className="ml-64 w-[calc(100vw-16rem)] h-screen overflow-y-auto">
        <div className="p-8 w-full">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#00FF9C]">🔑 Key Verteilung</h1>
              <p className="text-[#a0a0a8] mt-2">Verteile deine Lizenzschlüssel an Kunden</p>
            </div>
            <button
              onClick={() => navigate("/reseller-dashboard")}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a24] hover:bg-[#2a2a34] text-white rounded-lg transition border border-[#2a2a34]"
            >
              <FaArrowLeft /> Zurück
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-[#1a3a33] text-[#00FF9C] border border-[#00FF9C]/50"
                  : "bg-[#3a1a1a] text-[#ff6b6b] border border-[#ff6b6b]/50"
              }`}
            >
              {message.type === "success" ? (
                <FaCheckCircle className="text-2xl flex-shrink-0" />
              ) : (
                <FaExclamationTriangle className="text-2xl flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { title: "Gesamt Keys", value: stats.keys_distributed, icon: "🔑", color: "#00FF9C" },
              { title: "Aktiv", value: stats.total_sales, icon: "✅", color: "#00FF9C" },
              { title: "Umsatz", value: `€${stats.total_revenue.toFixed(2)}`, icon: "💰", color: "#FFD700" },
              { title: "Ø Verkauf", value: `€${stats.average_sale.toFixed(2)}`, icon: "📊", color: "#00D9FF" },
            ].map((stat) => (
              <div
                key={stat.title}
                className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-6 hover:border-[#00FF9C]/30 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#a0a0a8] text-sm">{stat.title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <span className="text-4xl">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-1">
              <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-6">
                <h2 className="text-xl font-bold text-[#00FF9C] mb-6">➕ Neuer Verkauf</h2>

                {showForm ? (
                  <form onSubmit={handleSale} className="space-y-4">
                    <div>
                      <label className="block text-white font-semibold mb-2 text-sm">Produkt *</label>
                      <select
                        value={selectedProduct?.id || ""}
                        onChange={(e) => {
                          const prod = inventory.find((p) => p.id === e.target.value);
                          setSelectedProduct(prod || null);
                        }}
                        className="w-full bg-[#0F0F14] text-white px-4 py-2 rounded-lg border border-[#2a2a34] focus:border-[#00FF9C] focus:outline-none text-sm"
                        required
                      >
                        <option value="">-- Auswählen --</option>
                        {inventory.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.product_name} • €{item.resale_price.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-2 text-sm">Name *</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Max Mustermann"
                        className="w-full bg-[#0F0F14] text-white px-4 py-2 rounded-lg border border-[#2a2a34] focus:border-[#00FF9C] focus:outline-none text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-2 text-sm">Email *</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="max@example.com"
                        className="w-full bg-[#0F0F14] text-white px-4 py-2 rounded-lg border border-[#2a2a34] focus:border-[#00FF9C] focus:outline-none text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-2 text-sm">Anzahl *</label>
                      <input
                        type="number"
                        min="1"
                        max={selectedProduct?.quantity_available || 1}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="5"
                        className="w-full bg-[#0F0F14] text-white px-4 py-2 rounded-lg border border-[#2a2a34] focus:border-[#00FF9C] focus:outline-none text-sm"
                        required
                      />
                    </div>

                    {quantity && selectedProduct && (
                      <div className="bg-[#0F0F14] border border-[#00FF9C]/30 rounded-lg p-3">
                        <p className="text-[#00FF9C] text-xs uppercase font-semibold mb-2">Berechnung</p>
                        <p className="text-white text-lg font-bold">
                          €{(parseInt(quantity) * selectedProduct.resale_price).toFixed(2)}
                        </p>
                        <p className="text-[#00FF9C] text-xs mt-1">
                          Gewinn: €{(parseInt(quantity) * (selectedProduct.resale_price - selectedProduct.purchase_price)).toFixed(2)}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedProduct}
                      className="w-full bg-[#00FF9C] hover:bg-[#00E88A] disabled:bg-[#555] text-[#0F0F14] font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 text-sm"
                    >
                      {isSubmitting ? "Wird gespeichert..." : "🚀 Keys verteilen"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setCustomerName("");
                        setCustomerEmail("");
                        setQuantity("");
                        setSelectedProduct(null);
                      }}
                      className="w-full bg-[#1a1a24] hover:bg-[#2a2a34] text-white py-2 px-4 rounded-lg transition border border-[#2a2a34]"
                    >
                      Abbrechen
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-[#00FF9C] hover:bg-[#00E88A] text-[#0F0F14] font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <FaPlus /> Neuer Verkauf
                  </button>
                )}
              </div>
            </div>

            {/* Transactions */}
            <div className="lg:col-span-2">
              <div className="mb-6 flex gap-4">
                <input
                  type="text"
                  placeholder="Suche nach Kunde..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-1 bg-[#1a1a24] text-white px-4 py-2 rounded-lg border border-[#2a2a34] focus:border-[#00FF9C] focus:outline-none text-sm"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#1a1a24] text-white px-4 py-2 rounded-lg border border-[#2a2a34] focus:border-[#00FF9C] focus:outline-none text-sm"
                >
                  <option value="date-desc">Neueste</option>
                  <option value="price-desc">Höchster Preis</option>
                  <option value="quantity-desc">Meiste Keys</option>
                </select>
              </div>

              {paginatedTransactions.length > 0 ? (
                <div className="space-y-4">
                  {paginatedTransactions.map((trans) => (
                    <div
                      key={trans.id}
                      className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-4 hover:border-[#00FF9C]/30 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold">{trans.customer_name}</p>
                          <p className="text-[#a0a0a8] text-sm">{trans.customer_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#00FF9C]">€{Number(trans.amount).toFixed(2)}</p>
                          <p className="text-[#a0a0a8] text-xs">
                            {new Date(trans.created_at).toLocaleDateString("de-DE")}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-between">
                        <span className="bg-[#0F0F14] px-3 py-1 rounded text-xs text-[#a0a0a8] border border-[#2a2a34]">
                          {trans.quantity} Keys
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewingKeys(trans.id)}
                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 font-bold"
                          >
                            <FaEye /> Keys anzeigen
                          </button>
                          <button
                            onClick={() => copyTransactionKeys(trans.license_keys)}
                            className="text-[#00FF9C] hover:text-[#00E88A] text-sm flex items-center gap-1"
                          >
                            <FaCopy /> Kopieren
                          </button>
                          <button
                            onClick={() => deleteTransaction(trans.id, trans.quantity)}
                            className="text-[#ff6b6b] hover:text-[#ff5555] text-sm"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded text-sm ${
                            currentPage === page
                              ? "bg-[#00FF9C] text-[#0F0F14] font-bold"
                              : "bg-[#1a1a24] text-[#a0a0a8] hover:bg-[#2a2a34] border border-[#2a2a34]"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-[#1a1a24] border border-[#2a2a34] rounded-lg">
                  <p className="text-[#a0a0a8]">Keine Transaktionen vorhanden</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* VIEW KEYS MODAL */}
      {viewingKeys && (() => {
        const trans = transactions.find(t => t.id === viewingKeys);
        if (!trans) return null;

        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setViewingKeys(null)}>
            <div className="bg-[#1a1a24] border border-[#2a2a34] rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#00FF9C] flex items-center gap-2">
                    <FaEye /> Verteilte Keys
                  </h2>
                  <p className="text-sm text-[#a0a0a8] mt-1">
                    Kunde: {trans.customer_name} ({trans.customer_email})
                  </p>
                </div>
                <button
                  onClick={() => setViewingKeys(null)}
                  className="p-2 hover:bg-[#2a2a34] rounded-lg transition"
                >
                  <FaTimes className="text-xl text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Transaction Info */}
              <div className="bg-[#0F0F14] border border-[#2a2a34] rounded-lg p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-[#a0a0a8]">Anzahl Keys</p>
                    <p className="text-white font-bold text-lg">{trans.quantity}</p>
                  </div>
                  <div>
                    <p className="text-[#a0a0a8]">Betrag</p>
                    <p className="text-[#00FF9C] font-bold text-lg">€{Number(trans.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[#a0a0a8]">Datum</p>
                    <p className="text-white font-bold">{new Date(trans.created_at).toLocaleDateString("de-DE")}</p>
                  </div>
                </div>
              </div>

              {/* Keys List */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">🔑 Lizenzschlüssel</h3>
                  <button
                    onClick={() => {
                      copyTransactionKeys(trans.license_keys);
                      setMessage({ type: "success", text: "✅ Alle Keys kopiert!" });
                    }}
                    className="px-3 py-1 bg-[#00FF9C] text-[#0F0F14] rounded font-bold text-sm hover:bg-[#00E88A] transition flex items-center gap-2"
                  >
                    <FaCopy /> Alle kopieren
                  </button>
                </div>

                {trans.license_keys.map((key, index) => (
                  <div key={index} className="bg-[#0F0F14] border border-[#2a2a34] rounded-lg p-3 flex items-center justify-between group hover:border-[#00FF9C]/30 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-[#00FF9C] font-bold text-sm">#{index + 1}</span>
                      <code className="text-white font-mono text-sm bg-[#1a1a24] px-3 py-1 rounded">{key}</code>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(key);
                        setMessage({ type: "success", text: `✅ Key #${index + 1} kopiert!` });
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[#00FF9C] hover:text-[#00E88A] transition"
                    >
                      <FaCopy />
                    </button>
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setViewingKeys(null)}
                className="w-full py-3 bg-[#2a2a34] hover:bg-[#3a3a44] text-white rounded-lg font-bold transition"
              >
                Schließen
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}