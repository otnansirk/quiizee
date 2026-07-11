"use client";

import React from "react";

export interface ReviewQuestionCardProps {
  item: any;
  form: {
    score: number | string;
    feedback?: string | null;
    saving?: boolean;
    saved?: boolean;
    error?: string | null;
  };
  onFormChange: (questionId: string, updates: any) => void;
  onSaveGrade: (item: any) => void;
}

export const ReviewQuestionCard: React.FC<ReviewQuestionCardProps> = ({
  item,
  form,
  onFormChange,
  onSaveGrade,
}) => {
  const isEssay = item.type === "essay";
  const isMC = item.type === "multiple_choice";
  const isTF = item.type === "true_false";

  const typeBadgeText = isEssay
    ? "Essay"
    : isMC
    ? "Multiple Choice"
    : "True / False";
  const typeBadgeStyle = isEssay
    ? {
        background: "rgba(245, 158, 11, 0.15)",
        color: "#fde047",
        border: "1px solid rgba(245, 158, 11, 0.3)",
      }
    : {
        background: "rgba(59, 130, 246, 0.15)",
        color: "#3066a3",
        border: "1px solid rgba(59, 130, 246, 0.3)",
      };

  return (
    <div
      className={`card mb-6 p-8 border-l-4 ${
        isEssay
          ? "border-l-amber-500 bg-gradient-to-br from-[#1e1a30]/85 to-[#141428]/95 shadow-[0_8px_32px_rgba(0,0,0,0.4),_0_0_20px_rgba(99,102,241,0.12)]"
          : item.isCorrect
            ? "border-l-emerald-500 bg-card shadow-md"
            : "border-l-red-500 bg-card shadow-md"
      }`}
    >
      {/* Question Header */}
      <div className="flex justify-between items-start gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-lg font-extrabold text-foreground bg-white w-9 h-9 rounded-full flex items-center justify-center border border-border">
            {item.order}
          </span>
          <span
            className="badge m-0"
            style={typeBadgeStyle}
          >
            {typeBadgeText}
          </span>
        </div>

        {/* Points Badge / Auto-graded status */}
        <div>
          {isEssay ? (
            <span
              className={`badge m-0 text-xs px-3.5 py-1.5 font-bold border ${
                item.isGraded
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/15 text-yellow-300 border-amber-500/30"
              }`}
            >
              {item.isGraded
                ? `Graded: ${item.currentScore} / ${item.maxPoints} pts`
                : `Max ${item.maxPoints} pts (Ungraded)`}
            </span>
          ) : (
            <span
              className={`badge m-0 text-xs px-3.5 py-1.5 font-bold border ${
                item.isCorrect
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/15 text-red-400 border-red-500/30"
              }`}
            >
              {item.isCorrect
                ? `${item.currentScore} / ${item.maxPoints} pts`
                : `0 / ${item.maxPoints} pts`}
            </span>
          )}
        </div>
      </div>

      {/* Question Prompt */}
      <div className={`text-lg font-semibold leading-relaxed italic ${isEssay ? "text-white/85" : "text-muted-foreground"}`}>
        {item.questionText}
      </div>

      {/* Question Image if any */}
      {item.questionImage && (
        <div className="mb-6 rounded-md overflow-hidden border border-border max-w-[600px] my-5">
          <img
            src={item.questionImage}
            alt="Question attachment"
            className="w-full h-auto block"
          />
        </div>
      )}

      {/* Response / Review Section */}
      {isEssay ? (
        /* ESSAY QUESTION: INTERACTIVE GRADING FORM */
        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="mb-6">
            <label className="label block mb-2.5 text-white/65 font-medium">
              <span>Student&apos;s Written Response:</span>
            </label>
            <div className={`bg-white/40 rounded-md p-5 text-base leading-relaxed whitespace-pre-wrap min-h-[110px] shadow-inner mb-2 ${
              item.answerText ? "text-white/90 not-italic" : "text-muted-foreground italic"
            }`}>
              {item.answerText ||
                "No answer provided (Timed Out or Left Blank)"}
            </div>
          </div>

          {/* Grading Form Box */}
          <div className="p-6">
            <h4 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              Assign Score & Instructor Feedback
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-6 items-start">
              {/* Points Awarded Input */}
              <div className="form-group m-0">
                <label className="label text-white/65">
                  Points (Max {item.maxPoints})
                </label>
                <input
                  type="number"
                  min="0"
                  max={item.maxPoints}
                  step="0.5"
                  value={form.score}
                  onChange={(e) =>
                    onFormChange(item.questionId, {
                      score: e.target.value,
                      saved: false,
                      error: null,
                    })
                  }
                  className={`input text-xl font-bold text-center bg-[#0a0a0f]/90 text-white/90 ${
                    form.error ? "border-red-500" : "border-indigo-500/40"
                  }`}
                />
              </div>

              {/* Instructor Feedback Textarea */}
              <div className="form-group m-0">
                <label className="label text-white/65">
                  Instructor Feedback & Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Great analysis! Remember to cite specific examples..."
                  value={form.feedback || ""}
                  onChange={(e) =>
                    onFormChange(item.questionId, {
                      feedback: e.target.value,
                      saved: false,
                      error: null,
                    })
                  }
                  className="input resize-y min-h-[80px]"
                />
              </div>
            </div>

            {/* Error Message */}
            {form.error && (
              <div className="text-red-400 text-sm mt-3 font-semibold">
                {form.error}
              </div>
            )}

            {/* Save Button & Status */}
            <div className="flex justify-end items-center gap-4 mt-6 pt-4 border-t border-white/5">
              {form.saved && (
                <span className="animate-fade-in text-emerald-400 font-bold text-base flex items-center gap-1">
                  Saved & Live Score Updated!
                </span>
              )}

              <button
                onClick={() => onSaveGrade(item)}
                disabled={form.saving}
                className="btn btn-primary py-2.5 px-6 shadow-[0_0_18px_rgba(99,102,241,0.35)] font-bold cursor-pointer disabled:opacity-50"
              >
                {form.saving ? "⌛ Saving..." : "💾 Save Grade & Feedback"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* READ-ONLY REVIEW FOR MULTIPLE CHOICE & TRUE/FALSE */
        <div className="mt-5 border-t border-white/10">
          {item.options && item.options.length > 0 ? (
            /* Display Options List */
            <div className="flex flex-col gap-3">
              {item.options.map((opt: any, idx: number) => {
                const isSelected =
                  item.selectedOptionId === opt.id ||
                  item.answerText === opt.optionText;
                const isOptCorrect =
                  opt.isCorrect ||
                  opt.optionText === item.correctAnswer ||
                  opt.id === item.correctAnswer;
                const letter = String.fromCharCode(65 + idx);

                let boxClass = "flex items-center justify-between p-4 rounded-md border border-border bg-[#141420]/40 transition-all";
                let badgeText = "";
                let badgeClass = "";

                if (isSelected && isOptCorrect) {
                  boxClass = "flex items-center justify-between p-4 rounded-md border border-emerald-500 bg-emerald-500/12 transition-all";
                  badgeText = "Student Answer (Correct)";
                  badgeClass = "bg-emerald-500/20 text-emerald-400";
                } else if (isSelected && !isOptCorrect) {
                  boxClass = "flex items-center justify-between p-4 rounded-md border border-red-500 bg-red-500/12 transition-all";
                  badgeText = "Student Answer (Incorrect)";
                  badgeClass = "bg-red-500/20 text-red-400";
                } else if (!isSelected && isOptCorrect) {
                  boxClass = "flex items-center justify-between p-4 rounded-md border border-dashed border-emerald-500 bg-emerald-500/5 transition-all";
                  badgeText = "Correct Answer";
                  badgeClass = "bg-emerald-500/15 text-emerald-400";
                }

                return (
                  <div key={opt.id} className={boxClass}>
                    <span className={`text-base text-foreground ${
                      isSelected || isOptCorrect ? "font-bold" : "font-normal"
                    }`}>
                      {letter}. {opt.optionText}
                    </span>
                    {badgeText && (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${badgeClass}`}>
                        {badgeText}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Display Simple Text comparison if no options array */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`border rounded-md p-4 bg-white/5 ${
                item.isCorrect ? "border-emerald-500" : "border-red-500"
              }`}>
                <div className="text-xs text-muted-foreground font-bold mb-1 tracking-wider uppercase">
                  STUDENT&apos;S ANSWER
                </div>
                <div className={`text-lg font-bold ${
                  item.isCorrect ? "text-emerald-400" : "text-red-400"
                }`}>
                  {item.answerText || "No answer selected"}
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-dashed border-emerald-500 rounded-md p-4">
                <div className="text-xs text-emerald-400 font-bold mb-1 tracking-wider uppercase">
                  CORRECT ANSWER
                </div>
                <div className="text-lg font-bold text-foreground">
                  {item.correctAnswer || "Not specified"}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
