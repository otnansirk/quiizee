'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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
        const res = await fetch(`/api/attempts/${attemptId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || errData.message || 'Failed to load assessment session. Please verify your access.');
        }

        const rawData = await res.json();
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
      const data = await res.json().catch(() => ({}));
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
      const data = await res.json().catch(() => ({}));
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
        const data = await res.json();
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
          grid-template-columns: 320px 1fr;
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
            gap: 1.5rem;
          }
          .nav-grid-card {
            position: relative !important;
            top: auto !important;
          }
        }
        .nav-grid-card {
          position: sticky;
          top: 95px;
          z-index: 30;
        }
        .question-nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 48px;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
          user-select: none;
          border: 1px solid var(--border);
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
          color: #86efac;
          border-color: rgba(34, 197, 94, 0.4);
        }
        .question-nav-btn.unanswered:not(.active) {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-secondary);
        }
      `}} />

      {/* Sticky Top Timer & Header Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#ffffff',
          borderBottom: '2px solid #111827',
          padding: '1rem 0',
        }}
      >
        <div className="container flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          {/* Left: Quiz Title & Student Name */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1
              style={{
                fontSize: '1.35rem',
                fontWeight: 900,
                color: '#111827',
                letterSpacing: '-0.02em',
                lineHeight: '1.2',
              }}
            >
              {quiz?.title || 'Live Assessment'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 700 }}>
                Candidate: <strong style={{ color: '#111827', fontWeight: 900 }}>{studentName}</strong>
              </span>
              <span style={{ color: '#111827', fontWeight: 900 }}>|</span>
              <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 700 }}>
                Attempt #{attempt?.attemptNumber || 1}
              </span>
            </div>
          </div>

          {/* Center/Right: Live Countdown Timer Display */}
          {remainingSeconds !== null && (
            <div
              className={`badge ${timerClass}`}
              style={{
                fontSize: '1.05rem',
                padding: '0.5rem 1.25rem',
                margin: 0,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'monospace',
                fontWeight: 900,
                letterSpacing: '0.05em',
                border: '2px solid #111827',
                boxShadow: '2px 2px 0px #111827',
                transition: 'all 0.3s ease',
              }}
            >
              {quiz?.durationMode === 'per_question' ? (
                <span>Q{currentQuestionIndex + 1} Timer: {formatTime(remainingSeconds)} remaining</span>
              ) : (
                <span>{formatTime(remainingSeconds)} remaining</span>
              )}
            </div>
          )}

          {/* Right: Submit Quiz Button */}
          <div>
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                padding: '0.65rem 1.5rem',
                boxShadow: '4px 4px 0px #111827',
                border: '2px solid #111827',
                fontWeight: 900,
              }}
            >
              Submit Quiz
            </button>
          </div>
        </div>
      </header>

      {/* Question Timeout Banner */}
      {questionTimeoutBanner && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: 'rgba(239, 68, 68, 0.95)',
            color: '#ffffff',
            padding: '0.85rem 1.75rem',
            borderRadius: 'var(--radius-full)',
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.5)',
            fontWeight: 800,
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            border: '2px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <span>{questionTimeoutBanner}</span>
        </div>
      )}

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
            {/* Left Column (or Top Drawer on mobile): Question Navigation Grid - Only show for Global Timer */}
            {quiz?.durationMode !== 'per_question' && (
              <aside className="nav-grid-card">
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Question Navigation
                    </h3>
                    <span className="badge badge-accent" style={{ margin: 0, fontSize: '0.75rem' }}>
                      {questions.length} Qs
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                    Click any number to jump directly to that question.
                  </p>

                  {/* Grid of Numbered Buttons */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: '0.6rem',
                    }}
                  >
                    {questions.map((q, idx) => {
                      const isActive = idx === currentQuestionIndex;
                      const isAnswered = isQuestionAnswered(q.id, q.type);
                      let btnClass = 'unanswered';
                      if (isActive) btnClass = 'active';
                      else if (isAnswered) btnClass = 'answered';

                      return (
                        <button
                          key={q.id}
                          onClick={() => handleNavigateQuestion(idx)}
                          className={`question-nav-btn ${btnClass}`}
                          title={`Question ${idx + 1} (${q.type.replace('_', ' ')}) - ${isAnswered ? 'Answered' : 'Unanswered'}`}
                        >
                          <span>{idx + 1}</span>
                          {isAnswered && !isActive && (
                            <span
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#22c55e',
                                boxShadow: '0 0 6px #22c55e',
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Summary Counter & Progress Bar */}
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: '0.6rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Completion</span>
                      <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                        {answeredCount} / {totalCount} answered
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPct}%`,
                          height: '100%',
                          background: 'var(--accent-gradient)',
                          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          borderRadius: 'var(--radius-full)',
                          boxShadow: '0 0 12px rgba(99, 102, 241, 0.6)',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '1rem',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#86efac' }}>
                        Answered
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                        Unanswered
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#818cf8' }}>
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {/* Right Column: Current Question Display Card */}
            <div className="card animate-fade-in" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
              {/* Header: Question X of Y | Type Badge | Points Badge */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  paddingBottom: '1.25rem',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: '1.75rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Question {currentQuestionIndex + 1}{' '}
                  </span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    of {questions.length}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                  <span className="badge badge-info" style={{ margin: 0 }}>
                    {currentQuestion.type === 'multiple_choice'
                      ? 'Multiple Choice'
                      : currentQuestion.type === 'true_false'
                      ? 'True or False'
                      : 'Essay'}
                  </span>
                  <span className="badge badge-accent" style={{ margin: 0, fontWeight: 800 }}>
                    {currentQuestion.points} pt{currentQuestion.points === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <h2
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: '1.6',
                  marginBottom: '1.75rem',
                }}
              >
                {currentQuestion.questionText}
              </h2>

              {/* Question Image Preview */}
              {currentQuestion.questionImage && (
                <div
                  style={{
                    marginBottom: '2rem',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    maxHeight: '420px',
                    display: 'flex',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '1rem',
                  }}
                >
                  <img
                    src={currentQuestion.questionImage}
                    alt={`Question ${currentQuestionIndex + 1} Figure`}
                    style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
              )}

              {/* Interactive Answer Inputs */}
              <div style={{ flex: 1, marginBottom: '2.5rem' }}>
                {/* 1. Multiple Choice */}
                {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {currentQuestion.options.map((option, idx) => {
                      const isSelected = answers[currentQuestion.id]?.selectedOptionId === option.id;
                      const letter = String.fromCharCode(65 + idx); // A, B, C, D...

                      return (
                        <div
                          key={option.id}
                          onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                          className={`choice-card ${isSelected ? 'selected' : ''}`}
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '1.25rem',
                            padding: '1.25rem 1.5rem',
                            borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                            background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(20, 20, 32, 0.6)',
                            boxShadow: isSelected ? '0 0 25px rgba(99, 102, 241, 0.25)' : undefined,
                          }}
                        >
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '1.05rem',
                              background: isSelected ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.08)',
                              color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                              border: isSelected ? 'none' : '1px solid var(--border)',
                              flexShrink: 0,
                              transition: 'all var(--transition-fast)',
                            }}
                          >
                            {letter}
                          </div>
                          <div
                            style={{
                              flex: 1,
                              fontSize: '1.08rem',
                              color: isSelected ? '#ffffff' : 'var(--text-primary)',
                              lineHeight: '1.5',
                              fontWeight: isSelected ? 600 : 400,
                            }}
                          >
                            {option.optionText}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. True / False */}
                {currentQuestion.type === 'true_false' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {/* True Card */}
                    {(() => {
                      const currentVal = answers[currentQuestion.id]?.answerText?.toLowerCase();
                      const isTrueSelected = currentVal === 'true';
                      const isFalseSelected = currentVal === 'false';

                      return (
                        <>
                          <div
                            onClick={() => handleSelectTrueFalse(currentQuestion.id, 'true')}
                            className={`choice-card ${isTrueSelected ? 'selected' : ''}`}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2.5rem 1.5rem',
                              textAlign: 'center',
                              gap: '0.85rem',
                              borderColor: isTrueSelected ? 'var(--success)' : 'var(--border)',
                              background: isTrueSelected ? 'rgba(34, 197, 94, 0.16)' : 'rgba(20, 20, 32, 0.6)',
                              boxShadow: isTrueSelected ? '0 0 30px rgba(34, 197, 94, 0.25)' : undefined,
                            }}
                          >
                            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: isTrueSelected ? '#86efac' : 'var(--text-primary)' }}>
                              True
                            </div>
                          </div>

                          <div
                            onClick={() => handleSelectTrueFalse(currentQuestion.id, 'false')}
                            className={`choice-card ${isFalseSelected ? 'selected' : ''}`}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2.5rem 1.5rem',
                              textAlign: 'center',
                              gap: '0.85rem',
                              borderColor: isFalseSelected ? 'var(--error)' : 'var(--border)',
                              background: isFalseSelected ? 'rgba(239, 68, 68, 0.16)' : 'rgba(20, 20, 32, 0.6)',
                              boxShadow: isFalseSelected ? '0 0 30px rgba(239, 68, 68, 0.25)' : undefined,
                            }}
                          >
                            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: isFalseSelected ? '#e12727' : 'var(--text-primary)' }}>
                              False
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* 3. Essay */}
                {currentQuestion.type === 'essay' && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <textarea
                      rows={7}
                      placeholder="Type your comprehensive answer here..."
                      value={answers[currentQuestion.id]?.answerText || ''}
                      onChange={e => handleEssayChange(currentQuestion.id, e.target.value)}
                      onBlur={e => handleEssayBlur(currentQuestion.id, e.target.value)}
                      className="input"
                      style={{
                        width: '100%',
                        padding: '1.25rem',
                        fontSize: '1.05rem',
                        lineHeight: '1.6',
                        background: 'rgba(10, 10, 15, 0.7)',
                        resize: 'vertical',
                        minHeight: '180px',
                        borderRadius: 'var(--radius-lg)',
                      }}
                    />
                    {/* Saving Status Indicator */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        marginTop: '0.75rem',
                        minHeight: '1.5rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      {savingStatus[currentQuestion.id] === 'saving' && (
                        <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          Saving response...
                        </span>
                      )}
                      {savingStatus[currentQuestion.id] === 'saved' && (
                        <span style={{ color: '#86efac', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          Saved securely
                        </span>
                      )}
                      {savingStatus[currentQuestion.id] === 'error' && (
                        <span style={{ color: '#e12727', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          Error saving. Will retry on next edit.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Navigation Footer inside Card */}
              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: '1.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                {quiz?.durationMode !== 'per_question' ? (
                  <button
                    onClick={() => handleNavigateQuestion(currentQuestionIndex - 1)}
                    disabled={currentQuestionIndex === 0}
                    className="btn btn-secondary"
                    style={{ padding: '0.75rem 1.75rem', fontWeight: 700 }}
                  >
                    Previous
                  </button>
                ) : <div />}

                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Question <strong style={{ color: 'var(--text-primary)' }}>{currentQuestionIndex + 1}</strong> of{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{questions.length}</strong>
                </div>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNextQuestion}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 2rem', fontWeight: 700 }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="btn btn-primary"
                    style={{
                      padding: '0.75rem 2rem',
                      fontWeight: 800,
                      background: 'var(--accent-gradient)',
                      boxShadow: '0 0 25px rgba(168, 85, 247, 0.5)',
                    }}
                  >
                    Review & Submit
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Submit Confirmation Modal Overlay */}
      {showSubmitModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            className="card animate-fade-in"
            style={{
              maxWidth: '540px',
              width: '100%',
              textAlign: 'center',
              padding: '2.75rem 2rem',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              boxShadow: '0 0 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(99, 102, 241, 0.25)',
            }}
          >
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Submit Assessment?
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.05rem' }}>
              You are about to finalize and submit your responses for scoring.
            </p>

            {/* Scorecard Summary Stats */}
            <div
              style={{
                background: 'rgba(20, 20, 32, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                marginBottom: '1.75rem',
                display: 'flex',
                justifyContent: 'space-around',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Questions
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {totalCount}
                </div>
              </div>
              <div style={{ width: '1px', background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: '0.8rem', color: '#86efac', fontWeight: 600, textTransform: 'uppercase' }}>
                  Answered
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#86efac', marginTop: '0.2rem' }}>
                  {answeredCount}
                </div>
              </div>
              <div style={{ width: '1px', background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: '0.8rem', color: unansweredCount > 0 ? '#fde047' : 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Unanswered
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: unansweredCount > 0 ? '#fde047' : 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {unansweredCount}
                </div>
              </div>
            </div>

            {/* Amber Warning or Emerald Success */}
            {unansweredCount > 0 ? (
              <div
                className="alert"
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#fde047',
                  textAlign: 'left',
                  marginBottom: '2rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Incomplete Assessment Warning</strong>
                  <span>
                    You have <strong>{unansweredCount} unanswered question{unansweredCount === 1 ? '' : 's'}</strong>! Any unanswered items will be automatically scored as 0 points.
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="alert"
                style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  color: '#86efac',
                  textAlign: 'left',
                  marginBottom: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <span>
                  <strong>All Set!</strong> You have provided an answer for every question in this assessment.
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="btn btn-secondary btn-lg"
                style={{ flex: 1, minWidth: '160px', justifyContent: 'center' }}
              >
                Keep Working
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="btn btn-primary btn-lg"
                style={{
                  flex: 1,
                  minWidth: '200px',
                  justifyContent: 'center',
                  boxShadow: '0 0 25px rgba(99, 102, 241, 0.5)',
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Submission Modal Overlay */}
      {showAutoSubmitModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            className="card animate-fade-in"
            style={{
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
              padding: '3rem 2rem',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              boxShadow: '0 0 50px rgba(239, 68, 68, 0.3)',
            }}
          >
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Time&apos;s Up!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: '1.6' }}>
              Your allocated time has expired. Submitting your assessment automatically...
            </p>
            <div className="spinner" style={{ width: '42px', height: '42px', margin: '0 auto' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
