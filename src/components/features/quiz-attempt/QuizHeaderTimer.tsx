"use client";

import React from "react";

export interface QuizHeaderTimerProps {
  quizTitle: string;
  studentName: string;
  attemptNumber: number;
  remainingSeconds: number | null;
  durationMode?: string;
  currentQuestionIndex: number;
  timerClass: string;
  questionTimeoutBanner: string | null;
  formatTime: (secs: number) => string;
  isSubmitting: boolean;
  onSubmitClick: () => void;
}

export const QuizHeaderTimer: React.FC<QuizHeaderTimerProps> = ({
  quizTitle,
  studentName,
  attemptNumber,
  remainingSeconds,
  durationMode,
  currentQuestionIndex,
  timerClass,
  questionTimeoutBanner,
  formatTime,
  isSubmitting,
  onSubmitClick,
}) => {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes pulseAlert {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .timer-warning {
          background: #fef08a !important;
          color: #854d0e !important;
          border-color: #eab308 !important;
        }
        .timer-danger {
          background: #fee2e2 !important;
          color: #b91c1c !important;
          border-color: #ef4444 !important;
          animation: pulseAlert 1s infinite;
        }
        @media (max-width: 640px) {
          .controls-bar-inner { flex-wrap: wrap; gap: 0.5rem !important; }
          .controls-title { font-size: 0.95rem !important; }
          .controls-meta { font-size: 0.72rem !important; }
          .controls-timer { font-size: 0.82rem !important; padding: 0.3rem 0.7rem !important; }
          .controls-submit { font-size: 0.8rem !important; padding: 0.4rem 0.9rem !important; box-shadow: 2px 2px 0px #111827 !important; }
        }
      `,
        }}
      />

      {/* Sticky Top Timer & Controls Bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#ffffff",
          borderBottom: "2px solid #111827",
          padding: "0.6rem 0",
        }}
      >
        <div
          className="container controls-bar-inner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          {/* Left: Quiz Title & Student Name */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              flex: 1,
            }}
          >
            <h1
              className="controls-title"
              style={{
                fontSize: "1.1rem",
                fontWeight: 900,
                color: "#111827",
                letterSpacing: "-0.02em",
                lineHeight: "1.2",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {quizTitle || "Live Assessment"}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                marginTop: "0.1rem",
                flexWrap: "wrap",
              }}
            >
              <span
                className="controls-meta"
                style={{
                  fontSize: "0.8rem",
                  color: "#4b5563",
                  fontWeight: 700,
                }}
              >
                <strong style={{ color: "#111827" }}>{studentName}</strong>
              </span>
              <span
                style={{
                  color: "#9ca3af",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              >
                ·
              </span>
              <span
                className="controls-meta"
                style={{
                  fontSize: "0.78rem",
                  color: "#6b7280",
                  fontWeight: 700,
                }}
              >
                Attempt #{attemptNumber || 1}
              </span>
            </div>
          </div>

          {/* Center: Live Countdown Timer */}
          {remainingSeconds !== null && (
            <div
              className={`badge controls-timer ${timerClass}`}
              style={{
                fontSize: "0.95rem",
                padding: "0.4rem 1rem",
                margin: 0,
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontFamily: "monospace",
                fontWeight: 900,
                letterSpacing: "0.04em",
                border: "2px solid #111827",
                boxShadow: "2px 2px 0px #111827",
                transition: "all 0.3s ease",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {durationMode === "per_question" ? (
                <span>
                  Q{currentQuestionIndex + 1}: {formatTime(remainingSeconds)}
                </span>
              ) : (
                <span>{formatTime(remainingSeconds)}</span>
              )}
            </div>
          )}

          {/* Right: Submit Quiz Button */}
          <div style={{ flexShrink: 0 }}>
            <button
              onClick={onSubmitClick}
              disabled={isSubmitting}
              className="btn btn-primary controls-submit"
              style={{
                padding: "0.5rem 1.2rem",
                boxShadow: "3px 3px 0px #111827",
                border: "2px solid #111827",
                fontWeight: 900,
                fontSize: "0.9rem",
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* Question Timeout Banner */}
      {questionTimeoutBanner && (
        <div
          className="animate-fade-in"
          style={{
            position: "fixed",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            background: "rgba(239, 68, 68, 0.95)",
            color: "#ffffff",
            padding: "0.85rem 1.75rem",
            borderRadius: "var(--radius-full)",
            boxShadow: "0 10px 30px rgba(239, 68, 68, 0.5)",
            fontWeight: 800,
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            border: "2px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          <span>{questionTimeoutBanner}</span>
        </div>
      )}
    </>
  );
};
