"use client";

import React from "react";
import Link from "next/link";

export interface AttemptHistoryItem {
  id?: string;
  attemptId?: string;
  resultCode: string;
  userId?: string | null;
  participantId?: string | null;
  studentName?: string;
  studentEmail?: string;
  user?: { name?: string; email?: string };
  participant?: { name?: string; email?: string };
  startTime?: string;
  createdAt?: string;
  endTime?: string | null;
  totalScore?: number | string | null;
  maxScore?: number | string;
  status?: string;
  attemptNumber?: number;
}

export interface AttemptsTableProps {
  filteredAttempts: AttemptHistoryItem[];
  filter: "all" | "submitted" | "graded" | "in_progress";
  onResetFilter: () => void;
}

export const AttemptsTable: React.FC<AttemptsTableProps> = ({
  filteredAttempts,
  filter,
  onResetFilter,
}) => {
  const getId = (item: AttemptHistoryItem): string => item.attemptId || item.id || "";
  const getName = (item: AttemptHistoryItem): string =>
    item.studentName || item.user?.name || item.participant?.name || "Anonymous Student";
  const getEmail = (item: AttemptHistoryItem): string =>
    item.studentEmail || item.user?.email || item.participant?.email || "No email provided";
  const getStatus = (item: AttemptHistoryItem): string => (item.status || "in_progress").toLowerCase();
  const getDate = (item: AttemptHistoryItem): string => {
    const raw = item.startTime || item.createdAt;
    if (!raw) return "Recently";
    try {
      return new Date(raw).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recently";
    }
  };

  if (filteredAttempts.length === 0) {
    return (
      <div className="empty-state animate-fade-in py-20 px-8 bg-black/40 border-2 border-dashed border-border rounded-2xl text-center shadow-xl">
        <div className="empty-state-icon text-5xl mb-3">
          👥
        </div>
        <h2 className="text-2xl font-extrabold mb-3 text-foreground/80">
          {filter === "all"
            ? "No Submissions Recorded Yet"
            : `No "${filter.replace("_", " ")}" Attempts Found`}
        </h2>
        <p className="text-muted-foreground max-w-[500px] mx-auto mb-8 text-base leading-relaxed">
          {filter === "all"
            ? "Share the access code with your students to start receiving assessment attempts. Once students submit their work, it will appear here in real-time!"
            : "Try selecting a different filter tab above to view other student attempts."}
        </p>
        {filter !== "all" ? (
          <button onClick={onResetFilter} className="btn btn-secondary btn-lg">
            Show All Submissions
          </button>
        ) : (
          <Link
            href="/teacher/quizzes"
            className="btn btn-primary btn-lg shadow-lg shadow-primary/40"
          >
            Back to My Quizzes
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden shadow-2xl shadow-indigo-500/10 border border-border bg-secondary">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border font-extrabold text-xs uppercase tracking-wider">
              <th className="py-5 px-6">Student Details</th>
              <th className="py-5 px-4">Result Code</th>
              <th className="py-5 px-4">Date & Time</th>
              <th className="py-5 px-4">Status</th>
              <th className="py-5 px-4">Score / Max</th>
              <th className="py-5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttempts.map((item, idx) => {
              const attemptId = getId(item);
              const name = getName(item);
              const email = getEmail(item);
              const status = getStatus(item);
              const dateStr = getDate(item);
              const max = Number(item.maxScore || 100);
              const total = Number(item.totalScore || 0);
              const pct = Math.round((total / max) * 100);

              return (
                <tr
                  key={attemptId || idx}
                  className={`transition-colors hover:bg-white/5 ${
                    idx === filteredAttempts.length - 1
                      ? "border-b-0"
                      : "border-b border-white/5"
                  }`}
                >
                  {/* Student Details */}
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 border ${
                          status === "graded"
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                            : "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                        }`}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-base">
                          {name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Result Code */}
                  <td className="py-5 px-4">
                    <span className="font-mono text-xs font-bold bg-white/5 text-foreground px-2.5 py-1.5 rounded border border-border">
                      {item.resultCode || "RES-PENDING"}
                    </span>
                  </td>

                  {/* Date & Time */}
                  <td className="py-5 px-4 text-sm text-muted-foreground">
                    {dateStr}
                  </td>

                  {/* Status Badge */}
                  <td className="py-5 px-4">
                    {status === "graded" ? (
                      <span className="badge badge-success m-0 inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20 font-bold">
                        Graded
                      </span>
                    ) : status === "submitted" ? (
                      <span className="badge badge-warning m-0 inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20 font-bold">
                        Submitted
                      </span>
                    ) : (
                      <span className="badge badge-info m-0 inline-flex items-center gap-1.5 font-bold">
                        In Progress
                      </span>
                    )}
                  </td>

                  {/* Score / Max */}
                  <td className="py-5 px-4">
                    {status === "graded" ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-lg text-emerald-500">
                          {total}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          / {max} pts
                        </span>
                        <span className="text-xs font-bold bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded ml-1">
                          {pct}%
                        </span>
                      </div>
                    ) : status === "submitted" ? (
                      <span className="text-sm text-amber-300 font-semibold">
                        Pending ({max} max pts)
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        In Progress...
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-5 px-6 text-right">
                    {status === "submitted" ? (
                      <Link
                        href={`/teacher/reviews/${attemptId}`}
                        className="btn btn-primary btn-sm px-4 py-2 shadow-md shadow-primary/30 whitespace-nowrap font-bold"
                      >
                        Grade Essays
                      </Link>
                    ) : status === "graded" ? (
                      <Link
                        href={`/results/${item.resultCode}`}
                        className="btn btn-secondary btn-sm px-4 py-2 border-indigo-500/40 text-foreground bg-indigo-500/10 whitespace-nowrap font-bold hover:bg-indigo-500/20"
                      >
                        View Score Report
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground italic pr-2">
                        Session Active
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
