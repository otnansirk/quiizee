"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function JoinQuizForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accessCode, setAccessCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill access code if ?code=... is present in URL
  useEffect(() => {
    const codeParam = searchParams?.get("code");
    if (codeParam) {
      setAccessCode(codeParam.toUpperCase());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!accessCode.trim()) {
      setError("Please enter an access code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/quizzes/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessCode: accessCode.trim().toUpperCase(),
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || (!data.success && !data.attemptId && !data.id && !data.attempt?.id)) {
        // Handle specific status codes or error messages cleanly
        if (res.status === 401) {
          setError("This is a private classroom assessment. Please log in with your authorized student account first.");
        } else if (res.status === 403) {
          setError(data.message || data.error || "You have reached the maximum number of attempts allowed for this assessment.");
        } else if (res.status === 404) {
          setError(data.message || data.error || "Invalid access code. We couldn't find an assessment with that code.");
        } else {
          setError(data.message || data.error || "Failed to join assessment. Please check your details and try again.");
        }
        setLoading(false);
        return;
      }

      // Success! Extract attemptId and redirect immediately
      const attemptId = data.attemptId || data.attempt?.id || data.id;
      if (attemptId) {
        router.push(`/quiz/${attemptId}`);
      } else {
        setError("Assessment joined, but session ID was not returned. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error joining quiz:", err);
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="card card-hover" style={{ padding: "2.5rem", position: "relative" }}>
      {/* Decorative Glow Corner */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "120px",
          height: "120px",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      <form onSubmit={handleSubmit}>
        {/* Error Alert Box */}
        {error && (
          <div className="alert alert-error animate-fade-in" role="alert" style={{ marginBottom: "1.75rem" }}>
            <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1, fontWeight: 500 }}>{error}</div>
          </div>
        )}

        {/* Access Code Input */}
        <div className="form-group">
          <label className="label" htmlFor="accessCode" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Access Code <span style={{ color: "var(--error)" }}>*</span></span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "normal" }}>Required</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="accessCode"
              type="text"
              required
              disabled={loading}
              className="input"
              placeholder="e.g. QUIZ-X8Y2Z1"
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value.toUpperCase());
                if (error) setError("");
              }}
              style={{
                fontFamily: "monospace, var(--font-inter)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 700,
                fontSize: "1.1rem",
                paddingLeft: "2.75rem",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--accent-hover)",
                fontSize: "1.1rem",
                pointerEvents: "none",
              }}
            >
              🔑
            </span>
          </div>
        </div>

        {/* Name Input */}
        <div className="form-group">
          <label className="label" htmlFor="name" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Your Full Name <span style={{ color: "var(--error)" }}>*</span></span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "normal" }}>Required for public assessments</span>
          </label>
          <input
            id="name"
            type="text"
            required
            disabled={loading}
            className="input"
            placeholder="e.g. Alex Rivera"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
          />
        </div>

        {/* Email Input */}
        <div className="form-group" style={{ marginBottom: "2rem" }}>
          <label className="label" htmlFor="email" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Email Address <span style={{ color: "var(--error)" }}>*</span></span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "normal" }}>We'll send your result code here</span>
          </label>
          <input
            id="email"
            type="email"
            required
            disabled={loading}
            className="input"
            placeholder="e.g. alex.rivera@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !accessCode.trim() || !name.trim() || !email.trim()}
          className="btn btn-primary btn-block btn-lg"
          style={{
            position: "relative",
            overflow: "hidden",
            fontWeight: 700,
            letterSpacing: "0.02em",
            boxShadow: "0 6px 20px rgba(99, 102, 241, 0.4)",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span
                style={{
                  width: "18px",
                  height: "18px",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Joining Assessment Room...
            </span>
          ) : (
            <span>Start Assessment ➔</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default function JoinQuizPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: "var(--bg-primary)" }}>
      {/* Top Navigation */}
      <header style={{ padding: "1.5rem 0", borderBottom: "1px solid var(--border)", background: "rgba(10, 10, 15, 0.8)", backdropFilter: "blur(12px)" }}>
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
            <span style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              Mini<span className="text-gradient">LMS</span>
            </span>
          </Link>
          <Link href="/" className="btn btn-ghost btn-sm" style={{ color: "var(--text-secondary)" }}>
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container animate-fade-in" style={{ padding: "4rem 1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto" }}>
          <div className="text-center" style={{ marginBottom: "2.5rem" }}>
            <div className="badge badge-accent" style={{ marginBottom: "1rem" }}>
              🚀 Live Assessment Room
            </div>
            <h1 className="title" style={{ fontSize: "2.75rem", marginBottom: "0.75rem" }}>
              Join Assessment
            </h1>
            <p className="subtitle" style={{ margin: "0 auto", maxWidth: "450px" }}>
              Enter your access code to begin your quiz session. Prepare your environment and good luck!
            </p>
          </div>

          <Suspense
            fallback={
              <div className="card text-center" style={{ padding: "4rem 2rem" }}>
                <div className="spinner" />
                <p style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>Loading assessment portal...</p>
              </div>
            }
          >
            <JoinQuizForm />
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: "2rem 0", borderTop: "1px solid var(--border)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
        <div className="container">
          <p>© {new Date().getFullYear()} Mini LMS. Engineered for seamless interactive assessments.</p>
        </div>
      </footer>
    </div>
  );
}
