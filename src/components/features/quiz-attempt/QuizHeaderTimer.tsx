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
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes pulseAlert {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .timer-warning {
          background: #fef08a !important;
          color: #854d0e !important;
          border-color: #eab308 !important;
        }
        .timer-danger {
          background: #fee2e2 !important;
          color: #b91c1c !important;
          border-color: #ef4444 !important;
          animation: pulseAlert 1s infinite;
        }
        @media (max-width: 640px) {
          .controls-bar-inner { flex-wrap: wrap; gap: 0.5rem !important; }
          .controls-title { font-size: 0.95rem !important; }
          .controls-meta { font-size: 0.72rem !important; }
          .controls-timer { font-size: 0.82rem !important; padding: 0.3rem 0.7rem !important; }
          .controls-submit { font-size: 0.8rem !important; padding: 0.4rem 0.9rem !important; box-shadow: 2px 2px 0px #111827 !important; }
        }
      `,
        }}
      />

      {/* Sticky Top Timer & Controls Bar */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-black py-2.5">
        <div className="container controls-bar-inner flex items-center justify-between gap-4">
          {/* Left: Quiz Title & Student Name */}
          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="controls-title text-lg font-black text-black tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {quizTitle || "Live Assessment"}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="controls-meta text-xs text-zinc-600 font-bold">
                <strong className="text-black">{studentName}</strong>
              </span>
              <span className="text-zinc-400 font-bold text-xs">
                ·
              </span>
              <span className="controls-meta text-xs text-zinc-500 font-bold">
                Attempt #{attemptNumber || 1}
              </span>
            </div>
          </div>

          {/* Center: Live Countdown Timer */}
          {remainingSeconds !== null && (
            <div className={`badge controls-timer ${timerClass} text-sm py-1.5 px-4 m-0 rounded-md flex items-center gap-1.5 font-mono font-black tracking-wider border-2 border-black shadow-[2px_2px_0px_#111827] transition-all flex-shrink-0 whitespace-nowrap`}>
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
              className="btn btn-primary controls-submit py-2 px-5 shadow-[3px_3px_0px_#111827] border-2 border-black font-black text-sm"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* Question Timeout Banner */}
      {questionTimeoutBanner && (
        <div className="animate-fade-in fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white py-3 px-7 rounded-full shadow-xl shadow-red-500/50 font-extrabold text-base flex items-center gap-2.5 border-2 border-white/30">
          <span>{questionTimeoutBanner}</span>
        </div>
      )}
    </>
  );
};
