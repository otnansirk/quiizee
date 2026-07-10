"use client";

import React from "react";
import { ModalPortal } from "@/components/atoms/ModalPortal";

export interface ScoreFinalizeConfirmModalProps {
  isOpen: boolean;
  runningTotal: number;
  displayMax: number;
  isFinalizing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ScoreFinalizeConfirmModal: React.FC<
  ScoreFinalizeConfirmModalProps
> = ({
  isOpen,
  runningTotal,
  displayMax,
  isFinalizing,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5, 5, 10, 0.8)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          zIndex: 1050,
        }}
      >
        <div
          className="modal-content card animate-fade-in"
          style={{
            width: "100%",
            maxWidth: "440px",
            padding: "1.75rem",
            textAlign: "center",
            background: "var(--bg-secondary)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 45px rgba(16, 185, 129, 0.18)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              fontWeight: 900,
              margin: "0 auto 1rem",
              border: "1px solid rgba(16, 185, 129, 0.35)",
            }}
          >
            ✓
          </div>
          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: 800,
              marginBottom: "0.45rem",
              color: "var(--text-primary)",
            }}
          >
            Finalize Exam Score?
          </h3>
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: "1.25rem",
              fontSize: "0.9rem",
              lineHeight: 1.5,
            }}
          >
            You are about to lock the final grade for this student attempt and make the results available.
          </p>

          <div
            style={{
              padding: "1rem",
              background: "rgba(0, 0, 0, 0.3)",
              borderRadius: "var(--radius-md)",
              marginBottom: "1.5rem",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "0.25rem",
              }}
            >
              FINAL SCORE TO BE AWARDED
            </div>
            <div
              style={{
                fontWeight: 800,
                color: "#10b981",
                fontSize: "1.5rem",
              }}
            >
              {runningTotal} / {displayMax} pts
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
            }}
          >
            <button
              onClick={onClose}
              disabled={isFinalizing}
              className="btn btn-secondary"
              style={{ flex: 1, padding: "0.75rem" }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isFinalizing}
              className="btn"
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.35)",
                fontWeight: 600,
              }}
            >
              {isFinalizing ? "Finalizing..." : "Finalize Now"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
