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
    <div
      className="toast-container"
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-item animate-fade-in"
          style={{
            pointerEvents: "auto",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-primary)",
            border: "2px solid var(--border)",
            boxShadow: "var(--shadow-md)",
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
            color: "var(--text-primary)",
            fontSize: "0.95rem",
            fontWeight: 600,
            maxWidth: "420px",
            minWidth: "280px",
          }}
        >
          <div
            style={{
              padding: "0.25rem 0.65rem",
              borderRadius: "4px",
              background:
                toast.type === "success"
                  ? "var(--success)"
                  : toast.type === "error"
                  ? "var(--error)"
                  : "var(--accent)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              flexShrink: 0,
              border: "1.5px solid var(--border)",
            }}
          >
            {toast.type === "success"
              ? "SUCCESS"
              : toast.type === "error"
              ? "ERROR"
              : "INFO"}
          </div>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
        </div>
      ))}
    </div>,
    document.body
  );
};
