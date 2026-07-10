"use client";

import React, { useState, useEffect } from "react";
import { QuestionData, OptionData, QuestionType } from "@/app/(dashboard)/teacher/quizzes/[quizId]/questions/page";
import { ModalPortal } from "@/components/atoms/ModalPortal";

export interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  durationMode?: string;
  questionToEdit: QuestionData | null;
  nextOrder: number;
  onSuccess: (isEdit: boolean) => void;
}

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  onClose,
  quizId,
  durationMode = "global",
  questionToEdit,
  nextOrder,
  onSuccess,
}) => {
  const [formType, setFormType] = useState<QuestionType>("multiple_choice");
  const [formText, setFormText] = useState<string>("");
  const [formImage, setFormImage] = useState<string>("");
  const [formPoints, setFormPoints] = useState<number>(1);
  const [formDuration, setFormDuration] = useState<number>(30);
  const [formCorrectAnswer, setFormCorrectAnswer] = useState<string>("true");
  const [formOptions, setFormOptions] = useState<OptionData[]>([
    { optionText: "", isCorrect: true, order: 1 },
    { optionText: "", isCorrect: false, order: 2 },
    { optionText: "", isCorrect: false, order: 3 },
    { optionText: "", isCorrect: false, order: 4 },
  ]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;

    if (questionToEdit) {
      setFormType(questionToEdit.type);
      setFormText(questionToEdit.questionText);
      setFormImage(questionToEdit.questionImage || "");
      setFormPoints(questionToEdit.points || 1);
      setFormDuration(questionToEdit.duration || 30);
      setFormCorrectAnswer(questionToEdit.correctAnswer || "true");

      if (
        questionToEdit.type === "multiple_choice" &&
        questionToEdit.options &&
        questionToEdit.options.length > 0
      ) {
        const sortedOpts = [...questionToEdit.options].sort(
          (a, b) => a.order - b.order
        );
        setFormOptions(
          sortedOpts.map((opt, idx) => ({
            id: opt.id,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            order: idx + 1,
          }))
        );
      } else {
        setFormOptions([
          { optionText: "", isCorrect: true, order: 1 },
          { optionText: "", isCorrect: false, order: 2 },
          { optionText: "", isCorrect: false, order: 3 },
          { optionText: "", isCorrect: false, order: 4 },
        ]);
      }
    } else {
      setFormType("multiple_choice");
      setFormText("");
      setFormImage("");
      setFormPoints(1);
      setFormDuration(durationMode === "per_question" ? 30 : 30);
      setFormCorrectAnswer("true");
      setFormOptions([
        { optionText: "", isCorrect: true, order: 1 },
        { optionText: "", isCorrect: false, order: 2 },
        { optionText: "", isCorrect: false, order: 3 },
        { optionText: "", isCorrect: false, order: 4 },
      ]);
    }
    setFormError("");
  }, [isOpen, questionToEdit, durationMode]);


  const addOption = () => {
    setFormOptions((prev) => [
      ...prev,
      {
        optionText: "",
        isCorrect: prev.length === 0,
        order: prev.length + 1,
      },
    ]);
  };

  const removeOption = (indexToRemove: number) => {
    if (formOptions.length <= 2) return;
    setFormOptions((prev) => {
      const updated = prev
        .filter((_, idx) => idx !== indexToRemove)
        .map((opt, idx) => ({ ...opt, order: idx + 1 }));

      if (!updated.some((o) => o.isCorrect) && updated.length > 0) {
        updated[0].isCorrect = true;
      }
      return updated;
    });
  };

  const toggleOptionCorrectness = (indexToSelect: number) => {
    setFormOptions((prev) =>
      prev.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === indexToSelect,
      }))
    );
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formText.trim()) {
      setFormError("Question text cannot be empty.");
      return;
    }

    if (
      durationMode === "per_question" &&
      (formDuration < 5 || isNaN(formDuration))
    ) {
      setFormError(
        "Duration must be at least 5 seconds for per-question timer mode."
      );
      return;
    }

    if (formType === "multiple_choice") {
      if (formOptions.length < 2) {
        setFormError("Multiple choice questions must have at least 2 options.");
        return;
      }
      for (let i = 0; i < formOptions.length; i++) {
        if (!formOptions[i].optionText.trim()) {
          setFormError(
            `Option ${String.fromCharCode(65 + i)} text cannot be empty.`
          );
          return;
        }
      }
      if (!formOptions.some((opt) => opt.isCorrect)) {
        setFormError("Please mark at least one option as correct.");
        return;
      }
    }

    setIsSaving(true);

    try {
      const payload: any = {
        type: formType,
        questionText: formText.trim(),
        questionImage: formImage.trim() || null,
        points: Number(formPoints),
        duration: durationMode === "per_question" ? Number(formDuration) : null,
        order: questionToEdit ? questionToEdit.order : nextOrder,
      };

      if (formType === "multiple_choice") {
        payload.options = formOptions.map((opt, idx) => ({
          optionText: opt.optionText.trim(),
          isCorrect: opt.isCorrect,
          order: idx + 1,
        }));
      } else if (formType === "true_false") {
        payload.correctAnswer = formCorrectAnswer;
      }

      const url = questionToEdit
        ? `/api/quizzes/${quizId}/questions/${questionToEdit.id}`
        : `/api/quizzes/${quizId}/questions`;

      const method = questionToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as any;
        throw new Error(errData.message || "Failed to save question");
      }

      onSuccess(!!questionToEdit);
      onClose();
    } catch (err: any) {
      setFormError(
        err.message || "An error occurred while saving the question."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5, 5, 10, 0.8)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content card"
        style={{
          width: "100%",
          maxWidth: "760px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: 0,
          background: "var(--bg-secondary)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(99, 102, 241, 0.2)",
        }}
      >
        {/* Modal Header (Fixed at top) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.85rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {questionToEdit
                ? `Edit Question #${questionToEdit.order || ""}`
                : "Add New Question"}
            </h2>
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                marginTop: "0.15rem",
              }}
            >
              Configure your question text, type, points, and grading rules.
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: "0.35rem 0.5rem", fontSize: "1.1rem", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div
          className="custom-scrollbar"
          style={{
            overflowY: "auto",
            flex: 1,
            padding: "1.25rem 1.5rem 1.75rem 1.5rem",
          }}
        >
          {/* Error Banner */}
        {formError && (
          <div
            className="alert alert-error animate-fade-in"
            style={{ marginBottom: "1.5rem" }}
          >
            <span>{formError}</span>
          </div>
        )}

        {/* Modal Form */}
        <form
          onSubmit={handleSaveQuestion}
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* 1. Question Type Selector */}
          <div>
            <label
              className="label"
              style={{ marginBottom: "0.75rem", display: "block" }}
            >
              QUESTION TYPE
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.75rem",
                padding: "0.4rem",
              }}
            >
              <button
                type="button"
                onClick={() => setFormType("multiple_choice")}
                className="btn"
                style={{
                  padding: "0.65rem 1rem",
                  fontSize: "0.9rem",
                  background:
                    formType === "multiple_choice"
                      ? "var(--accent-gradient)"
                      : "transparent",
                  color:
                    formType === "multiple_choice"
                      ? "#ffffff"
                      : "var(--text-secondary)",
                  boxShadow:
                    formType === "multiple_choice"
                      ? "0 4px 15px rgba(99, 102, 241, 0.3)"
                      : "none",
                }}
              >
                Multiple Choice
              </button>
              <button
                type="button"
                onClick={() => setFormType("true_false")}
                className="btn"
                style={{
                  padding: "0.65rem 1rem",
                  fontSize: "0.9rem",
                  background:
                    formType === "true_false"
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : "transparent",
                  color:
                    formType === "true_false"
                      ? "#ffffff"
                      : "var(--text-secondary)",
                  boxShadow:
                    formType === "true_false"
                      ? "0 4px 15px rgba(16, 185, 129, 0.3)"
                      : "none",
                }}
              >
                True / False
              </button>
              <button
                type="button"
                onClick={() => setFormType("essay")}
                className="btn"
                style={{
                  padding: "0.65rem 1rem",
                  fontSize: "0.9rem",
                  background:
                    formType === "essay"
                      ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                      : "transparent",
                  color:
                    formType === "essay"
                      ? "#ffffff"
                      : "var(--text-secondary)",
                  boxShadow:
                    formType === "essay"
                      ? "0 4px 15px rgba(245, 158, 11, 0.3)"
                      : "none",
                }}
              >
                Essay / Free Text
              </button>
            </div>
          </div>

          {/* 2. Question Text */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">
              QUESTION TEXT <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <textarea
              required
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              rows={3}
              placeholder="Enter your question prompt here... e.g., What is the primary role of ribosomes in a cell?"
              className="input custom-scrollbar"
              style={{
                resize: "vertical",
                minHeight: "90px",
                fontSize: "1rem",
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* 3. Question Image URL + Live Preview */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label
              className="label"
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <span>QUESTION IMAGE URL (OPTIONAL)</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>
                Supports PNG, JPG, GIF, SVG
              </span>
            </label>
            <input
              type="url"
              value={formImage}
              onChange={(e) => setFormImage(e.target.value)}
              placeholder="https://example.com/illustration.png"
              className="input"
            />
            {formImage.trim() && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px dashed var(--border)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginBottom: "0.5rem",
                  }}
                >
                  IMAGE PREVIEW
                </div>
                <img
                  src={formImage.trim()}
                  alt="Preview"
                  style={{
                    maxHeight: "180px",
                    maxWidth: "100%",
                    objectFit: "contain",
                    margin: "0 auto",
                    borderRadius: "4px",
                  }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* 4. Points & Duration Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">
                POINTS <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={formPoints}
                onChange={(e) =>
                  setFormPoints(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="input"
              />
              <span
                style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
              >
                Score value for this question
              </span>
            </div>

            {durationMode === "per_question" ? (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">
                  DURATION (SECONDS) <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <input
                  type="number"
                  min={5}
                  required
                  value={formDuration}
                  onChange={(e) =>
                    setFormDuration(Math.max(5, parseInt(e.target.value) || 5))
                  }
                  className="input"
                />
                <span
                  style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                >
                  Per-question timer limit
                </span>
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label" style={{ color: "var(--text-muted)" }}>
                  DURATION (SECONDS)
                </label>
                <input
                  type="text"
                  disabled
                  value="Global Timer Mode Active"
                  className="input"
                  style={{
                    fontStyle: "italic",
                    background: "rgba(255, 255, 255, 0.02)",
                  }}
                />
                <span
                  style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                >
                  Controlled by quiz global duration
                </span>
              </div>
            )}
          </div>

          {/* ==================================================================
             TYPE-SPECIFIC ANSWER INPUTS
             ================================================================== */}
          <div
            style={{
              marginTop: "0.5rem",
              padding: "1.5rem",
              borderRadius: "var(--radius-lg)",
              background: "rgb(10 10 15 / 6%)",
              border: "1px solid #b5b5b5",
            }}
          >
            {/* A. MULTIPLE CHOICE BUILDER */}
            {formType === "multiple_choice" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <label className="label" style={{ marginBottom: 0 }}>
                    ANSWER OPTIONS <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Select the correct option(s) using the checkmark
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {formOptions.map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <div
                        key={optIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.65rem 0.85rem",
                          borderRadius: "var(--radius-md)",
                          background: opt.isCorrect
                            ? "rgba(34, 197, 94, 0.1)"
                            : "rgba(255, 255, 255, 0.02)",
                          border: `1px solid ${
                            opt.isCorrect
                              ? "rgba(34, 197, 94, 0.4)"
                              : "rgba(255, 255, 255, 0.08)"
                          }`,
                          transition: "all 0.2s ease",
                        }}
                      >
                        {/* Letter Indicator */}
                        <span
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: opt.isCorrect
                              ? "rgba(34, 197, 94, 0.25)"
                              : "rgba(255, 255, 255, 0.08)",
                            color: opt.isCorrect
                              ? "#1c9749"
                              : "var(--text-primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "0.9rem",
                            flexShrink: 0,
                          }}
                        >
                          {letter}
                        </span>

                        {/* Option Text Input */}
                        <input
                          type="text"
                          required
                          value={opt.optionText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormOptions((prev) =>
                              prev.map((item, idx) =>
                                idx === optIdx
                                  ? { ...item, optionText: val }
                                  : item
                              )
                            );
                          }}
                          placeholder={`Option ${letter} text...`}
                          className="input"
                          style={{
                            flex: 1,
                            background: "transparent",
                            border: "none",
                            padding: "0.5rem",
                          }}
                        />

                        {/* Correctness Selector Button */}
                        <button
                          type="button"
                          onClick={() => toggleOptionCorrectness(optIdx)}
                          className="btn btn-sm"
                          title="Toggle correct option"
                          style={{
                            padding: "0.45rem 0.85rem",
                            borderRadius: "var(--radius-full)",
                            background: opt.isCorrect
                              ? "rgba(34, 197, 94, 0.25)"
                              : "rgba(255, 255, 255, 0.06)",
                            color: opt.isCorrect
                              ? "#1c9749"
                              : "var(--text-secondary)",
                            border: `1px solid ${
                              opt.isCorrect
                                ? "rgba(34, 197, 94, 0.5)"
                                : "rgba(255, 255, 255, 0.12)"
                            }`,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {opt.isCorrect ? "Correct" : "Mark Correct"}
                        </button>

                        {/* Remove Option Button */}
                        <button
                          type="button"
                          onClick={() => removeOption(optIdx)}
                          disabled={formOptions.length <= 2}
                          className="btn btn-ghost btn-sm"
                          title="Remove option"
                          style={{
                            padding: "0.45rem 0.65rem",
                            color: "#e12727",
                            opacity: formOptions.length <= 2 ? 0.3 : 1,
                            cursor:
                              formOptions.length <= 2
                                ? "not-allowed"
                                : "pointer",
                            flexShrink: 0,
                          }}
                        >
                          X
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add Option CTA */}
                <button
                  type="button"
                  onClick={addOption}
                  className="btn btn-ghost btn-sm"
                  style={{
                    marginTop: "1rem",
                    width: "100%",
                    border: "1px dashed rgba(255, 255, 255, 0.2)",
                    padding: "0.75rem",
                    color: "var(--accent-hover)",
                  }}
                >
                  Add Another Option
                </button>
              </div>
            )}

            {/* B. TRUE / FALSE BUILDER */}
            {formType === "true_false" && (
              <div>
                <label
                  className="label"
                  style={{ marginBottom: "1rem", display: "block" }}
                >
                  SELECT CORRECT ANSWER{" "}
                  <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setFormCorrectAnswer("true")}
                    className="card card-hover"
                    style={{
                      padding: "1.5rem",
                      textAlign: "center",
                      background:
                        formCorrectAnswer === "true"
                          ? "rgba(16, 185, 129, 0.18)"
                          : "rgba(255, 255, 255, 0.03)",
                      border: `2px solid ${
                        formCorrectAnswer === "true"
                          ? "rgba(16, 185, 129, 0.6)"
                          : "rgba(255, 255, 255, 0.08)"
                      }`,
                      cursor: "pointer",
                      boxShadow:
                        formCorrectAnswer === "true"
                          ? "0 0 25px rgba(16, 185, 129, 0.2)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 800,
                        color:
                          formCorrectAnswer === "true"
                            ? "#34d399"
                            : "var(--text-primary)",
                      }}
                    >
                      True is Correct{" "}
                      {formCorrectAnswer === "true" && "(Selected)"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormCorrectAnswer("false")}
                    className="card card-hover"
                    style={{
                      padding: "1.5rem",
                      textAlign: "center",
                      background:
                        formCorrectAnswer === "false"
                          ? "rgba(16, 185, 129, 0.18)"
                          : "rgba(255, 255, 255, 0.03)",
                      border: `2px solid ${
                        formCorrectAnswer === "false"
                          ? "rgba(16, 185, 129, 0.6)"
                          : "rgba(255, 255, 255, 0.08)"
                      }`,
                      cursor: "pointer",
                      boxShadow:
                        formCorrectAnswer === "false"
                          ? "0 0 25px rgba(16, 185, 129, 0.2)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 800,
                        color:
                          formCorrectAnswer === "false"
                            ? "#34d399"
                            : "var(--text-primary)",
                      }}
                    >
                      False is Correct{" "}
                      {formCorrectAnswer === "false" && "(Selected)"}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* C. ESSAY BUILDER */}
            {formType === "essay" && (
              <div
                style={{
                  padding: "1.5rem",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  color: "#fbbf24",
                }}
              >
                <div>
                  <h4
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      marginBottom: "0.25rem",
                      color: "#928313",
                    }}
                  >
                    Manual Review Required
                  </h4>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      lineHeight: 1.5,
                      color: "#928313",
                      opacity: 0.9,
                    }}
                  >
                    Essay answers are not auto-graded. You will review and grade
                    student responses manually after quiz completion in the
                    grading dashboard.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "1rem",
              marginTop: "0.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="btn btn-secondary"
              style={{ padding: "0.75rem 1.5rem" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
              style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}
            >
              {isSaving ? "Saving..." : "Save Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
    </ModalPortal>
  );
};
