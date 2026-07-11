"use client";

import React from "react";
import Link from "next/link";

export interface AttemptsHeaderFiltersProps {
  quizTitle: string;
  loading: boolean;
  error: string | null;
  filter: "all" | "submitted" | "graded" | "in_progress";
  totalAttemptsCount: number;
  countSubmitted: number;
  countGraded: number;
  countInProgress: number;
  onRefresh: () => void;
  onClearError: () => void;
  onSelectFilter: (filter: "all" | "submitted" | "graded" | "in_progress") => void;
}

export const AttemptsHeaderFilters: React.FC<AttemptsHeaderFiltersProps> = ({
  quizTitle,
  loading,
  error,
  filter,
  totalAttemptsCount,
  countSubmitted,
  countGraded,
  countInProgress,
  onRefresh,
  onClearError,
  onSelectFilter,
}) => {
  return (
    <>
      {/* Top Breadcrumb & Page Header */}
      <div className="mb-8">
        <Link
          href="/teacher/quizzes"
          className="btn btn-ghost btn-sm text-muted-foreground mb-4 inline-flex items-center gap-1.5"
        >
          Back to Quizzes
        </Link>

        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="title text-4xl mb-1 font-extrabold text-foreground">
              Attempt History
            </h1>
            <p className="subtitle m-0 max-w-full text-muted-foreground">
              View all student submissions and assessment performance for{" "}
              <strong className="text-primary font-bold">{quizTitle}</strong>
            </p>
          </div>
          <div>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="btn btn-secondary btn-sm border-indigo-500/30 text-primary hover:bg-indigo-500/10 transition-all"
              title="Refresh attempt history"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-error animate-fade-in mb-6 items-start flex justify-between gap-3 p-4 rounded-xl bg-error/15 border border-error/30 text-error">
          <div className="flex-1">
            <strong className="block mb-1 font-extrabold">Notice</strong>
            <span>{error}</span>
          </div>
          <button
            onClick={onClearError}
            className="btn btn-ghost btn-sm px-2 py-1 min-w-0 text-error font-bold"
          >
            X
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 p-2 border-b border-border overflow-x-auto">
        <button
          onClick={() => onSelectFilter("all")}
          className={`btn btn-sm transition-all border-none ${
            filter === "all"
              ? "bg-primary text-white shadow-md shadow-primary/30 font-bold"
              : "bg-transparent text-muted-foreground hover:text-foreground font-medium"
          }`}
        >
          All Submissions ({totalAttemptsCount})
        </button>

        <button
          onClick={() => onSelectFilter("submitted")}
          className={`btn btn-sm transition-all ${
            filter === "submitted"
              ? "bg-amber-500/20 text-amber-700 border border-amber-500/40 shadow-md shadow-amber-500/20 font-bold"
              : "bg-transparent text-muted-foreground border border-transparent hover:text-foreground font-medium"
          }`}
        >
          Needs Grading ({countSubmitted})
        </button>

        <button
          onClick={() => onSelectFilter("graded")}
          className={`btn btn-sm transition-all ${
            filter === "graded"
              ? "bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 shadow-md shadow-emerald-500/20 font-bold"
              : "bg-transparent text-muted-foreground border border-transparent hover:text-foreground font-medium"
          }`}
        >
          Graded ({countGraded})
        </button>

        <button
          onClick={() => onSelectFilter("in_progress")}
          className={`btn btn-sm transition-all ${
            filter === "in_progress"
              ? "bg-blue-500/20 text-blue-700 border border-blue-500/40 shadow-md shadow-blue-500/20 font-bold"
              : "bg-transparent text-muted-foreground border border-transparent hover:text-foreground font-medium"
          }`}
        >
          In Progress ({countInProgress})
        </button>
      </div>
    </>
  );
};
