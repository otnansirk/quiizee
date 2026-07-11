"use client";

import React from "react";
import Link from "next/link";

export interface EditQuizHeaderBannerProps {
  quizId: string;
  questionsCount: number;
  isPublished: boolean;
  isPublishing: boolean;
  isSubmitting: boolean;
  errorMsg: string | null;
  successMsg: string | null;
  onClearError: () => void;
  onClearSuccess: () => void;
  onTogglePublish: () => void;
}

export const EditQuizHeaderBanner: React.FC<EditQuizHeaderBannerProps> = ({
  quizId,
  questionsCount,
  isPublished,
  isPublishing,
  isSubmitting,
  errorMsg,
  successMsg,
  onClearError,
  onClearSuccess,
  onTogglePublish,
}) => {
  return (
    <>
      {/* Back Navigation */}
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <Link
          href="/teacher/quizzes"
          className="btn btn-ghost btn-sm pl-0 text-muted-foreground"
        >
          Back to Quizzes
        </Link>

        <Link
          href={`/teacher/quizzes/${quizId}/questions`}
          className="btn btn-secondary btn-sm font-bold"
        >
          Manage Questions ({questionsCount})
        </Link>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="title text-4xl font-extrabold mb-1 text-foreground">
          Edit Quiz Settings
        </h1>
        <p className="subtitle m-0 max-w-full text-muted-foreground">
          Update assessment parameters, access permissions, and certificates
        </p>
      </div>

      {/* Alert Messages */}
      {errorMsg && (
        <div className="alert alert-error animate-fade-in flex items-center justify-between">
          <span className="flex-1 font-semibold">{errorMsg}</span>
          <button
            onClick={onClearError}
            className="btn btn-ghost btn-sm p-1 min-w-0 text-error font-extrabold"
          >
            X
          </button>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success animate-fade-in flex items-center justify-between">
          <span className="flex-1 font-semibold">{successMsg}</span>
          <button
            onClick={onClearSuccess}
            className="btn btn-ghost btn-sm p-1 min-w-0 text-emerald-400 font-extrabold"
          >
            X
          </button>
        </div>
      )}

      {/* Publication Status Card */}
      <div className="card mb-8 p-6 sm:p-8 text-white !bg-black/80 flex items-center justify-between flex-wrap gap-4 border-2 border-black shadow-[4px_4px_0px_#000]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xl font-bold">
              Publication Status:
            </span>
            <span
              className={`badge m-0 text-xs font-extrabold ${
                isPublished ? "badge-success" : "badge-warning"
              }`}
            >
              {isPublished ? "Published" : "Draft"}
            </span>
          </div>
          <p className="text-sm text-white/70 m-0">
            {isPublished
              ? "This assessment is currently live and accessible to students with the access code."
              : "This assessment is currently hidden from students. Add questions and publish when ready."}
          </p>
        </div>

        <button
          type="button"
          onClick={onTogglePublish}
          disabled={isPublishing || isSubmitting}
          className={`btn font-bold px-6 py-2.5 ${isPublished ? "btn-secondary" : "btn-primary"}`}
        >
          {isPublishing
            ? "Updating..."
            : isPublished
            ? "Unpublish Quiz"
            : "Publish Quiz"}
        </button>
      </div>
    </>
  );
};
