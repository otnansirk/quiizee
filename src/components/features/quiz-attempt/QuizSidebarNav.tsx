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
      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-foreground">
            Question Navigation
          </h3>
          <span className="badge badge-accent m-0 text-xs font-bold">
            {questions.length} Qs
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-5 leading-normal">
          Click any number to jump directly to that question.
        </p>

        {/* Grid of Numbered Buttons */}
        <div className="grid grid-cols-5 gap-2.5">
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
                className={`question-nav-btn relative ${btnClass}`}
                title={`Question ${idx + 1} (${q.type.replace(
                  "_",
                  " "
                )}) - ${isAnswered ? "Answered" : "Unanswered"}`}
              >
                <span>{idx + 1}</span>
                {isAnswered && !isActive && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Summary Counter & Progress Bar */}
        <div className="mt-6 pt-5 border-t border-border">
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-muted-foreground font-semibold">
              Completion
            </span>
            <span className="font-extrabold text-foreground">
              {answeredCount} / {totalCount} answered
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              style={{ width: `${progressPct}%` }}
              className="h-full bg-gradient-to-r from-green-300 to-green-500 transition-all duration-300 rounded-full"
            />
          </div>
          <div className="flex justify-between mt-4 text-xs text-zinc-400 font-semibold">
            <span className="flex items-center gap-1 text-emerald-400 font-extrabold">
              Answered
            </span>
            <span className="flex items-center gap-1 text-muted-foreground font-extrabold">
              Unanswered
            </span>
            <span className="flex items-center gap-1 text-indigo-400 font-extrabold">
              Active
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
