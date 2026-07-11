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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in">
            <div className="card animate-fade-in max-w-[480px] w-full text-center p-7 border border-indigo-500/40 shadow-2xl shadow-indigo-500/25 bg-secondary">
              <h3 className="text-xl font-extrabold text-foreground mb-2">
                Submit Assessment?
              </h3>
              <p className="text-muted-foreground mb-5 text-sm">
                You are about to finalize and submit your responses for scoring.
              </p>

              {/* Scorecard Summary Stats */}
              <div className="bg-zinc-900 border border-border rounded-xl p-5 mb-7 flex justify-around items-center">
                <div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Total Questions
                  </div>
                  <div className="text-2xl font-extrabold text-white mt-1">
                    {totalCount}
                  </div>
                </div>
                <div className="w-[1px] h-10 bg-border" />
                <div>
                  <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                    Answered
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                    {answeredCount}
                  </div>
                </div>
                <div className="w-[1px] h-10 bg-border" />
                <div>
                  <div className={`text-xs font-semibold uppercase tracking-wider ${unansweredCount > 0 ? "text-amber-300" : "text-muted-foreground"}`}>
                    Unanswered
                  </div>
                  <div className={`text-2xl font-extrabold mt-1 ${unansweredCount > 0 ? "text-amber-300" : "text-white"}`}>
                    {unansweredCount}
                  </div>
                </div>
              </div>

              {/* Amber Warning or Emerald Success */}
              {unansweredCount > 0 ? (
                <div className="alert bg-amber-500/15 border border-amber-500/40 text-amber-300 text-left mb-8 flex items-start gap-3 p-4 rounded-xl">
                  <div>
                    <strong className="block mb-1 font-bold">
                      Incomplete Assessment Warning
                    </strong>
                    <span className="text-sm">
                      You have{" "}
                      <strong className="font-bold">
                        {unansweredCount} unanswered question
                        {unansweredCount === 1 ? "" : "s"}
                      </strong>
                      ! Any unanswered items will be automatically scored as 0 points.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="alert bg-emerald-500/15 border border-emerald-500/40 text-green-600 text-left mb-8 flex items-center gap-3 p-4 rounded-xl">
                  <span className="text-sm">
                    <strong className="font-bold">All Set!</strong> You have provided an answer for every question in this assessment.
                  </span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={onKeepWorking}
                  disabled={isSubmitting}
                  className="btn btn-secondary btn-lg flex-1 min-w-[160px] justify-center py-3"
                >
                  Keep Working
                </button>
                <button
                  onClick={onConfirmSubmit}
                  disabled={isSubmitting}
                  className="btn btn-primary btn-lg flex-1 min-w-[200px] justify-center py-3 shadow-lg shadow-indigo-500/50"
                >
                  {isSubmitting ? "Submitting..." : "Yes, Submit"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Submission Modal Overlay */}
        {showAutoSubmitModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-fade-in">
            <div className="card animate-fade-in max-w-[420px] w-full text-center p-7 border border-error/50 shadow-2xl shadow-error/30 bg-secondary">
              <h3 className="text-xl font-extrabold text-foreground mb-2">
                Time&apos;s Up!
              </h3>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                Your allocated time has expired. Submitting your assessment automatically...
              </p>
              <div className="spinner w-11 h-11 mx-auto"></div>
            </div>
          </div>
        )}
      </>
    </ModalPortal>
  );
};
