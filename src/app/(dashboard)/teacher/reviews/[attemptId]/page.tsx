'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

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

  useEffect(() => {
    if (!attemptId) return;

    const fetchReviewData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/attempts/${attemptId}/review`);
        if (res.ok) {
          const data = await res.json();

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

          const normItems: NormalizedItem[] = rawQuestions.map((qObj: any, idx: number) => {
            const q = qObj.question || qObj;
            const a =
              qObj.answer ||
              qObj.studentAnswer ||
              qObj.student_answer ||
              rawAnswers.find((ans: any) => ans.questionId === q.id || ans.question_id === q.id) ||
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
          const initialForms: Record<string, any> = {};
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
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || errData.message || 'Failed to load attempt review details.');
        }
      } catch (err: any) {
        console.error('Failed to fetch review data:', err);
        setError('Network error: Unable to load grading studio.');
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
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to save essay grade.');
      }

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

      // Clear saved checkmark after 3 seconds
      setTimeout(() => {
        setEssayForms((prev) =>
          prev[item.questionId]
            ? { ...prev, [item.questionId]: { ...prev[item.questionId], saved: false } }
            : prev
        );
      }, 3000);
    } catch (err: any) {
      setEssayForms((prev) => ({
        ...prev,
        [item.questionId]: {
          ...prev[item.questionId],
          saving: false,
          error: err.message || 'Network error while saving grade.',
        },
      }));
    }
  };

  // Handle finalizing the exam
  const handleFinalize = async () => {
    if (ungradedCount > 0) {
      setFinalizeError(`You still have ${ungradedCount} ungraded essay question(s). Please assign scores to all essays before finalizing.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!window.confirm(`Are you ready to finalize this exam score?\n\nFinal Score: ${runningTotal} / ${displayMax} points.\n\nThis will lock the grade and make results available to the student.`)) {
      return;
    }

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
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to finalize exam score.');
      }

      setFinalizeSuccess(`🎉 Exam graded! Final score: ${runningTotal} / ${displayMax}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Redirect back to reviews list after 2.5 seconds
      setTimeout(() => {
        router.push('/teacher/reviews');
      }, 2500);
    } catch (err: any) {
      setFinalizeError(err.message || 'Network error while finalizing exam.');
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
            <span style={{ fontSize: '2rem' }}>🎉</span>
            <div>
              <strong style={{ fontSize: '1.25rem', display: 'block', color: '#ffffff' }}>Exam Finalized Successfully!</strong>
              <span style={{ fontSize: '1.05rem', color: '#86efac' }}>{finalizeSuccess}. Redirecting to reviews catalog...</span>
            </div>
          </div>
          <Link href="/teacher/reviews" className="btn btn-primary btn-sm" style={{ background: '#22c55e', color: '#000000', fontWeight: 800 }}>
            Return to Reviews Now ➔
          </Link>
        </div>
      )}

      {/* Error Banner */}
      {(error || finalizeError) && (
        <div className="alert alert-error animate-fade-in mb-6" style={{ alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Notice</strong>
            <span>{error || finalizeError}</span>
          </div>
          <button
            onClick={() => { setError(null); setFinalizeError(null); }}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.2rem 0.5rem', minWidth: 'auto', color: '#fca5a5' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div
        className="card mb-8"
        style={{
          padding: '1.75rem 2rem',
          background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.85) 0%, rgba(20, 20, 36, 0.95) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 25px rgba(99, 102, 241, 0.15)',
        }}
      >
        <Link
          href="/teacher/reviews"
          className="btn btn-ghost btn-sm"
          style={{ paddingLeft: 0, color: 'var(--text-secondary)', marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <span>←</span> Back to Reviews
        </Link>

        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div className="flex items-center gap-3 mb-1" style={{ flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {studentInfo.name}
              </h1>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>({studentInfo.email})</span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-primary)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                {attemptInfo.resultCode}
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.05rem', fontWeight: 500 }}>
              Assessment: <strong style={{ color: 'var(--accent-hover)' }}>{quizInfo.title}</strong>
            </p>
          </div>

          <div className="flex items-center gap-6" style={{ flexWrap: 'wrap' }}>
            {/* Live Score Counter */}
            <div
              style={{
                background: 'rgba(10, 10, 15, 0.7)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.75rem 1.5rem',
                textAlign: 'center',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.2rem',
                }}
              >
                LIVE SCORE COUNTER
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                <span className="text-gradient">{runningTotal}</span>{' '}
                <span style={{ fontSize: '1.15rem', color: 'var(--text-secondary)' }}>/ {displayMax} pts</span>
              </div>
            </div>

            {/* Top Right Action: Finalize Exam Score */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
              <button
                onClick={handleFinalize}
                disabled={finalizing || ungradedCount > 0 || Boolean(finalizeSuccess)}
                className="btn btn-primary btn-lg"
                style={{
                  padding: '0.9rem 1.75rem',
                  fontSize: '1.05rem',
                  boxShadow: ungradedCount > 0 ? 'none' : '0 0 25px rgba(99, 102, 241, 0.5)',
                  opacity: ungradedCount > 0 ? 0.6 : 1,
                  cursor: ungradedCount > 0 ? 'not-allowed' : 'pointer',
                }}
                title={
                  ungradedCount > 0
                    ? `Please grade the remaining ${ungradedCount} essay question(s) first`
                    : 'Finalize and publish exam score'
                }
              >
                <span>🏁</span> {finalizing ? 'Finalizing...' : 'Finalize Exam Score'}
              </button>
              {ungradedCount > 0 ? (
                <span style={{ fontSize: '0.8rem', color: '#fde047', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>⚠️</span> {ungradedCount} essay {ungradedCount === 1 ? 'question' : 'questions'} still need grading
                </span>
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#86efac', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>✨</span> All questions graded! Ready to finalize.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

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
          <div className="empty-state-icon">❓</div>
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
            const isEssay = item.type === 'essay';
            const isMC = item.type === 'multiple_choice';
            const isTF = item.type === 'true_false';
            const form = essayForms[item.questionId] || {
              score: item.currentScore,
              feedback: item.feedback,
              saving: false,
              saved: false,
              error: null,
            };

            // Badge styling per question type
            const typeBadgeText = isEssay ? '📝 Essay' : isMC ? '🔘 Multiple Choice' : '⚖️ True / False';
            const typeBadgeStyle = isEssay
              ? { background: 'rgba(245, 158, 11, 0.15)', color: '#fde047', border: '1px solid rgba(245, 158, 11, 0.3)' }
              : { background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.3)' };

            return (
              <div
                key={item.questionId}
                className="card"
                style={{
                  padding: '2rem',
                  borderLeft: isEssay
                    ? '4px solid var(--warning)'
                    : item.isCorrect
                    ? '4px solid var(--success)'
                    : '4px solid var(--error)',
                  background: isEssay
                    ? 'linear-gradient(145deg, rgba(30, 26, 48, 0.85) 0%, rgba(20, 20, 40, 0.95) 100%)'
                    : 'var(--bg-card)',
                  boxShadow: isEssay ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.12)' : 'var(--shadow-md)',
                }}
              >
                {/* Question Header */}
                <div className="flex justify-between items-start gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
                  <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        background: 'rgba(255, 255, 255, 0.08)',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {item.order}
                    </span>
                    <span className="badge" style={{ ...typeBadgeStyle, margin: 0 }}>
                      {typeBadgeText}
                    </span>
                  </div>

                  {/* Points Badge / Auto-graded status */}
                  <div>
                    {isEssay ? (
                      <span
                        className="badge"
                        style={{
                          margin: 0,
                          background: item.isGraded ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: item.isGraded ? '#86efac' : '#fde047',
                          border: `1px solid ${item.isGraded ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                          fontSize: '0.85rem',
                          padding: '0.4rem 0.9rem',
                        }}
                      >
                        {item.isGraded ? `🟢 Graded: ${item.currentScore} / ${item.maxPoints} pts` : `🟡 Max ${item.maxPoints} pts (Ungraded)`}
                      </span>
                    ) : (
                      <span
                        className="badge"
                        style={{
                          margin: 0,
                          background: item.isCorrect ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: item.isCorrect ? '#86efac' : '#fca5a5',
                          border: `1px solid ${item.isCorrect ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          fontSize: '0.85rem',
                          padding: '0.4rem 0.9rem',
                        }}
                      >
                        {item.isCorrect ? `🟢 ${item.currentScore} / ${item.maxPoints} pts` : `🔴 0 / ${item.maxPoints} pts`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Prompt */}
                <div style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem', lineHeight: '1.6' }}>
                  {item.questionText}
                </div>

                {/* Question Image if any */}
                {item.questionImage && (
                  <div style={{ marginBottom: '1.5rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', maxWidth: '600px' }}>
                    <img
                      src={item.questionImage}
                      alt="Question attachment"
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>
                )}

                {/* Response / Review Section */}
                {isEssay ? (
                  /* ESSAY QUESTION: INTERACTIVE GRADING FORM */
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
                    {/* Student's Written Response Box */}
                    <div className="mb-6">
                      <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', color: 'var(--text-secondary)' }}>
                        <span>✍️</span>
                        <span>Student&apos;s Written Response:</span>
                      </label>
                      <div
                        style={{
                          background: 'rgba(10, 10, 15, 0.85)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1.25rem',
                          color: item.answerText ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontStyle: item.answerText ? 'normal' : 'italic',
                          fontSize: '1rem',
                          lineHeight: '1.7',
                          whiteSpace: 'pre-wrap',
                          minHeight: '110px',
                          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        {item.answerText || 'No answer provided (Timed Out or Left Blank)'}
                      </div>
                    </div>

                    {/* Grading Form Box */}
                    <div
                      style={{
                        background: 'rgba(20, 20, 36, 0.6)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.5rem',
                      }}
                    >
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-hover)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>⚖️</span> Assign Score & Instructor Feedback
                      </h4>

                      <div className="grid" style={{ gridTemplateColumns: '120px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                        {/* Points Awarded Input */}
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="label" style={{ color: 'var(--text-primary)' }}>
                            Points (Max {item.maxPoints})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={item.maxPoints}
                            step="0.5"
                            value={form.score}
                            onChange={(e) =>
                              setEssayForms((prev) => ({
                                ...prev,
                                [item.questionId]: { ...prev[item.questionId], score: e.target.value, saved: false, error: null },
                              }))
                            }
                            className="input"
                            style={{
                              fontSize: '1.2rem',
                              fontWeight: 700,
                              textAlign: 'center',
                              borderColor: form.error ? 'var(--error)' : 'rgba(99, 102, 241, 0.4)',
                              background: 'rgba(10, 10, 15, 0.9)',
                            }}
                          />
                        </div>

                        {/* Instructor Feedback Textarea */}
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="label" style={{ color: 'var(--text-primary)' }}>
                            Instructor Feedback & Comments (Optional)
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Great analysis! Remember to cite specific examples..."
                            value={form.feedback}
                            onChange={(e) =>
                              setEssayForms((prev) => ({
                                ...prev,
                                [item.questionId]: { ...prev[item.questionId], feedback: e.target.value, saved: false, error: null },
                              }))
                            }
                            className="input"
                            style={{ resize: 'vertical', minHeight: '80px' }}
                          />
                        </div>
                      </div>

                      {/* Error Message */}
                      {form.error && (
                        <div style={{ color: '#fca5a5', fontSize: '0.85rem', marginTop: '0.75rem', fontWeight: 600 }}>
                          ⚠️ {form.error}
                        </div>
                      )}

                      {/* Save Button & Status */}
                      <div className="flex justify-end items-center gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        {form.saved && (
                          <span className="animate-fade-in" style={{ color: '#86efac', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span>✅</span> Saved & Live Score Updated!
                          </span>
                        )}

                        <button
                          onClick={() => handleSaveEssayGrade(item)}
                          disabled={form.saving}
                          className="btn btn-primary"
                          style={{
                            padding: '0.65rem 1.5rem',
                            boxShadow: '0 0 18px rgba(99, 102, 241, 0.35)',
                          }}
                        >
                          {form.saving ? '⌛ Saving...' : '💾 Save Grade & Feedback'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* READ-ONLY REVIEW FOR MULTIPLE CHOICE & TRUE/FALSE */
                  <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
                    {item.options && item.options.length > 0 ? (
                      /* Display Options List */
                      <div className="flex flex-col gap-3">
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                          ANSWER OPTIONS:
                        </div>
                        {item.options.map((opt) => {
                          const isSelected = item.selectedOptionId === opt.id || item.answerText === opt.optionText;
                          const isOptCorrect = opt.isCorrect || opt.optionText === item.correctAnswer || opt.id === item.correctAnswer;

                          let boxStyle: React.CSSProperties = {
                            background: 'rgba(20, 20, 32, 0.4)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                          };

                          let badgeText: string | null = null;
                          let badgeBg = '';
                          let badgeColor = '';

                          if (isSelected && isOptCorrect) {
                            boxStyle = {
                              ...boxStyle,
                              background: 'rgba(34, 197, 94, 0.15)',
                              border: '1px solid var(--success)',
                              boxShadow: '0 0 15px rgba(34, 197, 94, 0.15)',
                            };
                            badgeText = '🟢 Student Answer (Correct)';
                            badgeBg = 'rgba(34, 197, 94, 0.2)';
                            badgeColor = '#86efac';
                          } else if (isSelected && !isOptCorrect) {
                            boxStyle = {
                              ...boxStyle,
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid var(--error)',
                              boxShadow: '0 0 15px rgba(239, 68, 68, 0.15)',
                            };
                            badgeText = '🔴 Student Answer (Incorrect)';
                            badgeBg = 'rgba(239, 68, 68, 0.2)';
                            badgeColor = '#fca5a5';
                          } else if (!isSelected && isOptCorrect) {
                            boxStyle = {
                              ...boxStyle,
                              background: 'rgba(34, 197, 94, 0.06)',
                              border: '1px dashed var(--success)',
                            };
                            badgeText = '✓ Correct Answer';
                            badgeBg = 'rgba(34, 197, 94, 0.15)';
                            badgeColor = '#86efac';
                          }

                          return (
                            <div key={opt.id} style={boxStyle}>
                              <span style={{ fontSize: '1rem', fontWeight: isSelected || isOptCorrect ? 700 : 400, color: 'var(--text-primary)' }}>
                                {opt.optionText}
                              </span>
                              {badgeText && (
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    padding: '0.3rem 0.75rem',
                                    borderRadius: 'var(--radius-full)',
                                    background: badgeBg,
                                    color: badgeColor,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {badgeText}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Display Simple Text comparison if no options array */
                      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div
                          style={{
                            background: 'rgba(10, 10, 15, 0.6)',
                            border: `1px solid ${item.isCorrect ? 'var(--success)' : 'var(--error)'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.3rem' }}>
                            STUDENT&apos;S ANSWER
                          </div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: item.isCorrect ? '#86efac' : '#fca5a5' }}>
                            {item.answerText || 'No answer selected'}
                          </div>
                        </div>

                        <div
                          style={{
                            background: 'rgba(34, 197, 94, 0.08)',
                            border: '1px dashed var(--success)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', color: '#86efac', fontWeight: 700, marginBottom: '0.3rem' }}>
                            CORRECT ANSWER
                          </div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.correctAnswer || 'Not specified'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
