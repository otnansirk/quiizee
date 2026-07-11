"use client";

import React from "react";
import Link from "next/link";
import { QuizData } from "@/app/(dashboard)/teacher/quizzes/[quizId]/questions/page";

export interface QuizQuestionsHeaderProps {
  quiz: QuizData;
  totalQuestions: number;
  totalPoints: number;
  isPublishing: boolean;
  onPublishToggle: (targetState: boolean) => void;
  onOpenAIModal: () => void;
  onAddQuestion: () => void;
}

export const QuizQuestionsHeader: React.FC<QuizQuestionsHeaderProps> = ({
  quiz,
  totalQuestions,
  totalPoints,
  isPublishing,
  onPublishToggle,
  onOpenAIModal,
  onAddQuestion,
}) => {
  return (
    <header className="mb-10">
      <div className="mb-5">
        <Link
          href="/teacher/quizzes"
          className="btn btn-ghost btn-sm py-1.5 px-3 text-sm text-muted-foreground inline-flex items-center gap-1.5 rounded-full bg-white/5 hover:bg-white/10"
        >
          Back to Quizzes
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {quiz.title}
          </h1>

          {quiz.isPublished ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Draft
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {quiz.isPublished ? (
            <button
              onClick={() => onPublishToggle(false)}
              disabled={isPublishing}
              className="btn btn-secondary py-3 px-6 text-sm border-error/75 text-error font-bold hover:bg-error/10"
            >
              {isPublishing ? "Unpublishing..." : "Unpublish"}
            </button>
          ) : (
            <button
              onClick={() => onPublishToggle(true)}
              disabled={isPublishing}
              className="btn py-3 px-6 text-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/35 font-bold hover:brightness-110"
            >
              {isPublishing ? "Publishing..." : "Publish Quiz"}
            </button>
          )}

          <button
            onClick={onOpenAIModal}
            className="btn py-3 px-6 text-sm bg-gradient-to-br from-purple-600 to-indigo-500 text-white border-2 border-black shadow-[3px_3px_0px_#111827] font-bold hover:brightness-110"
          >
            ✨ AI Generate
          </button>

          <button
            onClick={onAddQuestion}
            className="btn btn-primary py-3 px-6 text-sm font-bold shadow-md shadow-primary/30"
          >
            Add Question
          </button>
        </div>
      </div>

      <div className="card py-6 px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 bg-[#222222] border border-white/20 shadow-2xl rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center text-2xl font-extrabold flex-shrink-0">
            Q
          </div>
          <div>
            <div className="text-xs text-zinc-300 font-bold tracking-wider uppercase">
              TOTAL QUESTIONS
            </div>
            <div className="text-2xl font-extrabold text-white">
              {totalQuestions}{" "}
              <span className="text-sm font-medium text-zinc-400">
                questions
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center text-2xl font-extrabold flex-shrink-0">
            P
          </div>
          <div>
            <div className="text-xs text-zinc-300 font-bold tracking-wider uppercase">
              TOTAL POINTS
            </div>
            <div className="text-2xl font-extrabold text-white">
              {totalPoints}{" "}
              <span className="text-sm font-medium text-zinc-400">
                pts
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-2xl font-extrabold flex-shrink-0">
            T
          </div>
          <div>
            <div className="text-xs text-zinc-300 font-bold tracking-wider uppercase">
              DURATION MODE
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="py-1 px-2.5 rounded text-xs font-bold bg-blue-500/25 text-blue-300 border border-blue-500/40">
                {quiz.durationMode === "global"
                  ? "Global Timer"
                  : "Per-Question Timer"}
              </span>
              {quiz.durationMode === "global" && quiz.globalDuration && (
                <span className="text-xs text-zinc-300 font-semibold">
                  ({quiz.globalDuration} min)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
