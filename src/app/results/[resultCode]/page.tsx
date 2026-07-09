"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/organisms/PublicHeader";
import { AppFooter } from "@/components/organisms/AppFooter";
import { Spinner } from "@/components/atoms/Spinner";
import { BackLink } from "@/components/molecules/BackLink";
import { ResultTopBanner } from "@/components/features/results/ResultTopBanner";
import { ResultScoreCard } from "@/components/features/results/ResultScoreCard";
import { ResultQuestionItem } from "@/components/features/results/ResultQuestionItem";

// Robust TypeScript interfaces for flexible backend schema matching
interface Option {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface QuestionReview {
  id: string;
  questionNumber?: number;
  text: string;
  type: "multiple_choice" | "true_false" | "essay";
  points: number;
  imageUrl?: string | null;
  options?: Option[];
  correctAnswer?: string | boolean | null;
}

interface StudentAnswerReview {
  id: string;
  questionId: string;
  selectedOptionId?: string | null;
  answerText?: string | null;
  isCorrect?: boolean | null;
  score?: number | string | null;
  feedback?: string | null;
  status?: "viewing" | "answered" | "timed_out";
}

interface QuizResultData {
  attempt: {
    id: string;
    resultCode: string;
    attemptNumber: number;
    startTime: string;
    endTime?: string | null;
    totalScore?: number | string | null;
    maxScore: number | string;
    status: "in_progress" | "submitted" | "graded";
    isAutoSubmitted?: boolean;
    user?: { name: string; email?: string };
    participant?: { name: string; email?: string };
    studentAnswers?: StudentAnswerReview[];
  };
  quiz: {
    id: string;
    title: string;
    description?: string | null;
    accessCode: string;
    maxAttempts?: number;
    certificateEnabled?: boolean;
    certificateMinScore?: number | null;
  };
  student?: {
    name: string;
    email?: string;
  };
  questions: QuestionReview[];
  answers?: StudentAnswerReview[];
  certificateAvailable?: boolean;
  status?: "in_progress" | "submitted" | "graded";
  totalScore?: number | string | null;
  maxScore?: number | string;
}

export default function QuizResultPage() {
  const params = useParams();
  const router = useRouter();

  const resultCodeParam = typeof params?.resultCode === "string" 
    ? params.resultCode 
    : Array.isArray(params?.resultCode) ? params.resultCode[0] : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<QuizResultData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!resultCodeParam) {
      setError(true);
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await fetch(`/api/results/${encodeURIComponent(resultCodeParam)}`);
        
        if (!res.ok) {
          setError(true);
          setLoading(false);
          return;
        }

        const resultJson = await res.json();
        setData(resultJson);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching quiz result:", err);
        setError(true);
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultCodeParam]);

  const handleCopyCode = () => {
    if (!data?.attempt?.resultCode && !resultCodeParam) return;
    const codeToCopy = data?.attempt?.resultCode || resultCodeParam;
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Helper to find answer for a specific question
  const getAnswerForQuestion = (questionId: string): StudentAnswerReview | undefined => {
    if (!data) return undefined;
    if (data.answers && Array.isArray(data.answers)) {
      const found = data.answers.find((a) => a.questionId === questionId);
      if (found) return found;
    }
    if (data.attempt?.studentAnswers && Array.isArray(data.attempt.studentAnswers)) {
      const found = data.attempt.studentAnswers.find((a) => a.questionId === questionId);
      if (found) return found;
    }
    return undefined;
  };

  // Loading Spinner View
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between" style={{ background: "#ffffff", color: "#111827" }}>
        <PublicHeader size="md" sticky={false} style={{ padding: "1.25rem 0" }} />

        <main className="container flex-1 flex flex-col items-center justify-center text-center animate-fade-in" style={{ padding: "4rem 1.5rem" }}>
          <Spinner size={36} style={{ marginBottom: "1.5rem" }} />
          <h2 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#111827", marginBottom: "0.5rem" }}>
            Retrieving Score Report
          </h2>
          <p style={{ color: "#4b5563", maxWidth: "400px", fontWeight: 600 }}>
            Please wait while we verify your attempt and compile your comprehensive assessment breakdown...
          </p>
        </main>

        <AppFooter />
      </div>
    );
  }

  // Error / 404 Not Found View
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col justify-between" style={{ background: "#ffffff", color: "#111827" }}>
        <PublicHeader size="md" sticky={false} style={{ padding: "1.25rem 0" }} />

        <main className="container flex-1 flex flex-col items-center justify-center animate-fade-in" style={{ padding: "4rem 1.5rem" }}>
          <div className="card text-center" style={{ maxWidth: "500px", width: "100%", padding: "3rem 2.5rem", borderColor: "#111827", boxShadow: "8px 8px 0px #111827" }}>
            <h1 className="card-title" style={{ fontSize: "1.75rem", marginBottom: "0.75rem", fontWeight: 900 }}>
              Result Not Found
            </h1>
            <p className="card-description" style={{ marginBottom: "2.5rem", color: "#4b5563", fontSize: "1rem", fontWeight: 600 }}>
              Result not found. Please check your Result Code (<code style={{ color: "#111827", fontWeight: 800 }}>{resultCodeParam}</code>) and try again.
            </p>
            <BackLink href="/" label="Back to Home" variant="editorial" style={{ width: "100%" }} />
          </div>
        </main>

        <AppFooter />
      </div>
    );
  }

  // Extract variables safely with fallback support
  const studentName =
    data.student?.name ||
    data.attempt?.user?.name ||
    data.attempt?.participant?.name ||
    "Student";

  const quizTitle = data.quiz?.title || "Assessment Report";
  const status = data.attempt?.status || data.status || "submitted";
  const resultCode = data.attempt?.resultCode || resultCodeParam;
  
  const totalScoreVal = data.attempt?.totalScore !== undefined ? data.attempt?.totalScore : data.totalScore;
  const maxScoreVal = data.attempt?.maxScore !== undefined ? data.attempt?.maxScore : (data.maxScore || 100);

  const numTotalScore = totalScoreVal !== null && totalScoreVal !== undefined ? Number(totalScoreVal) : null;
  const numMaxScore = Number(maxScoreVal) || 100;
  
  const percentage = numTotalScore !== null ? Math.round((numTotalScore / numMaxScore) * 100) : null;

  const isCertificateAvailable = data.certificateAvailable !== undefined
    ? data.certificateAvailable
    : (data.quiz?.certificateEnabled && status === "graded" && percentage !== null && percentage >= (data.quiz?.certificateMinScore || 70));

  const maxAttempts = data.quiz?.maxAttempts || 1;

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: "#ffffff", color: "#111827" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 640px) {
          .results-main { padding: 0.65rem 0.65rem !important; }
          .results-banner-card { padding: 0.75rem !important; margin-bottom: 0.65rem !important; border: 2px solid #000; }
          .results-quiz-title { font-size: 1rem !important; margin-bottom: 0.2rem !important; }
          .results-score-card { padding: 0.75rem !important; }
          .results-score-num { font-size: 1.9rem !important; }
          .results-score-den { font-size: 0.95rem !important; }
          .results-cert-card { padding: 0.75rem !important; }
          .results-cert-title { font-size: 1.05rem !important; margin-bottom: 0.3rem !important; }
          .results-q-card { padding: 0.7rem !important; }
          .results-q-text { font-size: 0.9rem !important; margin-bottom: 0.5rem !important; }
          .results-section-title { font-size: 1.05rem !important; margin-bottom: 0.15rem !important; }
          .results-footer-card { padding: 0.75rem !important; }
        }
        @media (max-width: 400px) {
          .results-quiz-title { font-size: 0.92rem !important; }
          .results-score-num { font-size: 1.6rem !important; }
          .results-q-card { padding: 0.55rem !important; }
        }
      `}} />
      {/* Top Navigation */}
      <PublicHeader size="sm" backToHome={true} />

      {/* Main Results Dashboard */}
      <main className="container animate-fade-in results-main" style={{ padding: "clamp(0.5rem, 3vw, 2.5rem) clamp(0.75rem, 3vw, 1.25rem)", flex: 1 }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          
          {/* Top Celebratory Banner / Header */}
          <ResultTopBanner
            quizTitle={quizTitle}
            studentName={studentName}
            status={status}
            resultCode={resultCode}
            copied={copied}
            onCopyCode={handleCopyCode}
          />

          {/* Score Summary Card & Certificate Banner Grid */}
          <ResultScoreCard
            numTotalScore={numTotalScore}
            numMaxScore={numMaxScore}
            percentage={percentage}
            isCertificateAvailable={Boolean(isCertificateAvailable)}
            resultCode={resultCode}
            status={status}
          />

          {/* Detailed Question Breakdown Section */}
          <div style={{ marginBottom: "0.85rem" }}>
            <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: "0.65rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
              <div>
                <h2 className="title results-section-title" style={{ fontSize: "clamp(1rem, 3.5vw, 1.6rem)", marginBottom: "0.15rem" }}>
                  {data.questions?.length || 0} Question Review
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  Breakdown of each question, your answers, and correct solutions.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {data.questions?.map((q, idx) => {
                const ans = getAnswerForQuestion(q.id);
                return (
                  <ResultQuestionItem
                    key={q.id || idx}
                    question={q}
                    answer={ans}
                    index={idx}
                  />
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className="card flex items-center justify-between flex-wrap gap-3 results-footer-card"
            style={{
              padding: "clamp(0.75rem, 2.5vw, 1.5rem)",
              background: "rgba(20, 20, 32, 0.8)",
            }}
          >
            <div style={{ flex: "1 1 220px", minWidth: 0, color: "#FFF" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.2rem" }}>
                Ready for your next step?
              </h3>
              <p style={{ fontSize: "0.825rem", color: "#ffffffa8", margin: 0 }}>
                Return to the main portal or attempt this assessment again if retakes are permitted.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <BackLink href="/" label="Back to Home" variant="secondary" style={{ padding: "0.5rem 1.1rem", fontWeight: 600, fontSize: "0.88rem" }} />

              {maxAttempts > 1 && (
                <Link
                  href={`/quiz/join?code=${encodeURIComponent(data.quiz?.accessCode || "")}`}
                  className="btn btn-primary"
                  style={{ padding: "0.5rem 1.1rem", fontWeight: 700, fontSize: "0.88rem", boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)" }}
                >
                  Retake Quiz
                </Link>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <AppFooter padding="1.25rem 0" style={{ fontSize: "0.8rem" }} />
    </div>
  );
}
