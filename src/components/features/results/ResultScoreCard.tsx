"use client";

import React from "react";

export interface ResultScoreCardProps {
  numTotalScore: number | null;
  numMaxScore: number | string;
  percentage: number | null;
  isCertificateAvailable?: boolean;
  resultCode: string;
}

export const ResultScoreCard: React.FC<ResultScoreCardProps> = ({
  numTotalScore,
  numMaxScore,
  percentage,
  isCertificateAvailable,
  resultCode,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isCertificateAvailable
          ? "repeat(auto-fit, minmax(260px, 1fr))"
          : "1fr",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      {/* Large Glowing Score Display */}
      <div
        className="card results-score-card"
        style={{
          padding: "clamp(0.75rem, 3vw, 2rem)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          background:
            "linear-gradient(145deg, rgba(26, 26, 46, 0.8) 0%, rgba(20, 20, 36, 0.9) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow:
            "0 10px 30px rgba(0, 0, 0, 0.3), 0 0 30px rgba(99, 102, 241, 0.15)",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            color: "#FFF",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "0.5rem",
          }}
        >
          Total Score Earned
        </div>

        {numTotalScore !== null ? (
          <div
            className="flex items-baseline justify-center gap-2"
            style={{ marginBottom: "0.4rem" }}
          >
            <span
              className="results-score-num"
              style={{
                fontSize: "clamp(1.9rem, 7vw, 4rem)",
                fontWeight: 900,
                color: "#20a250",
                lineHeight: 1,
                letterSpacing: "-0.03em",
                filter: "drop-shadow(0 0 15px rgba(255, 255, 255, 0.4))",
              }}
            >
              {numTotalScore}
            </span>
            <span
              className="results-score-den"
              style={{
                fontSize: "clamp(0.85rem, 2.5vw, 1.6rem)",
                color: "#ffffff94",
                fontWeight: 600,
              }}
            >
              / {numMaxScore}
            </span>
          </div>
        ) : (
          <div
            style={{
              fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
              fontWeight: 800,
              color: "#fde047",
              marginBottom: "0.5rem",
              textShadow: "0 0 20px rgba(245, 158, 11, 0.3)",
            }}
          >
            Pending Review
          </div>
        )}

        {percentage !== null ? (
          <div
            className="badge badge-accent"
            style={{
              fontSize: "0.78rem",
              padding: "0.25rem 0.65rem",
              fontWeight: 700,
              margin: 0,
              background:
                percentage >= 70
                  ? "rgba(34, 197, 94, 0.15)"
                  : "rgba(255, 255, 255, 0.15)",
              color: percentage >= 70 ? "#43c372" : "#FFF",
              borderColor:
                percentage >= 70
                  ? "rgba(34, 197, 94, 0.4)"
                  : "rgba(255, 255, 255, 0.4)",
            }}
          >
            {percentage}% Accuracy
          </div>
        ) : (
          <div className="badge badge-warning" style={{ margin: 0 }}>
            Awaiting Essay Grading
          </div>
        )}
      </div>

      {/* Celebratory Certificate Banner */}
      {isCertificateAvailable && (
        <div
          className="card results-cert-card"
          style={{
            padding: "clamp(0.75rem, 3vw, 2rem)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.25) 100%)",
            border: "1px solid rgba(168, 85, 247, 0.4)",
            boxShadow:
              "0 10px 35px rgba(168, 85, 247, 0.25), 0 0 25px rgba(99, 102, 241, 0.2)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <h2
            className="results-cert-title"
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "#fff",
              marginBottom: "0.4rem",
              lineHeight: 1.3,
            }}
          >
            Congratulations!
          </h2>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--text-primary)",
              marginBottom: "1rem",
              opacity: 0.9,
            }}
          >
            You earned a Certificate of Completion for demonstrating mastery in
            this assessment!
          </p>
          <button
            type="button"
            onClick={() => {
              window.open(
                `/api/results/${encodeURIComponent(resultCode)}/certificate`,
                "_blank"
              );
            }}
            className="btn btn-primary btn-block"
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
              boxShadow: "0 4px 15px rgba(168, 85, 247, 0.5)",
              fontWeight: 700,
            }}
          >
            Download PDF Certificate
          </button>
        </div>
      )}
    </div>
  );
};
