'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function EditQuizPage() {
  const params = useParams();
  const quizId = params?.quizId as string;
  const router = useRouter();

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [accessMode, setAccessMode] = useState<'public' | 'private'>('public');
  const [durationMode, setDurationMode] = useState<'global' | 'per_question'>('global');
  const [globalDurationMinutes, setGlobalDurationMinutes] = useState<number | string>(30);
  const [maxAttempts, setMaxAttempts] = useState<number | string>(1);
  const [certificateEnabled, setCertificateEnabled] = useState<boolean>(false);
  const [certificateMinScore, setCertificateMinScore] = useState<number | string>(70);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [questionsCount, setQuestionsCount] = useState<number>(0);

  // Action States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) return;

    const fetchQuiz = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/quizzes/${quizId}`);
        if (!res.ok) {
          throw new Error('Failed to load quiz details or quiz not found.');
        }
        const data = await res.json();
        const q = data.quiz || data.data || data;

        setTitle(q.title || '');
        setDescription(q.description || '');
        setAccessCode(q.accessCode || '');
        setAccessMode(q.accessMode || 'public');
        setDurationMode(q.durationMode || 'global');
        setGlobalDurationMinutes(q.globalDuration ? Math.round(q.globalDuration / 60) : 30);
        setMaxAttempts(q.maxAttempts || 1);
        setCertificateEnabled(q.certificateEnabled || false);
        setCertificateMinScore(q.certificateMinScore || 70);
        setIsPublished(Boolean(q.isPublished));
        setQuestionsCount(q.questionsCount ?? (Array.isArray(q.questions) ? q.questions.length : 0));
      } catch (err: any) {
        setFetchError(err.message || 'Could not fetch quiz data.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleTogglePublish = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isPublished && questionsCount === 0) {
      setErrorMsg('Cannot publish quiz: You must add at least 1 question before publishing!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsPublishing(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || `Failed to ${isPublished ? 'unpublish' : 'publish'} quiz.`);
      }

      setIsPublished(!isPublished);
      setSuccessMsg(`Quiz has been successfully ${!isPublished ? 'published 🟢' : 'unpublished 🟡'}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle publication status.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter a quiz title.');
      return;
    }

    if (durationMode === 'global' && (!globalDurationMinutes || Number(globalDurationMinutes) <= 0)) {
      setErrorMsg('Please specify a valid global duration in minutes (greater than 0).');
      return;
    }

    if (certificateEnabled && (!certificateMinScore || Number(certificateMinScore) < 1 || Number(certificateMinScore) > 100)) {
      setErrorMsg('Please enter a valid minimum passing score percentage between 1% and 100%.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      accessMode,
      durationMode,
      globalDuration: durationMode === 'global' ? Math.round(Number(globalDurationMinutes) * 60) : null,
      maxAttempts: Math.max(1, Number(maxAttempts) || 1),
      certificateEnabled,
      certificateMinScore: certificateEnabled ? Math.min(100, Math.max(1, Number(certificateMinScore) || 70)) : null,
      isPublished,
    };

    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Failed to save quiz changes.');
      }

      router.push('/teacher/quizzes');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save quiz changes.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center animate-fade-in" style={{ padding: '5rem 0' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
          Loading quiz configuration...
        </p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="card animate-fade-in text-center" style={{ maxWidth: '600px', margin: '4rem auto', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Failed to Load Quiz</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{fetchError}</p>
        <Link href="/teacher/quizzes" className="btn btn-primary">
          ← Return to My Quizzes
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Back Navigation */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Link
          href="/teacher/quizzes"
          className="btn btn-ghost btn-sm"
          style={{ paddingLeft: 0, color: 'var(--text-secondary)' }}
        >
          ← Back to Quizzes
        </Link>

        <Link
          href={`/teacher/quizzes/${quizId}/questions`}
          className="btn btn-secondary btn-sm"
          style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: 'var(--accent-hover)' }}
        >
          ❓ Manage Questions ({questionsCount}) ➔
        </Link>
      </div>

      {/* Page Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="title" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
          Edit Quiz Settings
        </h1>
        <p className="subtitle" style={{ margin: 0, maxWidth: '100%' }}>
          Update assessment parameters, access permissions, and certificates
        </p>
      </div>

      {/* Alert Messages */}
      {errorMsg && (
        <div className="alert alert-error animate-fade-in">
          <span>⚠️</span>
          <span style={{ flex: 1 }}>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.2rem 0.5rem', minWidth: 'auto', color: '#fca5a5' }}
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success animate-fade-in">
          <span>✅</span>
          <span style={{ flex: 1 }}>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg(null)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.2rem 0.5rem', minWidth: 'auto', color: '#86efac' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Publication Status Card */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          padding: '1.5rem 2rem',
          borderLeft: isPublished ? '4px solid var(--success)' : '4px solid var(--warning)',
          background: 'rgba(20, 20, 35, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Publication Status:
            </span>
            <span className={`badge ${isPublished ? 'badge-success' : 'badge-warning'}`} style={{ margin: 0, fontSize: '0.8rem' }}>
              {isPublished ? '🟢 Published' : '🟡 Draft'}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            {isPublished
              ? 'This assessment is currently live and accessible to students with the access code.'
              : 'This assessment is currently hidden from students. Add questions and publish when ready.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleTogglePublish}
          disabled={isPublishing || isSubmitting}
          className={`btn ${isPublished ? 'btn-secondary' : 'btn-primary'}`}
        >
          {isPublishing ? '⌛ Updating...' : isPublished ? '⏸️ Unpublish Quiz' : '🚀 Publish Quiz'}
        </button>
      </div>

      {/* Main Glassmorphic Form Card */}
      <form onSubmit={handleSubmit} className="card" style={{ padding: '2.5rem' }}>
        <div className="card-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 className="card-title">General Information</h2>
            <p className="card-description">
              Modify the title and descriptive instructions for your students.
            </p>
          </div>
          {accessCode && (
            <div style={{ background: 'rgba(10, 10, 15, 0.8)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>Code:</span>
              <strong style={{ fontFamily: 'monospace', color: 'var(--accent-hover)', letterSpacing: '0.1em' }}>{accessCode}</strong>
            </div>
          )}
        </div>

        {/* Title Input */}
        <div className="form-group">
          <label className="label" htmlFor="title">
            Quiz Title <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <input
            id="title"
            type="text"
            className="input"
            placeholder="e.g. Midterm Examination: Advanced Web Development"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Description Input */}
        <div className="form-group" style={{ marginBottom: '2.5rem' }}>
          <label className="label" htmlFor="description">
            Description / Instructions
          </label>
          <textarea
            id="description"
            className="input"
            rows={4}
            placeholder="Explain what this assessment covers, rules against cheating, or any preparatory materials..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Access Mode Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 className="card-title" style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
            Security & Access Mode
          </h3>
          <p className="card-description" style={{ marginBottom: '1rem' }}>
            How students will access this assessment.
          </p>

          <div className="choice-card selected" style={{ cursor: 'default' }}>
            <div className="choice-card-title">
              <span>🌐</span> Public Access Code Only
            </div>
            <div className="choice-card-desc">
              Students access this assessment by entering the unique access code along with their Name and Email. No student login or account registration required.
            </div>
          </div>
        </div>

        {/* Duration Mode Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 className="card-title" style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
            Timer & Duration Mode
          </h3>
          <p className="card-description" style={{ marginBottom: '1rem' }}>
            Choose how time limits are enforced during the assessment.
          </p>

          <div className="choice-grid">
            <div
              className={`choice-card ${durationMode === 'global' ? 'selected' : ''}`}
              onClick={() => !isSubmitting && setDurationMode('global')}
            >
              <div className="choice-card-title">
                <span>⏱️</span> Global Timer
              </div>
              <div className="choice-card-desc">
                A single countdown timer for the entire assessment. Students can freely navigate back and forth between questions.
              </div>
            </div>

            <div
              className={`choice-card ${durationMode === 'per_question' ? 'selected' : ''}`}
              onClick={() => !isSubmitting && setDurationMode('per_question')}
            >
              <div className="choice-card-title">
                <span>⚡</span> Per-Question Timer
              </div>
              <div className="choice-card-desc">
                Each question has its own timer. Sequential navigation only: students must answer within the limit and cannot return to previous questions.
              </div>
            </div>
          </div>

          {/* Conditional Input: Global Duration */}
          {durationMode === 'global' && (
            <div className="form-group animate-fade-in" style={{ marginTop: '1.25rem', maxWidth: '300px' }}>
              <label className="label" htmlFor="globalDuration">
                Global Duration (minutes) <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                id="globalDuration"
                type="number"
                min="1"
                max="600"
                className="input"
                value={globalDurationMinutes}
                onChange={(e) => setGlobalDurationMinutes(e.target.value)}
                required={durationMode === 'global'}
                disabled={isSubmitting}
                placeholder="30"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Will be converted to {Math.round(Number(globalDurationMinutes || 0) * 60)} seconds upon saving.
              </span>
            </div>
          )}
        </div>

        {/* Max Attempts Section */}
        <div className="form-group" style={{ marginBottom: '2.5rem', maxWidth: '300px' }}>
          <label className="label" htmlFor="maxAttempts">
            Maximum Attempts Allowed <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <input
            id="maxAttempts"
            type="number"
            min="1"
            max="100"
            className="input"
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Number of times a student is allowed to retake this assessment.
          </span>
        </div>

        {/* Certificate Settings Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 className="card-title" style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
            Certificate Settings
          </h3>
          <p className="card-description" style={{ marginBottom: '1rem' }}>
            Automatically award downloadable completion certificates to passing students.
          </p>

          <div
            className={`toggle-switch-wrapper ${certificateEnabled ? 'active' : ''}`}
            onClick={() => !isSubmitting && setCertificateEnabled(!certificateEnabled)}
          >
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🎓</span> Enable Certificate for this Quiz
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Students who score above the minimum passing threshold will receive an official certificate of achievement.
              </div>
            </div>

            <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={certificateEnabled}
                onChange={(e) => setCertificateEnabled(e.target.checked)}
                disabled={isSubmitting}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Conditional Input: Minimum Score (%) */}
          {certificateEnabled && (
            <div className="form-group animate-fade-in" style={{ marginTop: '1.25rem', maxWidth: '300px' }}>
              <label className="label" htmlFor="certificateMinScore">
                Minimum Passing Score (%) <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                id="certificateMinScore"
                type="number"
                min="1"
                max="100"
                className="input"
                value={certificateMinScore}
                onChange={(e) => setCertificateMinScore(e.target.value)}
                required={certificateEnabled}
                disabled={isSubmitting}
                placeholder="70"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Percentage score required to unlock the certificate (e.g. 70 for 70%).
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="flex justify-between items-center" style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
          <Link href="/teacher/quizzes" className="btn btn-secondary">
            Cancel
          </Link>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isSubmitting}
            style={{ boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)' }}
          >
            {isSubmitting ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s infinite linear' }}>⏳</span>
                Saving Changes...
              </>
            ) : (
              <>
                💾 Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
