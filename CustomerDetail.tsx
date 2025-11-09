// src/pages/CustomerDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FaArrowLeft, FaUsers, FaKey } from "react-icons/fa";

type Customer = {
  id: string;
  name: string;
  email: string;
  licenses_count: number;
};

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomer() {
      const { data, error } = await supabase
        .from("customers")
        .select(`id, name, email, licenses(id)`)
        .eq("id", id)
        .single();

      if (error) console.error("Error fetching customer:", error);
      else
        setCustomer({
          id: data.id,
          name: data.name,
          email: data.email,
          licenses_count: data.licenses?.length || 0,
        });
      setLoading(false);
    }
    fetchCustomer();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#0E0E12] text-[#E0E0E0] p-8 font-sans">
      <Link
        to="/"
        className="flex items-center gap-2 text-purple-500 hover:text-purple-400 mb-6"
      >
        <FaArrowLeft /> Zurück
      </Link>

      {loading ? (
        <p>Lädt Kunde…</p>
      ) : customer ? (
        <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-2xl p-6 shadow-[0_0_15px_rgba(0,255,156,0.3)]">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
            <FaUsers /> {customer.name}
          </h1>
          <p className="text-gray-400 mb-2">
            Email: <span className="text-[#FFCD3C]">{customer.email}</span>
          </p>
          <p className="text-gray-400">
            Lizenzen: <span className="text-[#00FF9C]">{customer.licenses_count}</span>
          </p>
        </div>
      ) : (
        <p>Kunde nicht gefunden.</p>
      )}
    </div>
  );
}
