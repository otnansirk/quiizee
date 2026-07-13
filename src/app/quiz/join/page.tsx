"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppFooter } from "@/components/organisms/AppFooter";
import { BackLink } from "@/components/molecules/BackLink";
import { Spinner } from "@/components/atoms/Spinner";

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

      const data = (await res.json()) as any;

      if (!res.ok || (!data.success && !data.attemptId && !data.id && !data.attempt?.id)) {
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
    <div className="card">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error animate-fade-in" role="alert" style={{ marginBottom: "1.75rem" }}>
            <div style={{ flex: 1, fontWeight: 700 }}>{error}</div>
          </div>
        )}

        {/* Access Code Input */}
        <div className="form-group">
          <label className="label" htmlFor="accessCode" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Access Code <span style={{ color: "#dc2626" }}>*</span></span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="accessCode"
              type="text"
              required
              disabled={loading}
              className="input"
              placeholder="e.g. X8Y2Z1"
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value.toUpperCase());
                if (error) setError("");
              }}
              style={{
                fontFamily: "monospace, var(--font-inter)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            />
          </div>
        </div>

        {/* Name Input */}
        <div className="form-group">
          <label className="label" htmlFor="name" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Your Full Name <span style={{ color: "#dc2626" }}>*</span></span>
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
            <span>Email Address <span style={{ color: "#dc2626" }}>*</span></span>
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
            fontWeight: 900,
            letterSpacing: "0.02em",
            boxShadow: "6px 6px 0px #111827",
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
            <span>Start Assessment</span>
          )}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <BackLink href="/" label="Back to Home" variant="ghost" style={{ color: "#111827", fontWeight: 800 }} />
      </div>
    </div>
  );
}

export default function JoinQuizPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: "#ffffff", color: "#111827" }}>

      {/* Main Content Area */}
      <main className="container animate-fade-in" style={{ padding: "4rem 1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto" }}>
          <div className="text-center" style={{ marginBottom: "2.5rem" }}>
            <div className="badge badge-accent" style={{ marginBottom: "1rem" }}>
              Live Assessment Room
            </div>
            <h1 className="title">
              Join Assessment
            </h1>
            <p className="text-sm md:text-base" style={{ margin: "0 auto", maxWidth: "450px" }}>
              Enter your access code to begin your quiz session. Prepare your environment and good luck!
            </p>
          </div>

          <Suspense
            fallback={
              <div className="card text-center" style={{ padding: "4rem 2rem" }}>
                <Spinner />
                <p style={{ color: "#4b5563", marginTop: "1rem", fontWeight: 700 }}>Loading assessment portal...</p>
              </div>
            }
          >
            <JoinQuizForm />
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <AppFooter padding=".5rem 0" />
    </div>
  );
}
