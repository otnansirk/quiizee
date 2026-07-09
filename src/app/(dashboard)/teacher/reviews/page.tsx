'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ReviewsHeader } from '@/components/features/reviews/ReviewsHeader';
import { ReviewCard, ReviewItem } from '@/components/features/reviews/ReviewCard';

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

  return (
    <div className="animate-fade-in">
      <ReviewsHeader
        loading={loading}
        error={error}
        onRefresh={fetchReviews}
        onClearError={() => setError(null)}
      />

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
          <div className="empty-state-icon">
            !
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.75rem', color: '#ffffffb9' }}>
            All Caught Up!
          </h2>
          <p
            style={{
              color: '#ffffffb9',
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
          {reviews.map((item, idx) => (
            <ReviewCard key={item.attemptId || item.id || idx} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
