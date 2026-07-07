"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
      <div className="min-h-screen flex flex-col justify-between" style={{ background: "var(--bg-primary)" }}>
        <header style={{ padding: "1.5rem 0", borderBottom: "1px solid var(--border)", background: "rgba(10, 10, 15, 0.8)" }}>
          <div className="container flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "var(--accent-gradient)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "#fff",
                  fontSize: "1.2rem",
                  boxShadow: "0 0 15px rgba(99, 102, 241, 0.5)",
                }}
              >
                M
              </div>
              <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Mini<span className="text-gradient">LMS</span>
              </span>
            </Link>
          </div>
        </header>

        <main className="container flex-1 flex flex-col items-center justify-center text-center animate-fade-in" style={{ padding: "4rem 1.5rem" }}>
          <div className="spinner" style={{ marginBottom: "1.5rem", boxShadow: "0 0 25px rgba(99, 102, 241, 0.3)" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Retrieving Score Report
          </h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "400px" }}>
            Please wait while we verify your attempt and compile your comprehensive assessment breakdown...
          </p>
        </main>

        <footer style={{ padding: "2rem 0", borderTop: "1px solid var(--border)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          <div className="container">
            <p>© {new Date().getFullYear()} Mini LMS. Engineered for excellence.</p>
          </div>
        </footer>
      </div>
    );
  }

  // Error / 404 Not Found View
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col justify-between" style={{ background: "var(--bg-primary)" }}>
        <header style={{ padding: "1.5rem 0", borderBottom: "1px solid var(--border)", background: "rgba(10, 10, 15, 0.8)" }}>
          <div className="container flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "var(--accent-gradient)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "#fff",
                  fontSize: "1.2rem",
                }}
              >
                M
              </div>
              <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Mini<span className="text-gradient">LMS</span>
              </span>
            </Link>
          </div>
        </header>

        <main className="container flex-1 flex flex-col items-center justify-center animate-fade-in" style={{ padding: "4rem 1.5rem" }}>
          <div className="card text-center" style={{ maxWidth: "500px", width: "100%", padding: "3rem 2.5rem", borderColor: "rgba(239, 68, 68, 0.3)" }}>
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                margin: "0 auto 1.5rem",
                color: "#fca5a5",
                boxShadow: "0 0 25px rgba(239, 68, 68, 0.2)",
              }}
            >
              ⚠️
            </div>
            <h1 className="card-title" style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>
              Result Not Found
            </h1>
            <p className="card-description" style={{ marginBottom: "2.5rem", color: "var(--text-secondary)", fontSize: "1rem" }}>
              Result not found. Please check your Result Code (<code style={{ color: "var(--text-primary)", fontWeight: 600 }}>{resultCodeParam}</code>) and try again.
            </p>
            <Link href="/" className="btn btn-secondary btn-block btn-lg">
              ← Back to Home
            </Link>
          </div>
        </main>

        <footer style={{ padding: "2rem 0", borderTop: "1px solid var(--border)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          <div className="container">
            <p>© {new Date().getFullYear()} Mini LMS. Engineered for excellence.</p>
          </div>
        </footer>
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
    <div className="min-h-screen flex flex-col justify-between" style={{ background: "var(--bg-primary)" }}>
      {/* Top Navigation */}
      <header style={{ padding: "1.5rem 0", borderBottom: "1px solid var(--border)", background: "rgba(10, 10, 15, 0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div className="container flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                color: "#fff",
                fontSize: "1.2rem",
                boxShadow: "0 0 15px rgba(99, 102, 241, 0.5)",
              }}
            >
              M
            </div>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Mini<span className="text-gradient">LMS</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="btn btn-ghost btn-sm" style={{ color: "var(--text-secondary)" }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Results Dashboard */}
      <main className="container animate-fade-in" style={{ padding: "3rem 1.5rem", flex: 1 }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          
          {/* Top Celebratory Banner / Header */}
          <div className="card" style={{ padding: "2.5rem", marginBottom: "2rem", position: "relative", overflow: "hidden", border: "1px solid rgba(99, 102, 241, 0.25)" }}>
            {/* Background Glow */}
            <div
              style={{
                position: "absolute",
                top: "-40%",
                right: "-10%",
                width: "350px",
                height: "350px",
                background: "radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%)",
                borderRadius: "50%",
                filter: "blur(40px)",
                pointerEvents: "none",
              }}
            />

            <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: "1.5rem" }}>
              <div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>
                  Assessment Score Report
                </div>
                <h1 className="title" style={{ fontSize: "2.25rem", marginBottom: "0.5rem" }}>
                  {quizTitle}
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>👤 Student:</span> {studentName}
                </p>
              </div>

              {/* Status Badge */}
              <div style={{ alignSelf: "flex-start" }}>
                {status === "graded" ? (
                  <div
                    className="badge badge-success"
                    style={{
                      padding: "0.6rem 1.25rem",
                      fontSize: "0.875rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      boxShadow: "0 0 20px rgba(34, 197, 94, 0.25)",
                    }}
                  >
                    <span>🟢</span> Completed & Graded
                  </div>
                ) : (
                  <div
                    className="badge badge-warning"
                    style={{
                      padding: "0.6rem 1.25rem",
                      fontSize: "0.875rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      boxShadow: "0 0 20px rgba(245, 158, 11, 0.25)",
                    }}
                  >
                    <span>🟡</span> Waiting for Teacher Review
                  </div>
                )}
              </div>
            </div>

            {/* Note for Submitted / Pending Review */}
            {status === "submitted" && (
              <div
                style={{
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem 1.25rem",
                  marginBottom: "1.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  color: "#fde047",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>⏳</span>
                <div>
                  Your multiple choice questions have been auto-scored. Your final score will appear after your teacher reviews your essay responses.
                </div>
              </div>
            )}

            {/* Result Code Box */}
            <div
              style={{
                background: "rgba(10, 10, 15, 0.8)",
                border: "1px dashed rgba(99, 102, 241, 0.5)",
                borderRadius: "var(--radius-lg)",
                padding: "1.25rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    UNIQUE RESULT CODE:
                  </span>
                  <code
                    style={{
                      fontFamily: "monospace, var(--font-inter)",
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      color: "var(--accent-hover)",
                      letterSpacing: "0.1em",
                      background: "rgba(99, 102, 241, 0.15)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    {resultCode}
                  </code>
                </div>

                <button
                  onClick={handleCopyCode}
                  type="button"
                  className={`btn btn-sm ${copied ? "btn-primary" : "btn-secondary"}`}
                  style={{
                    minWidth: "160px",
                    transition: "all var(--transition-fast)",
                    fontWeight: 600,
                  }}
                >
                  {copied ? "✅ Copied!" : "📋 Copy Result Code"}
                </button>
              </div>

              <div style={{ fontSize: "0.825rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>⚠️</span>
                <span>
                  Save this unique code! You can use it anytime on the home page to revisit your detailed score report or download your certificate.
                </span>
              </div>
            </div>
          </div>

          {/* Score Summary Card & Certificate Banner Grid */}
          <div style={{ display: "grid", gridTemplateColumns: isCertificateAvailable ? "1fr 1fr" : "1fr", gap: "1.75rem", marginBottom: "2.5rem" }}>
            
            {/* Large Glowing Score Display */}
            <div
              className="card"
              style={{
                padding: "2.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                background: "linear-gradient(145deg, rgba(26, 26, 46, 0.8) 0%, rgba(20, 20, 36, 0.9) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3), 0 0 30px rgba(99, 102, 241, 0.15)",
              }}
            >
              <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
                Total Score Earned
              </div>

              {numTotalScore !== null ? (
                <div className="flex items-baseline justify-center gap-3" style={{ marginBottom: "0.75rem" }}>
                  <span
                    className="text-gradient"
                    style={{
                      fontSize: "4.5rem",
                      fontWeight: 900,
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                      filter: "drop-shadow(0 0 15px rgba(99, 102, 241, 0.4))",
                    }}
                  >
                    {numTotalScore}
                  </span>
                  <span style={{ fontSize: "2rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    / {numMaxScore}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: 800,
                    color: "#fde047",
                    marginBottom: "1rem",
                    textShadow: "0 0 20px rgba(245, 158, 11, 0.3)",
                  }}
                >
                  Pending Review
                </div>
              )}

              {percentage !== null ? (
                <div
                  className="badge badge-accent"
                  style={{
                    fontSize: "1rem",
                    padding: "0.4rem 1.2rem",
                    fontWeight: 700,
                    margin: 0,
                    background: percentage >= 70 ? "rgba(34, 197, 94, 0.15)" : "rgba(99, 102, 241, 0.15)",
                    color: percentage >= 70 ? "#86efac" : "var(--accent-hover)",
                    borderColor: percentage >= 70 ? "rgba(34, 197, 94, 0.4)" : "rgba(99, 102, 241, 0.4)",
                  }}
                >
                  {percentage}% Accuracy
                </div>
              ) : (
                <div className="badge badge-warning" style={{ margin: 0 }}>
                  Awaiting Essay Grading
                </div>
              )}
            </div>

            {/* Celebratory Certificate Banner */}
            {isCertificateAvailable && (
              <div
                className="card"
                style={{
                  padding: "2.5rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.25) 100%)",
                  border: "1px solid rgba(168, 85, 247, 0.4)",
                  boxShadow: "0 10px 35px rgba(168, 85, 247, 0.25), 0 0 25px rgba(99, 102, 241, 0.2)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem", animation: "pulseGlow 2.5s infinite" }}>
                  🎓
                </div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem", lineHeight: 1.3 }}>
                  Congratulations!
                </h2>
                <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "1.5rem", opacity: 0.9 }}>
                  You earned a Certificate of Completion for demonstrating mastery in this assessment!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    window.open(`/api/results/${encodeURIComponent(resultCode)}/certificate`, "_blank");
                  }}
                  className="btn btn-primary btn-block"
                  style={{
                    background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
                    boxShadow: "0 4px 15px rgba(168, 85, 247, 0.5)",
                    fontWeight: 700,
                  }}
                >
                  📥 Download PDF Certificate
                </button>
              </div>
            )}
          </div>

          {/* Detailed Question Breakdown Section */}
          <div style={{ marginBottom: "3rem" }}>
            <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
              <div>
                <h2 className="title" style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>
                  Question Review
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                  Detailed breakdown of each question, your submitted answers, and correct solutions.
                </p>
              </div>
              <div className="badge badge-accent" style={{ margin: 0 }}>
                {data.questions?.length || 0} Questions Total
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {data.questions?.map((q, idx) => {
                const ans = getAnswerForQuestion(q.id);
                const qNum = q.questionNumber || idx + 1;

                // Determine points earned styling
                const isAnsCorrect = ans?.isCorrect === true;
                const isAnsIncorrect = ans?.isCorrect === false;
                const isAnsPending = ans?.isCorrect === null || ans?.isCorrect === undefined || ans?.score === null || ans?.score === undefined;

                let ptsBadgeStyle = {
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                };
                let ptsText = `${ans?.score !== null && ans?.score !== undefined ? ans.score : "Pending"} / ${q.points} pts`;

                if (isAnsCorrect) {
                  ptsBadgeStyle = {
                    background: "rgba(34, 197, 94, 0.15)",
                    color: "#86efac",
                    border: "1px solid rgba(34, 197, 94, 0.4)",
                  };
                  ptsText = `${q.points} / ${q.points} pts`;
                } else if (isAnsIncorrect) {
                  ptsBadgeStyle = {
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "#fca5a5",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                  };
                  ptsText = `0 / ${q.points} pts`;
                } else if (q.type === "essay") {
                  ptsBadgeStyle = {
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "#fde047",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                  };
                }

                // Type label
                const typeLabel =
                  q.type === "multiple_choice"
                    ? "Multiple Choice"
                    : q.type === "true_false"
                    ? "True / False"
                    : "Essay Question";

                return (
                  <div
                    key={q.id || idx}
                    className="card"
                    style={{
                      padding: "2rem",
                      borderColor: isAnsCorrect
                        ? "rgba(34, 197, 94, 0.3)"
                        : isAnsIncorrect
                        ? "rgba(239, 68, 68, 0.3)"
                        : "var(--border)",
                      transition: "all var(--transition-normal)",
                    }}
                  >
                    {/* Question Header Bar */}
                    <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: "1.25rem" }}>
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border)",
                            padding: "0.3rem 0.8rem",
                            borderRadius: "var(--radius-md)",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          Question #{qNum}
                        </span>
                        <span className="badge" style={{ margin: 0, fontSize: "0.75rem", background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-hover)", border: "1px solid rgba(99, 102, 241, 0.25)" }}>
                          {typeLabel}
                        </span>
                      </div>

                      <div
                        className="badge"
                        style={{
                          margin: 0,
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          padding: "0.4rem 1rem",
                          ...ptsBadgeStyle,
                        }}
                      >
                        {ptsText}
                      </div>
                    </div>

                    {/* Question Text */}
                    <div style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                      {q.text}
                    </div>

                    {/* Image Preview if exists */}
                    {q.imageUrl && (
                      <div style={{ marginBottom: "1.5rem", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border)", maxWidth: "600px" }}>
                        <img src={q.imageUrl} alt={`Question ${qNum} illustration`} style={{ width: "100%", height: "auto", display: "block" }} />
                      </div>
                    )}

                    {/* Answer Renderers by Type */}
                    <div style={{ marginTop: "1rem" }}>
                      
                      {/* MULTIPLE CHOICE */}
                      {q.type === "multiple_choice" && q.options && (
                        <div className="flex flex-col gap-2.5">
                          {q.options.map((opt) => {
                            const isSelected = ans?.selectedOptionId === opt.id;
                            const isThisOptionCorrect = opt.isCorrect === true || q.correctAnswer === opt.id || q.correctAnswer === opt.text;

                            let optionBg = "rgba(20, 20, 32, 0.5)";
                            let optionBorder = "var(--border)";
                            let optionColor = "var(--text-secondary)";
                            let statusIcon = null;

                            if (isSelected && isThisOptionCorrect) {
                              optionBg = "rgba(34, 197, 94, 0.15)";
                              optionBorder = "rgba(34, 197, 94, 0.6)";
                              optionColor = "#86efac";
                              statusIcon = <span style={{ fontSize: "1.1rem", color: "#22c55e" }}>✅ Correct Choice</span>;
                            } else if (isSelected && !isThisOptionCorrect) {
                              optionBg = "rgba(239, 68, 68, 0.15)";
                              optionBorder = "rgba(239, 68, 68, 0.6)";
                              optionColor = "#fca5a5";
                              statusIcon = <span style={{ fontSize: "1.1rem", color: "#ef4444" }}>❌ Your Selection</span>;
                            } else if (!isSelected && isThisOptionCorrect) {
                              // Highlight actual correct option in green so they learn!
                              optionBg = "rgba(34, 197, 94, 0.08)";
                              optionBorder = "1px dashed rgba(34, 197, 94, 0.5)";
                              optionColor = "#86efac";
                              statusIcon = <span style={{ fontSize: "0.9rem", color: "#22c55e", fontWeight: 600 }}>✅ Correct Answer</span>;
                            }

                            return (
                              <div
                                key={opt.id}
                                style={{
                                  background: optionBg,
                                  border: `1px solid ${optionBorder}`,
                                  borderRadius: "var(--radius-md)",
                                  padding: "1rem 1.25rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "1rem",
                                  transition: "all var(--transition-fast)",
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    style={{
                                      width: "24px",
                                      height: "24px",
                                      borderRadius: "50%",
                                      border: `2px solid ${isSelected ? "currentColor" : "var(--border)"}`,
                                      background: isSelected ? "currentColor" : "transparent",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#fff",
                                      fontSize: "0.75rem",
                                      fontWeight: "bold",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {isSelected && "✓"}
                                  </div>
                                  <span style={{ color: optionColor, fontWeight: isSelected || isThisOptionCorrect ? 600 : 400, fontSize: "0.95rem" }}>
                                    {opt.text}
                                  </span>
                                </div>
                                {statusIcon && <div style={{ flexShrink: 0 }}>{statusIcon}</div>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* TRUE / FALSE */}
                      {q.type === "true_false" && (
                        <div
                          style={{
                            background: "rgba(20, 20, 32, 0.6)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            padding: "1.25rem 1.5rem",
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "1.5rem",
                          }}
                        >
                          <div>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "0.35rem" }}>
                              Your Submitted Answer
                            </span>
                            <div className="flex items-center gap-2" style={{ fontSize: "1.1rem", fontWeight: 700, color: isAnsCorrect ? "#86efac" : "#fca5a5" }}>
                              <span>{ans?.answerText ? ans.answerText.toString().toUpperCase() : "NO ANSWER"}</span>
                              <span>{isAnsCorrect ? "✅" : "❌"}</span>
                            </div>
                          </div>

                          <div>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "0.35rem" }}>
                              Correct Solution
                            </span>
                            <div className="flex items-center gap-2" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#86efac" }}>
                              <span>
                                {q.correctAnswer !== undefined && q.correctAnswer !== null
                                  ? q.correctAnswer.toString().toUpperCase()
                                  : "TRUE"}
                              </span>
                              <span>✅</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ESSAY QUESTION */}
                      {q.type === "essay" && (
                        <div className="flex flex-col gap-3">
                          <div
                            style={{
                              background: "rgba(10, 10, 15, 0.7)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-md)",
                              padding: "1.25rem 1.5rem",
                            }}
                          >
                            <div className="flex items-center justify-between gap-2" style={{ marginBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
                              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                                Your Written Response
                              </span>
                              {isAnsPending ? (
                                <span className="badge badge-warning" style={{ margin: 0, fontSize: "0.75rem" }}>
                                  📝 Pending Teacher Grading
                                </span>
                              ) : (
                                <span className="badge badge-success" style={{ margin: 0, fontSize: "0.75rem" }}>
                                  ✅ Graded by Instructor
                                </span>
                              )}
                            </div>
                            <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
                              {ans?.answerText || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No answer provided.</span>}
                            </p>
                          </div>

                          {/* Teacher Feedback Box if graded */}
                          {ans?.feedback && (
                            <div
                              style={{
                                background: "rgba(99, 102, 241, 0.1)",
                                border: "1px solid rgba(99, 102, 241, 0.3)",
                                borderRadius: "var(--radius-md)",
                                padding: "1.25rem 1.5rem",
                              }}
                            >
                              <div style={{ fontSize: "0.8rem", color: "var(--accent-hover)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <span>💬</span> Instructor Feedback & Comments:
                              </div>
                              <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>
                                {ans.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className="card flex items-center justify-between flex-wrap gap-4"
            style={{
              padding: "2rem",
              background: "rgba(20, 20, 32, 0.8)",
            }}
          >
            <div style={{ flex: "1 1 300px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                Ready for your next step?
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>
                Return to the main portal or attempt this assessment again if retakes are permitted.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/" className="btn btn-secondary" style={{ padding: "0.75rem 1.5rem", fontWeight: 600 }}>
                ← Back to Home
              </Link>

              {maxAttempts > 1 && (
                <Link
                  href={`/quiz/join?code=${encodeURIComponent(data.quiz?.accessCode || "")}`}
                  className="btn btn-primary"
                  style={{ padding: "0.75rem 1.75rem", fontWeight: 700, boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)" }}
                >
                  🔄 Retake Quiz
                </Link>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: "2rem 0", borderTop: "1px solid var(--border)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
        <div className="container">
          <p>© {new Date().getFullYear()} Mini LMS. Engineered for excellence in interactive assessments.</p>
        </div>
      </footer>
    </div>
  );
}
