"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams?.get("registered") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
      } else {
        router.push("/teacher/quizzes");
        router.refresh();
      }
    } catch {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="card !p-6 md:!p-11">
      <div className="card-header text-center" style={{ marginBottom: "2rem" }}>
        <h1 className="card-title">
          Teacher Login
        </h1>
        <p className="card-description">
          Sign in to manage your quizzes and assessments
        </p>
      </div>

      {isRegistered && (
        <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Account created successfully! Please sign in below.</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="form-group">
          <label htmlFor="email" className="label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="instructor@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
          style={{ padding: "0.875rem" }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign In to Portal"
          )}
        </button>
      </form>

      <div style={{ fontSize: "0.9rem", marginTop: "2rem", textAlign: "center", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
        <p style={{ color: "var(--text-secondary)" }}>
          Don&apos;t have a teacher account?{" "}
        </p>
          <Link href="/register" style={{ color: "var(--accent-hover)", fontWeight: 600, textDecoration: "none" }}>
            Register here
          </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="card text-center" style={{ padding: "2.5rem" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading login portal...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
