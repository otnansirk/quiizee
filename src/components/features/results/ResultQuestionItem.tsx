"use client";

import React from "react";
import { FormattedText } from "@/components/atoms/FormattedText";

export interface ResultQuestionItemProps {
  question: {
    id: string;
    questionNumber?: number;
    text: string;
    type: "multiple_choice" | "true_false" | "essay";
    points: number;
    imageUrl?: string | null;
    options?: { id: string; text: string; isCorrect?: boolean }[];
    correctAnswer?: string | boolean | null;
  };
  answer: any;
  index: number;
}

export const ResultQuestionItem: React.FC<ResultQuestionItemProps> = ({
  question: q,
  answer: ans,
  index,
}) => {
  const qNum = q.questionNumber || index + 1;

  // Determine points earned styling
  const isAnsCorrect = q.type !== "essay" && ans?.isCorrect === true;
  const isAnsIncorrect = q.type !== "essay" && ans?.isCorrect === false;
  const isAnsPending =
    q.type === "essay"
      ? !ans || ans.score === null || ans.score === undefined
      : !ans || ans.isCorrect === null || ans.isCorrect === undefined;

  let ptsBadgeStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.08)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
  };
  let ptsText = `${
    ans?.score !== null && ans?.score !== undefined ? ans.score : "Pending"
  } / ${q.points} pts`;

  if (q.type === "essay") {
    if (!isAnsPending) {
      ptsBadgeStyle = {
        background: "rgba(34, 197, 94, 0.15)",
        color: "#43c372",
        border: "1px solid rgba(34, 197, 94, 0.4)",
      };
      ptsText = `${ans?.score} / ${q.points} pts`;
    } else {
      ptsBadgeStyle = {
        background: "rgba(245, 158, 11, 0.15)",
        color: "#776610",
        border: "1px solid rgba(245, 158, 11, 0.4)",
      };
      ptsText = `Pending / ${q.points} pts`;
    }
  } else if (isAnsCorrect) {
    ptsBadgeStyle = {
      background: "rgba(34, 197, 94, 0.15)",
      color: "#43c372",
      border: "1px solid rgba(34, 197, 94, 0.4)",
    };
    ptsText = `${q.points} / ${q.points} pts`;
  } else if (isAnsIncorrect) {
    ptsBadgeStyle = {
      background: "rgba(239, 68, 68, 0.15)",
      color: "#e12727",
      border: "1px solid rgba(239, 68, 68, 0.4)",
    };
    ptsText = `0 / ${q.points} pts`;
  }

  // Type label
  const typeLabel =
    q.type === "multiple_choice"
      ? "Multiple Choice"
      : q.type === "true_false"
      ? "True / False"
      : "Essay Question";

  return (
    <div
      key={q.id || index}
      className={`card results-q-card p-4 sm:p-6 transition-all border-2 ${
        isAnsCorrect
          ? "border-emerald-500/40 bg-emerald-500/5"
          : isAnsIncorrect
          ? "border-error/40 bg-error/5"
          : "border-border"
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-secondary border border-border px-3 py-1 rounded-md font-bold text-sm text-foreground">
            #{qNum}
          </span>
          <span className="badge m-0 text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
            {typeLabel}
          </span>
        </div>

        <div
          className="badge m-0 text-xs font-bold px-2 py-0.5"
          style={ptsBadgeStyle}
        >
          {ptsText}
        </div>
      </div>

      {/* Question Text */}
      <div className="results-q-text text-base sm:text-lg font-semibold text-foreground mb-3 leading-relaxed">
        <FormattedText text={q.text} />
      </div>

      {/* Image Preview if exists */}
      {q.imageUrl && (
        <div className="mb-6 rounded-lg overflow-hidden border border-border max-w-[600px]">
          <img
            src={q.imageUrl}
            alt={`Question ${qNum} illustration`}
            className="w-full h-auto block"
          />
        </div>
      )}

      {/* Answer Renderers by Type */}
      <div className="mt-2">
        {/* MULTIPLE CHOICE */}
        {q.type === "multiple_choice" && q.options && (
          <div className="flex flex-col gap-2.5">
            {q.options.map((opt) => {
              const isSelected = ans?.selectedOptionId === opt.id;
              const isThisOptionCorrect =
                opt.isCorrect === true ||
                q.correctAnswer === opt.id ||
                q.correctAnswer === opt.text;

              let optionClass = "bg-secondary/60 border-2 border-gray-300 text-foreground";
              let statusIcon: React.ReactNode = null;

              if (isSelected && isThisOptionCorrect) {
                optionClass = "bg-emerald-500/20 border-2 border-emerald-500 text-green-600 font-bold";
                statusIcon = (
                  <span className="text-xs font-bold whitespace-nowrap">
                    ✓ Correct
                  </span>
                );
              } else if (isSelected && !isThisOptionCorrect) {
                optionClass = "bg-red-200/20 border-2 border-error text-error font-bold";
                statusIcon = (
                  <span className="text-xs text-error font-bold whitespace-nowrap">
                    ✗ Wrong
                  </span>
                );
              } else if (!isSelected && isThisOptionCorrect) {
                optionClass = "bg-emerald-500/10 border-emerald-500/50 border-dashed text-emerald-500 font-semibold";
                statusIcon = (
                  <span className="text-xs text-emerald-500 font-semibold whitespace-nowrap">
                    ✓ Correct Ans
                  </span>
                );
              }

              return (
                <div
                  key={opt.id}
                  className={`border rounded-md p-3 flex items-center justify-between gap-2 mb-1 transition-all ${optionClass}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isSelected
                          ? "border-gray-800 bg-current text-black dark:text-white"
                          : "border-gray-400 bg-transparent"
                      }`}
                    />
                    <div
                      className={`text-sm sm:text-base ${
                        isSelected || isThisOptionCorrect ? "font-semibold" : "font-normal"
                      }`}
                    >
                      <FormattedText text={opt.text} inline />
                    </div>
                  </div>
                  {statusIcon && (
                    <div className="flex-shrink-0">{statusIcon}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TRUE / FALSE */}
        {q.type === "true_false" && (
          <div className="border border-border rounded-md p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground uppercase font-bold block mb-1">
                Your Submitted Answer
              </span>
              <div
                className={`flex items-center gap-2 text-base font-bold ${
                  isAnsCorrect ? "text-emerald-400" : "text-error"
                }`}
              >
                <span>
                  {ans?.answerText
                    ? ans.answerText.toString().toUpperCase()
                    : "NO ANSWER"}
                </span>
                <span>{isAnsCorrect ? "Correct" : "Incorrect"}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-muted-foreground uppercase font-bold block mb-1">
                Correct Solution
              </span>
              <div className="flex items-center gap-2 text-base font-bold text-emerald-400">
                <span>
                  {q.correctAnswer !== undefined && q.correctAnswer !== null
                    ? q.correctAnswer.toString().toUpperCase()
                    : "TRUE"}
                </span>
                <span>Correct</span>
              </div>
            </div>
          </div>
        )}

        {/* ESSAY QUESTION */}
        {q.type === "essay" && (
          <div className="flex flex-col gap-3">
            <div className="border border-border rounded-md p-4">
              <div className="flex items-center justify-between gap-2 mb-3 border-b border-white/5 pb-2">
                <span className="text-xs text-muted-foreground uppercase font-bold">
                  Your Written Response
                </span>
                {isAnsPending ? (
                  <span className="badge badge-warning m-0 text-xs">
                    Pending Teacher Grading
                  </span>
                ) : (
                  <span className="badge badge-success m-0 text-xs">
                    Graded by Instructor
                  </span>
                )}
              </div>
              <p className="text-foreground text-base whitespace-pre-wrap leading-relaxed m-0">
                {ans?.answerText || (
                  <span className="text-muted-foreground italic">
                    No answer provided.
                  </span>
                )}
              </p>
            </div>

            {/* Teacher Feedback Box if graded */}
            {ans?.feedback && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-md p-4">
                <div className="text-xs text-indigo-400 uppercase font-bold mb-2 flex items-center gap-1.5">
                  Instructor Feedback & Comments:
                </div>
                <p className="text-foreground text-base leading-relaxed m-0">
                  {ans.feedback}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
