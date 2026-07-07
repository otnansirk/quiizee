import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col justify-between items-center relative"
      style={{
        padding: "2rem 1rem",
        background: "radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15) 0%, rgba(10, 10, 15, 1) 70%)",
      }}
    >
      {/* Top Header / Logo & Back Link */}
      <header className="w-full max-w-md flex items-center justify-between" style={{ marginBottom: "2rem" }}>
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              color: "#fff",
              fontSize: "1rem",
              boxShadow: "0 0 10px rgba(99, 102, 241, 0.4)",
            }}
          >
            M
          </div>
          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Mini<span className="text-gradient">LMS</span>
          </span>
        </Link>

        <Link
          href="/"
          className="btn btn-ghost btn-sm"
          style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}
        >
          ← Back to Home
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md flex-1 flex flex-col justify-center animate-fade-in" style={{ margin: "auto 0" }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: "3rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
        <p>Protected by Mini LMS Security • Teacher & Instructor Access</p>
      </footer>
    </div>
  );
}
