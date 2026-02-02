import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isDestructive?: boolean;
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  isDestructive = false,
  loading = false,
}: ConfirmModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) setVisible(true);
    else setTimeout(() => setVisible(false), 300);
  }, [isOpen]);

  if (!visible) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[150] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen
          ? "opacity-100 backdrop-blur-[2px]"
          : "opacity-0 backdrop-blur-none"
      }`}
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={!loading ? onClose : undefined}
      />

      <div
        className={`relative w-full max-w-sm glass p-6 rounded-3xl shadow-2xl transition-all duration-300 transform border ${
          // DYNAMIC BORDER & BACKGROUND
          isDestructive
            ? "border-error/30 bg-bg-surface shadow-error/10"
            : "border-border shadow-black/40 bg-bg-surface"
        } ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={`p-4 rounded-full mb-4 border shadow-inner ${
              isDestructive
                ? "bg-error/20 text-error border-error/20"
                : "bg-accent/20 text-accent border-border"
            }`}
          >
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-black text-text-main mb-2 tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-text-muted font-medium mb-6 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={loading}
              className={`flex-1 py-3 rounded-xl font-bold text-sm bg-text-main/5 text-text-muted border border-border hover:bg-text-main/10 hover:text-text-main transition-colors ${
                isDestructive ? "hover:bg-error/10 hover:text-error" : ""
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-3 rounded-xl font-bold text-sm text-text-inverted flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                isDestructive
                  ? "bg-error shadow-error/20 hover:bg-error/90"
                  : "bg-accent shadow-[0_4px_14px_rgb(var(--accent-rgb)/0.3)] hover:brightness-110"
              }`}
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
