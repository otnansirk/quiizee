"use client";

import React, { useState } from "react";
import { QuizItem } from "./QuizCard";
import { ModalPortal } from "@/components/atoms/ModalPortal";

export interface QuizDeleteModalProps {
  isOpen: boolean;
  quizToDelete: QuizItem | null;
  onClose: () => void;
  onSuccess: (deletedQuiz: QuizItem) => void;
  onError: (msg: string) => void;
}

export const QuizDeleteModal: React.FC<QuizDeleteModalProps> = ({
  isOpen,
  quizToDelete,
  onClose,
  onSuccess,
  onError,
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!quizToDelete) return null;

  const handleDeleteQuiz = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/quizzes/${quizToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as any;
        throw new Error(
          errData.error || errData.message || "Failed to delete quiz"
        );
      }

      onSuccess(quizToDelete);
      onClose();
    } catch (err: any) {
      onError(err.message || "An error occurred while deleting the quiz");
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
          className="modal-content card animate-fade-in"
          style={{
            width: "100%",
            maxWidth: "440px",
            padding: "1.75rem",
            textAlign: "center",
            background: "var(--bg-secondary)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 45px rgba(239, 68, 68, 0.22)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              fontWeight: 900,
              margin: "0 auto 1rem",
              border: "1px solid rgba(239, 68, 68, 0.35)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: "block" }}
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>
          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: 800,
              marginBottom: "0.45rem",
              color: "var(--text-primary)",
            }}
          >
            Delete Assessment?
          </h3>
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: "1.5rem",
              fontSize: "0.9rem",
              lineHeight: 1.5,
            }}
          >
            Are you sure you want to permanently delete{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              &ldquo;{quizToDelete.title}&rdquo;
            </strong>
            ? This action cannot be undone and will permanently remove all associated questions, options, and student attempts.
          </p>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
            }}
          >
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="btn btn-secondary"
              style={{ flex: 1, padding: "0.75rem" }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteQuiz}
              disabled={isDeleting}
              className="btn"
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "#ffffff",
                boxShadow: "0 4px 15px rgba(239, 68, 68, 0.35)",
                fontWeight: 600,
              }}
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
