// src/components/Dialog.tsx
// Schöne Popup Dialog Komponente

import { ReactNode } from "react";
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from "react-icons/fa";

type DialogType = "success" | "error" | "warning" | "info";

interface DialogProps {
  isOpen: boolean;
  type: DialogType;
  title: string;
  message: string | ReactNode;
  onClose: () => void;
  closeButton?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export function Dialog({
  isOpen,
  type,
  title,
  message,
  onClose,
  closeButton = "OK",
  actionButton,
}: DialogProps) {
  if (!isOpen) return null;

  const iconMap = {
    success: <FaCheckCircle className="text-4xl text-green-400" />,
    error: <FaTimesCircle className="text-4xl text-red-400" />,
    warning: <FaExclamationTriangle className="text-4xl text-yellow-400" />,
    info: <FaInfoCircle className="text-4xl text-blue-400" />,
  };

  const bgColorMap = {
    success: "bg-green-600/10 border-green-600",
    error: "bg-red-600/10 border-red-600",
    warning: "bg-yellow-600/10 border-yellow-600",
    info: "bg-blue-600/10 border-blue-600",
  };

  const titleColorMap = {
    success: "text-green-400",
    error: "text-red-400",
    warning: "text-yellow-400",
    info: "text-blue-400",
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`${bgColorMap[type]} border-2 rounded-xl p-8 w-full max-w-md backdrop-blur`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <FaTimes size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">{iconMap[type]}</div>

        {/* Title */}
        <h2 className={`text-2xl font-bold text-center mb-3 ${titleColorMap[type]}`}>
          {title}
        </h2>

        {/* Message */}
        <div className="text-gray-300 text-center mb-6">
          {typeof message === "string" ? (
            <p>{message}</p>
          ) : (
            message
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {actionButton && (
            <button
              onClick={actionButton.onClick}
              className="flex-1 px-4 py-3 bg-[#00FF9C] text-[#0E0E12] rounded font-bold hover:bg-[#00cc80] transition"
            >
              {actionButton.label}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[#3C3C44] text-white rounded font-bold hover:bg-[#4C4C54] transition"
          >
            {closeButton}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook für einfachere Nutzung
import { useState } from "react";

export function useDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Omit<DialogProps, "isOpen" | "onClose">>({
    type: "info",
    title: "",
    message: "",
  });

  const open = (newConfig: Omit<DialogProps, "isOpen" | "onClose">) => {
    setConfig(newConfig);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  return {
    Dialog: <Dialog {...config} isOpen={isOpen} onClose={close} />,
    open,
    close,
  };
}
