"use client";

import React from "react";
import { ModalPortal } from "@/components/atoms/ModalPortal";

export interface PublishValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestionNow: () => void;
}

export const PublishValidationModal: React.FC<PublishValidationModalProps> = ({
  isOpen,
  onClose,
  onAddQuestionNow,
}) => {

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
        className="modal-content card"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "1.5rem",
          textAlign: "center",
          background: "var(--bg-secondary)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(245, 158, 11, 0.2)",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "rgba(245, 158, 11, 0.15)",
            color: "#fbbf24",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            fontWeight: 900,
            margin: "0 auto 0.75rem",
            border: "1px solid rgba(245, 158, 11, 0.3)",
          }}
        >
          !
        </div>
        <h3
          style={{
            fontSize: "1.2rem",
            fontWeight: 800,
            marginBottom: "0.35rem",
            color: "var(--text-primary)",
          }}
        >
          Cannot Publish Quiz
        </h3>
        <p
          style={{
            color: "var(--text-secondary)",
            marginBottom: "1.25rem",
            fontSize: "0.85rem",
            lineHeight: 1.4,
          }}
        >
          You must add at least <strong>1 question</strong> before publishing this
          quiz. Students cannot take an empty assessment!
        </p>
        <button
          onClick={() => {
            onClose();
            onAddQuestionNow();
          }}
          className="btn btn-primary btn-block"
          style={{ padding: "0.85rem" }}
        >
          Add Question Now
        </button>
      </div>
    </div>
    </ModalPortal>
  );
};
