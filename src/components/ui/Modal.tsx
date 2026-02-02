import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) setVisible(true);
    else setTimeout(() => setVisible(false), 300);
  }, [isOpen]);

  if (!visible) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        // REDUCED BLUR: backdrop-blur-[2px] instead of sm/md
        isOpen
          ? "opacity-100 backdrop-blur-[2px]"
          : "opacity-0 backdrop-blur-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div
        className={`relative w-full max-w-lg glass rounded-3xl p-6 shadow-2xl transition-all duration-300 transform border border-border ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-text-main tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-text-main/5 rounded-full transition-colors text-text-muted hover:text-text-main"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
