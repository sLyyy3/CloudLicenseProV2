// src/utils/helpers.ts - EINFACH KOPIEREN & EINFÜGEN!
import { useState, useCallback } from "react";
import { FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";

// ============================================================
// 1️⃣ EXPIRATION BADGE COMPONENT
// ============================================================
interface ExpirationBadgeProps {
  expiresAt?: string;
  status: string;
}

export function ExpirationBadge({ expiresAt, status }: ExpirationBadgeProps) {
  if (!expiresAt || status !== "active") return null;

  const expiryDate = new Date(expiresAt);
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    return (
      <span className="bg-red-600/20 text-red-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
        <FaExclamationTriangle /> Abgelaufen
      </span>
    );
  }

  if (daysUntilExpiry <= 7) {
    return (
      <span className="bg-orange-600/20 text-orange-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
        <FaExclamationTriangle /> {daysUntilExpiry} Tage verbleibend
      </span>
    );
  }

  if (daysUntilExpiry <= 30) {
    return (
      <span className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
        🔔 {daysUntilExpiry} Tage verbleibend
      </span>
    );
  }

  return (
    <span className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
      <FaCheckCircle /> Gültig
    </span>
  );
}

// ============================================================
// 2️⃣ STATUS BADGE COMPONENT
// ============================================================
interface StatusBadgeProps {
  status: "active" | "inactive" | "expired" | "revoked";
}

const statusConfig = {
  active: {
    bg: "bg-green-600/20",
    text: "text-green-400",
    icon: "✅",
    label: "Active",
  },
  inactive: {
    bg: "bg-gray-600/20",
    text: "text-gray-400",
    icon: "⏸️",
    label: "Inactive",
  },
  expired: {
    bg: "bg-red-600/20",
    text: "text-red-400",
    icon: "❌",
    label: "Expired",
  },
  revoked: {
    bg: "bg-red-800/20",
    text: "text-red-300",
    icon: "🚫",
    label: "Revoked",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-semibold`}>
      {config.icon} {config.label}
    </span>
  );
}

// ============================================================
// 3️⃣ COPY TO CLIPBOARD
// ============================================================
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
}

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return { copy, copied };
}

// ============================================================
// 4️⃣ LICENSE KEY GENERATOR
// ============================================================
export interface KeyGeneratorOptions {
  productName?: string;
  customerName?: string;
  includeDate?: boolean;
}

export function generateLicenseKey(options: KeyGeneratorOptions = {}): string {
  const {
    productName = "PROD",
    customerName = "CUST",
    includeDate = true,
  } = options;

  const productPrefix = productName.substring(0, 4).toUpperCase().padEnd(4, "X");
  const customerPrefix = customerName.substring(0, 4).toUpperCase().padEnd(4, "Y");
  const randomHex = Math.random().toString(16).substring(2, 10).toUpperCase();
  const timestamp = includeDate ? Date.now().toString(36).substring(0, 4).toUpperCase() : "";

  return `${productPrefix}-${customerPrefix}-${randomHex}-${timestamp}`.toUpperCase();
}

// ============================================================
// 5️⃣ ADVANCED FILTER
// ============================================================
export interface FilterOption {
  status?: "active" | "inactive" | "expired" | "revoked";
  type?: "single" | "floating" | "concurrent";
  productId?: string;
  customerId?: string;
  searchQuery?: string;
  expiringsoon?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export function useAdvancedFilter<T extends Record<string, any>>(items: T[]) {
  const [filters, setFilters] = useState<FilterOption>({});

  const filtered = useCallback(() => {
    return items.filter((item) => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.type && item.type !== filters.type) return false;
      if (filters.productId && item.product_id !== filters.productId) return false;
      if (filters.customerId && item.customer_id !== filters.customerId) return false;

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchFields = [
          item.license_key,
          item.product_name,
          item.customer_name,
          item.customer_email,
        ].join(" ");
        if (!searchFields.toLowerCase().includes(query)) return false;
      }

      if (filters.expiringsoon && item.expires_at) {
        const expiryDate = new Date(item.expires_at);
        const daysUntil = Math.ceil(
          (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntil > 30 || daysUntil < 0) return false;
      }

      if (filters.dateFrom && item.created_at < filters.dateFrom) return false;
      if (filters.dateTo && item.created_at > filters.dateTo) return false;

      return true;
    });
  }, [items, filters]);

  return { filters, setFilters, filtered: filtered() };
}

// ============================================================
// 6️⃣ PAGINATION
// ============================================================
export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

// ============================================================
// 7️⃣ DATE FORMATTING
// ============================================================
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDaysUntilExpiry(expiryDate: string | Date): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(expiryDate: string | Date, days: number = 30): boolean {
  return getDaysUntilExpiry(expiryDate) <= days && getDaysUntilExpiry(expiryDate) > 0;
}

export function isExpired(expiryDate: string | Date): boolean {
  return getDaysUntilExpiry(expiryDate) < 0;
}

// ============================================================
// 8️⃣ CSV EXPORT
// ============================================================
export function exportToCSV(
  data: Record<string, any>[],
  filename: string = "export.csv"
) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================
// 9️⃣ VALIDATION
// ============================================================
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateLicenseKey(key: string): boolean {
  const keyRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{8}-[A-Z0-9]{4}$/;
  return keyRegex.test(key);
}