"use client";

import React from "react";
import Link from "next/link";

export interface EditQuizSettingsFormProps {
  accessCode: string;
  title: string;
  description: string;
  accessMode: "public" | "private" | "strict";
  allowedEmails: string;
  canResume: boolean;
  expiresAt: string;
  durationMode: "global" | "per_question";
  globalDurationMinutes: number | string;
  perQuestionDurationSeconds?: number | string;
  maxAttempts: number | string;
  certificateEnabled: boolean;
  certificateMinScore: number | string;
  certificateSignerName?: string;
  certificateSignerRole?: string;
  certificateSignatureUrl?: string;
  isSubmitting: boolean;
  onTitleChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  onAccessModeChange: (val: "public" | "private" | "strict") => void;
  onAllowedEmailsChange: (val: string) => void;
  onCanResumeChange: (val: boolean) => void;
  onExpiresAtChange: (val: string) => void;
  onDurationModeChange: (val: "global" | "per_question") => void;
  onGlobalDurationChange: (val: number | string) => void;
  onPerQuestionDurationChange?: (val: number | string) => void;
  onMaxAttemptsChange: (val: number | string) => void;
  onCertificateEnabledChange: (val: boolean) => void;
  onCertificateMinScoreChange: (val: number | string) => void;
  onCertificateSignerNameChange?: (val: string) => void;
  onCertificateSignerRoleChange?: (val: string) => void;
  onCertificateSignatureUrlChange?: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EditQuizSettingsForm: React.FC<EditQuizSettingsFormProps> = ({
  accessCode,
  title,
  description,
  accessMode,
  allowedEmails,
  canResume,
  expiresAt,
  durationMode,
  globalDurationMinutes,
  perQuestionDurationSeconds = "30",
  maxAttempts,
  certificateEnabled,
  certificateMinScore,
  certificateSignerName = "",
  certificateSignerRole = "",
  certificateSignatureUrl = "",
  isSubmitting,
  onTitleChange,
  onDescriptionChange,
  onAccessModeChange,
  onAllowedEmailsChange,
  onCanResumeChange,
  onExpiresAtChange,
  onDurationModeChange,
  onGlobalDurationChange,
  onPerQuestionDurationChange,
  onMaxAttemptsChange,
  onCertificateEnabledChange,
  onCertificateMinScoreChange,
  onCertificateSignerNameChange,
  onCertificateSignerRoleChange,
  onCertificateSignatureUrlChange,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="card p-6 sm:p-10">
      <div className="card-header flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="card-title">General Information</h2>
          <p className="card-description">
            Modify the title and descriptive instructions for your students.
          </p>
        </div>
        {accessCode && (
          <div className="bg-[#0a0a0f]/80 px-4 py-2 rounded-md border border-border text-sm">
            <span className="text-[#FFFFF5] mr-2">
              Code:
            </span>
            <strong className="font-mono text-white tracking-widest">
              {accessCode}
            </strong>
          </div>
        )}
      </div>

      {/* Title Input */}
      <div className="form-group">
        <label className="label" htmlFor="title">
          Quiz Title <span className="text-error">*</span>
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
      <div className="form-group mb-10">
        <label className="label" htmlFor="description">
          Description / Instructions
        </label>
        <textarea
          id="description"
          className="input resize-y"
          rows={4}
          placeholder="Explain what this assessment covers, rules against cheating, or any preparatory materials..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {/* Access Mode Section */}
      <div className="mb-10">
        <h3 className="card-title text-xl mb-1.5">
          Security & Access Mode
        </h3>
        <p className="card-description mb-4">
          How students will access this assessment.
        </p>

        <div className="choice-grid">
          <div
            className={`choice-card ${accessMode === "public" ? "selected" : ""}`}
            onClick={() => !isSubmitting && onAccessModeChange("public")}
          >
            <div className="choice-card-title">Public Mode (Access Code Only)</div>
            <div className="choice-card-desc">
              Anyone with the unique access code can join and attempt this assessment by entering their Name and Email.
            </div>
          </div>

          <div
            className={`choice-card ${accessMode === "strict" ? "selected" : ""}`}
            onClick={() => !isSubmitting && onAccessModeChange("strict")}
          >
            <div className="choice-card-title">Strict Mode (Email Whitelist)</div>
            <div className="choice-card-desc">
              Only students whose email address matches your whitelist can join using the access code.
            </div>
          </div>
        </div>

        {accessMode === "strict" && (
          <div className="form-group animate-fade-in mt-5">
            <label className="label" htmlFor="allowedEmails">
              Allowed Email Addresses <span className="text-error">*</span>
            </label>
            <textarea
              id="allowedEmails"
              rows={4}
              className="input font-mono"
              placeholder={`student1@example.com\nstudent2@example.com`}
              value={allowedEmails}
              onChange={(e) => onAllowedEmailsChange(e.target.value)}
              disabled={isSubmitting}
            />
            <span className="text-xs text-muted-foreground">
              Enter one email per line (or separate by comma). Only these exact email addresses can attempt the quiz.
            </span>
          </div>
        )}
      </div>

      {/* Duration Mode Section */}
      <div className="mb-10">
        <h3 className="card-title text-xl mb-1.5">
          Timer & Duration Mode
        </h3>
        <p className="card-description mb-4">
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
          <div className="form-group animate-fade-in mt-5 max-w-[300px]">
            <label className="label" htmlFor="globalDuration">
              Global Duration (minutes){" "}
              <span className="text-error">*</span>
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
            <span className="text-xs text-muted-foreground">
              Will be converted to{" "}
              {Math.round(Number(globalDurationMinutes || 0) * 60)} seconds upon
              saving.
            </span>
          </div>
        )}

