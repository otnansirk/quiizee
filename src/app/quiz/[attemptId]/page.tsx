'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { QuizHeaderTimer } from '@/components/features/quiz-attempt/QuizHeaderTimer';
import { QuizSidebarNav } from '@/components/features/quiz-attempt/QuizSidebarNav';
import { QuizQuestionDisplay } from '@/components/features/quiz-attempt/QuizQuestionDisplay';
import { QuizSubmitConfirmModal } from '@/components/features/quiz-attempt/QuizSubmitConfirmModal';

interface QuestionOption {
  id: string;
  questionId: string;
  optionText: string;
  order: number;
}

interface Question {
  id: string;
  quizId: string;
  type: 'multiple_choice' | 'true_false' | 'essay';
  questionText: string;
  questionImage?: string | null;
  points: number;
  order: number;
  duration?: number | null;
  options?: QuestionOption[];
}

interface QuizInfo {
  id: string;
  title: string;
  description?: string | null;
  durationMode: 'global' | 'per_question';
  globalDuration?: number | null;
  maxAttempts?: number;
}

interface AttemptInfo {
  id: string;
  quizId: string;
  userId?: string | null;
  participantId?: string | null;
  resultCode: string;
  attemptNumber: number;
  startTime: string;
  endTime?: string | null;
  status: 'in_progress' | 'submitted' | 'graded';
  isAutoSubmitted?: boolean;
}

interface AnswerState {
  selectedOptionId?: string;
  answerText?: string;
  status: string;
}

