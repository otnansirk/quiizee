"use client";

import React from "react";

export interface QuizHeaderTimerProps {
  quizTitle: string;
  studentName: string;
  attemptNumber: number;
  remainingSeconds: number | null;
  durationMode?: string;
  currentQuestionIndex: number;
  timerClass: string;
  questionTimeoutBanner: string | null;
  formatTime: (secs: number) => string;
  isSubmitting: boolean;
  onSubmitClick: () => void;
}

export const QuizHeaderTimer: React.FC<QuizHeaderTimerProps> = ({
  quizTitle,
  studentName,
  attemptNumber,
  remainingSeconds,
  durationMode,
  currentQuestionIndex,
  timerClass,
  questionTimeoutBanner,
  formatTime,
  isSubmitting,
  onSubmitClick,
}) => {
  return (
    <>
      {/* Sticky Top Timer & Controls Bar */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-black py-2.5">
        <div className="container flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4">
          {/* Left: Quiz Title & Student Name */}
          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-black text-black tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {quizTitle || "Live Assessment"}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[0.72rem] sm:text-xs text-zinc-600 font-bold">
                <strong className="text-black">{studentName}</strong>
              </span>
              <span className="text-zinc-400 font-bold text-xs">
                ·
              </span>
              <span className="text-[0.72rem] sm:text-xs text-zinc-500 font-bold">
                Attempt #{attemptNumber || 1}
              </span>
            </div>
          </div>

          {/* Center: Live Countdown Timer */}
          {remainingSeconds !== null && (
            <div className={`inline-flex items-center justify-center ${timerClass} text-xs sm:text-sm py-1 sm:py-1.5 px-3 sm:px-4 m-0 rounded-md gap-1.5 font-mono font-black tracking-wider border-2 shadow-[2px_2px_0px_#111827] transition-all flex-shrink-0 whitespace-nowrap`}>
              {durationMode === "per_question" ? (
                <span>
                  Q{currentQuestionIndex + 1}: {formatTime(remainingSeconds)}
                </span>
              ) : (
                <span>{formatTime(remainingSeconds)}</span>
              )}
            </div>
          )}

          {/* Right: Submit Quiz Button */}
          <div className="flex-shrink-0">
            <button
              onClick={onSubmitClick}
              disabled={isSubmitting}
              className="btn btn-primary py-1.5 sm:py-2 px-3.5 sm:px-5 shadow-[2px_2px_0px_#111827] sm:shadow-[3px_3px_0px_#111827] border-2 border-black font-black text-xs sm:text-sm"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* Question Timeout Banner */}
      {questionTimeoutBanner && (
        <div className="animate-fade-in fixed top-20 left-1 md:left-1/2 md:-translate-x-1/2 z-[100] bg-red-500 text-white py-3 rounded-full shadow-xl shadow-red-500/50 font-extrabold text-xs md:text-sm flex items-center gap-2.5 border-2 border-white/30 w-[98%] md:max-w-md text-center justify-center">
          <span>{questionTimeoutBanner}</span>
        </div>
      )}
    </>
  );
};
