"use client";

import React from "react";

export interface QuizSidebarNavProps {
  questions: any[];
  currentQuestionIndex: number;
  durationMode?: string;
  answeredCount: number;
  totalCount: number;
  progressPct: number;
  isQuestionAnswered: (questionId: string, qType: string) => boolean;
  onNavigateQuestion: (index: number) => void;
}

export const QuizSidebarNav: React.FC<QuizSidebarNavProps> = ({
  questions,
  currentQuestionIndex,
  durationMode,
  answeredCount,
  totalCount,
  progressPct,
  isQuestionAnswered,
  onNavigateQuestion,
}) => {
  if (durationMode === "per_question") return null;

  return (
    <aside className="nav-grid-card">
      <div className="card" style={{ padding: "clamp(0.75rem, 3vw, 1.5rem)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            Question Navigation
          </h3>
          <span
            className="badge badge-accent"
            style={{ margin: 0, fontSize: "0.75rem" }}
          >
            {questions.length} Qs
          </span>
        </div>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
            marginBottom: "1.25rem",
            lineHeight: "1.4",
          }}
        >
          Click any number to jump directly to that question.
        </p>

        {/* Grid of Numbered Buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "0.6rem",
          }}
        >
          {questions.map((q, idx) => {
            const isActive = idx === currentQuestionIndex;
            const isAnswered = isQuestionAnswered(q.id, q.type);
            let btnClass = "unanswered";
            if (isActive) btnClass = "active";
            else if (isAnswered) btnClass = "answered";

            return (
              <button
                key={q.id}
                onClick={() => onNavigateQuestion(idx)}
                className={`question-nav-btn ${btnClass}`}
                title={`Question ${idx + 1} (${q.type.replace(
                  "_",
                  " "
                )}) - ${isAnswered ? "Answered" : "Unanswered"}`}
              >
                <span>{idx + 1}</span>
                {isAnswered && !isActive && (
                  <span
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#22c55e",
                      boxShadow: "0 0 6px #22c55e",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Summary Counter & Progress Bar */}
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            className="flex justify-between items-center"
            style={{ marginBottom: "0.6rem", fontSize: "0.85rem" }}
          >
            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
              Completion
            </span>
            <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>
              {answeredCount} / {totalCount} answered
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: "var(--radius-full)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: "var(--accent-gradient)",
                transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                borderRadius: "var(--radius-full)",
                boxShadow: "0 0 12px rgba(99, 102, 241, 0.6)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "1rem",
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                color: "#86efac",
              }}
            >
              Answered
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                color: "var(--text-secondary)",
              }}
            >
              Unanswered
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                color: "#818cf8",
              }}
            >
              Active
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
