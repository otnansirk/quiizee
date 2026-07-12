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
  let badgeClass = "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
  let typeLabel = "Multiple Choice";
  let borderLeftClass = "border-l-indigo-500";

  if (q.type === "true_false") {
    badgeClass = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    typeLabel = "True or False";
    borderLeftClass = "border-l-emerald-500";
  } else if (q.type === "essay") {
    badgeClass = "bg-amber-500/15 text-yellow-600 border-amber-500/30";
    typeLabel = "Essay / Free Text";
    borderLeftClass = "border-l-amber-500";
  }

  return (
    <div className={`card card-hover p-4 sm:p-7 flex flex-col gap-3.5 sm:gap-5 border-l-4 ${borderLeftClass}`}>
      {/* Card Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-base sm:text-lg font-extrabold text-foreground bg-white/10 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-md">
            Question #{idx + 1}
          </span>

          {/* Type Badge */}
          <span className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[0.7rem] sm:text-xs font-bold border ${badgeClass}`}>
            {typeLabel}
          </span>

          {/* Points Badge */}
          <span className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-white/5 text-foreground border border-white/15 text-[0.7rem] sm:text-xs font-semibold">
            {q.points} {q.points === 1 ? "pt" : "pts"}
          </span>

          {/* Duration Badge (if per-question mode) */}
          {durationMode === "per_question" && q.duration && (
            <span className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[0.7rem] sm:text-xs font-semibold">
              {q.duration}s
            </span>
          )}

        </div>

        {/* Card Actions (Reorder, Edit, Delete) */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className={`btn btn-ghost btn-sm px-2 py-1 sm:px-2.5 sm:py-1.5 text-[0.65rem] sm:text-xs font-bold ${
              isFirst ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
            }`}
            title="Move question up"
          >
            UP
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className={`btn btn-ghost btn-sm px-2 py-1 sm:px-2.5 sm:py-1.5 text-[0.65rem] sm:text-xs font-bold ${
              isLast ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
            }`}
            title="Move question down"
          >
            DOWN
          </button>

          <div className="w-[1px] h-5 bg-border mx-0.5 sm:mx-1 hidden sm:block" />

          <button
            onClick={onEdit}
            className="btn btn-secondary btn-sm px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs sm:text-sm font-semibold"
          >
            Edit
          </button>

          <button
            onClick={onDelete}
            className="btn btn-danger btn-sm px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs sm:text-sm text-error bg-error/10 hover:bg-error/20 font-semibold"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Question Text & Optional Image */}
      <div>
        <p className={`text-base sm:text-lg font-semibold text-foreground leading-relaxed whitespace-pre-wrap ${q.questionImage ? "mb-3 sm:mb-4" : "mb-0"}`}>
          {q.questionText}
        </p>

        {q.questionImage && (
          <div className="mt-2.5 sm:mt-3 rounded-xl overflow-hidden border border-white/10 max-w-[500px] bg-black/30">
            <img
              src={q.questionImage}
              alt="Question illustration"
              className="w-full max-h-[220px] sm:max-h-[280px] object-contain block"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Type-Specific Answer Details */}
      <div className="mt-1">
        {/* MULTIPLE CHOICE DETAILS */}
        {q.type === "multiple_choice" && q.options && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
            {q.options
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((opt, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                return (
                  <div
                    key={opt.id || optIdx}
                    className={`p-2.5 sm:p-3.5 px-3 sm:px-4 rounded-xl flex items-center justify-between gap-2 sm:gap-3 transition-all border border-black border-2 ${
                      opt.isCorrect
                        ? "bg-success"
                        : "bg-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <span
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex-shrink-0 flex items-center justify-center font-bold text-xs sm:text-sm bg-white ${
                          opt.isCorrect
                            ? "text-success"
                            : "text-black"
                        }`}
                      >
                        {letter}
                      </span>
                      <span
                        className={`text-xs sm:text-sm break-words min-w-0 ${
                          opt.isCorrect
                            ? "text-white font-extrabold"
                            : "text-foreground font-normal"
                        }`}
                      >
                        {opt.optionText}
                      </span>
                    </div>

                    {opt.isCorrect && (
                      <span className="px-2 py-0.5 sm:px-2.5 rounded-full bg-white text-success text-[0.65rem] sm:text-xs font-bold inline-flex items-center gap-1 flex-shrink-0">
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
          <div className="p-4 rounded-xl bg-success border-2 border-border inline-flex items-center gap-3 text-white font-bold text-sm">
            <span>Correct Answer:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white text-success text-xs font-bold inline-flex items-center gap-1">
              {q.correctAnswer === "false"
                ? "False (Correct)"
                : "True (Correct)"}
            </span>
          </div>
        )}

        {/* ESSAY DETAILS */}
        {q.type === "essay" && (
          <div className="p-3.5 px-5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-3 text-yellow-600 text-sm font-medium">
            <span>
              <strong className="font-bold">Manual grading required:</strong> Teacher review is needed
              to evaluate student responses after quiz completion.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
