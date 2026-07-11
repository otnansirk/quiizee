"use client";

import React from "react";
import Link from "next/link";

export interface QuizItem {
  id: string;
  title: string;
  description: string | null;
  accessCode: string;
  accessMode: "public" | "private";
  durationMode: "global" | "per_question";
  globalDuration: number | null; // in seconds
  maxAttempts: number;
  certificateEnabled: boolean;
  certificateMinScore: number | null;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
  questionsCount?: number;
  questions?: any[];
}

export interface QuizCardProps {
  quiz: QuizItem;
  copiedId: string | null;
  updatingId: string | null;
  deletingId: string | null;
  onCopyCode: (id: string, code: string) => void;
  onTogglePublish: (quiz: QuizItem) => void;
  onDelete: (quiz: QuizItem) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  copiedId,
  updatingId,
  deletingId,
  onCopyCode,
  onTogglePublish,
  onDelete,
}) => {
  const globalMins = quiz.globalDuration
    ? Math.round(quiz.globalDuration / 60)
    : null;
  const isPublished = quiz.isPublished;

  return (
    <div
      className={`card card-hover flex flex-col p-7 border-l-4`}
    >
      {/* Title & Description */}
      <div className="mb-">
        <h3
          className="card-title text-xl line-clamp-1 mb-2 font-extrabold text-foreground"
          title={quiz.title}
        >
          {quiz.title}
        </h3>
        <p
          className="card-description text-muted-foreground line-clamp-2 min-h-[2.8rem] text-sm font-medium"
          title={quiz.description || "No description provided."}
        >
          {quiz.description || "No description provided."}
        </p>
      </div>

      {/* Badges Section */}
      <div className="flex flex-wrap gap-1">
        {/* Status Badge */}
        <span
          className={`badge m-0 ${
            isPublished ? "badge-success" : "badge-warning"
          }`}
        >
          {isPublished ? "Published" : "Draft"}
        </span>

        {/* Access Mode Badge */}
        <span
          className="badge badge-info m-0"
          title={
            quiz.accessMode === "public"
              ? "Public: Anyone with access code (Name + Email)"
              : "Private: Login Required"
          }
        >
          {quiz.accessMode === "public" ? "Public" : "Private"}
        </span>

        {/* Duration Mode Badge */}
        <span className="badge badge-accent m-0">
          {quiz.durationMode === "global"
            ? `${globalMins ? `${globalMins} min Global` : "No Limit"}`
            : "Per-Question"}
        </span>

        {/* Certificate Badge */}
        {quiz.certificateEnabled && (
          <span className="badge m-0 bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-600/80">
            Cert ({quiz.certificateMinScore || 70}%)
          </span>
        )}
      </div>

      {/* Access Code Box */}
      <div className="access-code-box">
        <div className="flex flex-col">
          <span className="text-[0.7rem] text-muted-foreground font-bold tracking-wider uppercase">
            ACCESS CODE
          </span>
          <span className="font-mono text-lg font-extrabold text-accent hover:text-primary tracking-widest">
            {quiz.accessCode}
          </span>
        </div>
        <button
          onClick={() => onCopyCode(quiz.id, quiz.accessCode)}
          className={`btn btn-secondary btn-sm px-3.5 py-1.5 text-xs ${
            copiedId === quiz.id
              ? "bg-emerald-500/20 border-success text-success"
              : ""
          }`}
          title="Copy access code for students"
        >
          {copiedId === quiz.id ? "Copied!" : "Copy Code"}
        </button>
      </div>

      {/* Action Buttons Footer */}
      <div className="flex gap-1 flex-wrap">
        <Link
          href={`/teacher/quizzes/${quiz.id}/attempts`}
          className="btn btn-secondary btn-sm w-full justify-center col-span-full border-indigo-500/60 bg-indigo-500/15 text-foreground font-bold shadow-sm shadow-indigo-500/20 hover:bg-indigo-500/25"
        >
          View Attempts
        </Link>

        <Link
          href={`/teacher/quizzes/${quiz.id}/edit`}
          className="btn btn-secondary btn-sm w-full justify-center"
        >
          Edit Settings
        </Link>

        <Link
          href={`/teacher/quizzes/${quiz.id}/questions`}
          className="btn btn-secondary btn-sm w-full justify-center border-indigo-500/40 text-accent bg-indigo-500/10 hover:bg-indigo-500/20 font-semibold"
        >
          Manage Questions
        </Link>

        <button
          onClick={() => onTogglePublish(quiz)}
          disabled={updatingId === quiz.id}
          className={`btn btn-sm w-full ${
            isPublished ? "btn-secondary" : "btn-primary"
          }`}
        >
          {updatingId === quiz.id
            ? "Updating..."
            : isPublished
            ? "Unpublish"
            : "Publish"}
        </button>

        <button
          onClick={() => onDelete(quiz)}
          disabled={deletingId === quiz.id}
          className="btn btn-danger btn-sm w-full border-error/80 text-error hover:bg-error/10 font-semibold"
        >
          {deletingId === quiz.id ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
};
