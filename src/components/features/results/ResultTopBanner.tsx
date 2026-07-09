"use client";

import React from "react";

export interface ResultTopBannerProps {
  quizTitle: string;
  studentName: string;
  status: "in_progress" | "submitted" | "graded";
  resultCode: string;
  copied: boolean;
  onCopyCode: () => void;
}

export const ResultTopBanner: React.FC<ResultTopBannerProps> = ({
  quizTitle,
  studentName,
  status,
  resultCode,
  copied,
  onCopyCode,
}) => {
  return (
    <div
      className="card results-banner-card"
      style={{
        padding: "clamp(0.75rem, 3vw, 2rem)",
        marginBottom: "0.85rem",
        position: "relative",
        overflow: "hidden",
        border: "3px solid #000",
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: "absolute",
          top: "-40%",
          right: "-10%",
          width: "350px",
          height: "350px",
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="flex items-center justify-between flex-wrap gap-3"
        style={{ marginBottom: "1.25rem" }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.25rem",
            }}
          >
            Assessment Score Report
          </div>
          <h1
            className="title results-quiz-title"
            style={{ fontSize: "clamp(1rem, 3.5vw, 2rem)", marginBottom: "0.25rem" }}
          >
            {quizTitle}
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              Student:
            </span>{" "}
            {studentName}
          </p>
        </div>

        {/* Status Badge */}
        <div style={{ alignSelf: "flex-start" }}>
          {status === "graded" ? (
            <div
              className="badge badge-success"
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.78rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 0 20px rgba(34, 197, 94, 0.25)",
              }}
            >
              Completed
            </div>
          ) : (
            <div
              className="badge badge-warning"
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.78rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 0 20px rgba(245, 158, 11, 0.25)",
              }}
            >
              Pending Review
            </div>
          )}
        </div>
      </div>

      {/* Note for Submitted / Pending Review */}
      {status === "submitted" && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "0.65rem 0.85rem",
            marginBottom: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "#806e16",
            fontSize: "0.9rem",
            lineHeight: 1.5,
          }}
        >
          <div>
            Your multiple choice questions have been auto-scored. Your final
            score will appear after your teacher reviews your essay responses.
          </div>
        </div>
      )}

      {/* Result Code Box */}
      <div
        style={{
          background: "rgba(10, 10, 15, 0.8)",
          border: "1px dashed rgba(99, 102, 241, 0.5)",
          borderRadius: "var(--radius-md)",
          padding: "0.85rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div
            className="flex items-center gap-2"
            style={{ minWidth: 0, flex: 1 }}
          >
            <code
              style={{
                fontFamily: "monospace, var(--font-inter)",
                fontSize: "clamp(0.9rem, 3vw, 1.2rem)",
                fontWeight: 800,
                color: "#FFF",
                letterSpacing: "0.08em",
                background: "rgba(255, 255, 255, 0.15)",
                padding: "0.2rem 0.5rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "160px",
                display: "inline-block",
              }}
            >
              {resultCode}
            </code>
          </div>

          <button
            onClick={onCopyCode}
            type="button"
            className={`btn btn-sm ${copied ? "btn-primary" : "btn-secondary"}`}
            style={{
              flexShrink: 0,
              transition: "all var(--transition-fast)",
              fontWeight: 600,
            }}
          >
            {copied ? "Copied!" : "Copy Code"}
          </button>
        </div>

        <div
          style={{
            fontSize: "0.825rem",
            color: "#ffffff94",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <span>
            Save this unique code! You can use it anytime on the home page to
            revisit your detailed score report or download your certificate.
          </span>
        </div>
      </div>
    </div>
  );
};
