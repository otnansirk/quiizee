"use client";

import React from "react";

export interface ResultTopBannerProps {
  quizTitle: string;
  studentName: string;
  status: "in_progress" | "submitted" | "graded";
  resultCode: string;
  copied: boolean;
  onCopyCode: () => void;
}

export const ResultTopBanner: React.FC<ResultTopBannerProps> = ({
  quizTitle,
  studentName,
  status,
  resultCode,
  copied,
  onCopyCode,
}) => {
  return (
    <div className="card results-banner-card p-4 sm:p-8 mb-4 relative overflow-hidden border-3 border-black">
      {/* Background Glow */}
      <div className="absolute -top-2/5 -right-1/10 w-[350px] h-[350px] bg-[radial-gradient(circle,_rgba(99,102,241,0.18)_0%,_transparent_70%)] rounded-full blur-[40px] pointer-events-none" />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
            Assessment Score Report
          </div>
          <h1 className="title results-quiz-title text-xl sm:text-3xl mb-1 text-foreground font-black">
            {quizTitle}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base flex items-center gap-2 m-0">
            <span className="text-foreground font-semibold">
              Student:
            </span>{" "}
            {studentName}
          </p>
        </div>

        {/* Status Badge */}
        <div className="self-start">
          {status === "graded" ? (
            <div className="badge badge-success px-3 py-1.5 text-xs inline-flex items-center gap-1.5 shadow-[0_0_20px_rgba(34,197,94,0.25)] m-0 font-bold">
              Completed
            </div>
          ) : (
            <div className="badge badge-warning px-3 py-1.5 text-xs inline-flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.25)] m-0 font-bold">
              Pending Review
            </div>
          )}
        </div>
      </div>

      {/* Note for Submitted / Pending Review */}
      {status === "submitted" && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 mb-4 flex items-center gap-3 text-yellow-600 text-sm leading-relaxed font-semibold">
          <div>
            Your multiple choice questions have been auto-scored. Your final
            score will appear after your teacher reviews your essay responses.
          </div>
        </div>
      )}

      {/* Result Code Box */}
      <div className="bg-[#0a0a0f]/80 border border-dashed border-indigo-500/50 rounded-md p-3.5 sm:p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <code className="font-mono text-base sm:text-xl font-extrabold text-white tracking-widest bg-white/15 px-2.5 py-1 rounded border border-white/30 overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px] inline-block">
              {resultCode}
            </code>
          </div>

          <button
            onClick={onCopyCode}
            type="button"
            className={`btn btn-sm flex-shrink-0 font-semibold transition-all ${copied ? "btn-primary" : "btn-secondary"}`}
          >
            {copied ? "Copied!" : "Copy Code"}
          </button>
        </div>

        <div className="text-xs text-white/70 flex items-center gap-1.5">
          <span>
            Save this unique code! You can use it anytime on the home page to
            revisit your detailed score report or download your certificate.
          </span>
        </div>
      </div>
    </div>
  );
};
