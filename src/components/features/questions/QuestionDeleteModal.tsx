"use client";

import React, { useState } from "react";
import { QuestionData } from "@/app/(dashboard)/teacher/quizzes/[quizId]/questions/page";
import { ModalPortal } from "@/components/atoms/ModalPortal";

export interface QuestionDeleteModalProps {
  isOpen: boolean;
  questionToDelete: QuestionData | null;
  quizId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export const QuestionDeleteModal: React.FC<QuestionDeleteModalProps> = ({
  isOpen,
  questionToDelete,
  quizId,
  onClose,
  onSuccess,
  onError,
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!questionToDelete) return null;

  const handleDeleteQuestion = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/quizzes/${quizId}/questions/${questionToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as any;
        throw new Error(errData.message || "Failed to delete question");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      onError(err.message || "An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

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
          border: "1px solid rgba(239, 68, 68, 0.3)",
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(239, 68, 68, 0.2)",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "rgba(239, 68, 68, 0.15)",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            fontWeight: 900,
            margin: "0 auto 0.75rem",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          DEL
        </div>
        <h3
          style={{
            fontSize: "1.2rem",
            fontWeight: 800,
            marginBottom: "0.35rem",
            color: "var(--text-primary)",
          }}
        >
          Delete Question?
        </h3>
        <p
          style={{
            color: "var(--text-secondary)",
            marginBottom: "1.25rem",
            fontSize: "0.85rem",
            lineHeight: 1.4,
          }}
        >
          Are you sure you want to delete this question? This action cannot be
          undone and will remove all associated student answers.
        </p>
        <div
          style={{
            padding: "0.85rem",
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: "var(--radius-md)",
            marginBottom: "2rem",
            textAlign: "left",
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
            QUESTION PREVIEW
          </div>
          <div
            style={{
              fontWeight: 600,
              color: "var(--text-primary)",
              fontSize: "0.95rem",
            }}
          >
            {questionToDelete.questionText.length > 80
              ? questionToDelete.questionText.substring(0, 80) + "..."
              : questionToDelete.questionText}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteQuestion}
            disabled={isDeleting}
            className="btn"
            style={{
              flex: 1,
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "#ffffff",
              boxShadow: "0 4px 15px rgba(239, 68, 68, 0.35)",
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
