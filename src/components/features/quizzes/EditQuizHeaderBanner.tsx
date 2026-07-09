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
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <Link
          href="/teacher/quizzes"
          className="btn btn-ghost btn-sm"
          style={{ paddingLeft: 0, color: "var(--text-secondary)" }}
        >
          Back to Quizzes
        </Link>

        <Link
          href={`/teacher/quizzes/${quizId}/questions`}
          className="btn btn-secondary btn-sm"
          style={{
            borderColor: "rgba(99, 102, 241, 0.4)",
            color: "var(--accent-hover)",
          }}
        >
          Manage Questions ({questionsCount})
        </Link>
      </div>

      {/* Page Title */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          className="title"
          style={{ fontSize: "2.5rem", marginBottom: "0.25rem" }}
        >
          Edit Quiz Settings
        </h1>
        <p className="subtitle" style={{ margin: 0, maxWidth: "100%" }}>
          Update assessment parameters, access permissions, and certificates
        </p>
      </div>

      {/* Alert Messages */}
      {errorMsg && (
        <div className="alert alert-error animate-fade-in">
          <span style={{ flex: 1 }}>{errorMsg}</span>
          <button
            onClick={onClearError}
            className="btn btn-ghost btn-sm"
            style={{ padding: "0.2rem 0.5rem", minWidth: "auto", color: "#e12727" }}
          >
            X
          </button>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success animate-fade-in">
          <span style={{ flex: 1 }}>{successMsg}</span>
          <button
            onClick={onClearSuccess}
            className="btn btn-ghost btn-sm"
            style={{ padding: "0.2rem 0.5rem", minWidth: "auto", color: "#86efac" }}
          >
            X
          </button>
        </div>
      )}

      {/* Publication Status Card */}
      <div
        className="card"
        style={{
          marginBottom: "2rem",
          padding: "1.5rem 2rem",
          color: "#ffffff",
          background: "#222222",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.25rem",
            }}
          >
            <span
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
              }}
            >
              Publication Status:
            </span>
            <span
              className={`badge ${
                isPublished ? "badge-success" : "badge-warning"
              }`}
              style={{ margin: 0, fontSize: "0.8rem" }}
            >
              {isPublished ? "Published" : "Draft"}
            </span>
          </div>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#ffffffb3",
              margin: 0,
            }}
          >
            {isPublished
              ? "This assessment is currently live and accessible to students with the access code."
              : "This assessment is currently hidden from students. Add questions and publish when ready."}
          </p>
        </div>

        <button
          type="button"
          onClick={onTogglePublish}
          disabled={isPublishing || isSubmitting}
          className={`btn ${isPublished ? "btn-secondary" : "btn-primary"}`}
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
