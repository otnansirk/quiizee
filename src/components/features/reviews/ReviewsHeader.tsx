"use client";

import React from "react";

export interface ReviewsHeaderProps {
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onClearError: () => void;
}

export const ReviewsHeader: React.FC<ReviewsHeaderProps> = ({
  loading,
  error,
  onRefresh,
  onClearError,
}) => {
  return (
    <>
      {/* Page Header */}
      <div
        className="flex justify-between items-center mb-6"
        style={{ flexWrap: "wrap", gap: "1rem" }}
      >
        <div>
          <h1
            className="title"
            style={{ fontSize: "2.5rem", marginBottom: "0.25rem" }}
          >
            Essay Reviews & Grading
          </h1>
          <p className="subtitle" style={{ margin: 0, maxWidth: "100%" }}>
            Review student responses and finalize assessment scores
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn btn-secondary btn-sm"
          style={{
            borderColor: "rgba(99, 102, 241, 0.3)",
            color: "var(--accent-hover)",
          }}
          title="Refresh pending reviews list"
        >
          Refresh List
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          className="alert alert-error animate-fade-in"
          style={{ marginBottom: "1.5rem" }}
        >
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={onClearError}
            className="btn btn-ghost btn-sm"
            style={{
              padding: "0.2rem 0.5rem",
              minWidth: "auto",
              color: "#e12727",
            }}
          >
            X
          </button>
        </div>
      )}
    </>
  );
};
