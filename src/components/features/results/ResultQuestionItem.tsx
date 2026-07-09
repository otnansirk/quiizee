"use client";

import React from "react";

export interface ResultQuestionItemProps {
  question: {
    id: string;
    questionNumber?: number;
    text: string;
    type: "multiple_choice" | "true_false" | "essay";
    points: number;
    imageUrl?: string | null;
    options?: { id: string; text: string; isCorrect?: boolean }[];
    correctAnswer?: string | boolean | null;
  };
  answer: any;
  index: number;
}

export const ResultQuestionItem: React.FC<ResultQuestionItemProps> = ({
  question: q,
  answer: ans,
  index,
}) => {
  const qNum = q.questionNumber || index + 1;

  // Determine points earned styling
  const isAnsCorrect = q.type !== "essay" && ans?.isCorrect === true;
  const isAnsIncorrect = q.type !== "essay" && ans?.isCorrect === false;
  const isAnsPending =
    q.type === "essay"
      ? !ans || ans.score === null || ans.score === undefined
      : !ans || ans.isCorrect === null || ans.isCorrect === undefined;

  let ptsBadgeStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.08)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
  };
  let ptsText = `${
    ans?.score !== null && ans?.score !== undefined ? ans.score : "Pending"
  } / ${q.points} pts`;

  if (q.type === "essay") {
    if (!isAnsPending) {
      ptsBadgeStyle = {
        background: "rgba(34, 197, 94, 0.15)",
        color: "#43c372",
        border: "1px solid rgba(34, 197, 94, 0.4)",
      };
      ptsText = `${ans?.score} / ${q.points} pts`;
    } else {
      ptsBadgeStyle = {
        background: "rgba(245, 158, 11, 0.15)",
        color: "#776610",
        border: "1px solid rgba(245, 158, 11, 0.4)",
      };
      ptsText = `Pending / ${q.points} pts`;
    }
  } else if (isAnsCorrect) {
    ptsBadgeStyle = {
      background: "rgba(34, 197, 94, 0.15)",
      color: "#43c372",
      border: "1px solid rgba(34, 197, 94, 0.4)",
    };
    ptsText = `${q.points} / ${q.points} pts`;
  } else if (isAnsIncorrect) {
    ptsBadgeStyle = {
      background: "rgba(239, 68, 68, 0.15)",
      color: "#e12727",
      border: "1px solid rgba(239, 68, 68, 0.4)",
    };
    ptsText = `0 / ${q.points} pts`;
  }

  // Type label
  const typeLabel =
    q.type === "multiple_choice"
      ? "Multiple Choice"
      : q.type === "true_false"
      ? "True / False"
      : "Essay Question";

  return (
    <div
      key={q.id || index}
      className="card results-q-card"
      style={{
        padding: "clamp(0.65rem, 2.5vw, 1.5rem)",
        borderColor: isAnsCorrect
          ? "rgba(34, 197, 94, 0.3)"
          : isAnsIncorrect
          ? "rgba(239, 68, 68, 0.3)"
          : "var(--border)",
        transition: "all var(--transition-normal)",
      }}
    >
      <div
        className="flex items-center justify-between flex-wrap gap-2"
        style={{ marginBottom: "0.65rem" }}
      >
        <div className="flex items-center gap-2">
          <span
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              padding: "0.3rem 0.8rem",
              borderRadius: "var(--radius-md)",
              fontWeight: 700,
              fontSize: "0.9rem",
              color: "var(--text-primary)",
            }}
          >
            #{qNum}
          </span>
          <span
            className="badge"
            style={{
              margin: 0,
              fontSize: "0.75rem",
              background: "rgba(99, 102, 241, 0.1)",
              color: "var(--accent-hover)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
            }}
          >
            {typeLabel}
          </span>
        </div>

        <div
          className="badge"
          style={{
            margin: 0,
            fontSize: "0.72rem",
            fontWeight: 700,
            padding: "0.2rem 0.55rem",
            ...ptsBadgeStyle,
          }}
        >
          {ptsText}
        </div>
      </div>

      {/* Question Text */}
      <div
        className="results-q-text"
        style={{
          fontSize: "clamp(0.88rem, 2.2vw, 1.05rem)",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "0.65rem",
          lineHeight: 1.55,
        }}
      >
        {q.text}
      </div>

      {/* Image Preview if exists */}
      {q.imageUrl && (
        <div
          style={{
            marginBottom: "1.5rem",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            border: "1px solid var(--border)",
            maxWidth: "600px",
          }}
        >
          <img
            src={q.imageUrl}
            alt={`Question ${qNum} illustration`}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
      )}

      {/* Answer Renderers by Type */}
      <div style={{ marginTop: "0.5rem" }}>
        {/* MULTIPLE CHOICE */}
        {q.type === "multiple_choice" && q.options && (
          <div className="flex flex-col gap-2.5">
            {q.options.map((opt) => {
              const isSelected = ans?.selectedOptionId === opt.id;
              const isThisOptionCorrect =
                opt.isCorrect === true ||
                q.correctAnswer === opt.id ||
                q.correctAnswer === opt.text;

              let optionBg = "rgba(223, 223, 223, 0.5)";
              let optionBorder = "var(--border)";
              let optionColor = "var(--text-secondary)";
              let statusIcon: React.ReactNode = null;

              if (isSelected && isThisOptionCorrect) {
                optionBg = "rgba(34, 197, 94, 0.554)";
                optionBorder = "rgba(34, 197, 94, 0.6)";
                optionColor = "#43c372";
                statusIcon = (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#22c55e",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ✓ Correct
                  </span>
                );
              } else if (isSelected && !isThisOptionCorrect) {
                optionBg = "rgba(239, 68, 68, 0.15)";
                optionBorder = "rgba(239, 68, 68, 0.6)";
                optionColor = "#e12727";
                statusIcon = (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#ef4444",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ✗ Wrong
                  </span>
                );
              } else if (!isSelected && isThisOptionCorrect) {
                optionBg = "rgba(34, 197, 94, 0.499)";
                optionBorder = "1px dashed rgba(34, 197, 94, 0.5)";
                optionColor = "#097731";
                statusIcon = (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#097731",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    ✓ Correct Ans
                  </span>
                );
              }

              return (
                <div
                  key={opt.id}
                  style={{
                    background: optionBg,
                    border: `1px solid ${optionBorder}`,
                    borderRadius: "var(--radius-md)",
                    padding: "0.65rem 0.85rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    marginBottom: "0.25rem",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        border: `2px solid ${
                          isSelected ? "currentColor" : "var(--border)"
                        }`,
                        background: isSelected ? "currentColor" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        color: optionColor,
                        fontWeight:
                          isSelected || isThisOptionCorrect ? 600 : 400,
                        fontSize: "0.95rem",
                      }}
                    >
                      {opt.text}
                    </span>
                  </div>
                  {statusIcon && (
                    <div style={{ flexShrink: 0 }}>{statusIcon}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TRUE / FALSE */}
        {q.type === "true_false" && (
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem 1rem",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: "0.35rem",
                }}
              >
                Your Submitted Answer
              </span>
              <div
                className="flex items-center gap-2"
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: isAnsCorrect ? "#43c372" : "#e12727",
                }}
              >
                <span>
                  {ans?.answerText
                    ? ans.answerText.toString().toUpperCase()
                    : "NO ANSWER"}
                </span>
                <span>{isAnsCorrect ? "Correct" : "Incorrect"}</span>
              </div>
            </div>

            <div>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: "0.35rem",
                }}
              >
                Correct Solution
              </span>
              <div
                className="flex items-center gap-2"
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#43c372",
                }}
              >
                <span>
                  {q.correctAnswer !== undefined && q.correctAnswer !== null
                    ? q.correctAnswer.toString().toUpperCase()
                    : "TRUE"}
                </span>
                <span>Correct</span>
              </div>
            </div>
          </div>
        )}

        {/* ESSAY QUESTION */}
        {q.type === "essay" && (
          <div className="flex flex-col gap-3">
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
              }}
            >
              <div
                className="flex items-center justify-between gap-2"
                style={{
                  marginBottom: "0.75rem",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  paddingBottom: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  Your Written Response
                </span>
                {isAnsPending ? (
                  <span
                    className="badge badge-warning"
                    style={{ margin: 0, fontSize: "0.75rem" }}
                  >
                    Pending Teacher Grading
                  </span>
                ) : (
                  <span
                    className="badge badge-success"
                    style={{ margin: 0, fontSize: "0.75rem" }}
                  >
                    Graded by Instructor
                  </span>
                )}
              </div>
              <p
                style={{
                  color: "var(--text-primary)",
                  fontSize: "0.95rem",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {ans?.answerText || (
                  <span
                    style={{ color: "var(--text-muted)", fontStyle: "italic" }}
                  >
                    No answer provided.
                  </span>
                )}
              </p>
            </div>

            {/* Teacher Feedback Box if graded */}
            {ans?.feedback && (
              <div
                style={{
                  background: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem 1rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--accent-hover)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  Instructor Feedback & Comments:
                </div>
                <p
                  style={{
                    color: "var(--text-primary)",
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {ans.feedback}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
