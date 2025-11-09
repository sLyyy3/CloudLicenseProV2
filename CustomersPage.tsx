// src/pages/CustomersPage.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import { FaUsers } from "react-icons/fa";

type Customer = {
  id: string;
  name: string;
  email: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomers() {
      const { data, error } = await supabase.from("customers").select("id,name,email");
      if (error) console.error(error);
      else setCustomers(data || []);
      setLoading(false);
    }
    fetchCustomers();
  }, []);

  return (
    <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] p-8 font-sans">
      <h1 className="text-4xl font-extrabold mb-6 flex items-center gap-2">
        <FaUsers /> Kunden
      </h1>
      {loading ? (
        <p>Lädt Kunden…</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6 hover:shadow-[0_0_15px_rgba(0,255,156,0.5)] transition-shadow"
            >
              <p className="text-xl font-semibold mb-1">{c.name}</p>
              <p className="text-gray-400 mb-2">{c.email}</p>
              <Link
                to={`/customer/${c.id}`}
                className="inline-block mt-2 px-4 py-2 bg-[#00FF9C] text-[#0E0E12] rounded hover:bg-[#00d68f] transition"
              >
                Ansehen
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
