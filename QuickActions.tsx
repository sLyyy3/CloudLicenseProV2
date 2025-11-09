// src/components/QuickActions.tsx
import { useEffect, useState } from "react";
import { FaPlus, FaUsers, FaKey, FaBoxes, FaKeyboard, FaTimes } from "react-icons/fa";

type QuickActionsProps = {
  onCreateLicense: () => void;
  onCreateCustomer: () => void;
  onCreateProduct: () => void;
  onOpenSearch: () => void;
};

export default function QuickActions({
  onCreateLicense,
  onCreateCustomer,
  onCreateProduct,
  onOpenSearch,
}: QuickActionsProps) {
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift+? zum Öffnen
      if (e.shiftKey && e.key === "?") {
        e.preventDefault();
        setShowMenu((prev) => !prev);
      }

      // ESC zum Schließen
      if (e.key === "Escape") {
        setShowMenu(false);
      }

      // Quick Actions (wenn Menu nicht offen und nicht in Input)
      if (!showMenu && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        if (e.key === "n") {
          e.preventDefault();
          onCreateLicense();
        }
        if (e.key === "c") {
          e.preventDefault();
          onCreateCustomer();
        }
        if (e.key === "p") {
          e.preventDefault();
          onCreateProduct();
        }
        if (e.key === "/") {
          e.preventDefault();
          onOpenSearch();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showMenu, onCreateLicense, onCreateCustomer, onCreateProduct, onOpenSearch]);

  const shortcuts = [
    { key: "Cmd+K", label: "Suchen", icon: <FaKey />, action: onOpenSearch },
    { key: "N", label: "Neue Lizenz", icon: <FaPlus />, action: onCreateLicense },
    { key: "C", label: "Neuer Kunde", icon: <FaUsers />, action: onCreateCustomer },
    { key: "P", label: "Neues Produkt", icon: <FaBoxes />, action: onCreateProduct },
    { key: "?", label: "Hilfe anzeigen", icon: <FaKeyboard />, action: () => setShowMenu(true) },
  ];

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setShowMenu(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-[#00FF9C] text-[#0E0E12] rounded-full shadow-lg hover:scale-110 transition flex items-center justify-center z-40"
        title="Tastenkombinationen (Shift+?)"
      >
        <FaKeyboard className="text-xl" />
      </button>

      {/* Quick Actions Menu */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl w-full max-w-md shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2C2C34]">
              <div>
                <h3 className="text-xl font-bold">Tastenkombinationen</h3>
                <p className="text-sm text-gray-400">Schneller arbeiten mit Shortcuts</p>
              </div>
              <button
                onClick={() => setShowMenu(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <FaTimes />
              </button>
            </div>

            {/* Shortcuts List */}
            <div className="p-4">
              {shortcuts.map((shortcut, index) => (
                <button
                  key={index}
                  onClick={() => {
                    shortcut.action();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-[#2C2C34] transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-[#00FF9C] text-xl group-hover:scale-110 transition">
                      {shortcut.icon}
                    </div>
                    <span>{shortcut.label}</span>
                  </div>
                  <kbd className="px-3 py-1 bg-[#2C2C34] border border-[#3C3C44] rounded text-sm font-mono group-hover:bg-[#3C3C44] transition">
                    {shortcut.key}
                  </kbd>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#2C2C34] text-sm text-gray-400">
              <p>💡 Tipp: Drücke <kbd className="px-2 py-1 bg-[#2C2C34] rounded text-xs">Shift+?</kbd> um dieses Menu zu öffnen</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}