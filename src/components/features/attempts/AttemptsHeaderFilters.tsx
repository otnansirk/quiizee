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
      <div style={{ marginBottom: "2rem" }}>
        <Link
          href="/teacher/quizzes"
          className="btn btn-ghost btn-sm"
          style={{
            paddingLeft: 0,
            color: "var(--text-secondary)",
            marginBottom: "1rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          Back to Quizzes
        </Link>

        <div
          className="flex justify-between items-start"
          style={{ flexWrap: "wrap", gap: "1rem" }}
        >
          <div>
            <h1 className="title" style={{ fontSize: "2.5rem", marginBottom: "0.25rem" }}>
              Attempt History
            </h1>
            <p className="subtitle" style={{ margin: 0, maxWidth: "100%" }}>
              View all student submissions and assessment performance for{" "}
              <strong style={{ color: "var(--accent-hover)" }}>{quizTitle}</strong>
            </p>
          </div>
          <div>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{
                borderColor: "rgba(99, 102, 241, 0.3)",
                color: "var(--accent-hover)",
              }}
              title="Refresh attempt history"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          className="alert alert-error animate-fade-in mb-6"
          style={{ alignItems: "flex-start" }}
        >
          <div style={{ flex: 1 }}>
            <strong style={{ display: "block", marginBottom: "0.25rem" }}>Notice</strong>
            <span>{error}</span>
          </div>
          <button
            onClick={onClearError}
            className="btn btn-ghost btn-sm"
            style={{ padding: "0.2rem 0.5rem", minWidth: "auto", color: "#e12727" }}
          >
            X
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        className="flex gap-2 mb-6"
        style={{
          // flexWrap: "wrap",
          padding: "0.5rem",
          marginBottom: "1.5rem",
          // borderRadius: "var(--radius-lg)",
          borderBottom: "1px solid #b8b8b8",
        }}
      >
        <button
          onClick={() => onSelectFilter("all")}
          className="btn btn-sm"
          style={{
            background: filter === "all" ? "var(--accent-gradient)" : "transparent",
            color: filter === "all" ? "#ffffff" : "var(--text-secondary)",
            border: "none",
            boxShadow: filter === "all" ? "0 2px 10px rgba(99, 102, 241, 0.3)" : "none",
          }}
        >
          All Submissions ({totalAttemptsCount})
        </button>

        <button
          onClick={() => onSelectFilter("submitted")}
          className="btn btn-sm"
          style={{
            background: filter === "submitted" ? "rgba(245, 158, 11, 0.2)" : "transparent",
            color: filter === "submitted" ? "#7e6e1c" : "var(--text-secondary)",
            border:
              filter === "submitted"
                ? "1px solid rgba(245, 158, 11, 0.4)"
                : "1px solid transparent",
            boxShadow: filter === "submitted" ? "0 0 12px rgba(245, 158, 11, 0.2)" : "none",
          }}
        >
          Needs Grading ({countSubmitted})
        </button>

        <button
          onClick={() => onSelectFilter("graded")}
          className="btn btn-sm"
          style={{
            background: filter === "graded" ? "rgba(34, 197, 94, 0.2)" : "transparent",
            color: filter === "graded" ? "#188340" : "var(--text-secondary)",
            border:
              filter === "graded"
                ? "1px solid rgba(34, 197, 94, 0.4)"
                : "1px solid transparent",
            boxShadow: filter === "graded" ? "0 0 12px rgba(34, 197, 94, 0.2)" : "none",
          }}
        >
          Graded ({countGraded})
        </button>

        <button
          onClick={() => onSelectFilter("in_progress")}
          className="btn btn-sm"
          style={{
            background:
              filter === "in_progress" ? "rgba(59, 130, 246, 0.2)" : "transparent",
            color: filter === "in_progress" ? "#1c5596" : "var(--text-secondary)",
            border:
              filter === "in_progress"
                ? "1px solid rgba(59, 130, 246, 0.4)"
                : "1px solid transparent",
          }}
        >
          In Progress ({countInProgress})
        </button>
      </div>
    </>
  );
};