        {/* Conditional Input: Per-Question Bulk Duration */}
        {durationMode === "per_question" && (
          <div className="form-group animate-fade-in mt-5 max-w-[300px]">
            <label className="label" htmlFor="perQuestionDuration">
              Bulk Per-Question Duration (seconds){" "}
              <span className="text-error">*</span>
            </label>
            <input
              id="perQuestionDuration"
              type="number"
              min="5"
              max="3600"
              className="input"
              value={perQuestionDurationSeconds || ""}
              onChange={(e) =>
                onPerQuestionDurationChange &&
                onPerQuestionDurationChange(e.target.value)
              }
              required={durationMode === "per_question"}
              disabled={isSubmitting}
              placeholder="30"
            />
            <span className="text-xs text-muted-foreground">
              Sets and updates all questions in this assessment to this duration in seconds upon saving.
            </span>
          </div>
        )}
      </div>

      {/* Max Attempts Section */}
      <div className="form-group mb-10 max-w-[300px]">
        <label className="label" htmlFor="maxAttempts">
          Maximum Attempts Allowed{" "}
          <span className="text-error">*</span>
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
        <span className="text-xs text-muted-foreground">
          Number of times a student is allowed to retake this assessment.
        </span>
      </div>

      {/* Attempt Resume Section */}
      <div className="mb-10">
        <h3 className="card-title text-xl mb-1.5">
          Attempt Resume Setting
        </h3>
        <p className="card-description mb-4">
          Control whether students can resume an unfinished assessment session if they accidentally close or refresh their tab.
        </p>

        <div
          className={`toggle-switch-wrapper ${canResume ? "active" : ""}`}
          onClick={() => !isSubmitting && onCanResumeChange(!canResume)}
        >
          <div>
            <div className="font-bold text-foreground flex items-center gap-2">
              Allow Students to Resume Ongoing Attempts
            </div>
            <div className="text-sm text-muted-foreground">
              If enabled, re-entering the assessment with the same email brings students right back where they left off without using up an attempt.
            </div>
          </div>

          <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={canResume}
              onChange={(e) => onCanResumeChange(e.target.checked)}
              disabled={isSubmitting}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Expiration Deadline Section */}
      <div className="mb-10">
        <h3 className="card-title text-xl mb-1.5">
          Expiration Deadline
        </h3>
        <p className="card-description mb-4">
          Set an optional closing date and time. After this deadline, no new attempts can be started.
        </p>

        <div className="form-group max-w-[350px]">
          <label className="label" htmlFor="expiresAt">
            Closing Date & Time (Optional)
          </label>
          <input
            id="expiresAt"
            type="datetime-local"
            className="input"
            value={expiresAt}
            onChange={(e) => onExpiresAtChange(e.target.value)}
            disabled={isSubmitting}
          />
          <span className="text-xs text-muted-foreground">
            Leave empty for lifetime validity (never expires).
          </span>
        </div>
      </div>

      {/* Certificate Settings Section */}
      <div className="mb-10">
        <h3 className="card-title text-xl mb-1.5">
          Certificate Settings
        </h3>
        <p className="card-description mb-4">
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
            <div className="font-bold text-foreground flex items-center gap-2">
              Enable Certificate for this Quiz
            </div>
            <div className="text-sm text-muted-foreground">
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

        {/* Conditional Inputs when Certificate is Enabled */}
        {certificateEnabled && (
          <div className="animate-fade-in mt-5 p-5 bg-white/[0.02] rounded-lg border border-border flex flex-col gap-5">
            <div className="form-group max-w-[300px]">
              <label className="label" htmlFor="certificateMinScore">
                Minimum Passing Score (%){" "}
                <span className="text-error">*</span>
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
              <span className="text-xs text-muted-foreground">
                Percentage score required to unlock the certificate (e.g. 70 for 70%).
              </span>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="certificateSignerName">
                Signer Name (Defaults to signed-in name if left blank)
              </label>
              <input
                id="certificateSignerName"
                type="text"
                className="input"
                value={certificateSignerName}
                onChange={(e) => onCertificateSignerNameChange?.(e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g., Dr. Jane Smith"
              />
              <span className="text-xs text-muted-foreground">
                Name displayed on the signature line of the completion certificate.
              </span>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="certificateSignerRole">
                Signer Role / Title (Optional)
              </label>
              <input
                id="certificateSignerRole"
                type="text"
                className="input"
                value={certificateSignerRole}
                onChange={(e) => onCertificateSignerRoleChange?.(e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g., Lead Instructor & Course Director"
              />
              <span className="text-xs text-muted-foreground">
                Title displayed right underneath the signer&apos;s name.
              </span>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="certificateSignatureUrl">
                Signature Image URL (Optional)
              </label>
              <input
                id="certificateSignatureUrl"
                type="url"
                className="input"
                value={certificateSignatureUrl}
                onChange={(e) => onCertificateSignatureUrlChange?.(e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g., https://example.com/signature.png"
              />
              <span className="text-xs text-muted-foreground">
                Direct URL to a PNG or JPG image of the instructor&apos;s signature (transparent background recommended).
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="flex justify-between items-center pt-6 border-t border-border flex-wrap gap-4">
        <Link href="/teacher/quizzes" className="btn btn-secondary">
          Cancel
        </Link>

        <button
          type="submit"
          className="btn btn-primary btn-lg shadow-lg shadow-indigo-500/40 font-black"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
};
