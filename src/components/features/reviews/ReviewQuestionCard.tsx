"use client";

import React from "react";

export interface ReviewQuestionCardProps {
  item: any;
  form: {
    score: number | string;
    feedback?: string | null;
    saving?: boolean;
    saved?: boolean;
    error?: string | null;
  };
  onFormChange: (questionId: string, updates: any) => void;
  onSaveGrade: (item: any) => void;
}

export const ReviewQuestionCard: React.FC<ReviewQuestionCardProps> = ({
  item,
  form,
  onFormChange,
  onSaveGrade,
}) => {
  const isEssay = item.type === "essay";
  const isMC = item.type === "multiple_choice";
  const isTF = item.type === "true_false";

  const typeBadgeText = isEssay
    ? "Essay"
    : isMC
    ? "Multiple Choice"
    : "True / False";
  const typeBadgeStyle = isEssay
    ? {
        background: "rgba(245, 158, 11, 0.15)",
        color: "#fde047",
        border: "1px solid rgba(245, 158, 11, 0.3)",
      }
    : {
        background: "rgba(59, 130, 246, 0.15)",
        color: "#93c5fd",
        border: "1px solid rgba(59, 130, 246, 0.3)",
      };

  return (
    <div
      className="card"
      style={{
        padding: "2rem",
        borderLeft: isEssay
          ? "4px solid var(--warning)"
          : item.isCorrect
          ? "4px solid var(--success)"
          : "4px solid var(--error)",
        background: isEssay
          ? "linear-gradient(145deg, rgba(30, 26, 48, 0.85) 0%, rgba(20, 20, 40, 0.95) 100%)"
          : "var(--bg-card)",
        boxShadow: isEssay
          ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.12)"
          : "var(--shadow-md)",
      }}
    >
      {/* Question Header */}
      <div
        className="flex justify-between items-start gap-4 mb-4"
        style={{ flexWrap: "wrap" }}
      >
        <div className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              background: "rgba(255, 255, 255, 0.08)",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--border)",
            }}
          >
            {item.order}
          </span>
          <span className="badge" style={{ ...typeBadgeStyle, margin: 0 }}>
            {typeBadgeText}
          </span>
        </div>

        {/* Points Badge / Auto-graded status */}
        <div>
          {isEssay ? (
            <span
              className="badge"
              style={{
                margin: 0,
                background: item.isGraded
                  ? "rgba(34, 197, 94, 0.15)"
                  : "rgba(245, 158, 11, 0.15)",
                color: item.isGraded ? "#43c372" : "#fde047",
                border: `1px solid ${
                  item.isGraded
                    ? "rgba(34, 197, 94, 0.3)"
                    : "rgba(245, 158, 11, 0.3)"
                }`,
                fontSize: "0.85rem",
                padding: "0.4rem 0.9rem",
              }}
            >
              {item.isGraded
                ? `Graded: ${item.currentScore} / ${item.maxPoints} pts`
                : `Max ${item.maxPoints} pts (Ungraded)`}
            </span>
          ) : (
            <span
              className="badge"
              style={{
                margin: 0,
                background: item.isCorrect
                  ? "rgba(34, 197, 94, 0.15)"
                  : "rgba(239, 68, 68, 0.15)",
                color: item.isCorrect ? "#43c372" : "#e12727",
                border: `1px solid ${
                  item.isCorrect
                    ? "rgba(34, 197, 94, 0.3)"
                    : "rgba(239, 68, 68, 0.3)"
                }`,
                fontSize: "0.85rem",
                padding: "0.4rem 0.9rem",
              }}
            >
              {item.isCorrect
                ? `${item.currentScore} / ${item.maxPoints} pts`
                : `0 / ${item.maxPoints} pts`}
            </span>
          )}
        </div>
      </div>

      {/* Question Prompt */}
      <div
        style={{
          fontSize: "1.15rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "1.25rem",
          lineHeight: "1.6",
        }}
      >
        {item.questionText}
      </div>

      {/* Question Image if any */}
      {item.questionImage && (
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
            src={item.questionImage}
            alt="Question attachment"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
      )}

      {/* Response / Review Section */}
      {isEssay ? (
        /* ESSAY QUESTION: INTERACTIVE GRADING FORM */
        <div
          style={{
            marginTop: "1.5rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "1.5rem",
          }}
        >
          <div className="mb-6">
            <label
              className="label"
              style={{
                display: "block",
                marginBottom: "0.6rem",
                color: "var(--text-secondary)",
              }}
            >
              <span>Student&apos;s Written Response:</span>
            </label>
            <div
              style={{
                background: "rgba(10, 10, 15, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "var(--radius-md)",
                padding: "1.25rem",
                color: item.answerText
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
                fontStyle: item.answerText ? "normal" : "italic",
                fontSize: "1rem",
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
                minHeight: "110px",
                boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.3)",
              }}
            >
              {item.answerText ||
                "No answer provided (Timed Out or Left Blank)"}
            </div>
          </div>

          {/* Grading Form Box */}
          <div
            style={{
              background: "rgba(20, 20, 36, 0.6)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
            }}
          >
            <h4
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--accent-hover)",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              Assign Score & Instructor Feedback
            </h4>

            <div
              className="grid"
              style={{
                gridTemplateColumns: "120px 1fr",
                gap: "1.5rem",
                alignItems: "start",
              }}
            >
              {/* Points Awarded Input */}
              <div className="form-group" style={{ margin: 0 }}>
                <label
                  className="label"
                  style={{ color: "var(--text-primary)" }}
                >
                  Points (Max {item.maxPoints})
                </label>
                <input
                  type="number"
                  min="0"
                  max={item.maxPoints}
                  step="0.5"
                  value={form.score}
                  onChange={(e) =>
                    onFormChange(item.questionId, {
                      score: e.target.value,
                      saved: false,
                      error: null,
                    })
                  }
                  className="input"
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    textAlign: "center",
                    borderColor: form.error
                      ? "var(--error)"
                      : "rgba(99, 102, 241, 0.4)",
                    background: "rgba(10, 10, 15, 0.9)",
                  }}
                />
              </div>

              {/* Instructor Feedback Textarea */}
              <div className="form-group" style={{ margin: 0 }}>
                <label
                  className="label"
                  style={{ color: "var(--text-primary)" }}
                >
                  Instructor Feedback & Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Great analysis! Remember to cite specific examples..."
                  value={form.feedback || ""}
                  onChange={(e) =>
                    onFormChange(item.questionId, {
                      feedback: e.target.value,
                      saved: false,
                      error: null,
                    })
                  }
                  className="input"
                  style={{ resize: "vertical", minHeight: "80px" }}
                />
              </div>
            </div>

            {/* Error Message */}
            {form.error && (
              <div
                style={{
                  color: "#e12727",
                  fontSize: "0.85rem",
                  marginTop: "0.75rem",
                  fontWeight: 600,
                }}
              >
                {form.error}
              </div>
            )}

            {/* Save Button & Status */}
            <div
              className="flex justify-end items-center gap-4 mt-4 pt-4"
              style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}
            >
              {form.saved && (
                <span
                  className="animate-fade-in"
                  style={{
                    color: "#43c372",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  Saved & Live Score Updated!
                </span>
              )}

              <button
                onClick={() => onSaveGrade(item)}
                disabled={form.saving}
                className="btn btn-primary"
                style={{
                  padding: "0.65rem 1.5rem",
                  boxShadow: "0 0 18px rgba(99, 102, 241, 0.35)",
                }}
              >
                {form.saving ? "⌛ Saving..." : "💾 Save Grade & Feedback"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* READ-ONLY REVIEW FOR MULTIPLE CHOICE & TRUE/FALSE */
        <div
          style={{
            marginTop: "1.25rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "1.25rem",
          }}
        >
          {item.options && item.options.length > 0 ? (
            /* Display Options List */
            <div className="flex flex-col gap-3">
              {item.options.map((opt: any, idx: number) => {
                const isSelected =
                  item.selectedOptionId === opt.id ||
                  item.answerText === opt.optionText;
                const isOptCorrect =
                  opt.isCorrect ||
                  opt.optionText === item.correctAnswer ||
                  opt.id === item.correctAnswer;
                const letter = String.fromCharCode(65 + idx);

                let boxStyle: React.CSSProperties = {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  background: "rgba(20, 20, 32, 0.4)",
                  transition: "all var(--transition-fast)",
                };

                let badgeText = "";
                let badgeBg = "";
                let badgeColor = "";

                if (isSelected && isOptCorrect) {
                  boxStyle = {
                    ...boxStyle,
                    background: "rgba(34, 197, 94, 0.12)",
                    border: "1px solid var(--success)",
                  };
                  badgeText = "Student Answer (Correct)";
                  badgeBg = "rgba(34, 197, 94, 0.2)";
                  badgeColor = "#43c372";
                } else if (isSelected && !isOptCorrect) {
                  boxStyle = {
                    ...boxStyle,
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid var(--error)",
                  };
                  badgeText = "Student Answer (Incorrect)";
                  badgeBg = "rgba(239, 68, 68, 0.2)";
                  badgeColor = "#e12727";
                } else if (!isSelected && isOptCorrect) {
                  boxStyle = {
                    ...boxStyle,
                    background: "rgba(34, 197, 94, 0.06)",
                    border: "1px dashed var(--success)",
                  };
                  badgeText = "Correct Answer";
                  badgeBg = "rgba(34, 197, 94, 0.15)";
                  badgeColor = "#43c372";
                }

                return (
                  <div key={opt.id} style={boxStyle}>
                    <span
                      style={{
                        fontSize: "1rem",
                        fontWeight: isSelected || isOptCorrect ? 700 : 400,
                        color: "var(--text-primary)",
                      }}
                    >
                      {letter}. {opt.optionText}
                    </span>
                    {badgeText && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.3rem 0.75rem",
                          borderRadius: "var(--radius-full)",
                          background: badgeBg,
                          color: badgeColor,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {badgeText}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Display Simple Text comparison if no options array */
            <div
              className="grid"
              style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
            >
              <div
                style={{
                  background: "rgba(10, 10, 15, 0.6)",
                  border: `1px solid ${
                    item.isCorrect ? "var(--success)" : "var(--error)"
                  }`,
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    fontWeight: 700,
                    marginBottom: "0.3rem",
                  }}
                >
                  STUDENT&apos;S ANSWER
                </div>
                <div
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: item.isCorrect ? "#43c372" : "#e12727",
                  }}
                >
                  {item.answerText || "No answer selected"}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(34, 197, 94, 0.08)",
                  border: "1px dashed var(--success)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#43c372",
                    fontWeight: 700,
                    marginBottom: "0.3rem",
                  }}
                >
                  CORRECT ANSWER
                </div>
                <div
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {item.correctAnswer || "Not specified"}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
