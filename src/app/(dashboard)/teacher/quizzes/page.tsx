'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MyQuizzesHeader } from '@/components/features/quizzes/MyQuizzesHeader';
import { QuizCard, QuizItem } from '@/components/features/quizzes/QuizCard';
import { QuizDeleteModal } from '@/components/features/quizzes/QuizDeleteModal';

export default function MyQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<QuizItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quizzes');
      if (res.ok) {
        const data = (await res.json()) as any;
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
        const data = (await res.json().catch(() => ({}))) as any;
        const errText = data.error || data.message || `Failed to ${quiz.isPublished ? 'unpublish' : 'publish'} quiz.`;
        setPublishError(`Cannot publish "${quiz.title}": ${errText}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setUpdatingId(null);
        return;
      }

      await fetchQuizzes();
      setSuccessMsg(`Quiz "${quiz.title}" has been successfully ${!quiz.isPublished ? 'published' : 'unpublished'}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setPublishError(`Network error: ${err.message || 'Failed to update publication status'}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = (quiz: QuizItem) => {
    setQuizToDelete(quiz);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <MyQuizzesHeader
        publishError={publishError}
        successMsg={successMsg}
        onClearError={() => setPublishError(null)}
        onClearSuccess={() => setSuccessMsg(null)}
      />

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
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            No Quizzes Created Yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
            Get started by building your first interactive assessment. You can customize duration timers, access security codes, and automated certificates.
          </p>
          <Link href="/teacher/quizzes/new" className="btn btn-primary btn-lg">
            Create Your First Quiz
          </Link>
        </div>
      ) : (
        /* Quizzes Grid */
        <div className="quiz-grid">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              copiedId={copiedId}
              updatingId={updatingId}
              deletingId={deletingId}
              onCopyCode={handleCopyCode}
              onTogglePublish={handleTogglePublish}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Quiz Delete Confirmation Modal */}
      <QuizDeleteModal
        isOpen={isDeleteModalOpen}
        quizToDelete={quizToDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setQuizToDelete(null);
        }}
        onSuccess={(deletedQuiz) => {
          setSuccessMsg(`Quiz "${deletedQuiz.title}" deleted successfully.`);
          fetchQuizzes();
        }}
        onError={(msg) => {
          setPublishError(`Failed to delete quiz: ${msg}`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
