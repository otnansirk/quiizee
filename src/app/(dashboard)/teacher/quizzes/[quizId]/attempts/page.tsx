'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AttemptsHeaderFilters } from '@/components/features/attempts/AttemptsHeaderFilters';
import { AttemptsTable, AttemptHistoryItem } from '@/components/features/attempts/AttemptsTable';

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

  const getStatus = (item: AttemptHistoryItem): string => (item.status || 'in_progress').toLowerCase();

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
      <AttemptsHeaderFilters
        quizTitle={quizTitle}
        loading={loading}
        error={error}
        filter={filter}
        totalAttemptsCount={attempts.length}
        countSubmitted={countSubmitted}
        countGraded={countGraded}
        countInProgress={countInProgress}
        onRefresh={fetchAttempts}
        onClearError={() => setError(null)}
        onSelectFilter={setFilter}
      />

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
      ) : (
        <AttemptsTable
          filteredAttempts={filteredAttempts}
          filter={filter}
          onResetFilter={() => setFilter('all')}
        />
      )}
    </div>
  );
}
