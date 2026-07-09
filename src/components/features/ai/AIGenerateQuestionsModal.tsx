"use client";

import React, { useState } from "react";
import { QuestionData, QuestionType } from "@/app/(dashboard)/teacher/quizzes/[quizId]/questions/page"; // We can define shared types or import
import { ModalPortal } from "@/components/atoms/ModalPortal";

export interface AIGenerateQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  onSuccess: (savedCount: number, failedCount: number) => void;
}

export const AIGenerateQuestionsModal: React.FC<AIGenerateQuestionsModalProps> = ({
  isOpen,
  onClose,
  quizId,
  onSuccess,
}) => {
  const [aiReferenceText, setAIReferenceText] = useState<string>("");
  const [aiQuestionCount, setAIQuestionCount] = useState<number>(5);
  const [aiDifficulty, setAIDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [aiTypes, setAITypes] = useState<QuestionType[]>(["multiple_choice", "true_false"]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiGeneratedQuestions, setAIGeneratedQuestions] = useState<QuestionData[]>([]);
  const [aiSelectedIndexes, setAISelectedIndexes] = useState<Set<number>>(new Set());
  const [isSavingAI, setIsSavingAI] = useState<boolean>(false);
  const [aiError, setAIError] = useState<string>("");
  const [aiStep, setAIStep] = useState<"input" | "review">("input");


  const toggleAIType = (t: QuestionType) => {
    setAITypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const toggleAISelect = (i: number) => {
    setAISelectedIndexes((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleAIGenerate = async () => {
    if (aiReferenceText.trim().length < 20) {
      setAIError("Please enter at least 20 characters of reference text.");
      return;
    }
    if (aiTypes.length === 0) {
      setAIError("Please select at least one question type.");
      return;
    }

    setIsGenerating(true);
    setAIError("");

    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceText: aiReferenceText,
          questionCount: aiQuestionCount,
          difficulty: aiDifficulty,
          types: aiTypes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate questions from AI.");
      }

      if (!data.questions || data.questions.length === 0) {
        throw new Error("AI did not return any valid questions. Please check your reference text or API key.");
      }

      setAIGeneratedQuestions(data.questions);
      setAISelectedIndexes(new Set(data.questions.map((_: any, idx: number) => idx)));
      setAIStep("review");
    } catch (err: any) {
      setAIError(err.message || "An unexpected error occurred during AI generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAISaveSelected = async () => {
    const toSave = aiGeneratedQuestions.filter((_, i) => aiSelectedIndexes.has(i));
    if (toSave.length === 0) {
      setAIError("Select at least one question to save.");
      return;
    }
    setIsSavingAI(true);
    setAIError("");
    let saved = 0;
    let failed = 0;
    for (const q of toSave) {
      try {
        const res = await fetch(`/api/quizzes/${quizId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(q),
        });
        if (res.ok) {
          saved++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
    setIsSavingAI(false);

    if (saved > 0) {
      onClose();
      setAIStep("input");
      setAIGeneratedQuestions([]);
      setAISelectedIndexes(new Set());
      setAIReferenceText("");
    }
    onSuccess(saved, failed);
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
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
          setAIStep("input");
        }
      }}
    >
      <div
        className="modal-content card"
        style={{
          width: "100%",
          maxWidth: "720px",
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
              ✨ AI Question Generator
            </h2>
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                marginTop: "0.15rem",
              }}
            >
              Paste your reference material and Gemini will generate quiz questions automatically.
            </p>
          </div>
          <button
            onClick={() => {
              onClose();
              setAIStep("input");
            }}
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
          {/* Step indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.75rem",
            padding: "0.75rem 1rem",
            background: "rgba(0, 0, 0, 0.25)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
          }}
        >
          {(["input", "review"] as const).map((step, i) => (
            <React.Fragment key={step}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    background:
                      aiStep === step
                        ? "var(--accent-gradient)"
                        : "rgba(255,255,255,0.07)",
                    color: aiStep === step ? "#fff" : "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    boxShadow:
                      aiStep === step
                        ? "0 0 12px rgba(99,102,241,0.4)"
                        : "none",
                  }}
                >
                  {i + 1}
                </div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color:
                      aiStep === step
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                  }}
                >
                  {step === "input" ? "Reference & Settings" : "Review & Save"}
                </span>
              </div>
              {i === 0 && (
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "1rem",
                    margin: "0 0.25rem",
                  }}
                >
                  →
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error Banner */}
        {aiError && (
          <div
            className="alert alert-error animate-fade-in"
            style={{ marginBottom: "1.5rem" }}
          >
            <span>{aiError}</span>
          </div>
        )}

        {/* ---- STEP 1: INPUT ---- */}
        {aiStep === "input" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* Reference text */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">
                REFERENCE TEXT / KNOWLEDGE BASE{" "}
                <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <textarea
                value={aiReferenceText}
                onChange={(e) => setAIReferenceText(e.target.value)}
                placeholder="Paste your lesson notes, textbook content, topic explanation, or any reference material here. Gemini will generate questions directly from this content..."
                rows={7}
                className="input custom-scrollbar"
                style={{
                  resize: "vertical",
                  minHeight: "140px",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                }}
              />
              <span
                style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
              >
                {aiReferenceText.length} characters · minimum 20 required
              </span>
            </div>

            {/* Question count + difficulty */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.25rem",
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">
                  NUMBER OF QUESTIONS:{" "}
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontWeight: 900,
                    }}
                  >
                    {aiQuestionCount}
                  </span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={aiQuestionCount}
                  onChange={(e) =>
                    setAIQuestionCount(Number(e.target.value))
                  }
                  className="input"
                  style={{
                    padding: "0.4rem 0",
                    cursor: "pointer",
                    accentColor: "var(--accent)",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: "0.2rem",
                  }}
                >
                  <span>1</span>
                  <span>10</span>
                  <span>20</span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">DIFFICULTY</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "0.5rem",
                    background: "rgba(0,0,0,0.3)",
                    padding: "0.4rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAIDifficulty(d)}
                      className="btn"
                      style={{
                        padding: "0.5rem 0.25rem",
                        fontSize: "0.82rem",
                        textTransform: "capitalize",
                        background:
                          aiDifficulty === d
                            ? d === "easy"
                              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                              : d === "medium"
                              ? "var(--accent-gradient)"
                              : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            : "transparent",
                        color:
                          aiDifficulty === d ? "#fff" : "var(--text-secondary)",
                        boxShadow:
                          aiDifficulty === d
                            ? "0 4px 12px rgba(99,102,241,0.3)"
                            : "none",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Question types */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">QUESTION TYPES TO GENERATE</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "0.75rem",
                  background: "rgba(0,0,0,0.3)",
                  padding: "0.4rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                }}
              >
                {([
                  { value: "multiple_choice", label: "Multiple Choice" },
                  { value: "true_false", label: "True / False" },
                  { value: "essay", label: "Essay" },
                ] as { value: QuestionType; label: string }[]).map((t) => {
                  const active = aiTypes.includes(t.value);
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleAIType(t.value)}
                      className="btn"
                      style={{
                        padding: "0.65rem 0.5rem",
                        fontSize: "0.88rem",
                        background: active
                          ? t.value === "true_false"
                            ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                            : t.value === "essay"
                            ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            : "var(--accent-gradient)"
                          : "transparent",
                        color: active ? "#ffffff" : "var(--text-secondary)",
                        boxShadow: active
                          ? "0 4px 15px rgba(99,102,241,0.3)"
                          : "none",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <span
                style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
              >
                Click to toggle. At least one type required.
              </span>
            </div>

            {/* Generate button */}
            <button
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className="btn btn-primary btn-block"
              style={{
                padding: "0.9rem",
                fontSize: "1rem",
                fontWeight: 800,
                opacity: isGenerating ? 0.7 : 1,
                cursor: isGenerating ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
              }}
            >
              {isGenerating ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid #fff",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Generating {aiQuestionCount} question{aiQuestionCount !== 1 ? "s" : ""}...
                </>
              ) : (
                <>
                  ✨ Generate {aiQuestionCount} Question{aiQuestionCount !== 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        )}

        {/* ---- STEP 2: REVIEW ---- */}
        {aiStep === "review" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {/* Toolbar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  margin: 0,
                }}
              >
                <span
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: 800,
                  }}
                >
                  {aiSelectedIndexes.size}
                </span>{" "}
                of {aiGeneratedQuestions.length} questions selected
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() =>
                    setAISelectedIndexes(
                      new Set(aiGeneratedQuestions.map((_, i) => i))
                    )
                  }
                  className="btn btn-ghost btn-sm"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setAISelectedIndexes(new Set())}
                  className="btn btn-ghost btn-sm"
                >
                  Deselect All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAIStep("input");
                    setAIGeneratedQuestions([]);
                    setAISelectedIndexes(new Set());
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  ← Re-generate
                </button>
              </div>
            </div>

            {/* Generated question list */}
            <div
              className="custom-scrollbar"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
                maxHeight: "400px",
                overflowY: "auto",
                paddingRight: "0.35rem",
              }}
            >
              {aiGeneratedQuestions.map((q, i) => {
                const selected = aiSelectedIndexes.has(i);
                const typeLabel =
                  q.type === "multiple_choice"
                    ? "Multiple Choice"
                    : q.type === "true_false"
                    ? "True / False"
                    : "Essay";
                const typeBg =
                  q.type === "multiple_choice"
                    ? "rgba(99,102,241,0.15)"
                    : q.type === "true_false"
                    ? "rgba(16,185,129,0.15)"
                    : "rgba(245,158,11,0.15)";
                const typeColor =
                  q.type === "multiple_choice"
                    ? "var(--accent-hover)"
                    : q.type === "true_false"
                    ? "#34d399"
                    : "#fbbf24";
                return (
                  <div
                    key={i}
                    onClick={() => toggleAISelect(i)}
                    className="card"
                    style={{
                      padding: "1rem 1.25rem",
                      cursor: "pointer",
                      border: selected
                        ? "1px solid rgba(99,102,241,0.5)"
                        : "1px solid var(--border)",
                      background: selected
                        ? "rgba(99,102,241,0.07)"
                        : "rgba(0,0,0,0.2)",
                      boxShadow: selected
                        ? "0 0 0 3px rgba(99,102,241,0.15)"
                        : "none",
                      transition: "all var(--transition-fast)",
                      display: "flex",
                      gap: "0.85rem",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "5px",
                        flexShrink: 0,
                        marginTop: "3px",
                        border: selected
                          ? "2px solid var(--accent)"
                          : "2px solid var(--border)",
                        background: selected ? "var(--accent)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selected && (
                        <span
                          style={{
                            color: "#fff",
                            fontSize: "0.7rem",
                            fontWeight: 900,
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.4rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          className="badge"
                          style={{
                            margin: 0,
                            fontSize: "0.7rem",
                            background: typeBg,
                            color: typeColor,
                            border: `1px solid ${typeColor}40`,
                          }}
                        >
                          {typeLabel}
                        </span>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            fontWeight: 600,
                          }}
                        >
                          Q{i + 1} · {q.points} pt{q.points !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p
                        style={{
                          color: "var(--text-primary)",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          margin: 0,
                          lineHeight: 1.55,
                        }}
                      >
                        {q.questionText}
                      </p>
                      {/* MC options preview */}
                      {q.type === "multiple_choice" &&
                        q.options &&
                        q.options.length > 0 && (
                          <div
                            style={{
                              marginTop: "0.5rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.2rem",
                            }}
                          >
                            {q.options.map((opt, oi) => (
                              <div
                                key={oi}
                                style={{
                                  fontSize: "0.8rem",
                                  color: opt.isCorrect
                                    ? "#34d399"
                                    : "var(--text-muted)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.4rem",
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: opt.isCorrect ? 700 : 400,
                                  }}
                                >
                                  {opt.isCorrect ? "✓" : "·"}
                                </span>
                                <span>{opt.optionText}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      {/* T/F answer */}
                      {q.type === "true_false" && q.correctAnswer && (
                        <div
                          style={{
                            marginTop: "0.4rem",
                            fontSize: "0.8rem",
                            color: "#34d399",
                            fontWeight: 600,
                          }}
                        >
                          Answer: {String(q.correctAnswer).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save button */}
            <button
              onClick={handleAISaveSelected}
              disabled={isSavingAI || aiSelectedIndexes.size === 0}
              className="btn btn-block"
              style={{
                padding: "0.9rem",
                fontSize: "1rem",
                fontWeight: 800,
                background:
                  aiSelectedIndexes.size === 0
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color:
                  aiSelectedIndexes.size === 0 ? "var(--text-muted)" : "#fff",
                boxShadow:
                  aiSelectedIndexes.size > 0
                    ? "0 4px 15px rgba(16,185,129,0.35)"
                    : "none",
                cursor:
                  isSavingAI || aiSelectedIndexes.size === 0
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all var(--transition-fast)",
                border: "none",
              }}
            >
              {isSavingAI
                ? "Saving to Quiz..."
                : `Add ${aiSelectedIndexes.size} Question${
                    aiSelectedIndexes.size !== 1 ? "s" : ""
                  } to Quiz`}
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
    </ModalPortal>
  );
};
