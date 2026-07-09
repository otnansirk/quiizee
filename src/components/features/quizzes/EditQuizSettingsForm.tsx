"use client";

import React from "react";
import Link from "next/link";

export interface EditQuizSettingsFormProps {
  accessCode: string;
  title: string;
  description: string;
  durationMode: "global" | "per_question";
  globalDurationMinutes: number | string;
  maxAttempts: number | string;
  certificateEnabled: boolean;
  certificateMinScore: number | string;
  isSubmitting: boolean;
  onTitleChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  onDurationModeChange: (val: "global" | "per_question") => void;
  onGlobalDurationChange: (val: number | string) => void;
  onMaxAttemptsChange: (val: number | string) => void;
  onCertificateEnabledChange: (val: boolean) => void;
  onCertificateMinScoreChange: (val: number | string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EditQuizSettingsForm: React.FC<EditQuizSettingsFormProps> = ({
  accessCode,
  title,
  description,
  durationMode,
  globalDurationMinutes,
  maxAttempts,
  certificateEnabled,
  certificateMinScore,
  isSubmitting,
  onTitleChange,
  onDescriptionChange,
  onDurationModeChange,
  onGlobalDurationChange,
  onMaxAttemptsChange,
  onCertificateEnabledChange,
  onCertificateMinScoreChange,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="card" style={{ padding: "2.5rem" }}>
      <div
        className="card-header flex justify-between items-center"
        style={{ flexWrap: "wrap", gap: "0.5rem" }}
      >
        <div>
          <h2 className="card-title">General Information</h2>
          <p className="card-description">
            Modify the title and descriptive instructions for your students.
          </p>
        </div>
        {accessCode && (
          <div
            style={{
              background: "rgba(10, 10, 15, 0.8)",
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              fontSize: "0.85rem",
            }}
          >
            <span style={{ color: "var(--text-muted)", marginRight: "0.5rem" }}>
              Code:
            </span>
            <strong
              style={{
                fontFamily: "monospace",
                color: "var(--accent-hover)",
                letterSpacing: "0.1em",
              }}
            >
              {accessCode}
            </strong>
          </div>
        )}
      </div>

      {/* Title Input */}
      <div className="form-group">
        <label className="label" htmlFor="title">
          Quiz Title <span style={{ color: "var(--error)" }}>*</span>
        </label>
        <input
          id="title"
          type="text"
          className="input"
          placeholder="e.g. Midterm Examination: Advanced Web Development"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Description Input */}
      <div className="form-group" style={{ marginBottom: "2.5rem" }}>
        <label className="label" htmlFor="description">
          Description / Instructions
        </label>
        <textarea
          id="description"
          className="input"
          rows={4}
          placeholder="Explain what this assessment covers, rules against cheating, or any preparatory materials..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          disabled={isSubmitting}
          style={{ resize: "vertical" }}
        />
      </div>

      {/* Access Mode Section */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h3
          className="card-title"
          style={{ fontSize: "1.2rem", marginBottom: "0.35rem" }}
        >
          Security & Access Mode
        </h3>
        <p className="card-description" style={{ marginBottom: "1rem" }}>
          How students will access this assessment.
        </p>

        <div className="choice-card selected" style={{ cursor: "default" }}>
          <div className="choice-card-title">Public Access Code Only</div>
          <div className="choice-card-desc">
            Students access this assessment by entering the unique access code
            along with their Name and Email. No student login or account
            registration required.
          </div>
        </div>
      </div>

      {/* Duration Mode Section */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h3
          className="card-title"
          style={{ fontSize: "1.2rem", marginBottom: "0.35rem" }}
        >
          Timer & Duration Mode
        </h3>
        <p className="card-description" style={{ marginBottom: "1rem" }}>
          Choose how time limits are enforced during the assessment.
        </p>

        <div className="choice-grid">
          <div
            className={`choice-card ${
              durationMode === "global" ? "selected" : ""
            }`}
            onClick={() => !isSubmitting && onDurationModeChange("global")}
          >
            <div className="choice-card-title">Global Timer</div>
            <div className="choice-card-desc">
              A single countdown timer for the entire assessment. Students can
              freely navigate back and forth between questions.
            </div>
          </div>

          <div
            className={`choice-card ${
              durationMode === "per_question" ? "selected" : ""
            }`}
            onClick={() => !isSubmitting && onDurationModeChange("per_question")}
          >
            <div className="choice-card-title">Per-Question Timer</div>
            <div className="choice-card-desc">
              Each question has its own timer. Sequential navigation only:
              students must answer within the limit and cannot return to
              previous questions.
            </div>
          </div>
        </div>

        {/* Conditional Input: Global Duration */}
        {durationMode === "global" && (
          <div
            className="form-group animate-fade-in"
            style={{ marginTop: "1.25rem", maxWidth: "300px" }}
          >
            <label className="label" htmlFor="globalDuration">
              Global Duration (minutes){" "}
              <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              id="globalDuration"
              type="number"
              min="1"
              max="600"
              className="input"
              value={globalDurationMinutes}
              onChange={(e) => onGlobalDurationChange(e.target.value)}
              required={durationMode === "global"}
              disabled={isSubmitting}
              placeholder="30"
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Will be converted to{" "}
              {Math.round(Number(globalDurationMinutes || 0) * 60)} seconds upon
              saving.
            </span>
          </div>
        )}
      </div>

      {/* Max Attempts Section */}
      <div
        className="form-group"
        style={{ marginBottom: "2.5rem", maxWidth: "300px" }}
      >
        <label className="label" htmlFor="maxAttempts">
          Maximum Attempts Allowed{" "}
          <span style={{ color: "var(--error)" }}>*</span>
        </label>
        <input
          id="maxAttempts"
          type="number"
          min="1"
          max="100"
          className="input"
          value={maxAttempts}
          onChange={(e) => onMaxAttemptsChange(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Number of times a student is allowed to retake this assessment.
        </span>
      </div>

      {/* Certificate Settings Section */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h3
          className="card-title"
          style={{ fontSize: "1.2rem", marginBottom: "0.35rem" }}
        >
          Certificate Settings
        </h3>
        <p className="card-description" style={{ marginBottom: "1rem" }}>
          Automatically award downloadable completion certificates to passing
          students.
        </p>

        <div
          className={`toggle-switch-wrapper ${
            certificateEnabled ? "active" : ""
          }`}
          onClick={() =>
            !isSubmitting && onCertificateEnabledChange(!certificateEnabled)
          }
        >
          <div>
            <div
              style={{
                fontWeight: 700,
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              Enable Certificate for this Quiz
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Students who score above the minimum passing threshold will receive
              an official certificate of achievement.
            </div>
          </div>

          <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={certificateEnabled}
              onChange={(e) => onCertificateEnabledChange(e.target.checked)}
              disabled={isSubmitting}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Conditional Input: Minimum Score (%) */}
        {certificateEnabled && (
          <div
            className="form-group animate-fade-in"
            style={{ marginTop: "1.25rem", maxWidth: "300px" }}
          >
            <label className="label" htmlFor="certificateMinScore">
              Minimum Passing Score (%){" "}
              <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              id="certificateMinScore"
              type="number"
              min="1"
              max="100"
              className="input"
              value={certificateMinScore}
              onChange={(e) => onCertificateMinScoreChange(e.target.value)}
              required={certificateEnabled}
              disabled={isSubmitting}
              placeholder="70"
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Percentage score required to unlock the certificate (e.g. 70 for
              70%).
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div
        className="flex justify-between items-center"
        style={{
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--border)",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <Link href="/teacher/quizzes" className="btn btn-secondary">
          Cancel
        </Link>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={isSubmitting}
          style={{ boxShadow: "0 0 25px rgba(99, 102, 241, 0.4)" }}
        >
          {isSubmitting ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
};
