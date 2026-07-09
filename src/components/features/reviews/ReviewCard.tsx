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
    <div
      className="card card-hover flex flex-col justify-between"
      style={{
        borderLeft: "4px solid var(--warning)",
        padding: "1.75rem",
      }}
    >
      <div>
        {/* Header: Quiz Title & Result Code */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <h3
            className="card-title"
            style={{
              fontSize: "1.3rem",
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            title={quizTitle}
          >
            {quizTitle}
          </h3>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.8rem",
              fontWeight: 700,
              background: "rgba(255, 255, 255, 0.08)",
              color: "var(--text-secondary)",
              padding: "0.3rem 0.6rem",
              borderRadius: "var(--radius-sm)",
              whiteSpace: "nowrap",
              border: "1px solid var(--border)",
            }}
          >
            {item.resultCode || "RES-PENDING"}
          </span>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span
            className="badge badge-warning"
            style={{
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 0 15px rgba(245, 158, 11, 0.15)",
            }}
          >
            Needs Grading
          </span>
        </div>

        {/* Student Info Box */}
        <div
          style={{
            background: "rgb(0 0 0 / 86%)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            margin: "1.25rem 0",
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#ffffff",
                boxShadow: "0 2px 10px rgba(99, 102, 241, 0.3)",
                flexShrink: 0,
              }}
            >
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  color: "#ffffffe3",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={studentName}
              >
                {studentName}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#ffffffae",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={studentEmail}
              >
                {studentEmail}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: "0.8rem",
              color: "#ffffff9d",
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              paddingTop: "0.6rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span>Attempted: {attemptDate}</span>
          </div>
        </div>

        {/* Stats Section */}
        <div
          className="mb-6"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div
            className="flex items-center gap-2"
            style={{
              color: "#a79127",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            <span>
              {ungradedCount} ungraded {ungradedCount === 1 ? "essay" : "essays"}
            </span>
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            Auto-scored:{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {autoPoints} pts
            </strong>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Link
        href={`/teacher/reviews/${attemptId}`}
        className="btn btn-primary"
        style={{
          width: "100%",
          justifyContent: "center",
          padding: "0.9rem 1.5rem",
          fontSize: "1rem",
          boxShadow: "0 4px 18px rgba(99, 102, 241, 0.35)",
        }}
      >
        Grade Response
      </Link>
    </div>
  );
};
