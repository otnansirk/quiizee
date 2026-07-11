"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastStackProps {
  toasts: ToastMessage[];
}

export const ToastStack: React.FC<ToastStackProps> = ({ toasts }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !toasts || toasts.length === 0) return null;

  return createPortal(
    <div className="toast-container fixed bottom-8 right-8 flex flex-col gap-3 z-[9999] pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-item animate-fade-in pointer-events-auto px-5 py-4 rounded-xl bg-background border-2 border-border shadow-md flex items-center gap-3.5 text-foreground text-sm font-semibold max-w-[420px] min-w-[280px]"
        >
          <div
            className={`py-1 px-2.5 rounded text-white font-extrabold text-xs uppercase tracking-wider flex-shrink-0 border-2 border-border ${
              toast.type === "success"
                ? "bg-success"
                : toast.type === "error"
                ? "bg-error"
                : "bg-accent"
            }`}
          >
            {toast.type === "success"
              ? "SUCCESS"
              : toast.type === "error"
              ? "ERROR"
              : "INFO"}
          </div>
          <span className="flex-1 leading-relaxed">{toast.message}</span>
        </div>
      ))}
    </div>,
    document.body
  );
};
