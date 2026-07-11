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
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[1050]">
        <div className="modal-content card animate-fade-in w-full max-w-[420px] p-6 text-center bg-secondary border border-error/30 shadow-2xl shadow-error/20">
          <div className="w-11 h-11 rounded-xl bg-error/15 text-error flex items-center justify-center text-base font-black mx-auto mb-3 border border-error/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
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
          <h3 className="text-lg font-extrabold mb-1.5 text-foreground">
            Delete Question?
          </h3>
          <p className="text-muted-foreground mb-5 text-sm leading-relaxed">
            Are you sure you want to delete this question? This action cannot be
            undone and will remove all associated student answers.
          </p>
          <div className="p-3.5 bg-black/30 rounded-xl mb-6 text-left border border-border">
            <div className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wider">
              QUESTION PREVIEW
            </div>
            <div className="font-semibold text-foreground text-sm leading-normal">
              {questionToDelete.questionText.length > 80
                ? questionToDelete.questionText.substring(0, 80) + "..."
                : questionToDelete.questionText}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="btn btn-secondary flex-1 py-2.5"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteQuestion}
              disabled={isDeleting}
              className="btn flex-1 py-2.5 bg-gradient-to-br from-error to-red-600 text-white shadow-md shadow-error/35 font-semibold"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
