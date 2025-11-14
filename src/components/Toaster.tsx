// src/components/Toaster.tsx
import { useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from "react-icons/fa";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};

let toastIdCounter = 0;
let addToastCallback: ((toast: Toast) => void) | null = null;

// Global toast functions
export const toast = {
  success: (message: string, duration = 3000) => {
    addToastCallback?.({ id: `toast-${toastIdCounter++}`, type: "success", message, duration });
  },
  error: (message: string, duration = 4000) => {
    addToastCallback?.({ id: `toast-${toastIdCounter++}`, type: "error", message, duration });
  },
  warning: (message: string, duration = 3500) => {
    addToastCallback?.({ id: `toast-${toastIdCounter++}`, type: "warning", message, duration });
  },
  info: (message: string, duration = 3000) => {
    addToastCallback?.({ id: `toast-${toastIdCounter++}`, type: "info", message, duration });
  },
};

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastCallback = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration || 3000);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="text-[#00FF9C]" />;
      case "error":
        return <FaTimesCircle className="text-[#FF5C57]" />;
      case "warning":
        return <FaExclamationTriangle className="text-[#FFCD3C]" />;
      case "info":
        return <FaInfoCircle className="text-[#3B82F6]" />;
    }
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-[#00FF9C]/10 border-[#00FF9C]";
      case "error":
        return "bg-[#FF5C57]/10 border-[#FF5C57]";
      case "warning":
        return "bg-[#FFCD3C]/10 border-[#FFCD3C]";
      case "info":
        return "bg-[#3B82F6]/10 border-[#3B82F6]";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            flex items-center gap-3 px-4 py-3 rounded-lg border
            backdrop-blur-sm shadow-lg
            animate-slide-in-right
            ${getStyles(toast.type)}
          `}
          style={{
            animation: `slideInRight 0.3s ease-out ${index * 0.1}s both`,
          }}
        >
          <div className="text-xl">{getIcon(toast.type)}</div>
          <p className="text-white flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>
      ))}
    </div>
  );
}

// Add to your global CSS (index.css):
/*
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out;
}
*/