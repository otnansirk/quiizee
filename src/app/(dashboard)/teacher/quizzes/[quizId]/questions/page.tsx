'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { ToastStack } from '@/components/molecules/ToastStack';
import { QuestionList } from '@/components/features/questions/QuestionList';
import { QuestionFormModal } from '@/components/features/questions/QuestionFormModal';
import { QuestionDeleteModal } from '@/components/features/questions/QuestionDeleteModal';
import { PublishValidationModal } from '@/components/features/questions/PublishValidationModal';
import { AIGenerateQuestionsModal } from '@/components/features/ai/AIGenerateQuestionsModal';
import { QuizQuestionsHeader } from '@/components/features/questions/QuizQuestionsHeader';

/* ==========================================================================
   TYPES & INTERFACES (Exported for reusable components)
   ========================================================================== */

export type QuestionType = 'multiple_choice' | 'true_false' | 'essay';

export interface OptionData {
  id?: string;
  optionText: string;
  isCorrect: boolean;
  order: number;
}

export interface QuestionData {
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

export interface QuizData {
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

/* ==========================================================================
   MAIN COMPONENT: QUESTION MANAGEMENT UI
   ========================================================================== */

export default function QuizQuestionsPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = params?.quizId || '';

  // State: Quiz & Questions
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Unified Toast Hook
  const { toasts, showToast } = useToast();

  // State: Publish / Unpublish
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isPublishAlertOpen, setIsPublishAlertOpen] = useState<boolean>(false);

  // State: Modals
  const [questionToEdit, setQuestionToEdit] = useState<QuestionData | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [questionToDelete, setQuestionToDelete] = useState<QuestionData | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);

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
      const data = (await res.json()) as QuizData;
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
        const errData = (await res.json().catch(() => ({}))) as any;
        throw new Error(errData.message || `Failed to ${targetPublishState ? 'publish' : 'unpublish'} quiz`);
      }

      setQuiz((prev) => (prev ? { ...prev, isPublished: targetPublishState } : null));
      showToast(
        `Quiz successfully ${targetPublishState ? 'published' : 'unpublished'}!`,
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
          <h2 className="card-title" style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>
            Failed to Load Quiz
          </h2>
          <p className="card-description" style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            {fetchError || 'We could not find the requested quiz.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/teacher/quizzes" className="btn btn-secondary">
              Back to Quizzes
            </Link>
            <button onClick={fetchQuizData} className="btn btn-primary">
              Try Again
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

      {/* Floating Toast Notifications */}
      <ToastStack toasts={toasts} />

      <div className="container" style={{ paddingTop: '2rem' }}>
        <QuizQuestionsHeader
          quiz={quiz}
          totalQuestions={totalQuestions}
          totalPoints={totalPoints}
          isPublishing={isPublishing}
          onPublishToggle={handlePublishToggle}
          onOpenAIModal={() => setIsAIModalOpen(true)}
          onAddQuestion={() => { setQuestionToEdit(null); setIsFormModalOpen(true); }}
        />

        {/* Questions List Feature Component */}
        <QuestionList
          questions={questions}
          durationMode={quiz.durationMode}
          onAddFirst={() => { setQuestionToEdit(null); setIsFormModalOpen(true); }}
          onMoveQuestion={handleMoveQuestion}
          onEditQuestion={(q) => { setQuestionToEdit(q); setIsFormModalOpen(true); }}
          onDeleteQuestion={(q) => { setQuestionToDelete(q); setIsDeleteModalOpen(true); }}
        />

        {/* Delete Confirmation Modal */}
        <QuestionDeleteModal
          isOpen={isDeleteModalOpen}
          questionToDelete={questionToDelete}
          quizId={quizId}
          onClose={() => { setIsDeleteModalOpen(false); setQuestionToDelete(null); }}
          onSuccess={() => { showToast('Question deleted successfully', 'success'); fetchQuizData(); }}
          onError={(msg) => showToast(msg, 'error')}
        />

        {/* Publish Validation Alert Modal */}
        <PublishValidationModal
          isOpen={isPublishAlertOpen}
          onClose={() => setIsPublishAlertOpen(false)}
          onAddQuestionNow={() => { setQuestionToEdit(null); setIsFormModalOpen(true); }}
        />

        {/* AI Generate Questions Modal */}
        <AIGenerateQuestionsModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          quizId={quizId}
          onSuccess={(saved, failed) => {
            if (saved > 0) {
              showToast(`${saved} question${saved > 1 ? 's' : ''} added to quiz!`, 'success');
              fetchQuizData();
            }
            if (failed > 0) {
              showToast(`${failed} question${failed > 1 ? 's' : ''} failed to save.`, 'error');
            }
          }}
        />
      </div>

        {/* Add / Edit Question Modal */}
        <QuestionFormModal
          isOpen={isFormModalOpen}
          onClose={() => { setIsFormModalOpen(false); setQuestionToEdit(null); }}
          quizId={quizId}
          durationMode={quiz.durationMode}
          questionToEdit={questionToEdit}
          nextOrder={questions.length + 1}
          onSuccess={(isEdit) => {
            showToast(isEdit ? 'Question updated successfully!' : 'Question added successfully!', 'success');
            fetchQuizData();
          }}
        />
    </div>
  );
}
