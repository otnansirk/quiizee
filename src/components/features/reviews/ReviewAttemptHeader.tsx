"use client";

import React from "react";
import Link from "next/link";

export interface ReviewAttemptHeaderProps {
  studentInfo: { name: string; email: string };
  attemptInfo: { resultCode: string };
  quizInfo: { title: string };
  runningTotal: number;
  displayMax: number;
  ungradedCount: number;
  finalizing: boolean;
  finalizeSuccess: string | null;
  onFinalize: () => void;
}

export const ReviewAttemptHeader: React.FC<ReviewAttemptHeaderProps> = ({
  studentInfo,
  attemptInfo,
  quizInfo,
  runningTotal,
  displayMax,
  ungradedCount,
  finalizing,
  finalizeSuccess,
  onFinalize,
}) => {
  return (
    <div className="card p-7 mb-8 bg-gradient-to-br from-[#141420]/85 to-[#1e1e32]/90 border border-indigo-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <Link
        href="/teacher/reviews"
        className="btn btn-secondary btn-sm pl-0 text-white/90 mb-5 inline-flex items-center gap-1.5 font-bold"
      >
        Back to Reviews
      </Link>

      <div className="fle justify-between items-center flex-wrap gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-3xl font-extrabold text-white/90 m-0">
              {studentInfo.name}
            </h1>
            <span className="text-base text-white/90">
              {studentInfo.email}
            </span>
            <span className="font-mono text-sm font-bold bg-white/10 text-white/90 px-2.5 py-1 rounded border border-border">
              {attemptInfo.resultCode}
            </span>
          </div>
          <p className="m-0 text-white/75 text-lg font-medium">
            Assessment:{" "}
            <strong className="text-indigo-400 font-extrabold">
              {quizInfo.title}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          {/* Live Score Counter */}
          <div className="bg-[#0a0a0f]/70 border border-indigo-500/40 rounded-xl px-6 py-3 text-center shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-1">
              LIVE SCORE COUNTER
            </div>
            <div className="text-2xl font-extrabold text-white/90">
              <span className="text-gradient font-black">{runningTotal}</span>{" "}
              <span className="text-lg text-slate-400 font-semibold">
                / {displayMax} pts
              </span>
            </div>
          </div>

          {/* Top Right Action: Finalize Exam Score */}
          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={onFinalize}
              disabled={
                finalizing || ungradedCount > 0 || Boolean(finalizeSuccess)
              }
              className={`btn btn-primary btn-lg py-3.5 px-7 text-lg font-extrabold transition-all ${
                ungradedCount > 0
                  ? "opacity-60 cursor-not-allowed shadow-none"
                  : "shadow-[0_0_25px_rgba(99,102,241,0.5)] cursor-pointer"
              }`}
              title={
                ungradedCount > 0
                  ? `Please grade the remaining ${ungradedCount} essay question(s) first`
                  : "Finalize and publish exam score"
              }
            >
              {finalizing ? "Finalizing..." : "Finalize Exam Score"}
            </button>
            {ungradedCount > 0 ? (
              <span className="text-xs text-yellow-300 font-semibold flex items-center gap-1">
                {ungradedCount} essay{" "}
                {ungradedCount === 1 ? "question" : "questions"} still need
                grading
              </span>
            ) : (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                All questions graded! Ready to finalize.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
