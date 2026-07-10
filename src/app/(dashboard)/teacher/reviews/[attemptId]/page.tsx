'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ReviewAttemptHeader } from '@/components/features/reviews/ReviewAttemptHeader';
import { ReviewQuestionCard } from '@/components/features/reviews/ReviewQuestionCard';
import { ScoreFinalizeConfirmModal } from '@/components/features/reviews/ScoreFinalizeConfirmModal';

interface ReviewOption {
  id: string;
  optionText: string;
  isCorrect?: boolean;
}

interface NormalizedItem {
  questionId: string;
  studentAnswerId: string | null;
  order: number;
  type: 'multiple_choice' | 'true_false' | 'essay';
  questionText: string;
  questionImage: string | null;
  maxPoints: number;
  correctAnswer: string | null;
  options: ReviewOption[];
  
  // Student response
  selectedOptionId: string | null;
  answerText: string | null;
  isCorrect: boolean | null;
  status: string;
  
  // Grading state
  currentScore: number;
  feedback: string;
  isGraded: boolean;
}

interface RawEssayReview {
  score?: number | string;
  feedback?: string;
}

interface RawStudentAnswer {
  id?: string;
  questionId?: string;
  question_id?: string;
  selectedOptionId?: string | null;
  selected_option_id?: string | null;
  answerText?: string | null;
  answer_text?: string | null;
  isCorrect?: boolean | null;
  is_correct?: boolean | null;
  status?: string;
  score?: number | string | null;
  feedback?: string;
  isGraded?: boolean;
  essayReview?: RawEssayReview | null;
}

interface RawQuestion {
  id?: string;
  studentAnswerId?: string | null;
  student_answer_id?: string | null;
  order?: number;
  orderNumber?: number;
  type?: 'multiple_choice' | 'true_false' | 'essay';
  questionText?: string;
  question_text?: string;
  questionImage?: string | null;
  question_image?: string | null;
  points?: number | string;
  maxScore?: number | string;
  correctAnswer?: string | null;
  correct_answer?: string | null;
  options?: ReviewOption[];
  questionOptions?: ReviewOption[];
  answer?: RawStudentAnswer | null;
  studentAnswer?: RawStudentAnswer | null;
  student_answer?: RawStudentAnswer | null;
}

