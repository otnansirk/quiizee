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
          className="toast-item"
          style={{
            pointerEvents: "auto",
            padding: "1rem 1.5rem",
            borderRadius: "var(--radius-md)",
            background: "rgba(20, 20, 35, 0.95)",
            backdropFilter: "blur(16px)",
            border: `1px solid ${
              toast.type === "success"
                ? "rgba(34, 197, 94, 0.4)"
                : toast.type === "error"
                ? "rgba(239, 68, 68, 0.4)"
                : "rgba(99, 102, 241, 0.4)"
            }`,
            boxShadow:
              "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.15)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "var(--text-primary)",
            fontSize: "0.95rem",
            fontWeight: 500,
            maxWidth: "400px",
          }}
        >
          <span
            style={{
              fontWeight: 800,
              textTransform: "uppercase",
              fontSize: "0.75rem",
            }}
          >
            {toast.type === "success"
              ? "[SUCCESS]"
              : toast.type === "error"
              ? "[ERROR]"
              : "[INFO]"}
          </span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>,
    document.body
  );
};
