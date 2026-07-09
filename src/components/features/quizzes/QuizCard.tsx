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
      className="card card-hover flex flex-col"
      style={{
        borderLeft: isPublished
          ? "4px solid var(--success)"
          : "4px solid var(--warning)",
        padding: "1.75rem",
      }}
    >
      {/* Title & Description */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h3
          className="card-title"
          style={{
            fontSize: "1.3rem",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: "0.5rem",
          }}
          title={quiz.title}
        >
          {quiz.title}
        </h3>
        <p
          className="card-description"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.8rem",
          }}
          title={quiz.description || "No description provided."}
        >
          {quiz.description || "No description provided."}
        </p>
      </div>

      {/* Badges Section */}
      <div
        className="flex"
        style={{ flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}
      >
        {/* Status Badge */}
        <span
          className={`badge ${
            isPublished ? "badge-success" : "badge-warning"
          }`}
          style={{ margin: 0 }}
        >
          {isPublished ? "Published" : "Draft"}
        </span>

        {/* Access Mode Badge */}
        <span
          className="badge badge-info"
          style={{ margin: 0 }}
          title={
            quiz.accessMode === "public"
              ? "Public: Anyone with access code (Name + Email)"
              : "Private: Login Required"
          }
        >
          {quiz.accessMode === "public" ? "Public" : "Private"}
        </span>

        {/* Duration Mode Badge */}
        <span className="badge badge-accent" style={{ margin: 0 }}>
          {quiz.durationMode === "global"
            ? `${globalMins ? `${globalMins} min Global` : "No Limit"}`
            : "Per-Question"}
        </span>

        {/* Certificate Badge */}
        {quiz.certificateEnabled && (
          <span
            className="badge"
            style={{
              margin: 0,
              background: "rgba(168, 85, 247, 0.15)",
              color: "#9143de",
              border: "1px solid rgba(114, 28, 194, 0.822)",
            }}
          >
            Cert ({quiz.certificateMinScore || 70}%)
          </span>
        )}
      </div>

      {/* Access Code Box */}
      <div className="access-code-box">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            ACCESS CODE
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "var(--accent-hover)",
              letterSpacing: "0.12em",
            }}
          >
            {quiz.accessCode}
          </span>
        </div>
        <button
          onClick={() => onCopyCode(quiz.id, quiz.accessCode)}
          className="btn btn-secondary btn-sm"
          style={{
            padding: "0.4rem 0.85rem",
            fontSize: "0.8rem",
            background:
              copiedId === quiz.id ? "rgba(34, 197, 94, 0.2)" : undefined,
            borderColor: copiedId === quiz.id ? "var(--success)" : undefined,
            color: copiedId === quiz.id ? "#43c372" : undefined,
          }}
          title="Copy access code for students"
        >
          {copiedId === quiz.id ? "Copied!" : "Copy Code"}
        </button>
      </div>

      {/* Action Buttons Footer */}
      <div className="card-actions-grid">
        <Link
          href={`/teacher/quizzes/${quiz.id}/attempts`}
          className="btn btn-secondary btn-sm"
          style={{
            width: "100%",
            justifyContent: "center",
            gridColumn: "1 / -1",
            borderColor: "rgba(99, 102, 241, 0.6)",
            background: "rgba(99, 102, 241, 0.18)",
            color: "#000000",
            fontWeight: 700,
            boxShadow: "0 0 15px rgba(99, 102, 241, 0.2)",
          }}
        >
          View Attempts
        </Link>

        <Link
          href={`/teacher/quizzes/${quiz.id}/edit`}
          className="btn btn-secondary btn-sm"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Edit Settings
        </Link>

        <Link
          href={`/teacher/quizzes/${quiz.id}/questions`}
          className="btn btn-secondary btn-sm"
          style={{
            width: "100%",
            justifyContent: "center",
            borderColor: "rgba(99, 102, 241, 0.4)",
            color: "var(--accent-hover)",
            background: "rgba(99, 102, 241, 0.08)",
          }}
        >
          Manage Questions
        </Link>

        <button
          onClick={() => onTogglePublish(quiz)}
          disabled={updatingId === quiz.id}
          className={`btn btn-sm ${
            isPublished ? "btn-secondary" : "btn-primary"
          }`}
          style={{ width: "100%" }}
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
          className="btn btn-secondary btn-sm"
          style={{
            width: "100%",
            borderColor: "rgba(239, 68, 68, 0.79)",
            color: "#e81717",
          }}
        >
          {deletingId === quiz.id ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
};
