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
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[1050]">
        <div className="modal-content card animate-fade-in w-full max-w-[440px] p-7 text-center bg-secondary border border-error/35 shadow-2xl shadow-error/20">
          <div className="w-12 h-12 rounded-xl bg-error/15 text-error flex items-center justify-center text-lg font-black mx-auto mb-4 border border-error/35">
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
              className="block"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>
          <h3 className="text-xl font-extrabold mb-2 text-foreground">
            Delete Assessment?
          </h3>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            Are you sure you want to permanently delete{" "}
            <strong className="text-foreground">
              &ldquo;{quizToDelete.title}&rdquo;
            </strong>
            ? This action cannot be undone and will permanently remove all associated questions, options, and student attempts.
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="btn btn-secondary flex-1 py-3"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteQuiz}
              disabled={isDeleting}
              className="btn flex-1 py-3 bg-gradient-to-br from-error to-red-600 text-white shadow-md shadow-error/30 font-semibold"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
