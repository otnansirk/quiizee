'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface QuizItem {
  id: string;
  title: string;
  description: string | null;
  accessCode: string;
  accessMode: 'public' | 'private';
  durationMode: 'global' | 'per_question';
  globalDuration: number | null; // in seconds
  maxAttempts: number;
  certificateEnabled: boolean;
  certificateMinScore: number | null;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
  questionsCount?: number;
  questions?: any[];
}

export default function MyQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quizzes');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setQuizzes(data);
        } else if (data && Array.isArray(data.quizzes)) {
          setQuizzes(data.quizzes);
        } else if (data && Array.isArray(data.data)) {
          setQuizzes(data.data);
        } else {
          setQuizzes([]);
        }
      } else {
        setQuizzes([]);
      }
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleCopyCode = (id: string, code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    }
  };

  const handleTogglePublish = async (quiz: QuizItem) => {
    setPublishError(null);
    setSuccessMsg(null);

    // If trying to publish, check if questions count is 0
    const qCount = quiz.questionsCount ?? (Array.isArray(quiz.questions) ? quiz.questions.length : undefined);
    if (!quiz.isPublished && qCount === 0) {
      setPublishError(`Cannot publish "${quiz.title}": You must add at least 1 question before publishing!`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setUpdatingId(quiz.id);
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !quiz.isPublished }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errText = data.error || data.message || `Failed to ${quiz.isPublished ? 'unpublish' : 'publish'} quiz.`;
        setPublishError(`Cannot publish "${quiz.title}": ${errText}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setUpdatingId(null);
        return;
      }

      await fetchQuizzes();
      setSuccessMsg(`Quiz "${quiz.title}" has been successfully ${!quiz.isPublished ? 'published 🟢' : 'unpublished 🟡'}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setPublishError(`Network error: ${err.message || 'Failed to update publication status'}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (quiz: QuizItem) => {
    if (!window.confirm(`Are you sure you want to delete "${quiz.title}"?\n\nAll associated questions, options, and student attempts will be permanently deleted.`)) {
      return;
    }

    setDeletingId(quiz.id);
    setPublishError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccessMsg(`Quiz "${quiz.title}" deleted successfully.`);
        await fetchQuizzes();
      } else {
        const data = await res.json().catch(() => ({}));
        setPublishError(`Failed to delete quiz: ${data.error || 'Unknown error'}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setPublishError(`Network error: ${err.message}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="title" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
            My Quizzes
          </h1>
          <p className="subtitle" style={{ margin: 0, maxWidth: '100%' }}>
            Create, manage, and publish your assessments
          </p>
        </div>

        <Link href="/teacher/quizzes/new" className="btn btn-primary btn-lg" style={{ boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}>
          <span>➕</span> Create New Quiz
        </Link>
      </div>

      {/* Alert Messages */}
      {publishError && (
        <div className="alert alert-error animate-fade-in" style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Action Required</strong>
            <span>{publishError}</span>
          </div>
          <button
            onClick={() => setPublishError(null)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.2rem 0.5rem', minWidth: 'auto', color: '#fca5a5' }}
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>✅</span>
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

      {/* Loading State */}
      {loading ? (
        <div className="text-center" style={{ padding: '4rem 0' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            Loading your assessment catalog...
          </p>
        </div>
      ) : quizzes.length === 0 ? (
        /* Empty State */
        <div className="empty-state animate-fade-in">
          <div className="empty-state-icon">📝</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            No Quizzes Created Yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
            Get started by building your first interactive assessment. You can customize duration timers, access security codes, and automated certificates.
          </p>
          <Link href="/teacher/quizzes/new" className="btn btn-primary btn-lg">
            <span>➕</span> Create Your First Quiz
          </Link>
        </div>
      ) : (
        /* Quizzes Grid */
        <div className="quiz-grid">
          {quizzes.map((quiz) => {
            const globalMins = quiz.globalDuration ? Math.round(quiz.globalDuration / 60) : null;
            const isPublished = quiz.isPublished;

            return (
              <div
                key={quiz.id}
                className="card card-hover flex flex-col"
                style={{
                  borderLeft: isPublished ? '4px solid var(--success)' : '4px solid var(--warning)',
                  padding: '1.75rem',
                }}
              >
                {/* Title & Description */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3
                    className="card-title"
                    style={{
                      fontSize: '1.3rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: '0.5rem',
                    }}
                    title={quiz.title}
                  >
                    {quiz.title}
                  </h3>
                  <p
                    className="card-description"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '2.8rem',
                    }}
                    title={quiz.description || 'No description provided.'}
                  >
                    {quiz.description || 'No description provided.'}
                  </p>
                </div>

                {/* Badges Section */}
                <div className="flex" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {/* Status Badge */}
                  <span
                    className={`badge ${isPublished ? 'badge-success' : 'badge-warning'}`}
                    style={{ margin: 0 }}
                  >
                    {isPublished ? '🟢 Published' : '🟡 Draft'}
                  </span>

                  {/* Access Mode Badge */}
                  <span
                    className="badge badge-info"
                    style={{ margin: 0 }}
                    title={quiz.accessMode === 'public' ? 'Public: Anyone with access code (Name + Email)' : 'Private: Login Required'}
                  >
                    {quiz.accessMode === 'public' ? '🌐 Public' : '🔒 Private'}
                  </span>

                  {/* Duration Mode Badge */}
                  <span
                    className="badge badge-accent"
                    style={{ margin: 0 }}
                  >
                    {quiz.durationMode === 'global'
                      ? `⏱️ ${globalMins ? `${globalMins} min Global` : 'No Limit'}`
                      : '⚡ Per-Question'}
                  </span>

                  {/* Certificate Badge */}
                  {quiz.certificateEnabled && (
                    <span
                      className="badge"
                      style={{
                        margin: 0,
                        background: 'rgba(168, 85, 247, 0.15)',
                        color: '#c084fc',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                      }}
                    >
                      🎓 Cert ({quiz.certificateMinScore || 70}%)
                    </span>
                  )}
                </div>

                {/* Access Code Box */}
                <div className="access-code-box">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
                      ACCESS CODE
                    </span>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: 'var(--accent-hover)',
                        letterSpacing: '0.12em',
                      }}
                    >
                      {quiz.accessCode}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(quiz.id, quiz.accessCode)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.8rem',
                      background: copiedId === quiz.id ? 'rgba(34, 197, 94, 0.2)' : undefined,
                      borderColor: copiedId === quiz.id ? 'var(--success)' : undefined,
                      color: copiedId === quiz.id ? '#86efac' : undefined,
                    }}
                    title="Copy access code for students"
                  >
                    {copiedId === quiz.id ? '✅ Copied!' : '📋 Copy Code'}
                  </button>
                </div>

                {/* Action Buttons Footer */}
                <div className="card-actions-grid">
                  <Link
                    href={`/teacher/quizzes/${quiz.id}/attempts`}
                    className="btn btn-secondary btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      gridColumn: '1 / -1',
                      borderColor: 'rgba(99, 102, 241, 0.6)',
                      background: 'rgba(99, 102, 241, 0.18)',
                      color: '#ffffff',
                      fontWeight: 700,
                      boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    👥 View Attempts
                  </Link>

                  <Link
                    href={`/teacher/quizzes/${quiz.id}/edit`}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    ✏️ Edit Settings
                  </Link>

                  <Link
                    href={`/teacher/quizzes/${quiz.id}/questions`}
                    className="btn btn-secondary btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      borderColor: 'rgba(99, 102, 241, 0.4)',
                      color: 'var(--accent-hover)',
                      background: 'rgba(99, 102, 241, 0.08)',
                    }}
                  >
                    ❓ Manage Questions
                  </Link>

                  <button
                    onClick={() => handleTogglePublish(quiz)}
                    disabled={updatingId === quiz.id}
                    className={`btn btn-sm ${isPublished ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ width: '100%' }}
                  >
                    {updatingId === quiz.id ? '⌛...' : isPublished ? '⏸️ Unpublish' : '🚀 Publish'}
                  </button>

                  <button
                    onClick={() => handleDelete(quiz)}
                    disabled={deletingId === quiz.id}
                    className="btn btn-secondary btn-sm"
                    style={{
                      width: '100%',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      color: '#fca5a5',
                    }}
                  >
                    {deletingId === quiz.id ? '⌛...' : '🗑️ Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
