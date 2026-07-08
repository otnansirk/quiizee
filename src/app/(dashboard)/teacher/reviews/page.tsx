'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface ReviewItem {
  id?: string;
  attemptId?: string;
  resultCode: string;
  quizTitle?: string;
  quiz?: { title: string };
  studentName?: string;
  studentEmail?: string;
  student?: { name?: string; email?: string };
  user?: { name?: string; email?: string };
  attemptDate?: string;
  startTime?: string;
  createdAt?: string;
  ungradedEssaysCount?: number;
  ungradedCount?: number;
  autoScoredPoints?: number;
  totalScore?: number;
  maxScore?: number;
  status?: string;
}

export default function EssayReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/teacher/reviews');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setReviews(data);
        } else if (data && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        } else if (data && Array.isArray(data.data)) {
          setReviews(data.data);
        } else if (data && Array.isArray(data.attempts)) {
          setReviews(data.attempts);
        } else {
          setReviews([]);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Failed to fetch essay reviews:', errData);
        setReviews([]);
      }
    } catch (err: any) {
      console.error('Network error fetching reviews:', err);
      setError('Unable to load reviews. Please check your network connection.');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const getId = (item: ReviewItem): string => item.attemptId || item.id || '';
  const getQuizTitle = (item: ReviewItem): string => item.quizTitle || item.quiz?.title || 'Untitled Assessment';
  const getStudentName = (item: ReviewItem): string => item.studentName || item.student?.name || item.user?.name || 'Anonymous Student';
  const getStudentEmail = (item: ReviewItem): string => item.studentEmail || item.student?.email || item.user?.email || 'No email provided';
  const getDate = (item: ReviewItem): string => {
    const rawDate = item.attemptDate || item.startTime || item.createdAt;
    if (!rawDate) return 'Recently';
    try {
      return new Date(rawDate).toLocaleDateString('en-US', {
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
  const getUngradedCount = (item: ReviewItem): number => item.ungradedEssaysCount ?? item.ungradedCount ?? 1;
  const getAutoScoredPoints = (item: ReviewItem): number => item.autoScoredPoints ?? item.totalScore ?? 0;

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="title" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
            Essay Reviews & Grading
          </h1>
          <p className="subtitle" style={{ margin: 0, maxWidth: '100%' }}>
            Review student responses and finalize assessment scores
          </p>
        </div>

        <button
          onClick={fetchReviews}
          disabled={loading}
          className="btn btn-secondary btn-sm"
          style={{
            borderColor: 'rgba(99, 102, 241, 0.3)',
            color: 'var(--accent-hover)',
          }}
          title="Refresh pending reviews list"
        >
          Refresh List
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-error animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.2rem 0.5rem', minWidth: 'auto', color: '#e12727' }}
          >
            X
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div className="text-center" style={{ padding: '5rem 0' }}>
          <div
            className="spinner"
            style={{
              width: '50px',
              height: '50px',
              borderWidth: '4px',
              boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)',
            }}
          ></div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1.5rem', fontSize: '1.05rem', fontWeight: 500 }}>
            Scanning student submissions for pending essay reviews...
          </p>
        </div>
      ) : reviews.length === 0 ? (
        /* Celebratory Empty State */
        <div
          className="empty-state animate-fade-in"
          style={{
            padding: '5rem 2rem',
            background: 'linear-gradient(145deg, rgba(20, 20, 36, 0.6) 0%, rgba(15, 15, 28, 0.8) 100%)',
            border: '2px dashed rgba(34, 197, 94, 0.3)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            className="empty-state-icon"
            style={{
              width: '90px',
              height: '90px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              boxShadow: '0 0 35px rgba(34, 197, 94, 0.25)',
              fontSize: '3rem',
            }}
          >
            !
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            All Caught Up!
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '550px',
              margin: '0 auto 2.5rem',
              fontSize: '1.05rem',
              lineHeight: '1.6',
            }}
          >
            No student essay responses waiting for grading right now. All submissions have been reviewed and finalized!
          </p>
          <Link
            href="/teacher/quizzes"
            className="btn btn-primary btn-lg"
            style={{
              boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)',
              padding: '1rem 2.25rem',
            }}
          >
            Back to My Quizzes
          </Link>
        </div>
      ) : (
        /* Reviews Grid */
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.75rem' }}>
          {reviews.map((item, idx) => {
            const attemptId = getId(item);
            const quizTitle = getQuizTitle(item);
            const studentName = getStudentName(item);
            const studentEmail = getStudentEmail(item);
            const attemptDate = getDate(item);
            const ungradedCount = getUngradedCount(item);
            const autoPoints = getAutoScoredPoints(item);

            return (
              <div
                key={attemptId || idx}
                className="card card-hover flex flex-col justify-between"
                style={{
                  borderLeft: '4px solid var(--warning)',
                  padding: '1.75rem',
                  background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.8) 0%, rgba(20, 20, 36, 0.9) 100%)',
                }}
              >
                <div>
                  {/* Header: Quiz Title & Result Code */}
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h3
                      className="card-title"
                      style={{
                        fontSize: '1.3rem',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={quizTitle}
                    >
                      {quizTitle}
                    </h3>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-secondary)',
                        padding: '0.3rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        whiteSpace: 'nowrap',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {item.resultCode || 'RES-PENDING'}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span
                      className="badge badge-warning"
                      style={{
                        margin: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 0 15px rgba(245, 158, 11, 0.15)',
                      }}
                    >
                      Needs Grading
                    </span>
                  </div>

                  {/* Student Info Box */}
                  <div
                    style={{
                      background: 'rgba(10, 10, 15, 0.6)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'var(--accent-gradient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)',
                          flexShrink: 0,
                        }}
                      >
                        {studentName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '1.05rem',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={studentName}
                        >
                          {studentName}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={studentEmail}
                        >
                          {studentEmail}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        paddingTop: '0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>Attempted: {attemptDate}</span>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div
                    className="flex justify-between items-center gap-2 mb-6"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div className="flex items-center gap-2" style={{ color: '#fde047', fontSize: '0.9rem', fontWeight: 600 }}>
                      <span>{ungradedCount} ungraded {ungradedCount === 1 ? 'essay' : 'essays'}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Auto-scored: <strong style={{ color: 'var(--text-primary)' }}>{autoPoints} pts</strong>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Link
                  href={`/teacher/reviews/${attemptId}`}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '0.9rem 1.5rem',
                    fontSize: '1rem',
                    boxShadow: '0 4px 18px rgba(99, 102, 241, 0.35)',
                  }}
                >
                  Grade Response
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
