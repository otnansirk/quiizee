"use client";

import React from "react";
import Link from "next/link";
import { QuizData } from "@/app/(dashboard)/teacher/quizzes/[quizId]/questions/page";

export interface QuizQuestionsHeaderProps {
  quiz: QuizData;
  totalQuestions: number;
  totalPoints: number;
  isPublishing: boolean;
  onPublishToggle: (targetState: boolean) => void;
  onOpenAIModal: () => void;
  onAddQuestion: () => void;
}

export const QuizQuestionsHeader: React.FC<QuizQuestionsHeaderProps> = ({
  quiz,
  totalQuestions,
  totalPoints,
  isPublishing,
  onPublishToggle,
  onOpenAIModal,
  onAddQuestion,
}) => {
  return (
    <header style={{ marginBottom: "2.5rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <Link
          href="/teacher/quizzes"
          className="btn btn-ghost btn-sm"
          style={{
            padding: "0.4rem 0.8rem",
            fontSize: "0.9rem",
            color: "var(--text-secondary)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            borderRadius: "var(--radius-full)",
            background: "rgba(255, 255, 255, 0.03)",
          }}
        >
          Back to Quizzes
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontSize: "2.25rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            {quiz.title}
          </h1>

          {quiz.isPublished ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.85rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                borderRadius: "var(--radius-full)",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#34d399",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#34d399",
                }}
              />
              Published
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.85rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                borderRadius: "var(--radius-full)",
                background: "rgba(245, 158, 11, 0.15)",
                color: "#fbbf24",
                border: "1px solid rgba(245, 158, 11, 0.3)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#fbbf24",
                }}
              />
              Draft
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
          {quiz.isPublished ? (
            <button
              onClick={() => onPublishToggle(false)}
              disabled={isPublishing}
              className="btn btn-secondary"
              style={{
                borderColor: "rgba(236, 37, 37, 0.756)",
                color: "#e12727",
              }}
            >
              {isPublishing ? "Unpublishing..." : "Unpublish"}
            </button>
          ) : (
            <button
              onClick={() => onPublishToggle(true)}
              disabled={isPublishing}
              className="btn"
              style={{
                background:
                  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.35)",
              }}
            >
              {isPublishing ? "Publishing..." : "Publish Quiz"}
            </button>
          )}

          <button
            onClick={onOpenAIModal}
            className="btn"
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "0.95rem",
              background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
              color: "#fff",
              border: "2px solid #111827",
              boxShadow: "3px 3px 0px #111827",
            }}
          >
            ✨ AI Generate
          </button>

          <button
            onClick={onAddQuestion}
            className="btn btn-primary"
            style={{ padding: "0.75rem 1.5rem", fontSize: "0.95rem" }}
          >
            Add Question
          </button>
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: "1.5rem 2rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.5rem",
          background: "#222222",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "12px",
              background: "rgba(99, 102, 241, 0.2)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              color: "#818cf8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              fontWeight: 800,
            }}
          >
            Q
          </div>
          <div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#d4d4d8",
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
            >
              TOTAL QUESTIONS
            </div>
            <div
              style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff" }}
            >
              {totalQuestions}{" "}
              <span
                style={{ fontSize: "0.9rem", fontWeight: 500, color: "#a1a1aa" }}
              >
                questions
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "12px",
              background: "rgba(168, 85, 247, 0.2)",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              color: "#c084fc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              fontWeight: 800,
            }}
          >
            P
          </div>
          <div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#d4d4d8",
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
            >
              TOTAL POINTS
            </div>
            <div
              style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff" }}
            >
              {totalPoints}{" "}
              <span
                style={{ fontSize: "0.9rem", fontWeight: 500, color: "#a1a1aa" }}
              >
                pts
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "12px",
              background: "rgba(59, 130, 246, 0.2)",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              color: "#60a5fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              fontWeight: 800,
            }}
          >
            T
          </div>
          <div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#d4d4d8",
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
            >
              DURATION MODE
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "0.2rem",
              }}
            >
              <span
                style={{
                  padding: "0.25rem 0.65rem",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(59, 130, 246, 0.25)",
                  color: "#93c5fd",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  border: "1px solid rgba(59, 130, 246, 0.4)",
                }}
              >
                {quiz.durationMode === "global"
                  ? "Global Timer"
                  : "Per-Question Timer"}
              </span>
              {quiz.durationMode === "global" && quiz.globalDuration && (
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "#d4d4d8",
                    fontWeight: 600,
                  }}
                >
                  ({quiz.globalDuration} min)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
