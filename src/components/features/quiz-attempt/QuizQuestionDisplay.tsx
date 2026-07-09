"use client";

import React from "react";

export interface QuizQuestionDisplayProps {
  currentQuestion: any;
  currentQuestionIndex: number;
  totalQuestions: number;
  answers: Record<string, any>;
  savingStatus: Record<string, "idle" | "saving" | "saved" | "error">;
  durationMode?: string;
  onSelectOption: (questionId: string, optionId: string) => void;
  onSelectTrueFalse: (questionId: string, value: "true" | "false") => void;
  onEssayChange: (questionId: string, value: string) => void;
  onEssayBlur: (questionId: string, value: string) => void;
  onPrevQuestion: () => void;
  onNextQuestion: () => void;
  onReviewSubmit: () => void;
}

export const QuizQuestionDisplay: React.FC<QuizQuestionDisplayProps> = ({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  answers,
  savingStatus,
  durationMode,
  onSelectOption,
  onSelectTrueFalse,
  onEssayChange,
  onEssayBlur,
  onPrevQuestion,
  onNextQuestion,
  onReviewSubmit,
}) => {
  if (!currentQuestion) return null;

  return (
    <div
      className="card animate-fade-in"
      style={{
        padding: "clamp(1rem, 4vw, 2.5rem)",
        display: "flex",
        flexDirection: "column",
        minHeight: "400px",
      }}
    >
      {/* Header: Question X of Y | Type Badge | Points Badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          paddingBottom: "1.25rem",
          borderBottom: "1px solid var(--border)",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            Question {currentQuestionIndex + 1}{" "}
          </span>
          <span
            style={{
              fontSize: "1rem",
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            of {totalQuestions}
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.65rem", alignItems: "center" }}>
          <span className="badge badge-info" style={{ margin: 0 }}>
            {currentQuestion.type === "multiple_choice"
              ? "Multiple Choice"
              : currentQuestion.type === "true_false"
              ? "True or False"
              : "Essay"}
          </span>
          <span
            className="badge badge-accent"
            style={{ margin: 0, fontWeight: 800 }}
          >
            {currentQuestion.points} pt
            {currentQuestion.points === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Question Text */}
      <h2
        style={{
          fontSize: "clamp(1.05rem, 3.5vw, 1.4rem)",
          fontWeight: 700,
          color: "var(--text-primary)",
          lineHeight: "1.6",
          marginBottom: "1.25rem",
        }}
      >
        {currentQuestion.questionText}
      </h2>

      {/* Question Image Preview */}
      {currentQuestion.questionImage && (
        <div
          style={{
            marginBottom: "2rem",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            border: "1px solid var(--border)",
            maxHeight: "420px",
            display: "flex",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.4)",
            padding: "1rem",
          }}
        >
          <img
            src={currentQuestion.questionImage}
            alt={`Question ${currentQuestionIndex + 1} Figure`}
            style={{
              maxWidth: "100%",
              maxHeight: "380px",
              objectFit: "contain",
              borderRadius: "var(--radius-sm)",
            }}
          />
        </div>
      )}

      {/* Interactive Answer Inputs */}
      <div style={{ flex: 1, marginBottom: "2.5rem" }}>
        {/* 1. Multiple Choice */}
        {currentQuestion.type === "multiple_choice" &&
          currentQuestion.options && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {currentQuestion.options.map((option: any, idx: number) => {
                const isSelected =
                  answers[currentQuestion.id]?.selectedOptionId === option.id;
                const letter = String.fromCharCode(65 + idx); // A, B, C, D...

                return (
                  <div
                    key={option.id}
                    onClick={() =>
                      onSelectOption(currentQuestion.id, option.id)
                    }
                    className={`choice-card ${isSelected ? "selected" : ""}`}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "1.25rem",
                      padding: "1.25rem 1.5rem",
                      borderColor: isSelected
                        ? "var(--accent)"
                        : "var(--border)",
                      background: isSelected
                        ? "rgba(99, 102, 241, 0.15)"
                        : "rgba(232, 232, 232, 0.6)",
                      boxShadow: isSelected
                        ? "0 0 25px rgba(99, 102, 241, 0.25)"
                        : undefined,
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "1.05rem",
                        background: isSelected
                          ? "var(--accent-gradient)"
                          : "rgba(255, 255, 255, 0.08)",
                        color: isSelected ? "#ffffff" : "var(--text-secondary)",
                        border: isSelected
                          ? "none"
                          : "1px solid var(--border)",
                        flexShrink: 0,
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      {letter}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        fontSize: "1.08rem",
                        color: isSelected ? "#000000" : "var(--text-primary)",
                        lineHeight: "1.5",
                        fontWeight: isSelected ? 800 : 400,
                      }}
                    >
                      {option.optionText}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        {/* 2. True / False */}
        {currentQuestion.type === "true_false" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            {(() => {
              const currentVal =
                answers[currentQuestion.id]?.answerText?.toLowerCase();
              const isTrueSelected = currentVal === "true";
              const isFalseSelected = currentVal === "false";

              return (
                <>
                  <div
                    onClick={() =>
                      onSelectTrueFalse(currentQuestion.id, "true")
                    }
                    className={`choice-card ${
                      isTrueSelected ? "selected" : ""
                    }`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "clamp(1rem, 4vw, 2.5rem) 1rem",
                      textAlign: "center",
                      gap: "0.6rem",
                      borderColor: isTrueSelected
                        ? "var(--success)"
                        : "var(--border)",
                      background: isTrueSelected
                        ? "rgba(34, 197, 94, 0.16)"
                        : "#d4d4d4",
                      boxShadow: isTrueSelected
                        ? "0 0 30px rgba(34, 197, 94, 0.25)"
                        : undefined,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.35rem",
                        fontWeight: 800,
                        color: isTrueSelected
                          ? "#1a8a43"
                          : "var(--text-primary)",
                      }}
                    >
                      True
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      onSelectTrueFalse(currentQuestion.id, "false")
                    }
                    className={`choice-card ${
                      isFalseSelected ? "selected" : ""
                    }`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "clamp(1rem, 4vw, 2.5rem) 1rem",
                      textAlign: "center",
                      gap: "0.6rem",
                      borderColor: isFalseSelected
                        ? "var(--error)"
                        : "var(--border)",
                      background: isFalseSelected
                        ? "rgba(239, 68, 68, 0.16)"
                        : "rgba(232, 232, 232, 0.6)",
                      boxShadow: isFalseSelected
                        ? "0 0 30px rgba(239, 68, 68, 0.25)"
                        : undefined,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.35rem",
                        fontWeight: 800,
                        color: isFalseSelected
                          ? "#e12727"
                          : "var(--text-primary)",
                      }}
                    >
                      False
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* 3. Essay */}
        {currentQuestion.type === "essay" && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <textarea
              rows={7}
              placeholder="Type your comprehensive answer here..."
              value={answers[currentQuestion.id]?.answerText || ""}
              onChange={(e) =>
                onEssayChange(currentQuestion.id, e.target.value)
              }
              onBlur={(e) => onEssayBlur(currentQuestion.id, e.target.value)}
              className="input"
              style={{
                width: "100%",
                padding: "1.25rem",
                fontSize: "1.05rem",
                lineHeight: "1.6",
                background: "rgba(246, 246, 246, 0.7)",
                resize: "vertical",
                minHeight: "180px",
                borderRadius: "var(--radius-lg)",
              }}
            />
            {/* Saving Status Indicator */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                marginTop: "0.75rem",
                minHeight: "1.5rem",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              {savingStatus[currentQuestion.id] === "saving" && (
                <span
                  style={{
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  Saving response...
                </span>
              )}
              {savingStatus[currentQuestion.id] === "saved" && (
                <span
                  style={{
                    color: "#43c372",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  Saved securely
                </span>
              )}
              {savingStatus[currentQuestion.id] === "error" && (
                <span
                  style={{
                    color: "#e12727",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  Error saving. Will retry on next edit.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Footer inside Card */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        {durationMode !== "per_question" ? (
          <button
            onClick={onPrevQuestion}
            disabled={currentQuestionIndex === 0}
            className="btn btn-secondary nav-btn-prev"
          >
            Prev
          </button>
        ) : (
          <div />
        )}

        <div
          style={{
            fontSize: "0.82rem",
            color: "var(--text-secondary)",
            fontWeight: 600,
          }}
        >
          <strong style={{ color: "var(--text-primary)" }}>
            {currentQuestionIndex + 1}
          </strong>
          {" / "}
          <strong style={{ color: "var(--text-primary)" }}>
            {totalQuestions}
          </strong>
        </div>

        {currentQuestionIndex < totalQuestions - 1 ? (
          <button
            onClick={onNextQuestion}
            className="btn btn-primary nav-btn-next"
          >
            Next
          </button>
        ) : (
          <button
            onClick={onReviewSubmit}
            className="btn btn-primary nav-btn-next"
            style={{
              background: "var(--accent-gradient)",
              boxShadow: "0 0 20px rgba(168, 85, 247, 0.5)",
            }}
          >
            Review & Submit
          </button>
        )}
      </div>
    </div>
  );
};
