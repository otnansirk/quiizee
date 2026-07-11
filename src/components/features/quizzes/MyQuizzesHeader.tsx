"use client";

import React from "react";
import Link from "next/link";

export interface MyQuizzesHeaderProps {
  publishError: string | null;
  successMsg: string | null;
  onClearError: () => void;
  onClearSuccess: () => void;
}

export const MyQuizzesHeader: React.FC<MyQuizzesHeaderProps> = ({
  publishError,
  successMsg,
  onClearError,
  onClearSuccess,
}) => {
  return (
    <>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="title text-4xl font-extrabold mb-1 text-foreground">
            My Quizzes
          </h1>
          <p className="subtitle m-0 max-w-full text-muted-foreground">
            Create, manage, and publish your assessments
          </p>
        </div>

        <Link
          href="/teacher/quizzes/new"
          className="btn btn-primary btn-lg shadow-lg shadow-indigo-500/40 font-black"
        >
          Create New Quiz
        </Link>
      </div>

      {/* Alert Messages */}
      {publishError && (
        <div className="alert alert-error animate-fade-in mb-6 items-start flex justify-between">
          <div className="flex-1">
            <strong className="block mb-1 font-bold">
              Action Required
            </strong>
            <span>{publishError}</span>
          </div>
          <button
            onClick={onClearError}
            className="btn btn-ghost btn-sm p-1 min-w-0 text-red-300 font-extrabold"
          >
            X
          </button>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success animate-fade-in mb-6 flex items-center justify-between">
          <span className="flex-1 font-semibold">{successMsg}</span>
          <button
            onClick={onClearSuccess}
            className="btn btn-ghost btn-sm p-1 min-w-0 text-emerald-400 font-extrabold"
          >
            X
          </button>
        </div>
      )}
    </>
  );
};
