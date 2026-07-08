'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface AttemptHistoryItem {
  id?: string;
  attemptId?: string;
  resultCode: string;
  userId?: string | null;
  participantId?: string | null;
  studentName?: string;
  studentEmail?: string;
  user?: { name?: string; email?: string };
  participant?: { name?: string; email?: string };
  startTime?: string;
  createdAt?: string;
  endTime?: string | null;
  totalScore?: number | string | null;
  maxScore?: number | string;
  status?: string;
  attemptNumber?: number;
}

export default function AttemptHistoryPage() {
  const params = useParams();
  const quizId = (params?.quizId as string) || '';

  const [attempts, setAttempts] = useState<AttemptHistoryItem[]>([]);
  const [quizTitle, setQuizTitle] = useState<string>('Assessment Submissions');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state: all | submitted | graded | in_progress
  const [filter, setFilter] = useState<'all' | 'submitted' | 'graded' | 'in_progress'>('all');

  const fetchAttempts = async () => {
    if (!quizId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/teacher/quizzes/${quizId}/attempts`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.quizTitle) {
          setQuizTitle(data.quizTitle);
        } else if (data && data.quiz?.title) {
          setQuizTitle(data.quiz.title);
        }

        if (Array.isArray(data)) {
          setAttempts(data);
        } else if (data && Array.isArray(data.attempts)) {
          setAttempts(data.attempts);
        } else if (data && Array.isArray(data.data)) {
          setAttempts(data.data);
        } else {
          setAttempts([]);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || errData.message || 'Failed to load attempt history.');
        setAttempts([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch attempt history:', err);
      setError('Network error: Unable to load attempt history.');
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, [quizId]);

  const getId = (item: AttemptHistoryItem): string => item.attemptId || item.id || '';
  const getName = (item: AttemptHistoryItem): string =>
    item.studentName || item.user?.name || item.participant?.name || 'Anonymous Student';
  const getEmail = (item: AttemptHistoryItem): string =>
    item.studentEmail || item.user?.email || item.participant?.email || 'No email provided';
  const getStatus = (item: AttemptHistoryItem): string => (item.status || 'in_progress').toLowerCase();
  const getDate = (item: AttemptHistoryItem): string => {
    const raw = item.startTime || item.createdAt;
    if (!raw) return 'Recently';
    try {
      return new Date(raw).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  // Filtered list
  const filteredAttempts = attempts.filter((item) => {
    if (filter === 'all') return true;
    return getStatus(item) === filter;
  });

  const countSubmitted = attempts.filter((item) => getStatus(item) === 'submitted').length;
  const countGraded = attempts.filter((item) => getStatus(item) === 'graded').length;
  const countInProgress = attempts.filter((item) => getStatus(item) === 'in_progress').length;

  return (
    <div className="animate-fade-in">
      {/* Top Breadcrumb & Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/teacher/quizzes"
          className="btn btn-ghost btn-sm"
          style={{
            paddingLeft: 0,
            color: 'var(--text-secondary)',
            marginBottom: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          Back to Quizzes
        </Link>

        <div className="flex justify-between items-start" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="title" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
              Attempt History
            </h1>
            <p className="subtitle" style={{ margin: 0, maxWidth: '100%' }}>
              View all student submissions and assessment performance for <strong style={{ color: 'var(--accent-hover)' }}>{quizTitle}</strong>
            </p>
          </div>

          <button
            onClick={fetchAttempts}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: 'rgba(99, 102, 241, 0.3)',
              color: 'var(--accent-hover)',
            }}
            title="Refresh attempt history"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-error animate-fade-in mb-6" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Notice</strong>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.2rem 0.5rem', minWidth: 'auto', color: '#e12727' }}
          >
            X
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        className="flex gap-2 mb-6"
        style={{
          flexWrap: 'wrap',
          background: 'rgba(20, 20, 32, 0.6)',
          padding: '0.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          width: 'fit-content',
        }}
      >
        <button
          onClick={() => setFilter('all')}
          className="btn btn-sm"
          style={{
            background: filter === 'all' ? 'var(--accent-gradient)' : 'transparent',
            color: filter === 'all' ? '#ffffff' : 'var(--text-secondary)',
            border: 'none',
            boxShadow: filter === 'all' ? '0 2px 10px rgba(99, 102, 241, 0.3)' : 'none',
          }}
        >
          All Submissions ({attempts.length})
        </button>

        <button
          onClick={() => setFilter('submitted')}
          className="btn btn-sm"
          style={{
            background: filter === 'submitted' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
            color: filter === 'submitted' ? '#fde047' : 'var(--text-secondary)',
            border: filter === 'submitted' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
            boxShadow: filter === 'submitted' ? '0 0 12px rgba(245, 158, 11, 0.2)' : 'none',
          }}
        >
          Needs Grading ({countSubmitted})
        </button>

        <button
          onClick={() => setFilter('graded')}
          className="btn btn-sm"
          style={{
            background: filter === 'graded' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
            color: filter === 'graded' ? '#86efac' : 'var(--text-secondary)',
            border: filter === 'graded' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid transparent',
            boxShadow: filter === 'graded' ? '0 0 12px rgba(34, 197, 94, 0.2)' : 'none',
          }}
        >
          Graded ({countGraded})
        </button>

        <button
          onClick={() => setFilter('in_progress')}
          className="btn btn-sm"
          style={{
            background: filter === 'in_progress' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            color: filter === 'in_progress' ? '#93c5fd' : 'var(--text-secondary)',
            border: filter === 'in_progress' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
          }}
        >
          In Progress ({countInProgress})
        </button>
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <div className="text-center" style={{ padding: '5rem 0' }}>
          <div
            className="spinner"
            style={{ width: '50px', height: '50px', borderWidth: '4px', boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)' }}
          ></div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1.5rem', fontSize: '1.05rem', fontWeight: 500 }}>
            Retrieving student submission records and score logs...
          </p>
        </div>
      ) : filteredAttempts.length === 0 ? (
        /* Empty State */
        <div
          className="empty-state animate-fade-in"
          style={{
            padding: '5rem 2rem',
            background: 'linear-gradient(145deg, rgba(20, 20, 36, 0.6) 0%, rgba(15, 15, 28, 0.8) 100%)',
            border: '2px dashed var(--border)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="empty-state-icon" style={{ fontSize: '3rem' }}>
            👥
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            {filter === 'all' ? 'No Submissions Recorded Yet' : `No "${filter.replace('_', ' ')}" Attempts Found`}
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '500px',
              margin: '0 auto 2rem',
              fontSize: '1.05rem',
              lineHeight: '1.6',
            }}
          >
            {filter === 'all'
              ? 'Share the access code with your students to start receiving assessment attempts. Once students submit their work, it will appear here in real-time!'
              : 'Try selecting a different filter tab above to view other student attempts.'}
          </p>
          {filter !== 'all' ? (
            <button onClick={() => setFilter('all')} className="btn btn-secondary btn-lg">
              Show All Submissions
            </button>
          ) : (
            <Link href="/teacher/quizzes" className="btn btn-primary btn-lg" style={{ boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)' }}>
              Back to My Quizzes
            </Link>
          )}
        </div>
      ) : (
        /* Sleek Glassmorphic Table */
        <div
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.08)',
            background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.85) 0%, rgba(18, 18, 32, 0.95) 100%)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    background: 'rgba(15, 15, 26, 0.9)',
                    borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  <th style={{ padding: '1.25rem 1.5rem' }}>Student Details</th>
                  <th style={{ padding: '1.25rem 1rem' }}>Result Code</th>
                  <th style={{ padding: '1.25rem 1rem' }}>Date & Time</th>
                  <th style={{ padding: '1.25rem 1rem' }}>Status</th>
                  <th style={{ padding: '1.25rem 1rem' }}>Score / Max</th>
                  <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.map((item, idx) => {
                  const attemptId = getId(item);
                  const name = getName(item);
                  const email = getEmail(item);
                  const status = getStatus(item);
                  const dateStr = getDate(item);
                  const max = Number(item.maxScore || 100);
                  const total = Number(item.totalScore || 0);
                  const pct = Math.round((total / max) * 100);

                  return (
                    <tr
                      key={attemptId || idx}
                      style={{
                        borderBottom: idx === filteredAttempts.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Student Details */}
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div className="flex items-center gap-3">
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: status === 'graded' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                              border: `1px solid ${status === 'graded' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1rem',
                              fontWeight: 700,
                              color: status === 'graded' ? '#86efac' : '#c084fc',
                              flexShrink: 0,
                            }}
                          >
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                              {name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Result Code */}
                      <td style={{ padding: '1.25rem 1rem' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--text-primary)',
                            padding: '0.3rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {item.resultCode || 'RES-PENDING'}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: '1.25rem 1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {dateStr}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '1.25rem 1rem' }}>
                        {status === 'graded' ? (
                          <span
                            className="badge badge-success"
                            style={{
                              margin: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              boxShadow: '0 0 12px rgba(34, 197, 94, 0.15)',
                            }}
                          >
                            Graded
                          </span>
                        ) : status === 'submitted' ? (
                          <span
                            className="badge badge-warning"
                            style={{
                              margin: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              boxShadow: '0 0 12px rgba(245, 158, 11, 0.15)',
                            }}
                          >
                            Submitted
                          </span>
                        ) : (
                          <span
                            className="badge badge-info"
                            style={{
                              margin: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            In Progress
                          </span>
                        )}
                      </td>

                      {/* Score / Max */}
                      <td style={{ padding: '1.25rem 1rem' }}>
                        {status === 'graded' ? (
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#86efac' }}>{total}</span>{' '}
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>/ {max} pts</span>{' '}
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: 'rgba(34, 197, 94, 0.15)',
                                color: '#86efac',
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                marginLeft: '0.3rem',
                              }}
                            >
                              {pct}%
                            </span>
                          </div>
                        ) : status === 'submitted' ? (
                          <span style={{ fontSize: '0.9rem', color: '#fde047', fontWeight: 600 }}>
                            Pending ({max} max pts)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            In Progress...
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        {status === 'submitted' ? (
                          <Link
                            href={`/teacher/reviews/${attemptId}`}
                            className="btn btn-primary btn-sm"
                            style={{
                              padding: '0.5rem 1rem',
                              boxShadow: '0 0 15px rgba(99, 102, 241, 0.35)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Grade Essays
                          </Link>
                        ) : status === 'graded' ? (
                          <Link
                            href={`/results/${item.resultCode}`}
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '0.5rem 1rem',
                              borderColor: 'rgba(99, 102, 241, 0.4)',
                              color: 'var(--accent-hover)',
                              background: 'rgba(99, 102, 241, 0.1)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            View Score Report
                          </Link>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingRight: '0.5rem' }}>
                            Session Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
