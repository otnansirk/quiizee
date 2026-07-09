'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { EditQuizHeaderBanner } from '@/components/features/quizzes/EditQuizHeaderBanner';
import { EditQuizSettingsForm } from '@/components/features/quizzes/EditQuizSettingsForm';

export default function EditQuizPage() {
  const params = useParams();
  const quizId = params?.quizId as string;
  const router = useRouter();

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [accessMode, setAccessMode] = useState<'public' | 'private'>('public');
  const [durationMode, setDurationMode] = useState<'global' | 'per_question'>('global');
  const [globalDurationMinutes, setGlobalDurationMinutes] = useState<number | string>(30);
  const [maxAttempts, setMaxAttempts] = useState<number | string>(1);
  const [certificateEnabled, setCertificateEnabled] = useState<boolean>(false);
  const [certificateMinScore, setCertificateMinScore] = useState<number | string>(70);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [questionsCount, setQuestionsCount] = useState<number>(0);

  // Action States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) return;

    const fetchQuiz = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/quizzes/${quizId}`);
        if (!res.ok) {
          throw new Error('Failed to load quiz details or quiz not found.');
        }
        const data = await res.json();
        const q = data.quiz || data.data || data;

        setTitle(q.title || '');
        setDescription(q.description || '');
        setAccessCode(q.accessCode || '');
        setAccessMode(q.accessMode || 'public');
        setDurationMode(q.durationMode || 'global');
        setGlobalDurationMinutes(q.globalDuration ? Math.round(q.globalDuration / 60) : 30);
        setMaxAttempts(q.maxAttempts || 1);
        setCertificateEnabled(q.certificateEnabled || false);
        setCertificateMinScore(q.certificateMinScore || 70);
        setIsPublished(Boolean(q.isPublished));
        setQuestionsCount(q.questionsCount ?? (Array.isArray(q.questions) ? q.questions.length : 0));
      } catch (err: any) {
        setFetchError(err.message || 'Could not fetch quiz data.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleTogglePublish = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isPublished && questionsCount === 0) {
      setErrorMsg('Cannot publish quiz: You must add at least 1 question before publishing!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsPublishing(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || `Failed to ${isPublished ? 'unpublish' : 'publish'} quiz.`);
      }

      setIsPublished(!isPublished);
      setSuccessMsg(`Quiz has been successfully ${!isPublished ? 'published' : 'unpublished'}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle publication status.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter a quiz title.');
      return;
    }

    if (durationMode === 'global' && (!globalDurationMinutes || Number(globalDurationMinutes) <= 0)) {
      setErrorMsg('Please specify a valid global duration in minutes (greater than 0).');
      return;
    }

    if (certificateEnabled && (!certificateMinScore || Number(certificateMinScore) < 1 || Number(certificateMinScore) > 100)) {
      setErrorMsg('Please enter a valid minimum passing score percentage between 1% and 100%.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      accessMode,
      durationMode,
      globalDuration: durationMode === 'global' ? Math.round(Number(globalDurationMinutes) * 60) : null,
      maxAttempts: Math.max(1, Number(maxAttempts) || 1),
      certificateEnabled,
      certificateMinScore: certificateEnabled ? Math.min(100, Math.max(1, Number(certificateMinScore) || 70)) : null,
      isPublished,
    };

    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Failed to save quiz changes.');
      }

      router.push('/teacher/quizzes');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save quiz changes.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center animate-fade-in" style={{ padding: '5rem 0' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
          Loading quiz configuration...
        </p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="card animate-fade-in text-center" style={{ maxWidth: '600px', margin: '4rem auto', padding: '3rem 2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Failed to Load Quiz</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{fetchError}</p>
        <Link href="/teacher/quizzes" className="btn btn-primary">
          Return to My Quizzes
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <EditQuizHeaderBanner
        quizId={quizId}
        questionsCount={questionsCount}
        isPublished={isPublished}
        isPublishing={isPublishing}
        isSubmitting={isSubmitting}
        errorMsg={errorMsg}
        successMsg={successMsg}
        onClearError={() => setErrorMsg(null)}
        onClearSuccess={() => setSuccessMsg(null)}
        onTogglePublish={handleTogglePublish}
      />

      <EditQuizSettingsForm
        accessCode={accessCode}
        title={title}
        description={description}
        durationMode={durationMode}
        globalDurationMinutes={globalDurationMinutes}
        maxAttempts={maxAttempts}
        certificateEnabled={certificateEnabled}
        certificateMinScore={certificateMinScore}
        isSubmitting={isSubmitting}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onDurationModeChange={setDurationMode}
        onGlobalDurationChange={setGlobalDurationMinutes}
        onMaxAttemptsChange={setMaxAttempts}
        onCertificateEnabledChange={setCertificateEnabled}
        onCertificateMinScoreChange={setCertificateMinScore}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
