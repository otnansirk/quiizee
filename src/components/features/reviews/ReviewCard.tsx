"use client";

import React from "react";
import Link from "next/link";

export interface ReviewItem {
  id?: string;
  attemptId?: string;
  resultCode: string;
  quizTitle?: string;
  quiz?: { title: string };
  studentName?: string;
  studentEmail?: string;
  student?: { name?: string; email?: string };
  user?: { name?: string; email?: string };
  attemptDate?: string;
  startTime?: string;
  createdAt?: string;
  ungradedEssaysCount?: number;
  ungradedCount?: number;
  autoScoredPoints?: number;
  totalScore?: number;
  maxScore?: number;
  status?: string;
}

export interface ReviewCardProps {
  item: ReviewItem;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ item }) => {
  const attemptId = item.attemptId || item.id || "";
  const quizTitle =
    item.quizTitle || item.quiz?.title || "Untitled Assessment";
  const studentName =
    item.studentName ||
    item.student?.name ||
    item.user?.name ||
    "Anonymous Student";
  const studentEmail =
    item.studentEmail ||
    item.student?.email ||
    item.user?.email ||
    "No email provided";

  const rawDate = item.attemptDate || item.startTime || item.createdAt;
  let attemptDate = "Recently";
  if (rawDate) {
    try {
      attemptDate = new Date(rawDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      attemptDate = "Recently";
    }
  }

  const ungradedCount =
    item.ungradedEssaysCount ?? item.ungradedCount ?? 1;
  const autoPoints = item.autoScoredPoints ?? item.totalScore ?? 0;

  return (
    <div className="card card-hover flex flex-col justify-between border-l-4 border-l-amber-500 p-7">
      <div>
        {/* Header: Quiz Title & Result Code */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <h3
            className="card-title text-xl m-0 line-clamp-2 overflow-hidden"
            title={quizTitle}
          >
            {quizTitle}
          </h3>
          <span className="font-mono text-xs font-bold bg-white/10 text-muted-foreground px-2.5 py-1 rounded border border-border whitespace-nowrap">
            {item.resultCode || "RES-PENDING"}
          </span>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span className="badge badge-warning m-0 inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-bold">
            Needs Grading
          </span>
        </div>

        {/* Student Info Box */}
        <div className="bg-black/85 border border-border rounded-lg p-4 my-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-lg font-bold text-white shadow-[0_2px_10px_rgba(99,102,241,0.3)] flex-shrink-0">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div
                className="font-bold text-base text-white/90 whitespace-nowrap overflow-hidden text-ellipsis"
                title={studentName}
              >
                {studentName}
              </div>
              <div
                className="text-xs text-white/70 whitespace-nowrap overflow-hidden text-ellipsis"
                title={studentEmail}
              >
                {studentEmail}
              </div>
            </div>
          </div>

          <div className="text-xs text-white/60 border-t border-white/10 pt-2.5 flex items-center gap-1.5">
            <span>Attempted: {attemptDate}</span>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-6 bg-white/[0.03] p-3 rounded border border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <span>
              {ungradedCount} ungraded {ungradedCount === 1 ? "essay" : "essays"}
            </span>
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            Auto-scored:{" "}
            <strong className="text-foreground font-bold">
              {autoPoints} pts
            </strong>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Link
        href={`/teacher/reviews/${attemptId}`}
        className="btn btn-primary w-full justify-center py-3.5 px-6 text-base shadow-[0_4px_18px_rgba(99,102,241,0.35)] font-extrabold"
      >
        Grade Response
      </Link>
    </div>
  );
};
