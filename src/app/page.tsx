"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [resultCode, setResultCode] = useState("");
  const [error, setError] = useState("");

  const handleCheckResults = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultCode.trim()) {
      setError("Please enter a result code");
      return;
    }
    setError("");
    router.push(`/results/${encodeURIComponent(resultCode.trim().toUpperCase())}`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Navigation */}
      <header style={{ padding: "1.5rem 0", borderBottom: "1px solid var(--border)" }}>
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
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
            <span style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Mini<span className="text-gradient">LMS</span>
            </span>
          </div>
          <Link href="/login" className="btn btn-ghost btn-sm">
            Teacher Portal →
          </Link>
        </div>
      </header>

      {/* Hero & Main Content */}
      <main className="container animate-fade-in" style={{ padding: "4rem 1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="text-center" style={{ marginBottom: "3.5rem" }}>
          <div className="badge badge-accent">✨ Next-Generation Learning & Quizzes</div>
          <h1 className="title">
            Master Assessments with <br />
            <span className="text-gradient">Mini LMS</span>
          </h1>
          <p className="subtitle">
            Experience seamless interactive quiz taking, instant result verification, and comprehensive instructor analytics in a beautifully crafted dark workspace.
          </p>
        </div>

        {/* 3 Interactive Options Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "2rem",
            maxWidth: "1100px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Card 1: Join Quiz */}
          <div className="card card-hover flex flex-col justify-between" style={{ padding: "2.5rem" }}>
            <div>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.5rem",
                  color: "var(--accent-hover)",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </div>
              <h2 className="card-title" style={{ fontSize: "1.5rem" }}>Join Quiz</h2>
              <p className="card-description" style={{ marginBottom: "2rem" }}>
                For students and participants ready to take a live assessment or practice exam. Enter your session and start testing immediately.
              </p>
            </div>
            <Link href="/quiz/join" className="btn btn-primary btn-block">
              Enter Quiz Room →
            </Link>
          </div>

          {/* Card 2: View Results */}
          <div className="card card-hover flex flex-col justify-between" style={{ padding: "2.5rem" }}>
            <div>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "rgba(34, 197, 94, 0.15)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.5rem",
                  color: "#86efac",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="card-title" style={{ fontSize: "1.5rem" }}>View Results</h2>
              <p className="card-description" style={{ marginBottom: "1.5rem" }}>
                Enter your unique result code to check your grades, review correct answers, and read instructor feedback.
              </p>
            </div>
            <form onSubmit={handleCheckResults} className="flex flex-col gap-2">
              <div>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. RES-A7X9K2"
                  value={resultCode}
                  onChange={(e) => {
                    setResultCode(e.target.value);
                    if (error) setError("");
                  }}
                  style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}
                />
                {error && <span style={{ color: "var(--error)", fontSize: "0.8rem", marginTop: "0.3rem", display: "block" }}>{error}</span>}
              </div>
              <button type="submit" className="btn btn-secondary btn-block" style={{ marginTop: "0.5rem" }}>
                Check Results →
              </button>
            </form>
          </div>

          {/* Card 3: Teacher Portal */}
          <div className="card card-hover flex flex-col justify-between" style={{ padding: "2.5rem" }}>
            <div>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.5rem",
                  color: "#fcd34d",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <h2 className="card-title" style={{ fontSize: "1.5rem" }}>Teacher Portal</h2>
              <p className="card-description" style={{ marginBottom: "2rem" }}>
                For instructors and administrators. Sign in to create quizzes, grade essay responses, and monitor student performance.
              </p>
            </div>
            <Link href="/login" className="btn btn-secondary btn-block" style={{ border: "1px solid rgba(245, 158, 11, 0.3)" }}>
              Instructor Login →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: "2rem 0", borderTop: "1px solid var(--border)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
        <div className="container">
          <p>© {new Date().getFullYear()} Mini LMS. Engineered for excellence.</p>
        </div>
      </footer>
    </div>
  );
}
