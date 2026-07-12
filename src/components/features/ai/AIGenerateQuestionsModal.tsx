"use client";

import React, { useState } from "react";
import { QuestionData, QuestionType } from "@/app/(dashboard)/teacher/quizzes/[quizId]/questions/page"; // We can define shared types or import
import { ModalPortal } from "@/components/atoms/ModalPortal";

export interface AIGenerateQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  onSuccess: (savedCount: number, failedCount: number) => void;
  quizHasSubmissions?: boolean;
  quizSubmissionsCount?: number;
}

export const AIGenerateQuestionsModal: React.FC<AIGenerateQuestionsModalProps> = ({
  isOpen,
  onClose,
  quizId,
  onSuccess,
  quizHasSubmissions = false,
  quizSubmissionsCount = 0,
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
          questionTypes: aiTypes,
        }),
      });

      const data = (await res.json()) as any;

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
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[1000]"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
            setAIStep("input");
          }
        }}
      >
        <div className="modal-content card w-full max-w-[720px] max-h-[90vh] flex flex-col overflow-hidden p-0 bg-secondary border border-white/10 shadow-2xl shadow-indigo-500/20">
          {/* Modal Header (Fixed at top) */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-secondary flex-shrink-0">
            <div>
              <h2 className="text-lg font-extrabold text-foreground">
                ✨ AI Question Generator
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Paste your reference material and Gemini will generate quiz questions automatically.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                setAIStep("input");
              }}
              className="btn btn-ghost btn-sm px-2 py-1 text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Modal Body */}
          <div className="custom-scrollbar overflow-y-auto flex-1 p-5 px-6 pb-7">
            {/* Block AI Generate if Quiz Has Submissions */}
            {quizHasSubmissions && (
              <div className="p-4 mb-6 rounded-xl bg-error/15 border border-error/40 text-error flex items-start gap-3 shadow-md bg-red-200">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-xs leading-relaxed text-error">
                  <span className="font-bold block mb-0.5 text-sm uppercase tracking-wider">
                    Action Blocked: Quiz Has Past Submissions ({quizSubmissionsCount || 1})
                  </span>
                  You cannot add brand new questions to this quiz because student(s) have already submitted attempts. Adding new questions would alter the total question count and corrupt historical attempt grading records.
                </div>
              </div>
            )}

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-7 p-3 bg-gray-300 rounded-xl border-black border-2">
              {(["input", "review"] as const).map((step, i) => (
                <React.Fragment key={step}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-[26px] h-[26px] rounded-full flex-shrink-0 flex items-center justify-center text-xs font-extrabold transition-all ${
                        aiStep === step
                          ? "bg-primary text-white shadow-md shadow-primary/40"
                          : "bg-white/80 text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        aiStep === step
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step === "input" ? "Reference & Settings" : "Review & Save"}
                    </span>
                  </div>
                  {i === 0 && (
                    <span className="text-muted-foreground text-base mx-1">
                      →
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Error Banner */}
            {aiError && (
              <div className="alert alert-error animate-fade-in mb-6">
                <span>{aiError}</span>
              </div>
            )}

            {/* ---- STEP 1: INPUT ---- */}
            {aiStep === "input" && (
              <div className="flex flex-col gap-6">
                {/* Reference text */}
                <div className="form-group mb-0">
                  <label className="label">
                    REFERENCE TEXT / KNOWLEDGE BASE{" "}
                    <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={aiReferenceText}
                    onChange={(e) => setAIReferenceText(e.target.value)}
                    placeholder="Paste your lesson notes, textbook content, topic explanation, or any reference material here. Gemini will generate questions directly from this content..."
                    rows={7}
                    className="input custom-scrollbar min-h-[140px] text-sm leading-relaxed resize-y"
                  />
                  <span className="text-xs text-muted-foreground">
                    {aiReferenceText.length} characters · minimum 20 required
                  </span>
                </div>

                {/* Question count + difficulty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="form-group mb-0">
                    <label className="label">
                      NUMBER OF QUESTIONS:{" "}
                      <span className="text-foreground font-black">
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
                      className="input py-1.5 cursor-pointer accent-accent"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1</span>
                      <span>10</span>
                      <span>20</span>
                    </div>
                  </div>

                  <div className="form-group mb-0">
                    <label className="label">DIFFICULTY</label>
                    <div className="grid grid-cols-3 gap-2 p-1.5 rounded-lg">
                      {(["easy", "medium", "hard"] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setAIDifficulty(d)}
                          className={`btn py-2 px-1 text-xs capitalize transition-all ${
                            aiDifficulty === d
                              ? d === "easy"
                                ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30"
                                : d === "medium"
                                ? "bg-primary text-white shadow-md shadow-primary/30"
                                : "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30"
                              : "bg-transparent text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Question types */}
                <div className="form-group mb-0">
                  <label className="label">QUESTION TYPES TO GENERATE</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                          className={`btn py-2.5 px-2 text-xs transition-all ${
                            active
                              ? t.value === "true_false"
                                ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30"
                                : t.value === "essay"
                                ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30"
                                : "bg-primary text-white shadow-md shadow-primary/30"
                              : "bg-transparent text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Click to toggle. At least one type required.
                  </span>
                </div>

                {/* Generate button or Close when blocked */}
                {quizHasSubmissions ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setAIStep("input");
                    }}
                    className="btn btn-secondary btn-block py-3.5 text-base font-extrabold cursor-pointer"
                  >
                    Close
                  </button>
                ) : (
                  <button
                    onClick={handleAIGenerate}
                    disabled={isGenerating}
                    className={`btn btn-primary btn-block py-3.5 text-base font-extrabold flex items-center justify-center gap-2.5 ${
                      isGenerating ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating {aiQuestionCount} question{aiQuestionCount !== 1 ? "s" : ""}...
                      </>
                    ) : (
                      <>
                        ✨ Generate {aiQuestionCount} Question{aiQuestionCount !== 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* ---- STEP 2: REVIEW ---- */}
            {aiStep === "review" && (
              <div className="flex flex-col gap-5">
                {/* Toolbar */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-muted-foreground text-sm m-0">
                    <span className="text-foreground font-extrabold">
                      {aiSelectedIndexes.size}
                    </span>{" "}
                    of {aiGeneratedQuestions.length} questions selected
                  </p>
                  <div className="flex gap-2">
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
                      Re-generate
                    </button>
                  </div>
                </div>

                {/* Generated question list */}
                <div className="custom-scrollbar flex flex-col gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {aiGeneratedQuestions.map((q, i) => {
                    const selected = aiSelectedIndexes.has(i);
                    const typeLabel =
                      q.type === "multiple_choice"
                        ? "Multiple Choice"
                        : q.type === "true_false"
                        ? "True / False"
                        : "Essay";
                    const badgeClass =
                      q.type === "multiple_choice"
                        ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
                        : q.type === "true_false"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/30";
                    return (
                      <div
                        key={i}
                        onClick={() => toggleAISelect(i)}
                        className={`card p-4 cursor-pointer transition-all flex gap-3.5 items-start border ${
                          selected
                            ? "border-indigo-500/50 bg-indigo-500/10 shadow-md shadow-indigo-500/10"
                            : "border-border bg-black/20"
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded mt-1 flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                            selected
                              ? "border-accent bg-accent text-white"
                              : "border-border bg-transparent"
                          }`}
                        >
                          {selected && (
                            <span className="text-[0.7rem] font-black">
                              ✓
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`badge m-0 text-xs border ${badgeClass}`}>
                              {typeLabel}
                            </span>
                            <span className="text-xs text-muted-foreground font-semibold">
                              Q{i + 1} · {q.points} pt{q.points !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <p className="text-foreground text-sm font-semibold m-0 leading-relaxed">
                            {q.questionText}
                          </p>
                          {/* MC options preview */}
                          {q.type === "multiple_choice" &&
                            q.options &&
                            q.options.length > 0 && (
                              <div className="mt-2 flex flex-col gap-1">
                                {q.options.map((opt, oi) => (
                                  <div
                                    key={oi}
                                    className={`text-xs flex items-center gap-1.5 ${
                                      opt.isCorrect
                                        ? "text-emerald-400 font-bold"
                                        : "text-muted-foreground font-normal"
                                    }`}
                                  >
                                    <span>
                                      {opt.isCorrect ? "✓" : "·"}
                                    </span>
                                    <span>{opt.optionText}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          {/* T/F answer */}
                          {q.type === "true_false" && q.correctAnswer && (
                            <div className="mt-1.5 text-xs text-emerald-400 font-semibold">
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
                  className={`btn btn-block py-3.5 text-base font-extrabold flex items-center justify-center gap-2 transition-all border-none ${
                    aiSelectedIndexes.size === 0
                      ? "bg-white/5 text-muted-foreground cursor-not-allowed"
                      : "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 cursor-pointer"
                  }`}
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
