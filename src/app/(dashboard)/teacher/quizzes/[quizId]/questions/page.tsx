'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

/* ==========================================================================
   TYPES & INTERFACES
   ========================================================================== */

type QuestionType = 'multiple_choice' | 'true_false' | 'essay';

interface OptionData {
  id?: string;
  optionText: string;
  isCorrect: boolean;
  order: number;
}

interface QuestionData {
  id: string;
  quizId: string;
  type: QuestionType;
  questionText: string;
  questionImage?: string | null;
  duration?: number | null;
  points: number;
  order: number;
  correctAnswer?: string | null;
  options?: OptionData[];
  createdAt?: string;
  updatedAt?: string;
}

interface QuizData {
  id: string;
  title: string;
  description?: string | null;
  accessCode: string;
  accessMode: 'public' | 'private';
  durationMode: 'global' | 'per_question';
  globalDuration?: number | null;
  isPublished: boolean;
  questions?: QuestionData[];
}

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

/* ==========================================================================
   MAIN COMPONENT: QUESTION MANAGEMENT UI
   ========================================================================== */

export default function QuizQuestionsPage() {
  const params = useParams<{ quizId: string }>();
  const router = useRouter();
  const quizId = params?.quizId || '';

  // State: Quiz & Questions
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State: Toast Notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // State: Publish / Unpublish Loading
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isPublishAlertOpen, setIsPublishAlertOpen] = useState<boolean>(false);

  // State: Delete Confirmation Modal
  const [questionToDelete, setQuestionToDelete] = useState<QuestionData | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // State: Add / Edit Question Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Form Fields
  const [formType, setFormType] = useState<QuestionType>('multiple_choice');
  const [formText, setFormText] = useState<string>('');
  const [formImage, setFormImage] = useState<string>('');
  const [formPoints, setFormPoints] = useState<number>(1);
  const [formDuration, setFormDuration] = useState<number>(30);
  const [formCorrectAnswer, setFormCorrectAnswer] = useState<string>('true');
  const [formOptions, setFormOptions] = useState<OptionData[]>([
    { optionText: '', isCorrect: true, order: 1 },
    { optionText: '', isCorrect: false, order: 2 },
    { optionText: '', isCorrect: false, order: 3 },
    { optionText: '', isCorrect: false, order: 4 },
  ]);

  /* --------------------------------------------------------------------------
     HELPER: TOAST NOTIFICATIONS
     -------------------------------------------------------------------------- */
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  /* --------------------------------------------------------------------------
     API: FETCH QUIZ & QUESTIONS
     -------------------------------------------------------------------------- */
  const fetchQuizData = useCallback(async () => {
    if (!quizId) return;
    setIsLoading(true);
    setFetchError(null);

    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Quiz not found. It may have been deleted.');
        }
        throw new Error(`Failed to load quiz details (${res.status})`);
      }
      const data: QuizData = await res.json();
      setQuiz(data);

      const sortedQuestions = (data.questions || []).slice().sort((a, b) => a.order - b.order);
      setQuestions(sortedQuestions);
    } catch (err: any) {
      console.error('Error fetching quiz data:', err);
      setFetchError(err.message || 'An unexpected error occurred while loading questions.');
    } finally {
      setIsLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);

  /* --------------------------------------------------------------------------
     API: PUBLISH / UNPUBLISH QUIZ
     -------------------------------------------------------------------------- */
  const handlePublishToggle = async (targetPublishState: boolean) => {
    if (targetPublishState && questions.length === 0) {
      setIsPublishAlertOpen(true);
      return;
    }

    setIsPublishing(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: targetPublishState }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to ${targetPublishState ? 'publish' : 'unpublish'} quiz`);
      }

      setQuiz((prev) => (prev ? { ...prev, isPublished: targetPublishState } : null));
      showToast(
        `Quiz successfully ${targetPublishState ? 'published 🚀' : 'unpublished ⏸️'}!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update publication status', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  /* --------------------------------------------------------------------------
     API: REORDER QUESTIONS (MOVE UP / DOWN)
     -------------------------------------------------------------------------- */
  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const q1 = questions[index];
    const q2 = questions[targetIndex];

    // Optimistic UI Update
    const newQuestions = [...questions];
    newQuestions[index] = { ...q2, order: q1.order };
    newQuestions[targetIndex] = { ...q1, order: q2.order };
    newQuestions.sort((a, b) => a.order - b.order);
    setQuestions(newQuestions);

    try {
      const [res1, res2] = await Promise.all([
        fetch(`/api/quizzes/${quizId}/questions/${q1.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: q2.order }),
        }),
        fetch(`/api/quizzes/${quizId}/questions/${q2.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: q1.order }),
        }),
      ]);

      if (!res1.ok || !res2.ok) {
        throw new Error('Server rejected reorder request');
      }
      showToast('Question order updated', 'success');
    } catch (err: any) {
      showToast('Failed to save question order. Reverting changes...', 'error');
      await fetchQuizData();
    }
  };

  /* --------------------------------------------------------------------------
     API: DELETE QUESTION
     -------------------------------------------------------------------------- */
  const openDeleteModal = (question: QuestionData) => {
    setQuestionToDelete(question);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/quizzes/${quizId}/questions/${questionToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to delete question');
      }

      showToast(`Question deleted successfully`, 'success');
      setIsDeleteModalOpen(false);
      setQuestionToDelete(null);
      await fetchQuizData();
    } catch (err: any) {
      showToast(err.message || 'An error occurred while deleting', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  /* --------------------------------------------------------------------------
     FORM: OPEN ADD / EDIT MODAL
     -------------------------------------------------------------------------- */
  const openAddModal = () => {
    setEditingQuestionId(null);
    setFormType('multiple_choice');
    setFormText('');
    setFormImage('');
    setFormPoints(1);
    setFormDuration(quiz?.durationMode === 'per_question' ? 30 : 30);
    setFormCorrectAnswer('true');
    setFormOptions([
      { optionText: '', isCorrect: true, order: 1 },
      { optionText: '', isCorrect: false, order: 2 },
      { optionText: '', isCorrect: false, order: 3 },
      { optionText: '', isCorrect: false, order: 4 },
    ]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (question: QuestionData) => {
    setEditingQuestionId(question.id);
    setFormType(question.type);
    setFormText(question.questionText);
    setFormImage(question.questionImage || '');
    setFormPoints(question.points || 1);
    setFormDuration(question.duration || 30);
    setFormCorrectAnswer(question.correctAnswer || 'true');

    if (question.type === 'multiple_choice' && question.options && question.options.length > 0) {
      const sortedOpts = [...question.options].sort((a, b) => a.order - b.order);
      setFormOptions(
        sortedOpts.map((opt, idx) => ({
          id: opt.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
          order: idx + 1,
        }))
      );
    } else {
      setFormOptions([
        { optionText: '', isCorrect: true, order: 1 },
        { optionText: '', isCorrect: false, order: 2 },
        { optionText: '', isCorrect: false, order: 3 },
        { optionText: '', isCorrect: false, order: 4 },
      ]);
    }
    setFormError('');
    setIsModalOpen(true);
  };

  /* --------------------------------------------------------------------------
     FORM: MULTIPLE CHOICE OPTIONS HELPERS
     -------------------------------------------------------------------------- */
  const addOption = () => {
    setFormOptions((prev) => [
      ...prev,
      {
        optionText: '',
        isCorrect: prev.length === 0,
        order: prev.length + 1,
      },
    ]);
  };

  const removeOption = (indexToRemove: number) => {
    if (formOptions.length <= 2) return;
    setFormOptions((prev) => {
      const updated = prev
        .filter((_, idx) => idx !== indexToRemove)
        .map((opt, idx) => ({ ...opt, order: idx + 1 }));

      if (!updated.some((o) => o.isCorrect) && updated.length > 0) {
        updated[0].isCorrect = true;
      }
      return updated;
    });
  };

  const toggleOptionCorrectness = (indexToToggle: number) => {
    setFormOptions((prev) =>
      prev.map((opt, idx) => {
        if (idx === indexToToggle) {
          return { ...opt, isCorrect: !opt.isCorrect };
        }
        return opt;
      })
    );
  };

  const setSingleCorrectOption = (indexToSelect: number) => {
    setFormOptions((prev) =>
      prev.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === indexToSelect,
      }))
    );
  };

  /* --------------------------------------------------------------------------
     API: SAVE QUESTION (POST / PUT)
     -------------------------------------------------------------------------- */
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formText.trim()) {
      setFormError('Question text is required.');
      return;
    }

    if (formPoints < 1 || isNaN(formPoints)) {
      setFormError('Points must be at least 1.');
      return;
    }

    if (quiz?.durationMode === 'per_question' && (formDuration < 5 || isNaN(formDuration))) {
      setFormError('Duration must be at least 5 seconds for per-question timer mode.');
      return;
    }

    if (formType === 'multiple_choice') {
      if (formOptions.length < 2) {
        setFormError('Multiple choice questions must have at least 2 options.');
        return;
      }
      for (let i = 0; i < formOptions.length; i++) {
        if (!formOptions[i].optionText.trim()) {
          setFormError(`Option ${String.fromCharCode(65 + i)} text cannot be empty.`);
          return;
        }
      }
      if (!formOptions.some((opt) => opt.isCorrect)) {
        setFormError('Please mark at least one option as correct.');
        return;
      }
    }

    setIsSaving(true);

    try {
      const payload: any = {
        type: formType,
        questionText: formText.trim(),
        questionImage: formImage.trim() || null,
        points: Number(formPoints),
        duration: quiz?.durationMode === 'per_question' ? Number(formDuration) : null,
        order: editingQuestionId
          ? questions.find((q) => q.id === editingQuestionId)?.order || questions.length + 1
          : questions.length + 1,
      };

      if (formType === 'multiple_choice') {
        payload.options = formOptions.map((opt, idx) => ({
          optionText: opt.optionText.trim(),
          isCorrect: opt.isCorrect,
          order: idx + 1,
        }));
      } else if (formType === 'true_false') {
        payload.correctAnswer = formCorrectAnswer;
      }

      const url = editingQuestionId
        ? `/api/quizzes/${quizId}/questions/${editingQuestionId}`
        : `/api/quizzes/${quizId}/questions`;

      const method = editingQuestionId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save question');
      }

      showToast(
        editingQuestionId ? 'Question updated successfully! ✨' : 'Question added successfully! 🎉',
        'success'
      );
      setIsModalOpen(false);
      await fetchQuizData();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving the question.');
    } finally {
      setIsSaving(false);
    }
  };

  /* --------------------------------------------------------------------------
     COMPUTED SUMMARY STATS
     -------------------------------------------------------------------------- */
  const totalQuestions = questions.length;
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  /* ==========================================================================
     RENDER: LOADING & ERROR STATES
     ========================================================================== */

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem', minHeight: '80vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            className="card"
            style={{
              height: '80px',
              background: 'rgba(26, 26, 46, 0.4)',
              animation: 'pulseGlow 2s infinite',
            }}
          />
          <div
            className="card"
            style={{
              height: '120px',
              background: 'rgba(26, 26, 46, 0.4)',
              animation: 'pulseGlow 2s infinite',
            }}
          />
          <div
            className="card"
            style={{
              height: '200px',
              background: 'rgba(26, 26, 46, 0.4)',
              animation: 'pulseGlow 2s infinite',
            }}
          />
        </div>
      </div>
    );
  }

  if (fetchError || !quiz) {
    return (
      <div className="container animate-fade-in" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '550px', margin: '0 auto', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 className="card-title" style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>
            Failed to Load Quiz
          </h2>
          <p className="card-description" style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            {fetchError || 'We could not find the requested quiz.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/teacher/quizzes" className="btn btn-secondary">
              ← Back to Quizzes
            </Link>
            <button onClick={fetchQuizData} className="btn btn-primary">
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     RENDER: MAIN UI
     ========================================================================== */

  return (
    <div className="min-h-screen animate-fade-in" style={{ paddingBottom: '6rem' }}>
      {/* Custom Styles for Modals and Micro-animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.96) translateY(-12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-content {
          animation: modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes toastSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .toast-item {
          animation: toastSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      ` }} />

      {/* Floating Toast Notifications Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-item"
            style={{
              pointerEvents: 'auto',
              padding: '1rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(20, 20, 35, 0.95)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${
                toast.type === 'success'
                  ? 'rgba(34, 197, 94, 0.4)'
                  : toast.type === 'error'
                  ? 'rgba(239, 68, 68, 0.4)'
                  : 'rgba(99, 102, 241, 0.4)'
              }`,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              fontWeight: 500,
              maxWidth: '400px',
            }}
          >
            <span>
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="container" style={{ paddingTop: '2rem' }}>
        {/* ======================================================================
           HEADER SECTION
           ====================================================================== */}
        <header style={{ marginBottom: '2.5rem' }}>
          {/* Breadcrumb / Back Link */}
          <div style={{ marginBottom: '1.25rem' }}>
            <Link
              href="/teacher/quizzes"
              className="btn btn-ghost btn-sm"
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.03)',
              }}
            >
              ← Back to Quizzes
            </Link>
          </div>

          {/* Title & Top Right Actions */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {quiz.title}
              </h1>

              {/* Status Badge */}
              {quiz.isPublished ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: '#4ade80',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    boxShadow: '0 0 15px rgba(34, 197, 94, 0.2)',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                  Published
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24' }} />
                  Draft
                </span>
              )}
            </div>

            {/* Top Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              {quiz.isPublished ? (
                <button
                  onClick={() => handlePublishToggle(false)}
                  disabled={isPublishing}
                  className="btn btn-secondary"
                  style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}
                >
                  {isPublishing ? '⏸️ Unpublishing...' : '⏸️ Unpublish'}
                </button>
              ) : (
                <button
                  onClick={() => handlePublishToggle(true)}
                  disabled={isPublishing}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  {isPublishing ? '🚀 Publishing...' : '🚀 Publish Quiz'}
                </button>
              )}

              <button
                onClick={openAddModal}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
              >
                ➕ Add Question
              </button>
            </div>
          </div>

          {/* Summary Stats Banner */}
          <div
            className="card"
            style={{
              padding: '1.5rem 2rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
              background: 'rgba(20, 20, 35, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Stat 1: Total Questions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}
              >
                📋
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  TOTAL QUESTIONS
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {totalQuestions} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>questions</span>
                </div>
              </div>
            </div>

            {/* Stat 2: Total Points */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}
              >
                🏆
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  TOTAL POINTS
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {totalPoints} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>pts</span>
                </div>
              </div>
            </div>

            {/* Stat 3: Duration Mode */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}
              >
                ⏳
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  DURATION MODE
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#60a5fa',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    {quiz.durationMode === 'global' ? 'Global Timer' : 'Per-Question Timer'}
                  </span>
                  {quiz.durationMode === 'global' && quiz.globalDuration && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      ({quiz.globalDuration} min)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ======================================================================
           QUESTIONS LIST SECTION
           ====================================================================== */}
        <section>
          {questions.length === 0 ? (
            /* Empty State Card */
            <div
              className="card"
              style={{
                padding: '4.5rem 2rem',
                textAlign: 'center',
                border: '2px dashed rgba(255, 255, 255, 0.12)',
                background: 'rgba(20, 20, 35, 0.4)',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  margin: '0 auto 1.5rem',
                  color: 'var(--accent)',
                  boxShadow: '0 0 30px rgba(99, 102, 241, 0.15)',
                }}
              >
                ✨
              </div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem',
                }}
              >
                No questions added yet
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  maxWidth: '480px',
                  margin: '0 auto 2rem',
                  fontSize: '1rem',
                  lineHeight: 1.6,
                }}
              >
                Start building your interactive assessment by adding multiple choice, true/false, or essay questions.
              </p>
              <button onClick={openAddModal} className="btn btn-primary btn-lg">
                ➕ Add Your First Question
              </button>
            </div>
          ) : (
            /* Populated Questions List */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {questions.map((q, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === questions.length - 1;

                // Color accent by question type
                let typeBadgeBg = 'rgba(99, 102, 241, 0.15)';
                let typeBadgeColor = '#818cf8';
                let typeBadgeBorder = 'rgba(99, 102, 241, 0.3)';
                let typeLabel = '🔘 Multiple Choice';
                let cardBorderLeft = '#6366f1';

                if (q.type === 'true_false') {
                  typeBadgeBg = 'rgba(16, 185, 129, 0.15)';
                  typeBadgeColor = '#34d399';
                  typeBadgeBorder = 'rgba(16, 185, 129, 0.3)';
                  typeLabel = '⚖️ True or False';
                  cardBorderLeft = '#10b981';
                } else if (q.type === 'essay') {
                  typeBadgeBg = 'rgba(245, 158, 11, 0.15)';
                  typeBadgeColor = '#fbbf24';
                  typeBadgeBorder = 'rgba(245, 158, 11, 0.3)';
                  typeLabel = '📝 Essay / Free Text';
                  cardBorderLeft = '#f59e0b';
                }

                return (
                  <div
                    key={q.id}
                    className="card card-hover"
                    style={{
                      padding: '1.75rem 2rem',
                      borderLeft: `4px solid ${cardBorderLeft}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem',
                    }}
                  >
                    {/* Card Header Row */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        paddingBottom: '1rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            background: 'rgba(255, 255, 255, 0.06)',
                            padding: '0.35rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          Question #{idx + 1}
                        </span>

                        {/* Type Badge */}
                        <span
                          style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: 'var(--radius-full)',
                            background: typeBadgeBg,
                            color: typeBadgeColor,
                            border: `1px solid ${typeBadgeBorder}`,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                          }}
                        >
                          {typeLabel}
                        </span>

                        {/* Points Badge */}
                        <span
                          style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-primary)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          🏆 {q.points} {q.points === 1 ? 'pt' : 'pts'}
                        </span>

                        {/* Duration Badge (if per-question mode) */}
                        {quiz.durationMode === 'per_question' && q.duration && (
                          <span
                            style={{
                              padding: '0.3rem 0.75rem',
                              borderRadius: 'var(--radius-full)',
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            ⏳ {q.duration}s
                          </span>
                        )}
                      </div>

                      {/* Card Actions (Reorder, Edit, Delete) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          disabled={isFirst}
                          className="btn btn-ghost btn-sm"
                          title="Move question up"
                          style={{
                            padding: '0.4rem 0.6rem',
                            opacity: isFirst ? 0.3 : 1,
                            cursor: isFirst ? 'not-allowed' : 'pointer',
                          }}
                        >
                          ⬆️
                        </button>
                        <button
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          disabled={isLast}
                          className="btn btn-ghost btn-sm"
                          title="Move question down"
                          style={{
                            padding: '0.4rem 0.6rem',
                            opacity: isLast ? 0.3 : 1,
                            cursor: isLast ? 'not-allowed' : 'pointer',
                          }}
                        >
                          ⬇️
                        </button>

                        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 0.25rem' }} />

                        <button
                          onClick={() => openEditModal(q)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.4rem 0.85rem' }}
                        >
                          ✏️ Edit
                        </button>

                        <button
                          onClick={() => openDeleteModal(q)}
                          className="btn btn-ghost btn-sm"
                          style={{
                            padding: '0.4rem 0.85rem',
                            color: '#fca5a5',
                            background: 'rgba(239, 68, 68, 0.08)',
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>

                    {/* Question Text & Optional Image */}
                    <div>
                      <p
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          marginBottom: q.questionImage ? '1rem' : '0',
                        }}
                      >
                        {q.questionText}
                      </p>

                      {q.questionImage && (
                        <div
                          style={{
                            marginTop: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            maxWidth: '500px',
                            background: 'rgba(0, 0, 0, 0.3)',
                          }}
                        >
                          <img
                            src={q.questionImage}
                            alt="Question illustration"
                            style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', display: 'block' }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Type-Specific Answer Details */}
                    <div style={{ marginTop: '0.25rem' }}>
                      {/* MULTIPLE CHOICE DETAILS */}
                      {q.type === 'multiple_choice' && q.options && (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '0.75rem',
                          }}
                        >
                          {q.options
                            .slice()
                            .sort((a, b) => a.order - b.order)
                            .map((opt, optIdx) => {
                              const letter = String.fromCharCode(65 + optIdx);
                              return (
                                <div
                                  key={opt.id || optIdx}
                                  style={{
                                    padding: '0.85rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: opt.isCorrect
                                      ? 'rgba(34, 197, 94, 0.12)'
                                      : 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${
                                      opt.isCorrect ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.08)'
                                    }`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.75rem',
                                    transition: 'all 0.2s ease',
                                    boxShadow: opt.isCorrect ? '0 0 15px rgba(34, 197, 94, 0.1)' : 'none',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span
                                      style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        background: opt.isCorrect
                                          ? 'rgba(34, 197, 94, 0.25)'
                                          : 'rgba(255, 255, 255, 0.08)',
                                        color: opt.isCorrect ? '#4ade80' : 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                      }}
                                    >
                                      {letter}
                                    </span>
                                    <span
                                      style={{
                                        color: opt.isCorrect ? '#ffffff' : 'var(--text-primary)',
                                        fontWeight: opt.isCorrect ? 600 : 400,
                                        fontSize: '0.95rem',
                                      }}
                                    >
                                      {opt.optionText}
                                    </span>
                                  </div>

                                  {opt.isCorrect && (
                                    <span
                                      style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: 'var(--radius-full)',
                                        background: 'rgba(34, 197, 94, 0.2)',
                                        color: '#4ade80',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                      }}
                                    >
                                      ✅ Correct
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {/* TRUE / FALSE DETAILS */}
                      {q.type === 'true_false' && (
                        <div
                          style={{
                            padding: '1rem 1.25rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            color: '#34d399',
                            fontWeight: 700,
                            fontSize: '1rem',
                            boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)',
                          }}
                        >
                          <span>⚖️ Correct Answer:</span>
                          <span
                            style={{
                              padding: '0.25rem 0.75rem',
                              background: 'rgba(16, 185, 129, 0.25)',
                              borderRadius: 'var(--radius-sm)',
                              color: '#ffffff',
                              textTransform: 'capitalize',
                            }}
                          >
                            {q.correctAnswer === 'false' ? 'False ✅' : 'True ✅'}
                          </span>
                        </div>
                      )}

                      {/* ESSAY DETAILS */}
                      {q.type === 'essay' && (
                        <div
                          style={{
                            padding: '0.85rem 1.25rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            color: '#fbbf24',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                          }}
                        >
                          <span style={{ fontSize: '1.25rem' }}>📝</span>
                          <span>
                            <strong>Manual grading required:</strong> Teacher review is needed to evaluate student responses after quiz completion.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ======================================================================
         MODAL 1: ADD / EDIT QUESTION FORM
         ====================================================================== */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 5, 10, 0.8)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content card custom-scrollbar"
            style={{
              width: '100%',
              maxWidth: '760px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(99, 102, 241, 0.2)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.75rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {editingQuestionId
                    ? `Edit Question #${
                        questions.findIndex((q) => q.id === editingQuestionId) + 1
                      }`
                    : 'Add New Question'}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Configure your question text, type, points, and grading rules.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.5rem', fontSize: '1.25rem', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="alert alert-error animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* 1. Question Type Selector */}
              <div>
                <label className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                  QUESTION TYPE
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '0.4rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setFormType('multiple_choice')}
                    className="btn"
                    style={{
                      padding: '0.65rem 1rem',
                      fontSize: '0.9rem',
                      background:
                        formType === 'multiple_choice' ? 'var(--accent-gradient)' : 'transparent',
                      color: formType === 'multiple_choice' ? '#ffffff' : 'var(--text-secondary)',
                      boxShadow: formType === 'multiple_choice' ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none',
                    }}
                  >
                    🔘 Multiple Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('true_false')}
                    className="btn"
                    style={{
                      padding: '0.65rem 1rem',
                      fontSize: '0.9rem',
                      background:
                        formType === 'true_false'
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'transparent',
                      color: formType === 'true_false' ? '#ffffff' : 'var(--text-secondary)',
                      boxShadow: formType === 'true_false' ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
                    }}
                  >
                    ⚖️ True / False
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('essay')}
                    className="btn"
                    style={{
                      padding: '0.65rem 1rem',
                      fontSize: '0.9rem',
                      background:
                        formType === 'essay'
                          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          : 'transparent',
                      color: formType === 'essay' ? '#ffffff' : 'var(--text-secondary)',
                      boxShadow: formType === 'essay' ? '0 4px 15px rgba(245, 158, 11, 0.3)' : 'none',
                    }}
                  >
                    📝 Essay / Free Text
                  </button>
                </div>
              </div>

              {/* 2. Question Text */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">
                  QUESTION TEXT <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <textarea
                  required
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  rows={3}
                  placeholder="Enter your question prompt here... e.g., What is the primary role of ribosomes in a cell?"
                  className="input custom-scrollbar"
                  style={{ resize: 'vertical', minHeight: '90px', fontSize: '1rem', lineHeight: 1.5 }}
                />
              </div>

              {/* 3. Question Image URL + Live Preview */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>QUESTION IMAGE URL (OPTIONAL)</span>
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>Supports PNG, JPG, GIF, SVG</span>
                </label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://example.com/illustration.png"
                  className="input"
                />
                {formImage.trim() && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px dashed var(--border)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      IMAGE PREVIEW
                    </div>
                    <img
                      src={formImage.trim()}
                      alt="Preview"
                      style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', margin: '0 auto', borderRadius: '4px' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 4. Points & Duration Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">
                    POINTS <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formPoints}
                    onChange={(e) => setFormPoints(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Score value for this question
                  </span>
                </div>

                {quiz.durationMode === 'per_question' ? (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">
                      DURATION (SECONDS) <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min={5}
                      required
                      value={formDuration}
                      onChange={(e) => setFormDuration(Math.max(5, parseInt(e.target.value) || 5))}
                      className="input"
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Per-question timer limit
                    </span>
                  </div>
                ) : (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label" style={{ color: 'var(--text-muted)' }}>
                      DURATION (SECONDS)
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Global Timer Mode Active"
                      className="input"
                      style={{ fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.02)' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Controlled by quiz global duration
                    </span>
                  </div>
                )}
              </div>

              {/* ==================================================================
                 TYPE-SPECIFIC ANSWER INPUTS
                 ================================================================== */}
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(10, 10, 15, 0.6)',
                  border: '1px solid var(--border)',
                }}
              >
                {/* A. MULTIPLE CHOICE BUILDER */}
                {formType === 'multiple_choice' && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem',
                      }}
                    >
                      <label className="label" style={{ marginBottom: 0 }}>
                        ANSWER OPTIONS <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Select the correct option(s) using the checkmark ✅
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {formOptions.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        return (
                          <div
                            key={optIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.65rem 0.85rem',
                              borderRadius: 'var(--radius-md)',
                              background: opt.isCorrect
                                ? 'rgba(34, 197, 94, 0.1)'
                                : 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${
                                opt.isCorrect ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.08)'
                              }`,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {/* Letter Indicator */}
                            <span
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: opt.isCorrect
                                  ? 'rgba(34, 197, 94, 0.25)'
                                  : 'rgba(255, 255, 255, 0.08)',
                                color: opt.isCorrect ? '#4ade80' : 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                flexShrink: 0,
                              }}
                            >
                              {letter}
                            </span>

                            {/* Option Text Input */}
                            <input
                              type="text"
                              required
                              value={opt.optionText}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormOptions((prev) =>
                                  prev.map((item, idx) =>
                                    idx === optIdx ? { ...item, optionText: val } : item
                                  )
                                );
                              }}
                              placeholder={`Option ${letter} text...`}
                              className="input"
                              style={{ flex: 1, background: 'transparent', border: 'none', padding: '0.5rem' }}
                            />

                            {/* Correctness Selector Button */}
                            <button
                              type="button"
                              onClick={() => toggleOptionCorrectness(optIdx)}
                              className="btn btn-sm"
                              title="Toggle correct option"
                              style={{
                                padding: '0.45rem 0.85rem',
                                borderRadius: 'var(--radius-full)',
                                background: opt.isCorrect
                                  ? 'rgba(34, 197, 94, 0.25)'
                                  : 'rgba(255, 255, 255, 0.06)',
                                color: opt.isCorrect ? '#4ade80' : 'var(--text-secondary)',
                                border: `1px solid ${
                                  opt.isCorrect ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.12)'
                                }`,
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {opt.isCorrect ? '✅ Correct' : 'Mark Correct'}
                            </button>

                            {/* Remove Option Button */}
                            <button
                              type="button"
                              onClick={() => removeOption(optIdx)}
                              disabled={formOptions.length <= 2}
                              className="btn btn-ghost btn-sm"
                              title="Remove option"
                              style={{
                                padding: '0.45rem 0.65rem',
                                color: '#fca5a5',
                                opacity: formOptions.length <= 2 ? 0.3 : 1,
                                cursor: formOptions.length <= 2 ? 'not-allowed' : 'pointer',
                                flexShrink: 0,
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Option CTA */}
                    <button
                      type="button"
                      onClick={addOption}
                      className="btn btn-ghost btn-sm"
                      style={{
                        marginTop: '1rem',
                        width: '100%',
                        border: '1px dashed rgba(255, 255, 255, 0.2)',
                        padding: '0.75rem',
                        color: 'var(--accent-hover)',
                      }}
                    >
                      ➕ Add Another Option
                    </button>
                  </div>
                )}

                {/* B. TRUE / FALSE BUILDER */}
                {formType === 'true_false' && (
                  <div>
                    <label className="label" style={{ marginBottom: '1rem', display: 'block' }}>
                      SELECT CORRECT ANSWER <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => setFormCorrectAnswer('true')}
                        className="card card-hover"
                        style={{
                          padding: '1.5rem',
                          textAlign: 'center',
                          background:
                            formCorrectAnswer === 'true'
                              ? 'rgba(16, 185, 129, 0.18)'
                              : 'rgba(255, 255, 255, 0.03)',
                          border: `2px solid ${
                            formCorrectAnswer === 'true'
                              ? 'rgba(16, 185, 129, 0.6)'
                              : 'rgba(255, 255, 255, 0.08)'
                          }`,
                          cursor: 'pointer',
                          boxShadow: formCorrectAnswer === 'true' ? '0 0 25px rgba(16, 185, 129, 0.2)' : 'none',
                        }}
                      >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👍</div>
                        <div
                          style={{
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            color: formCorrectAnswer === 'true' ? '#34d399' : 'var(--text-primary)',
                          }}
                        >
                          True is Correct {formCorrectAnswer === 'true' && '✅'}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormCorrectAnswer('false')}
                        className="card card-hover"
                        style={{
                          padding: '1.5rem',
                          textAlign: 'center',
                          background:
                            formCorrectAnswer === 'false'
                              ? 'rgba(16, 185, 129, 0.18)'
                              : 'rgba(255, 255, 255, 0.03)',
                          border: `2px solid ${
                            formCorrectAnswer === 'false'
                              ? 'rgba(16, 185, 129, 0.6)'
                              : 'rgba(255, 255, 255, 0.08)'
                          }`,
                          cursor: 'pointer',
                          boxShadow: formCorrectAnswer === 'false' ? '0 0 25px rgba(16, 185, 129, 0.2)' : 'none',
                        }}
                      >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👎</div>
                        <div
                          style={{
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            color: formCorrectAnswer === 'false' ? '#34d399' : 'var(--text-primary)',
                          }}
                        >
                          False is Correct {formCorrectAnswer === 'false' && '✅'}
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* C. ESSAY BUILDER */}
                {formType === 'essay' && (
                  <div
                    style={{
                      padding: '1.5rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      color: '#fbbf24',
                    }}
                  >
                    <div style={{ fontSize: '2.5rem' }}>📝</div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem', color: '#fef08a' }}>
                        Manual Review Required
                      </h4>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: '#fde047', opacity: 0.9 }}>
                        Essay answers are not auto-graded. You will review and grade student responses manually after quiz completion in the grading dashboard.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  marginTop: '0.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="btn btn-secondary"
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                >
                  {isSaving ? '⏳ Saving...' : 'Save Question ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
         MODAL 2: DELETE CONFIRMATION DIALOG
         ====================================================================== */}
      {isDeleteModalOpen && questionToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 5, 10, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 1050,
          }}
        >
          <div
            className="modal-content card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(239, 68, 68, 0.2)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 1.25rem',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              🗑️
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Delete Question?
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Are you sure you want to delete this question? This action cannot be undone and will remove all associated student answers.
            </p>
            <div
              style={{
                padding: '0.85rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '2rem',
                textAlign: 'left',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                QUESTION PREVIEW
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                {questionToDelete.questionText.length > 80
                  ? questionToDelete.questionText.substring(0, 80) + '...'
                  : questionToDelete.questionText}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setQuestionToDelete(null);
                }}
                disabled={isDeleting}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteQuestion}
                disabled={isDeleting}
                className="btn"
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.35)',
                }}
              >
                {isDeleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
         MODAL 3: PUBLISH VALIDATION ALERT DIALOG
         ====================================================================== */}
      {isPublishAlertOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 5, 10, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 1050,
          }}
        >
          <div
            className="modal-content card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(245, 158, 11, 0.2)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 1.25rem',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              ⚠️
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Cannot Publish Quiz
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
              You must add at least <strong>1 question</strong> before publishing this quiz. Students cannot take an empty assessment!
            </p>
            <button
              onClick={() => {
                setIsPublishAlertOpen(false);
                openAddModal();
              }}
              className="btn btn-primary btn-block"
              style={{ padding: '0.85rem' }}
            >
              ➕ Add Question Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