export default function InteractiveGradingStudioPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = (params?.attemptId as string) || '';

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<NormalizedItem[]>([]);
  const [attemptInfo, setAttemptInfo] = useState<{ id: string; resultCode: string; totalScore?: number; maxScore?: number; status: string }>({
    id: attemptId,
    resultCode: 'RES-PENDING',
    status: 'in_progress',
  });
  const [quizInfo, setQuizInfo] = useState<{ id?: string; title: string; description?: string }>({
    title: 'Assessment Review',
  });
  const [studentInfo, setStudentInfo] = useState<{ name: string; email: string }>({
    name: 'Student Name',
    email: 'student@minilms.edu',
  });

  // Local form state for essay questions: questionId -> form state
  const [essayForms, setEssayForms] = useState<
    Record<string, { score: number | string; feedback: string; saving: boolean; saved: boolean; error: string | null }>
  >({});

  const [finalizing, setFinalizing] = useState<boolean>(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [finalizeSuccess, setFinalizeSuccess] = useState<string | null>(null);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!attemptId) return;

    const fetchReviewData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/attempts/${attemptId}/review`);
        if (res.ok) {
          const data = (await res.json()) as any;

          // Extract basic info
          const att = data.attempt || data.data?.attempt || {};
          const qz = data.quiz || data.data?.quiz || {};
          const st = data.student || data.user || data.data?.student || data.data?.user || {};

          setAttemptInfo({
            id: att.id || attemptId,
            resultCode: att.resultCode || data.resultCode || 'RES-A7X9K2',
            totalScore: att.totalScore !== undefined ? Number(att.totalScore) : undefined,
            maxScore: att.maxScore !== undefined ? Number(att.maxScore) : undefined,
            status: att.status || 'submitted',
          });

          setQuizInfo({
            id: qz.id || data.quizId,
            title: qz.title || data.quizTitle || att.quizTitle || 'Assessment Review',
            description: qz.description || null,
          });

          setStudentInfo({
            name: st.name || att.studentName || 'Student Response',
            email: st.email || att.studentEmail || 'No email provided',
          });

          // Normalize questions and answers
          const rawQuestions = Array.isArray(data.questions)
            ? data.questions
            : Array.isArray(data.data?.questions)
            ? data.data.questions
            : Array.isArray(data.items)
            ? data.items
            : [];
          const rawAnswers = Array.isArray(data.answers)
            ? data.answers
            : Array.isArray(data.studentAnswers)
            ? data.studentAnswers
            : Array.isArray(data.data?.answers)
            ? data.data.answers
            : [];

          const normItems: NormalizedItem[] = rawQuestions.map((qItem: unknown, idx: number) => {
            const qObj = qItem as RawQuestion & { question?: RawQuestion };
            const q: RawQuestion = qObj.question || qObj;
            const a: RawStudentAnswer | null =
              qObj.answer ||
              qObj.studentAnswer ||
              qObj.student_answer ||
              rawAnswers.find((ans: RawStudentAnswer) => ans.questionId === q.id || ans.question_id === q.id) ||
              null;

            const studentAnswerId = a?.id || q.studentAnswerId || q.student_answer_id || null;
            const order = q.order ?? q.orderNumber ?? idx + 1;
            const type = q.type || 'multiple_choice';
            const questionText = q.questionText || q.question_text || 'No question prompt';
            const questionImage = q.questionImage || q.question_image || null;
            const maxPoints = Number(q.points ?? q.maxScore ?? 1);
            const correctAnswer = q.correctAnswer || q.correct_answer || null;
            const options = Array.isArray(q.options)
              ? q.options
              : Array.isArray(q.questionOptions)
              ? q.questionOptions
              : [];

            const selectedOptionId = a?.selectedOptionId || a?.selected_option_id || null;
            const answerText = a?.answerText || a?.answer_text || null;
            const isCorrect = a?.isCorrect !== undefined ? a.isCorrect : a?.is_correct !== undefined ? a.is_correct : null;
            const status = a?.status || 'answered';

            const rawScore =
              a?.score !== undefined && a?.score !== null
                ? Number(a.score)
                : a?.essayReview?.score !== undefined
                ? Number(a.essayReview.score)
                : isCorrect
                ? maxPoints
                : 0;
            const feedback = a?.feedback || a?.essayReview?.feedback || '';

            const isEssay = type === 'essay';
            const isGraded = isEssay
              ? (a?.score !== undefined && a?.score !== null) ||
                (a?.essayReview !== undefined && a?.essayReview !== null) ||
                Boolean(a?.isGraded) ||
                Number(rawScore) > 0 ||
                Boolean(feedback)
              : true;

            return {
              questionId: q.id || `q-${idx}`,
              studentAnswerId,
              order,
              type,
              questionText,
              questionImage,
              maxPoints,
              correctAnswer,
              options,
              selectedOptionId,
              answerText,
              isCorrect,
              status,
              currentScore: isNaN(rawScore) ? 0 : rawScore,
              feedback: feedback || '',
              isGraded,
            };
          });

          // Sort by order
          normItems.sort((a, b) => a.order - b.order);
          setItems(normItems);

          // Initialize essay forms state
          const initialForms: Record<
            string,
            { score: number | string; feedback: string; saving: boolean; saved: boolean; error: string | null }
          > = {};
          normItems.forEach((it) => {
            if (it.type === 'essay') {
              initialForms[it.questionId] = {
                score: it.currentScore,
                feedback: it.feedback,
                saving: false,
                saved: false,
                error: null,
              };
            }
          });
          setEssayForms(initialForms);
        } else {
          const errData = (await res.json().catch(() => ({}))) as any;
          setError(errData.error || errData.message || 'Failed to load attempt review details.');
        }
      } catch (err: unknown) {
        console.error('Failed to fetch review data:', err);
        setError(err instanceof Error ? err.message : 'Network error: Unable to load grading studio.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviewData();
  }, [attemptId]);

  // Calculate scores
  const totalMax = items.reduce((sum, it) => sum + (Number(it.maxPoints) || 0), 0);
  const runningTotal = items.reduce((sum, it) => sum + (Number(it.currentScore) || 0), 0);
  const displayMax = Math.max(totalMax, attemptInfo.maxScore || 0);
  const ungradedCount = items.filter((it) => it.type === 'essay' && !it.isGraded).length;

  // Handle saving an essay grade
  const handleSaveEssayGrade = async (item: NormalizedItem) => {
    const form = essayForms[item.questionId];
    if (!form) return;

    const numScore = Number(form.score);
    if (isNaN(numScore) || numScore < 0 || numScore > item.maxPoints) {
      setEssayForms((prev) => ({
        ...prev,
        [item.questionId]: {
          ...prev[item.questionId],
          error: `Please enter a valid score between 0 and ${item.maxPoints}.`,
        },
      }));
      return;
    }

    setEssayForms((prev) => ({
      ...prev,
      [item.questionId]: { ...prev[item.questionId], saving: true, saved: false, error: null },
    }));

    try {
      const res = await fetch(`/api/attempts/${attemptId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentAnswerId: item.studentAnswerId,
          questionId: item.questionId,
          score: numScore,
          feedback: form.feedback || '',
        }),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as any;
        throw new Error(errData.error || errData.message || 'Failed to save essay grade.');
      }

      const resData = (await res.json().catch(() => ({}))) as any;

      // Update local items state so live score updates immediately
      setItems((prev) =>
        prev.map((it) =>
          it.questionId === item.questionId
            ? { ...it, currentScore: numScore, feedback: form.feedback || '', isGraded: true }
            : it
        )
      );

      setEssayForms((prev) => ({
        ...prev,
        [item.questionId]: { ...prev[item.questionId], saving: false, saved: true, error: null },
      }));

      if (resData && resData.allEssaysGraded) {
        setFinalizeSuccess(`All essay responses graded! Final score automatically calculated.`);
        setTimeout(() => {
          router.push('/teacher/reviews');
        }, 2500);
      } else {
        // Clear saved indicator after 3 seconds
        setTimeout(() => {
          setEssayForms((prev) =>
            prev[item.questionId]
              ? { ...prev, [item.questionId]: { ...prev[item.questionId], saved: false } }
              : prev
          );
        }, 3000);
      }
    } catch (err: unknown) {
      setEssayForms((prev) => ({
        ...prev,
        [item.questionId]: {
          ...prev[item.questionId],
          saving: false,
          error: err instanceof Error ? err.message : 'Network error while saving grade.',
        },
      }));
    }
  };

  // Handle finalizing the exam
  const handleFinalize = () => {
    if (ungradedCount > 0) {
      setFinalizeError(`You still have ${ungradedCount} ungraded essay question(s). Please assign scores to all essays before finalizing.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsFinalizeModalOpen(true);
  };

  const executeFinalize = async () => {
    setFinalizing(true);
    setFinalizeError(null);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalScore: runningTotal,
          maxScore: displayMax,
        }),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as any;
        throw new Error(errData.error || errData.message || 'Failed to finalize exam score.');
      }

      setIsFinalizeModalOpen(false);
      setFinalizeSuccess(`Exam graded! Final score: ${runningTotal} / ${displayMax}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Redirect back to reviews list after 2.5 seconds
      setTimeout(() => {
        router.push('/teacher/reviews');
      }, 2500);
    } catch (err: unknown) {
      setIsFinalizeModalOpen(false);
      setFinalizeError(err instanceof Error ? err.message : 'Network error while finalizing exam.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Celebratory Modal / Banner on Success */}
      {finalizeSuccess && (
        <div
          className="alert alert-success animate-fade-in mb-6"
          style={{
            padding: '1.5rem',
            background: 'rgba(34, 197, 94, 0.18)',
            border: '2px solid var(--success)',
            boxShadow: '0 0 35px rgba(34, 197, 94, 0.3)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div className="flex items-center gap-3">
            <div>
              <strong style={{ fontSize: '1.25rem', display: 'block', color: '#ffffff' }}>Exam Finalized Successfully!</strong>
              <span style={{ fontSize: '1.05rem', color: '#43c372' }}>{finalizeSuccess}. Redirecting to reviews catalog...</span>
            </div>
          </div>
          <Link href="/teacher/reviews" className="btn btn-primary btn-sm" style={{ background: '#22c55e', color: '#000000', fontWeight: 800 }}>
            Return to Reviews Now
          </Link>
        </div>
      )}

      {/* Error Banner */}
      {(error || finalizeError) && (
        <div className="alert alert-error animate-fade-in mb-6" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Notice</strong>
            <span>{error || finalizeError}</span>
          </div>
          <button
            onClick={() => { setError(null); setFinalizeError(null); }}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.2rem 0.5rem', minWidth: 'auto', color: '#e12727' }}
          >
            X
          </button>
        </div>
      )}

      {/* Header Bar */}
      <ReviewAttemptHeader
        studentInfo={studentInfo}
        attemptInfo={attemptInfo}
        quizInfo={quizInfo}
        runningTotal={runningTotal}
        displayMax={displayMax}
        ungradedCount={ungradedCount}
        finalizing={finalizing}
        finalizeSuccess={finalizeSuccess}
        onFinalize={handleFinalize}
      />

      {/* Loading State */}
      {loading ? (
        <div className="text-center" style={{ padding: '5rem 0' }}>
          <div
            className="spinner"
            style={{ width: '50px', height: '50px', borderWidth: '4px', boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)' }}
          ></div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1.5rem', fontSize: '1.05rem', fontWeight: 500 }}>
            Loading questions, student answers, and grading rubrics...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">!</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            No Questions Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto' }}>
            There are no questions recorded for this assessment submission.
          </p>
        </div>
      ) : (
        /* Questions & Answers Review List */
        <div className="flex flex-col gap-6">
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Questions & Student Responses ({items.length})
          </h2>

          {items.map((item) => {
            const form = essayForms[item.questionId] || {
              score: item.currentScore,
              feedback: item.feedback,
              saving: false,
              saved: false,
              error: null,
            };

            return (
              <ReviewQuestionCard
                key={item.questionId}
                item={item}
                form={form}
                onFormChange={(questionId, updates) =>
                  setEssayForms((prev) => ({
                    ...prev,
                    [questionId]: { ...prev[questionId], ...updates },
                  }))
                }
                onSaveGrade={handleSaveEssayGrade}
              />
            );
          })}
        </div>
      )}

      {/* Score Finalize Confirmation Modal */}
      <ScoreFinalizeConfirmModal
        isOpen={isFinalizeModalOpen}
        runningTotal={runningTotal}
        displayMax={displayMax}
        isFinalizing={finalizing}
        onClose={() => setIsFinalizeModalOpen(false)}
        onConfirm={executeFinalize}
      />
    </div>
  );
}
