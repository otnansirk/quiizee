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
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="title text-4xl font-extrabold mb-1 text-foreground">
            Essay Reviews & Grading
          </h1>
          <p className="subtitle m-0 max-w-full text-muted-foreground">
            Review student responses and finalize assessment scores
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn btn-secondary btn-sm border-indigo-500/30 text-indigo-400 hover:text-indigo-300 font-semibold"
          title="Refresh pending reviews list"
        >
          Refresh List
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-error animate-fade-in mb-6 flex items-center justify-between">
          <span className="flex-1 font-semibold">{error}</span>
          <button
            onClick={onClearError}
            className="btn btn-ghost btn-sm p-1 min-w-0 text-red-400 font-bold"
          >
            X
          </button>
        </div>
      )}
    </>
  );
};
