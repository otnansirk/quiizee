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
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[1000]">
        <div className="modal-content card w-full max-w-[760px] max-h-[90vh] flex flex-col overflow-hidden p-0 bg-secondary border border-white/10 shadow-2xl shadow-indigo-500/20">
          {/* Modal Header (Fixed at top) */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-secondary flex-shrink-0">
            <div>
              <h2 className="text-lg font-extrabold text-foreground">
                {questionToEdit
                  ? `Edit Question #${questionToEdit.order || ""}`
                  : "Add New Question"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure your question text, type, points, and grading rules.
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm px-2 py-1 text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Modal Body */}
          <div className="custom-scrollbar overflow-y-auto flex-1 p-5 px-6 pb-7">
            {/* Error Banner */}
            {formError && (
              <div className="alert alert-error animate-fade-in mb-6">
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSaveQuestion} className="flex flex-col gap-6">
              {/* 1. Question Type Selector */}
              <div>
                <label className="label mb-3 block">
                  QUESTION TYPE
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-1.5">
                  <button
                    type="button"
                    onClick={() => setFormType("multiple_choice")}
                    className={`btn py-2.5 px-4 text-sm font-semibold transition-all ${
                      formType === "multiple_choice"
                        ? "bg-primary text-white shadow-md shadow-primary/30"
                        : "bg-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Multiple Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("true_false")}
                    className={`btn py-2.5 px-4 text-sm font-semibold transition-all ${
                      formType === "true_false"
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30"
                        : "bg-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    True / False
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("essay")}
                    className={`btn py-2.5 px-4 text-sm font-semibold transition-all ${
                      formType === "essay"
                        ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30"
                        : "bg-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Essay / Free Text
                  </button>
                </div>
              </div>

              {/* 2. Question Text */}
              <div className="form-group mb-0">
                <label className="label">
                  QUESTION TEXT <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  rows={3}
                  placeholder="Enter your question prompt here... e.g., What is the primary role of ribosomes in a cell?"
                  className="input custom-scrollbar min-h-[90px] text-base leading-relaxed resize-y"
                />
              </div>

              {/* 3. Question Image URL + Live Preview */}
              <div className="form-group mb-0">
                <label className="label flex justify-between">
                  <span>QUESTION IMAGE URL (OPTIONAL)</span>
                  <span className="font-normal text-muted-foreground">
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
                  <div className="mt-3 p-3 rounded-xl bg-black/30 border border-dashed border-border text-center">
                    <div className="text-xs text-muted-foreground font-semibold mb-2">
                      IMAGE PREVIEW
                    </div>
                    <img
                      src={formImage.trim()}
                      alt="Preview"
                      className="max-h-[180px] max-w-full object-contain mx-auto rounded"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 4. Points & Duration Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="label">
                    POINTS <span className="text-error">*</span>
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
                  <span className="text-xs text-muted-foreground">
                    Score value for this question
                  </span>
                </div>

                {durationMode === "per_question" ? (
                  <div className="form-group mb-0">
                    <label className="label">
                      DURATION (SECONDS) <span className="text-error">*</span>
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
                    <span className="text-xs text-muted-foreground">
                      Per-question timer limit
                    </span>
                  </div>
                ) : (
                  <div className="form-group mb-0">
                    <label className="label text-muted-foreground">
                      DURATION (SECONDS)
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Global Timer Mode Active"
                      className="input italic bg-white/5"
                    />
                    <span className="text-xs text-muted-foreground">
                      Controlled by quiz global duration
                    </span>
                  </div>
                )}
              </div>

              {/* ==================================================================
                 TYPE-SPECIFIC ANSWER INPUTS
                 ================================================================== */}
              <div className="mt-2 p-6 card">
                {/* A. MULTIPLE CHOICE BUILDER */}
                {formType === "multiple_choice" && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="label mb-0">
                        ANSWER OPTIONS <span className="text-error">*</span>
                      </label>
                      <span className="text-xs text-muted-foreground">
                        Select the correct option(s) using the checkmark
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {formOptions.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-3 p-2.5 px-3.5 rounded-xl transition-all border ${
                              opt.isCorrect
                                ? "bg-emerald-500/15 border-emerald-500/40"
                                : "bg-white/5 border-white/10"
                            }`}
                          >
                            {/* Letter Indicator */}
                            <span
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm flex-shrink-0 ${
                                opt.isCorrect
                                  ? "bg-emerald-500/25 text-success"
                                  : "bg-white/10 text-foreground"
                              }`}
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
                              className="input flex-1 bg-transparent border-none p-2"
                            />

                            {/* Correctness Selector Button */}
                            <button
                              type="button"
                              onClick={() => toggleOptionCorrectness(optIdx)}
                              className={`btn px-3.5 py-2 rounded-full text-xs font-bold flex-shrink-0 border ${
                                opt.isCorrect
                                  ? "btn-success"
                                  : "btn-secondary"
                              }`}
                              title="Toggle correct option"
                            >
                              {opt.isCorrect ? "Correct" : "Mark Correct"}
                            </button>

                            {/* Remove Option Button */}
                            <button
                              type="button"
                              onClick={() => removeOption(optIdx)}
                              disabled={formOptions.length <= 2}
                              className={`btn btn-danger btn-sm px-2.5 py-2 text-error font-bold ${
                                formOptions.length <= 2
                                  ? "opacity-30 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                              title="Remove option"
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
                      className="btn btn-secondary btn-sm mt-4 w-full border border-dashed border-white/20 p-3 text-accent hover:text-primary font-semibold"
                    >
                      Add Another Option
                    </button>
                  </div>
                )}

                {/* B. TRUE / FALSE BUILDER */}
                {formType === "true_false" && (
                  <div>
                    <label className="label mb-4 block">
                      SELECT CORRECT ANSWER <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormCorrectAnswer("true")}
                        className={`card card-hover p-6 text-center transition-all border-2 ${
                          formCorrectAnswer === "true"
                            ? "bg-emerald-500/20 border-emerald-500/60 shadow-lg shadow-emerald-500/20"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div
                          className={`text-lg font-extrabold ${
                            formCorrectAnswer === "true"
                              ? "text-emerald-400"
                              : "text-foreground"
                          }`}
                        >
                          True is Correct {formCorrectAnswer === "true" && "(Selected)"}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormCorrectAnswer("false")}
                        className={`card card-hover p-6 text-center transition-all border-2 ${
                          formCorrectAnswer === "false"
                            ? "bg-emerald-500/20 border-emerald-500/60 shadow-lg shadow-emerald-500/20"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div
                          className={`text-lg font-extrabold ${
                            formCorrectAnswer === "false"
                              ? "text-emerald-400"
                              : "text-foreground"
                          }`}
                        >
                          False is Correct {formCorrectAnswer === "false" && "(Selected)"}
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* C. ESSAY BUILDER */}
                {formType === "essay" && (
                  <div className="p-6 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-4 text-amber-300">
                    <div>
                      <h4 className="text-base font-bold mb-1 text-yellow-600">
                        Manual Review Required
                      </h4>
                      <p className="text-sm leading-relaxed text-yellow-600 font-medium">
                        Essay answers are not auto-graded. You will review and grade
                        student responses manually after quiz completion in the
                        grading dashboard.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-4 mt-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="btn btn-secondary py-3 px-6 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary py-3 px-8 text-base font-bold shadow-lg shadow-primary/30"
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