export default function QuizTakingEnginePage() {
  const params = useParams();
  const attemptId = (params?.attemptId as string) || '';
  const router = useRouter();

  // State Management
  const [attempt, setAttempt] = useState<AttemptInfo | null>(null);
  const [quiz, setQuiz] = useState<QuizInfo | null>(null);
  const [studentName, setStudentName] = useState<string>('Student');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // UI / Helper State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showAutoSubmitModal, setShowAutoSubmitModal] = useState<boolean>(false);
  const [savingStatus, setSavingStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});
  const [questionTimeoutBanner, setQuestionTimeoutBanner] = useState<string | null>(null);

  // Refs for timers & debouncing
  const hasAutoSubmittedRef = useRef<boolean>(false);
  const hasTimedOutQuestionRef = useRef<Record<string, boolean>>({});
  const essayTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const attemptStartTimeRef = useRef<string | null>(null);

  // 1. Fetch Attempt Data on Mount
  useEffect(() => {
    if (!attemptId) {
      setError('Invalid Assessment Attempt ID.');
      setLoading(false);
      return;
    }

    const fetchAttemptData = async () => {
      setLoading(true);
      setError(null);
      try {
        let res: Response | null = null;
        let errData: any = {};
        for (let retry = 0; retry < 4; retry++) {
          res = await fetch(`/api/attempts/${attemptId}`, {
            cache: 'no-store',
          });
          if (res.ok) {
            break;
          }
          errData = (await res.json().catch(() => ({}))) as any;
          // If 404 (or server error) occurs right after join, wait and retry up to 3 times
          if (retry < 3 && (res.status === 404 || res.status >= 500)) {
            await new Promise((resolve) => setTimeout(resolve, 300 * (retry + 1)));
            continue;
          }
          break;
        }

        if (!res || !res.ok) {
          throw new Error(errData.error || errData.message || 'Failed to load assessment session. Please verify your access.');
        }

        const rawData = (await res.json()) as any;
        const attemptData: AttemptInfo = rawData.attempt || rawData.data || rawData;

        if (!attemptData || !attemptData.id) {
          throw new Error('Assessment session not found.');
        }

        // Redirect immediately if quiz is already submitted
        if (attemptData.status !== 'in_progress') {
          setIsRedirecting(true);
          router.replace(`/results/${attemptData.resultCode || attemptId}`);
          return;
        }

        setAttempt(attemptData);
        attemptStartTimeRef.current = attemptData.startTime;

        // Quiz info
        const quizData: QuizInfo = rawData.quiz || attemptData['quiz' as keyof AttemptInfo] || {
          id: attemptData.quizId,
          title: 'Assessment',
          durationMode: 'global',
        };
        setQuiz(quizData);

        // Determine Student Name
        const userObj = rawData.user || rawData.participant;
        const nameStr = userObj?.name || userObj?.email || rawData.studentName || 'Candidate';
        setStudentName(nameStr);

        // Sanitize Questions (remove any correct answers/flags)
        const rawQuestions = rawData.questions || [];
        const sorted = [...rawQuestions].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        const sanitizedQuestions: Question[] = sorted.map((q: any) => ({
          id: q.id,
          quizId: q.quizId,
          type: q.type,
          questionText: q.questionText,
          questionImage: q.questionImage || null,
          points: q.points || 1,
          order: q.order || 0,
          duration: q.duration || null,
          options: Array.isArray(q.options)
            ? q.options
                .map((opt: any) => ({
                  id: opt.id,
                  questionId: opt.questionId,
                  optionText: opt.optionText,
                  order: opt.order || 0,
                }))
                .sort((a: any, b: any) => a.order - b.order)
            : undefined,
        }));
        setQuestions(sanitizedQuestions);

        // Initialize Answers Map from fetched studentAnswers
        const initialAnswersMap: Record<string, AnswerState> = {};
        sanitizedQuestions.forEach(q => {
          initialAnswersMap[q.id] = { status: 'viewing' };
        });

        const fetchedAnswers = rawData.studentAnswers || rawData.answers || [];
        if (Array.isArray(fetchedAnswers)) {
          fetchedAnswers.forEach((sa: any) => {
            if (sa && sa.questionId) {
              const hasAns = !!sa.selectedOptionId || (!!sa.answerText && sa.answerText.trim() !== '');
              initialAnswersMap[sa.questionId] = {
                selectedOptionId: sa.selectedOptionId || undefined,
                answerText: sa.answerText || undefined,
                status: sa.status || (hasAns ? 'answered' : 'viewing'),
              };
            }
          });
        }
        setAnswers(initialAnswersMap);

        // Initialize Global Timer if applicable
        if (quizData.durationMode === 'global' && typeof quizData.globalDuration === 'number') {
          const elapsed = Math.floor((Date.now() - new Date(attemptData.startTime).getTime()) / 1000);
          const rem = Math.max(0, quizData.globalDuration - elapsed);
          setRemainingSeconds(rem);
        } else if (quizData.durationMode === 'per_question') {
          let firstUnfinishedIdx = 0;
          for (let i = 0; i < sanitizedQuestions.length; i++) {
            const q = sanitizedQuestions[i];
            const sa = (Array.isArray(fetchedAnswers) ? fetchedAnswers : []).find((a: any) => a.questionId === q.id);
            const isDone = sa && (sa.status === 'answered' || sa.status === 'timed_out' || sa.selectedOptionId || (sa.answerText && sa.answerText.trim() !== ''));
            if (!isDone) {
              firstUnfinishedIdx = i;
              break;
            }
            if (i === sanitizedQuestions.length - 1) {
              firstUnfinishedIdx = i;
            }
          }
          setCurrentQuestionIndex(firstUnfinishedIdx);
        }
      } catch (err: any) {
        console.error('Error fetching quiz attempt:', err);
        setError(err.message || 'An unexpected error occurred while loading the assessment.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptData();
  }, [attemptId, router]);

  // 2. Submission Handlers
  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowAutoSubmitModal(true);
    setShowSubmitModal(false);

    try {
      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAutoSubmitted: true }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      const resultCode = data.resultCode || attempt?.resultCode || attemptId;
      router.replace(`/results/${resultCode}`);
    } catch (err) {
      console.error('Auto-submit failed:', err);
      router.replace(`/results/${attempt?.resultCode || attemptId}`);
    }
  }, [isSubmitting, attemptId, attempt?.resultCode, router]);

  const handleManualSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowSubmitModal(false);

    try {
      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAutoSubmitted: false }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      const resultCode = data.resultCode || attempt?.resultCode || attemptId;
      router.replace(`/results/${resultCode}`);
    } catch (err) {
      console.error('Manual submit failed:', err);
      router.replace(`/results/${attempt?.resultCode || attemptId}`);
    }
  }, [isSubmitting, attemptId, attempt?.resultCode, router]);

  // 3. Global Countdown Timer Effect
  useEffect(() => {
    if (
      !quiz ||
      quiz.durationMode !== 'global' ||
      typeof quiz.globalDuration !== 'number' ||
      !attemptStartTimeRef.current ||
      isRedirecting ||
      isSubmitting
    ) {
      return;
    }

    const calculateRemaining = () => {
      const elapsed = Math.floor((Date.now() - new Date(attemptStartTimeRef.current!).getTime()) / 1000);
      return (quiz.globalDuration as number) - elapsed;
    };

    const interval = setInterval(() => {
      const rem = calculateRemaining();
      setRemainingSeconds(rem);

      if (rem <= 0 && !hasAutoSubmittedRef.current && !isSubmitting) {
        hasAutoSubmittedRef.current = true;
        clearInterval(interval);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz, isRedirecting, isSubmitting, handleAutoSubmit]);

  const autoSubmitQuiz = handleAutoSubmit;

  // 3b. Per-Question Countdown Timer Effect
  const handleQuestionTimeout = useCallback(async (currentQ: Question, currentIndex: number) => {
    setQuestionTimeoutBanner(`Time's up for Question ${currentIndex + 1}! Advancing to next question...`);
    setTimeout(() => {
      setQuestionTimeoutBanner(prev => (prev?.includes(`Question ${currentIndex + 1}`) ? null : prev));
    }, 4000);

    const currentAns = answers[currentQ.id];
    const hasAns = !!currentAns?.selectedOptionId || (!!currentAns?.answerText && currentAns.answerText.trim() !== '');

    try {
      if (hasAns) {
        await fetch(`/api/attempts/${attemptId}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: currentQ.id,
            selectedOptionId: currentAns.selectedOptionId,
            answerText: currentAns.answerText,
            status: 'answered',
          }),
        });
      } else {
        setAnswers(prev => ({
          ...prev,
          [currentQ.id]: {
            ...prev[currentQ.id],
            status: 'timed_out',
          },
        }));
        await fetch(`/api/attempts/${attemptId}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: currentQ.id,
            status: 'timed_out',
          }),
        });
      }
    } catch (err) {
      console.error('Error saving timed out answer:', err);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      autoSubmitQuiz();
    }
  }, [answers, attemptId, questions.length, autoSubmitQuiz]);

  useEffect(() => {
    if (
      !quiz ||
      quiz.durationMode !== 'per_question' ||
      !questions.length ||
      isRedirecting ||
      isSubmitting
    ) {
      return;
    }

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ || typeof currentQ.duration !== 'number' || currentQ.duration <= 0) {
      setTimeout(() => setRemainingSeconds(null), 0);
      return;
    }

    let isMounted = true;
    let timerInterval: NodeJS.Timeout | null = null;

    const startQuestionTimer = async () => {
      try {
        const res = await fetch(`/api/attempts/${attemptId}/question-start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: currentQ.id }),
        });
        if (!res.ok || !isMounted) return;
        const data = (await res.json()) as any;
        if (!data || !data.questionStartedAt || !isMounted) return;

        const startedAt = new Date(data.questionStartedAt).getTime();
        const durationSecs = typeof currentQ.duration === 'number' ? currentQ.duration : (data.duration || 0);

        const calcRemaining = () => {
          const elapsed = Math.floor((Date.now() - startedAt) / 1000);
          return Math.max(0, durationSecs - elapsed);
        };

        const initialRem = calcRemaining();
        setRemainingSeconds(initialRem);

        if (initialRem <= 0 && !hasTimedOutQuestionRef.current[currentQ.id] && !isSubmitting) {
          hasTimedOutQuestionRef.current[currentQ.id] = true;
          handleQuestionTimeout(currentQ, currentQuestionIndex);
          return;
        }

        timerInterval = setInterval(() => {
          if (!isMounted) return;
          const rem = calcRemaining();
          setRemainingSeconds(rem);

          if (rem <= 0 && !hasTimedOutQuestionRef.current[currentQ.id] && !isSubmitting) {
            hasTimedOutQuestionRef.current[currentQ.id] = true;
            if (timerInterval) clearInterval(timerInterval);
            handleQuestionTimeout(currentQ, currentQuestionIndex);
          }
        }, 1000);
      } catch (err) {
        console.error('Error starting question timer:', err);
      }
    };

    startQuestionTimer();

    return () => {
      isMounted = false;
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [currentQuestionIndex, quiz, questions, attemptId, isRedirecting, isSubmitting, handleQuestionTimeout]);

  // 4. Answer Evaluation & Handlers
  const isQuestionAnswered = (qId: string, qType?: string): boolean => {
    const ans = answers[qId];
    if (!ans) return false;
    if (qType === 'multiple_choice') {
      return !!ans.selectedOptionId;
    }
    if (qType === 'true_false') {
      return (
        ans.answerText?.toLowerCase() === 'true' ||
        ans.answerText?.toLowerCase() === 'false' ||
        !!ans.selectedOptionId
      );
    }
    if (qType === 'essay') {
      return !!ans.answerText && ans.answerText.trim().length > 0;
    }
    return !!ans.selectedOptionId || (!!ans.answerText && ans.answerText.trim().length > 0);
  };

  const handleSelectOption = async (questionId: string, optionId: string) => {
    if (isSubmitting || (remainingSeconds !== null && remainingSeconds <= 0) || hasTimedOutQuestionRef.current[questionId]) return;

    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedOptionId: optionId,
        status: 'answered',
      },
    }));

    try {
      await fetch(`/api/attempts/${attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          selectedOptionId: optionId,
        }),
      });
    } catch (err) {
      console.error('Error saving multiple choice answer:', err);
    }
  };

  const handleSelectTrueFalse = async (questionId: string, val: 'true' | 'false') => {
    if (isSubmitting || (remainingSeconds !== null && remainingSeconds <= 0) || hasTimedOutQuestionRef.current[questionId]) return;

    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answerText: val,
        status: 'answered',
      },
    }));

    try {
      await fetch(`/api/attempts/${attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          answerText: val,
        }),
      });
    } catch (err) {
      console.error('Error saving true/false answer:', err);
    }
  };

  const handleEssayChange = (questionId: string, val: string) => {
    if (isSubmitting || (remainingSeconds !== null && remainingSeconds <= 0) || hasTimedOutQuestionRef.current[questionId]) return;

    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answerText: val,
        status: val.trim() ? 'answered' : 'viewing',
      },
    }));

    setSavingStatus(prev => ({ ...prev, [questionId]: 'saving' }));

    if (essayTimeoutRef.current[questionId]) {
      clearTimeout(essayTimeoutRef.current[questionId]);
    }

    essayTimeoutRef.current[questionId] = setTimeout(() => {
      saveEssayAnswer(questionId, val);
    }, 1000);
  };

  const handleEssayBlur = (questionId: string, val: string) => {
    if (essayTimeoutRef.current[questionId]) {
      clearTimeout(essayTimeoutRef.current[questionId]);
      delete essayTimeoutRef.current[questionId];
      saveEssayAnswer(questionId, val);
    }
  };

  const saveEssayAnswer = async (questionId: string, val: string) => {
    setSavingStatus(prev => ({ ...prev, [questionId]: 'saving' }));
    try {
      const res = await fetch(`/api/attempts/${attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          answerText: val,
        }),
      });
      if (res.ok) {
        setSavingStatus(prev => ({ ...prev, [questionId]: 'saved' }));
        setTimeout(() => {
          setSavingStatus(prev => (prev[questionId] === 'saved' ? { ...prev, [questionId]: 'idle' } : prev));
        }, 3000);
      } else {
        setSavingStatus(prev => ({ ...prev, [questionId]: 'error' }));
      }
    } catch (err) {
      console.error('Error saving essay answer:', err);
      setSavingStatus(prev => ({ ...prev, [questionId]: 'error' }));
    }
  };

  const handleNavigateQuestion = (index: number) => {
    if (quiz?.durationMode === 'per_question') return;
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextQuestion = async () => {
    if (quiz?.durationMode === 'per_question') {
      const currentQ = questions[currentQuestionIndex];
      if (currentQ) {
        const ans = answers[currentQ.id];
        const hasAns = !!ans?.selectedOptionId || (!!ans?.answerText && ans.answerText.trim() !== '');
        if (!hasAns && ans?.status !== 'timed_out') {
          setAnswers(prev => ({
            ...prev,
            [currentQ.id]: { ...prev[currentQ.id], status: 'timed_out' }
          }));
          try {
            await fetch(`/api/attempts/${attemptId}/answer`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                questionId: currentQ.id,
                status: 'timed_out',
              }),
            });
          } catch (err) {
            console.error('Error saving skipped question status:', err);
          }
        }
      }
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatTime = (secs: number): string => {
    if (secs < 0) secs = 0;
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const minStr = mins < 10 ? `0${mins}` : `${mins}`;
    const secStr = s < 10 ? `0${s}` : `${s}`;
    if (hrs > 0) {
      return `${hrs}:${minStr}:${secStr}`;
    }
    return `${minStr}:${secStr}`;
  };

  // 5. Render Loading & Error & Redirect States
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 animate-fade-in">
        <div className="spinner" style={{ width: '56px', height: '56px', borderWidth: '4px' }}></div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '1.5rem', color: 'var(--text-primary)' }}>
          {isRedirecting ? 'Redirecting to Assessment Results...' : 'Preparing Live Assessment Environment...'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '400px' }}>
          {isRedirecting
            ? 'Your assessment has been submitted. Please wait while we load your scorecard.'
            : 'Synchronizing questions, security timers, and answer sheets.'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
        <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Assessment Unavailable
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
            {error}
          </p>
          <Link href="/" className="btn btn-primary btn-block btn-lg">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Current Question Details
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = questions.filter(q => isQuestionAnswered(q.id, q.type)).length;
  const totalCount = questions.length;
  const progressPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
  const unansweredCount = totalCount - answeredCount;

  // Determine Timer styling classes
  let timerClass = 'timer-normal';
  if (remainingSeconds !== null) {
    if (remainingSeconds <= 10) {
      timerClass = 'timer-pulse-red';
    } else if (remainingSeconds <= 60) {
      timerClass = 'timer-warning-amber';
    }
  }

  return (
    <div className="min-h-screen flex flex-col animate-fade-in" style={{ background: 'var(--bg-primary)' }}>
      {/* Custom CSS for Engine & Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.04); }
        }
        .timer-pulse-red {
          animation: pulse 1s infinite !important;
          color: #e12727 !important;
          background: rgba(239, 68, 68, 0.25) !important;
          border: 1px solid rgba(239, 68, 68, 0.6) !important;
          box-shadow: 0 0 25px rgba(239, 68, 68, 0.5) !important;
        }
        .timer-warning-amber {
          color: #fde047 !important;
          background: rgba(245, 158, 11, 0.2) !important;
          border: 1px solid rgba(245, 158, 11, 0.5) !important;
          box-shadow: 0 0 18px rgba(245, 158, 11, 0.3) !important;
        }
        .timer-normal {
          color: #93c5fd;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.15);
        }
        .quiz-workspace-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 2rem;
          margin-top: 2rem;
          margin-bottom: 4rem;
          align-items: start;
        }
        .quiz-workspace-grid.single-col {
          grid-template-columns: minmax(0, 850px);
          justify-content: center;
        }
        @media (max-width: 900px) {
          .quiz-workspace-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
            margin-top: 1rem;
            margin-bottom: 2rem;
          }
          .nav-grid-card {
            position: relative !important;
            top: auto !important;
          }
        }
        .nav-grid-card {
          position: sticky;
          top: 60px;
          z-index: 30;
        }
        .question-nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 40px;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
          user-select: none;
          border: 1px solid var(--border);
        }
        @media (max-width: 640px) {
          .question-nav-btn {
            height: 34px;
            font-size: 0.8rem;
          }
        }
        .question-nav-btn:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .question-nav-btn.active {
          background: var(--accent-gradient);
          color: #ffffff;
          border: 2px solid #ffffff;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.6);
          transform: scale(1.06);
          z-index: 2;
        }
        .question-nav-btn.answered:not(.active) {
          background: rgba(34, 197, 94, 0.18);
          color: #43c372;
          border-color: rgba(34, 197, 94, 0.4);
        }
        .question-nav-btn.unanswered:not(.active) {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-secondary);
        }
        /* Controls bar mobile */
        .controls-bar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        /* Bottom nav buttons */
        .nav-btn-prev, .nav-btn-next {
          padding: 0.5rem 1.1rem;
          font-size: 0.88rem;
          font-weight: 700;
        }
        @media (max-width: 640px) {
          .controls-bar-inner {
            gap: 0.4rem;
          }
          .controls-title { font-size: 0.95rem !important; }
          .controls-meta  { font-size: 0.72rem !important; }
          .controls-timer { font-size: 0.82rem !important; padding: 0.3rem 0.7rem !important; }
          .controls-submit { font-size: 0.8rem !important; padding: 0.4rem 0.9rem !important; box-shadow: 2px 2px 0px #111827 !important; }
          .nav-btn-prev, .nav-btn-next { padding: 0.4rem 0.85rem !important; font-size: 0.8rem !important; }
        }
      `}} />

      {/* Sticky Top Timer & Controls Bar */}
      <QuizHeaderTimer
        quizTitle={quiz?.title || 'Live Assessment'}
        studentName={studentName}
        attemptNumber={attempt?.attemptNumber || 1}
        remainingSeconds={remainingSeconds}
        durationMode={quiz?.durationMode}
        currentQuestionIndex={currentQuestionIndex}
        timerClass={timerClass}
        questionTimeoutBanner={questionTimeoutBanner}
        formatTime={formatTime}
        isSubmitting={isSubmitting}
        onSubmitClick={() => setShowSubmitModal(true)}
      />

      {/* Main Workspace (2-Column Responsive Layout) */}
      <main className="container flex-1">
        {questions.length === 0 ? (
          <div className="empty-state animate-fade-in" style={{ marginTop: '3rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              No Questions Found
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
              This assessment currently contains no active questions. Please contact your instructor or institution administrator.
            </p>
            <Link href="/" className="btn btn-secondary btn-lg">
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <div className={`quiz-workspace-grid ${quiz?.durationMode === 'per_question' ? 'single-col' : ''}`}>
            {/* Left Column (or Top Drawer on mobile): Question Navigation Grid */}
            <QuizSidebarNav
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              durationMode={quiz?.durationMode}
              answeredCount={answeredCount}
              totalCount={totalCount}
              progressPct={progressPct}
              isQuestionAnswered={isQuestionAnswered}
              onNavigateQuestion={handleNavigateQuestion}
            />

            {/* Right Column: Current Question Display Card */}
            <QuizQuestionDisplay
              currentQuestion={currentQuestion}
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              answers={answers}
              savingStatus={savingStatus}
              durationMode={quiz?.durationMode}
              onSelectOption={handleSelectOption}
              onSelectTrueFalse={handleSelectTrueFalse}
              onEssayChange={handleEssayChange}
              onEssayBlur={handleEssayBlur}
              onPrevQuestion={() => handleNavigateQuestion(currentQuestionIndex - 1)}
              onNextQuestion={handleNextQuestion}
              onReviewSubmit={() => setShowSubmitModal(true)}
            />
          </div>
        )}
      </main>

      {/* Submit Confirmation Modals */}
      <QuizSubmitConfirmModal
        showSubmitModal={showSubmitModal}
        showAutoSubmitModal={showAutoSubmitModal}
        totalCount={totalCount}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        isSubmitting={isSubmitting}
        onKeepWorking={() => setShowSubmitModal(false)}
        onConfirmSubmit={handleManualSubmit}
      />
    </div>
  );
}
