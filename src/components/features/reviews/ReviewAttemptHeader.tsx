"use client";

import React from "react";
import Link from "next/link";

export interface ReviewAttemptHeaderProps {
  studentInfo: { name: string; email: string };
  attemptInfo: { resultCode: string };
  quizInfo: { title: string };
  runningTotal: number;
  displayMax: number;
  ungradedCount: number;
  finalizing: boolean;
  finalizeSuccess: string | null;
  onFinalize: () => void;
}

export const ReviewAttemptHeader: React.FC<ReviewAttemptHeaderProps> = ({
  studentInfo,
  attemptInfo,
  quizInfo,
  runningTotal,
  displayMax,
  ungradedCount,
  finalizing,
  finalizeSuccess,
  onFinalize,
}) => {
  return (
    <div
      className="card"
      style={{
        padding: "1.75rem",
        marginBottom: "2rem",
        background:
          "linear-gradient(135deg, rgba(20, 20, 32, 0.85) 0%, rgba(30, 30, 50, 0.9) 100%)",
        border: "1px solid rgba(99, 102, 241, 0.3)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
      }}
    >
      <Link
        href="/teacher/reviews"
        className="btn btn-ghost btn-sm"
        style={{
          paddingLeft: 0,
          color: "#ffffffe3",
          marginBottom: "1.25rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
        }}
      >
        Back to Reviews
      </Link>

      <div
        className="flex justify-between items-center"
        style={{ flexWrap: "wrap", gap: "1.5rem" }}
      >
        <div>
          <div
            className="flex items-center gap-3 mb-1"
            style={{ flexWrap: "wrap" }}
          >
            <h1
              style={{
                fontSize: "1.85rem",
                fontWeight: 800,
                color: "#ffffffe3",
                margin: 0,
              }}
            >
              {studentInfo.name}
            </h1>
            <span style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>
              ({studentInfo.email})
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "0.85rem",
                fontWeight: 700,
                background: "rgba(255, 255, 255, 0.08)",
                color: "#ffffffe3",
                padding: "0.25rem 0.65rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
              }}
            >
              {attemptInfo.resultCode}
            </span>
          </div>
          <p
            style={{
              margin: 0,
              color: "#ffffffba",
              fontSize: "1.05rem",
              fontWeight: 500,
            }}
          >
            Assessment:{" "}
            <strong style={{ color: "var(--accent-hover)" }}>
              {quizInfo.title}
            </strong>
          </p>
        </div>

        <div
          className="flex items-center gap-6"
          style={{ flexWrap: "wrap" }}
        >
          {/* Live Score Counter */}
          <div
            style={{
              background: "rgba(10, 10, 15, 0.7)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              borderRadius: "var(--radius-lg)",
              padding: "0.75rem 1.5rem",
              textAlign: "center",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.2)",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.2rem",
              }}
            >
              LIVE SCORE COUNTER
            </div>
            <div
              style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "#ffffffe3",
              }}
            >
              <span className="text-gradient">{runningTotal}</span>{" "}
              <span
                style={{
                  fontSize: "1.15rem",
                  color: "var(--text-secondary)",
                }}
              >
                / {displayMax} pts
              </span>
            </div>
          </div>

          {/* Top Right Action: Finalize Exam Score */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "0.4rem",
            }}
          >
            <button
              onClick={onFinalize}
              disabled={
                finalizing || ungradedCount > 0 || Boolean(finalizeSuccess)
              }
              className="btn btn-primary btn-lg"
              style={{
                padding: "0.9rem 1.75rem",
                fontSize: "1.05rem",
                boxShadow:
                  ungradedCount > 0
                    ? "none"
                    : "0 0 25px rgba(99, 102, 241, 0.5)",
                opacity: ungradedCount > 0 ? 0.6 : 1,
                cursor: ungradedCount > 0 ? "not-allowed" : "pointer",
              }}
              title={
                ungradedCount > 0
                  ? `Please grade the remaining ${ungradedCount} essay question(s) first`
                  : "Finalize and publish exam score"
              }
            >
              {finalizing ? "Finalizing..." : "Finalize Exam Score"}
            </button>
            {ungradedCount > 0 ? (
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#fde047",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                {ungradedCount} essay{" "}
                {ungradedCount === 1 ? "question" : "questions"} still need
                grading
              </span>
            ) : (
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#43c372",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                All questions graded! Ready to finalize.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
