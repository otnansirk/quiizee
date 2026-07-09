"use client";

import React from "react";
import { QuestionData } from "@/app/(dashboard)/teacher/quizzes/[quizId]/questions/page";

export interface QuestionCardItemProps {
  question: QuestionData;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  durationMode?: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const QuestionCardItem: React.FC<QuestionCardItemProps> = ({
  question: q,
  index: idx,
  isFirst,
  isLast,
  durationMode = "global",
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}) => {
  let typeBadgeBg = "rgba(99, 102, 241, 0.15)";
  let typeBadgeColor = "#818cf8";
  let typeBadgeBorder = "rgba(99, 102, 241, 0.3)";
  let typeLabel = "Multiple Choice";
  let cardBorderLeft = "#6366f1";

  if (q.type === "true_false") {
    typeBadgeBg = "rgba(16, 185, 129, 0.15)";
    typeBadgeColor = "#34d399";
    typeBadgeBorder = "rgba(16, 185, 129, 0.3)";
    typeLabel = "True or False";
    cardBorderLeft = "#10b981";
  } else if (q.type === "essay") {
    typeBadgeBg = "rgba(245, 158, 11, 0.15)";
    typeBadgeColor = "#fbbf24";
    typeBadgeBorder = "rgba(245, 158, 11, 0.3)";
    typeLabel = "Essay / Free Text";
    cardBorderLeft = "#f59e0b";
  }

  return (
    <div
      className="card card-hover"
      style={{
        padding: "1.75rem 2rem",
        borderLeft: `4px solid ${cardBorderLeft}`,
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      {/* Card Header Row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              background: "rgba(255, 255, 255, 0.06)",
              padding: "0.35rem 0.85rem",
              borderRadius: "var(--radius-sm)",
            }}
          >
            Question #{idx + 1}
          </span>

          {/* Type Badge */}
          <span
            style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "var(--radius-full)",
              background: typeBadgeBg,
              color: typeBadgeColor,
              border: `1px solid ${typeBadgeBorder}`,
              fontSize: "0.8rem",
              fontWeight: 700,
            }}
          >
            {typeLabel}
          </span>

          {/* Points Badge */}
          <span
            style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "var(--radius-full)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "var(--text-primary)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            {q.points} {q.points === 1 ? "pt" : "pts"}
          </span>

          {/* Duration Badge (if per-question mode) */}
          {durationMode === "per_question" && q.duration && (
            <span
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "var(--radius-full)",
                background: "rgba(59, 130, 246, 0.15)",
                color: "#60a5fa",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              {q.duration}s
            </span>
          )}
        </div>

        {/* Card Actions (Reorder, Edit, Delete) */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="btn btn-ghost btn-sm"
            title="Move question up"
            style={{
              padding: "0.4rem 0.6rem",
              opacity: isFirst ? 0.3 : 1,
              cursor: isFirst ? "not-allowed" : "pointer",
            }}
          >
            UP
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="btn btn-ghost btn-sm"
            title="Move question down"
            style={{
              padding: "0.4rem 0.6rem",
              opacity: isLast ? 0.3 : 1,
              cursor: isLast ? "not-allowed" : "pointer",
            }}
          >
            DOWN
          </button>

          <div
            style={{
              width: "1px",
              height: "20px",
              background: "var(--border)",
              margin: "0 0.25rem",
            }}
          />

          <button
            onClick={onEdit}
            className="btn btn-secondary btn-sm"
            style={{ padding: "0.4rem 0.85rem" }}
          >
            Edit
          </button>

          <button
            onClick={onDelete}
            className="btn btn-ghost btn-sm"
            style={{
              padding: "0.4rem 0.85rem",
              color: "#e12727",
              background: "rgba(239, 68, 68, 0.08)",
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Question Text & Optional Image */}
      <div>
        <p
          style={{
            fontSize: "1.15rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            marginBottom: q.questionImage ? "1rem" : "0",
          }}
        >
          {q.questionText}
        </p>

        {q.questionImage && (
          <div
            style={{
              marginTop: "0.75rem",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              maxWidth: "500px",
              background: "rgba(0, 0, 0, 0.3)",
            }}
          >
            <img
              src={q.questionImage}
              alt="Question illustration"
              style={{
                width: "100%",
                maxHeight: "280px",
                objectFit: "contain",
                display: "block",
              }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Type-Specific Answer Details */}
      <div style={{ marginTop: "0.25rem" }}>
        {/* MULTIPLE CHOICE DETAILS */}
        {q.type === "multiple_choice" && q.options && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(100%, 1fr))",
              gap: "0.75rem",
            }}
          >
            {q.options
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((opt, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                return (
                  <div
                    key={opt.id || optIdx}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "var(--radius-md)",
                      background: opt.isCorrect
                        ? "rgba(34, 197, 94, 0.12)"
                        : "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${
                        opt.isCorrect
                          ? "rgba(34, 197, 94, 0.4)"
                          : "rgba(255, 255, 255, 0.08)"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      transition: "all 0.2s ease",
                      boxShadow: opt.isCorrect
                        ? "0 0 15px rgba(34, 197, 94, 0.1)"
                        : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <span
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          background: opt.isCorrect
                            ? "rgba(34, 197, 94, 0.25)"
                            : "rgba(255, 255, 255, 0.08)",
                          color: opt.isCorrect
                            ? "#2d9754"
                            : "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                        }}
                      >
                        {letter}
                      </span>
                      <span
                        style={{
                          color:"var(--text-primary)",
                          fontWeight: opt.isCorrect ? 800 : 400,
                          fontSize: "0.95rem",
                        }}
                      >
                        {opt.optionText}
                      </span>
                    </div>

                    {opt.isCorrect && (
                      <span
                        style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "var(--radius-full)",
                          background: "rgba(34, 197, 94, 0.2)",
                          color: "#2d9754",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                        }}
                      >
                        Correct
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* TRUE / FALSE DETAILS */}
        {q.type === "true_false" && (
          <div
            style={{
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-md)",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.75rem",
              color: "#2d9754",
              fontWeight: 700,
              fontSize: "1rem",
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.1)",
            }}
          >
            <span>Correct Answer:</span>
            <span
              style={{
                padding: "0.25rem 0.75rem",
                background: "rgba(16, 185, 129, 0.767)",
                borderRadius: "var(--radius-sm)",
                color: "#ffffff",
                textTransform: "capitalize",
              }}
            >
              {q.correctAnswer === "false"
                ? "False (Correct)"
                : "True (Correct)"}
            </span>
          </div>
        )}

        {/* ESSAY DETAILS */}
        {q.type === "essay" && (
          <div
            style={{
              padding: "0.85rem 1.25rem",
              borderRadius: "var(--radius-md)",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              color: "#fbbf24",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            <span>
              <strong>Manual grading required:</strong> Teacher review is needed
              to evaluate student responses after quiz completion.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
