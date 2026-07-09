"use client";

import React from "react";
import { ModalPortal } from "@/components/atoms/ModalPortal";

export interface QuizSubmitConfirmModalProps {
  showSubmitModal: boolean;
  showAutoSubmitModal: boolean;
  totalCount: number;
  answeredCount: number;
  unansweredCount: number;
  isSubmitting: boolean;
  onKeepWorking: () => void;
  onConfirmSubmit: () => void;
}

export const QuizSubmitConfirmModal: React.FC<QuizSubmitConfirmModalProps> = ({
  showSubmitModal,
  showAutoSubmitModal,
  totalCount,
  answeredCount,
  unansweredCount,
  isSubmitting,
  onKeepWorking,
  onConfirmSubmit,
}) => {
  return (
    <ModalPortal isOpen={showSubmitModal || showAutoSubmitModal}>
      <>
      {/* Submit Confirmation Modal Overlay */}
      {showSubmitModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.82)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            animation: "fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            className="card animate-fade-in"
            style={{
              maxWidth: "480px",
              width: "100%",
              textAlign: "center",
              padding: "1.75rem 1.5rem",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              boxShadow:
                "0 0 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(99, 102, 241, 0.25)",
            }}
          >
            <h3
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: "0.5rem",
              }}
            >
              Submit Assessment?
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: "1.25rem",
                fontSize: "0.9rem",
              }}
            >
              You are about to finalize and submit your responses for scoring.
            </p>

            {/* Scorecard Summary Stats */}
            <div
              style={{
                background: "rgb(36, 36, 41)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "1.25rem",
                marginBottom: "1.75rem",
                display: "flex",
                justifyContent: "space-around",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Total Questions
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    marginTop: "0.2rem",
                  }}
                >
                  {totalCount}
                </div>
              </div>
              <div style={{ width: "1px", background: "var(--border)" }} />
              <div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#43c372",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Answered
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#43c372",
                    marginTop: "0.2rem",
                  }}
                >
                  {answeredCount}
                </div>
              </div>
              <div style={{ width: "1px", background: "var(--border)" }} />
              <div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color:
                      unansweredCount > 0 ? "#fde047" : "var(--text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Unanswered
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color:
                      unansweredCount > 0
                        ? "#fde047"
                        : "#FFFFFF",
                    marginTop: "0.2rem",
                  }}
                >
                  {unansweredCount}
                </div>
              </div>
            </div>

            {/* Amber Warning or Emerald Success */}
            {unansweredCount > 0 ? (
              <div
                className="alert"
                style={{
                  background: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.4)",
                  color: "#c8aa12",
                  textAlign: "left",
                  marginBottom: "2rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <strong
                    style={{ display: "block", marginBottom: "0.2rem" }}
                  >
                    Incomplete Assessment Warning
                  </strong>
                  <span>
                    You have{" "}
                    <strong>
                      {unansweredCount} unanswered question
                      {unansweredCount === 1 ? "" : "s"}
                    </strong>
                    ! Any unanswered items will be automatically scored as 0
                    points.
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="alert"
                style={{
                  background: "rgba(34, 197, 94, 0.15)",
                  border: "1px solid rgba(34, 197, 94, 0.4)",
                  color: "#43c372",
                  textAlign: "left",
                  marginBottom: "2rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span>
                  <strong>All Set!</strong> You have provided an answer for every
                  question in this assessment.
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={onKeepWorking}
                disabled={isSubmitting}
                className="btn btn-secondary btn-lg"
                style={{
                  flex: 1,
                  minWidth: "160px",
                  justifyContent: "center",
                }}
              >
                Keep Working
              </button>
              <button
                onClick={onConfirmSubmit}
                disabled={isSubmitting}
                className="btn btn-primary btn-lg"
                style={{
                  flex: 1,
                  minWidth: "200px",
                  justifyContent: "center",
                  boxShadow: "0 0 25px rgba(99, 102, 241, 0.5)",
                }}
              >
                {isSubmitting
                  ? "Submitting..."
                  : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Submission Modal Overlay */}
      {showAutoSubmitModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.88)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            zIndex: 110,
            display: "flex",
            alignItems: 'center',
            justifyContent: 'center',
            padding: "1.5rem",
            animation: "fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            className="card animate-fade-in"
            style={{
              maxWidth: "420px",
              width: "100%",
              textAlign: "center",
              padding: "1.75rem 1.5rem",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              boxShadow: "0 0 50px rgba(239, 68, 68, 0.3)",
            }}
          >
            <h3
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: "0.5rem",
              }}
            >
              Time&apos;s Up!
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.95rem",
                marginBottom: "1.5rem",
                lineHeight: "1.5",
              }}
            >
              Your allocated time has expired. Submitting your assessment
              automatically...
            </p>
            <div
              className="spinner"
              style={{ width: "42px", height: "42px", margin: "0 auto" }}
            ></div>
          </div>
        </div>
      )}
      </>
    </ModalPortal>
  );
};
