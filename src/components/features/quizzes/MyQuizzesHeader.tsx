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
      <div
        className="flex justify-between items-center mb-6"
        style={{ flexWrap: "wrap", gap: "1rem" }}
      >
        <div>
          <h1
            className="title"
            style={{ fontSize: "2.5rem", marginBottom: "0.25rem" }}
          >
            My Quizzes
          </h1>
          <p className="subtitle" style={{ margin: 0, maxWidth: "100%" }}>
            Create, manage, and publish your assessments
          </p>
        </div>

        <Link
          href="/teacher/quizzes/new"
          className="btn btn-primary btn-lg"
          style={{ boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)" }}
        >
          Create New Quiz
        </Link>
      </div>

      {/* Alert Messages */}
      {publishError && (
        <div
          className="alert alert-error animate-fade-in"
          style={{ marginBottom: "1.5rem", alignItems: "flex-start" }}
        >
          <div style={{ flex: 1 }}>
            <strong style={{ display: "block", marginBottom: "0.25rem" }}>
              Action Required
            </strong>
            <span>{publishError}</span>
          </div>
          <button
            onClick={onClearError}
            className="btn btn-ghost btn-sm"
            style={{
              padding: "0.2rem 0.5rem",
              minWidth: "auto",
              color: "#fca5a5",
            }}
          >
            X
          </button>
        </div>
      )}

      {successMsg && (
        <div
          className="alert alert-success animate-fade-in"
          style={{ marginBottom: "1.5rem" }}
        >
          <span style={{ flex: 1 }}>{successMsg}</span>
          <button
            onClick={onClearSuccess}
            className="btn btn-ghost btn-sm"
            style={{
              padding: "0.2rem 0.5rem",
              minWidth: "auto",
              color: "#43c372",
            }}
          >
            X
          </button>
        </div>
      )}
    </>
  );
};
