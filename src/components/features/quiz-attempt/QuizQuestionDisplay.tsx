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
    <div className="card animate-fade-in p-6 sm:p-10 flex flex-col min-h-[400px]">
      {/* Header: Question X of Y | Type Badge | Points Badge */}
      <div className="flex justify-between items-center flex-wrap gap-4 pb-5 border-b border-border mb-7">
        <div>
          <span className="text-xl font-extrabold text-foreground">
            Question {currentQuestionIndex + 1}{" "}
          </span>
          <span className="text-base text-muted-foreground font-semibold">
            of {totalQuestions}
          </span>
        </div>

        <div className="flex gap-2.5 items-center">
          <span className="badge badge-info m-0 font-bold">
            {currentQuestion.type === "multiple_choice"
              ? "Multiple Choice"
              : currentQuestion.type === "true_false"
              ? "True or False"
              : "Essay"}
          </span>
          <span className="badge badge-accent m-0 font-extrabold">
            {currentQuestion.points} pt
            {currentQuestion.points === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Question Text */}
      <h2 className="text-lg sm:text-2xl font-bold text-foreground leading-relaxed mb-5">
        {currentQuestion.questionText}
      </h2>

      {/* Question Image Preview */}
      {currentQuestion.questionImage && (
        <div className="mb-8 rounded-2xl overflow-hidden border border-border max-h-[420px] flex justify-center bg-black/40 p-4">
          <img
            src={currentQuestion.questionImage}
            alt={`Question ${currentQuestionIndex + 1} Figure`}
            className="max-w-full max-h-[380px] object-contain rounded-lg"
          />
        </div>
      )}

      {/* Interactive Answer Inputs */}
      <div className="flex-1 mb-10">
        {/* 1. Multiple Choice */}
        {currentQuestion.type === "multiple_choice" &&
          currentQuestion.options && (
            <div className="flex flex-col gap-4">
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
                    className={`choice-card flex flex-row items-center gap-5 p-5 border rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? "selected border-primary bg-indigo-500/15 shadow-lg shadow-indigo-500/25"
                        : "border-border bg-secondary/60 hover:border-foreground/30"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-base flex-shrink-0 transition-all ${
                        isSelected
                          ? "bg-primary text-white border-none"
                          : "bg-white/10 text-muted-foreground border border-border"
                      }`}
                    >
                      {letter}
                    </div>
                    <div
                      className={`flex-1 text-lg leading-snug ${
                        isSelected
                          ? "text-primary font-extrabold"
                          : "text-foreground font-normal"
                      }`}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className={`choice-card flex flex-col items-center justify-center py-10 px-4 text-center gap-2.5 border rounded-xl transition-all cursor-pointer ${
                      isTrueSelected
                        ? "selected border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/25"
                        : "border-border bg-secondary/60 hover:border-foreground/30"
                    }`}
                  >
                    <div
                      className={`text-2xl font-extrabold ${
                        isTrueSelected
                          ? "text-emerald-400"
                          : "text-foreground"
                      }`}
                    >
                      True
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      onSelectTrueFalse(currentQuestion.id, "false")
                    }
                    className={`choice-card flex flex-col items-center justify-center py-10 px-4 text-center gap-2.5 border rounded-xl transition-all cursor-pointer ${
                      isFalseSelected
                        ? "selected border-error bg-error/15 shadow-lg shadow-error/25"
                        : "border-border bg-secondary/60 hover:border-foreground/30"
                    }`}
                  >
                    <div
                      className={`text-2xl font-extrabold ${
                        isFalseSelected
                          ? "text-error"
                          : "text-foreground"
                      }`}
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
          <div className="flex flex-col">
            <textarea
              rows={7}
              placeholder="Type your comprehensive answer here..."
              value={answers[currentQuestion.id]?.answerText || ""}
              onChange={(e) =>
                onEssayChange(currentQuestion.id, e.target.value)
              }
              onBlur={(e) => onEssayBlur(currentQuestion.id, e.target.value)}
              className="input w-full p-5 text-lg leading-relaxed bg-secondary/70 resize-y min-h-[180px] rounded-2xl border border-border focus:border-primary focus:outline-none"
            />
            {/* Saving Status Indicator */}
            <div className="flex justify-end items-center mt-3 min-h-[1.5rem] text-sm font-semibold">
              {savingStatus[currentQuestion.id] === "saving" && (
                <span className="text-muted-foreground flex items-center gap-1.5">
                  Saving response...
                </span>
              )}
              {savingStatus[currentQuestion.id] === "saved" && (
                <span className="text-green-600 flex items-center gap-1.5">
                  Saved securely
                </span>
              )}
              {savingStatus[currentQuestion.id] === "error" && (
                <span className="text-error flex items-center gap-1.5">
                  Error saving. Will retry on next edit.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Footer inside Card */}
      <div className="border-t border-border pt-4 flex justify-between items-center flex-wrap gap-3">
        {durationMode !== "per_question" ? (
          <button
            onClick={onPrevQuestion}
            disabled={currentQuestionIndex === 0}
            className="btn btn-secondary nav-btn-prev font-bold px-6 py-2"
          >
            Prev
          </button>
        ) : (
          <div />
        )}

        <div className="text-sm text-muted-foreground font-semibold">
          <strong className="text-foreground">
            {currentQuestionIndex + 1}
          </strong>
          {" / "}
          <strong className="text-foreground">
            {totalQuestions}
          </strong>
        </div>

        {currentQuestionIndex < totalQuestions - 1 ? (
          <button
            onClick={onNextQuestion}
            className="btn btn-primary nav-btn-next font-bold px-6 py-2 shadow-md shadow-primary/30"
          >
            Next
          </button>
        ) : (
          <button
            onClick={onReviewSubmit}
            className="btn btn-primary nav-btn-next font-bold px-6 py-2 bg-gradient-to-br from-purple-600 to-indigo-500 shadow-lg shadow-purple-500/50"
          >
            Review & Submit
          </button>
        )}
      </div>
    </div>
  );
};
