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
        background: "#ffffff",
      }}
    >
      {/* Top Header / Logo & Back Link */}
      <header className="w-full max-w-md flex items-center justify-between" style={{ marginBottom: "2.5rem", paddingBottom: "1rem", borderBottom: "2px solid #111827" }}>
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              color: "#fff",
              fontSize: "1.1rem",
              boxShadow: "3px 3px 0px #2563eb",
            }}
          >
            Q
          </div>
          <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.04em" }}>
            QUIIZEE <span style={{ fontSize: "0.85rem", background: "#111827", color: "#fff", padding: "0.15rem 0.4rem", borderRadius: "4px", verticalAlign: "middle" }}>&apos;26</span>
          </span>
        </Link>

        <Link
          href="/"
          className="btn btn-ghost btn-sm"
          style={{ fontSize: "0.85rem", color: "#111827", fontWeight: 800 }}
        >
          Back
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md flex-1 flex flex-col justify-center animate-fade-in" style={{ margin: "auto 0" }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: "3rem", textAlign: "center", color: "#4b5563", fontSize: "0.85rem", fontWeight: 700 }}>
        <p>© {new Date().getFullYear()} QUIIZEE &apos;26 • CREATOR &amp; INSTRUCTOR PORTAL</p>
      </footer>
    </div>
  );
}
