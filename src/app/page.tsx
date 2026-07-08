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
    <div className="editorial-landing-wrapper min-h-screen flex flex-col justify-between animate-fade-in">
      {/* Custom Scoped Editorial CSS - Side-by-Side Responsive Layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        .editorial-landing-wrapper {
          background: #ffffff;
          color: #111827;
          font-family: var(--font-inter), sans-serif;
          overflow-x: hidden;
        }
        .editorial-header {
          padding: 1.25rem 0;
          border-bottom: 2px solid #111827;
          background: #ffffff;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .editorial-logo {
          font-size: 1.4rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          color: #111827;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .editorial-logo-badge {
          background: #111827;
          color: #ffffff;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          font-size: 0.9rem;
        }
        .editorial-btn-black {
          background: #111827;
          color: #ffffff;
          padding: 0.7rem 1.5rem;
          border-radius: 50px;
          font-weight: 800;
          font-size: 0.9rem;
          text-decoration: none;
          transition: transform 0.2s, background 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #111827;
          cursor: pointer;
          width: 100%;
        }
        .editorial-btn-black:hover {
          background: #374151;
          transform: translateY(-2px);
        }
        .editorial-btn-blue {
          background: #2563eb;
          color: #ffffff;
          padding: 0.9rem 1.75rem;
          border-radius: 50px;
          font-weight: 800;
          font-size: 1.05rem;
          text-decoration: none;
          transition: transform 0.2s, background 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #111827;
          box-shadow: 4px 4px 0px #111827;
          cursor: pointer;
          width: 100%;
        }
        .editorial-btn-blue:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 6px 6px 0px #111827;
        }
        /* Top Hero Graphic Typography */
        .chunky-title-container {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-bottom: 1rem;
          position: relative;
        }
        .chunky-letter {
          font-size: 12vw;
          max-font-size: 7.5rem;
          font-weight: 900;
          color: #111827;
          line-height: 0.9;
          text-transform: uppercase;
          display: inline-block;
          user-select: none;
        }
        @media (min-width: 900px) {
          .chunky-letter { font-size: 7.5rem; }
        }
        .chunky-letter:nth-child(1) { transform: rotate(-6deg) translateY(-5px); }
        .chunky-letter:nth-child(2) { transform: rotate(4deg) translateY(8px); }
        .chunky-letter:nth-child(3) { transform: rotate(-3deg) scale(1.05); }
        .chunky-letter:nth-child(4) { transform: rotate(7deg) translateY(-8px); }
        .chunky-letter:nth-child(5) { transform: rotate(-5deg) translateY(5px); }
        .chunky-letter:nth-child(6) { transform: rotate(3deg); }
        .chunky-letter:nth-child(7) { transform: rotate(-7deg) translateY(-4px); }
        .year-badge {
          font-size: 2rem;
          font-weight: 900;
          color: #9ca3af;
          position: absolute;
          top: -15px;
          right: 5%;
          transform: rotate(14deg);
        }
        .hero-subtitle {
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 0.25em;
          color: #4b5563;
          text-transform: uppercase;
          text-align: center;
          margin-bottom: 4rem;
        }
        /* Side-by-Side Responsive Grid */
        .cards-layout {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 2.5rem;
          align-items: center;
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
        }
        @media (max-width: 850px) {
          .cards-layout {
            grid-template-columns: 1fr;
            gap: 1.75rem;
          }
        }
        /* Simple Editorial Cards */
        .editorial-card {
          background: #ffffff;
          border: 3px solid #111827;
          border-radius: 24px;
          box-shadow: 8px 8px 0px #111827;
          padding: 2.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
          text-align: left;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .editorial-card:hover {
          transform: translateY(-4px);
          box-shadow: 12px 12px 0px #111827;
        }
        .card-tag {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-weight: 900;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #ffffff;
          margin-bottom: 1rem;
          border: 2px solid #111827;
          width: fit-content;
        }
        .tag-blue { background: #2563eb; }
        .tag-mint { background: #059669; }
        
        .card-title {
          font-size: 1.65rem;
          font-weight: 900;
          color: #111827;
          margin-bottom: 0.5rem;
        }
        .card-desc {
          font-size: 0.95rem;
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        .editorial-input {
          width: 100%;
          padding: 0.85rem 1.2rem;
          border-radius: 14px;
          background: #f9fafb;
          border: 2px solid #111827;
          color: #111827;
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          outline: none;
          transition: background 0.2s;
        }
        .editorial-input:focus {
          background: #ffffff;
          box-shadow: 4px 4px 0px #111827;
        }
        .editorial-input::placeholder {
          text-transform: none;
          letter-spacing: normal;
          color: #9ca3af;
          font-weight: 600;
        }
        .divider-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #f3f4f6;
          border: 2px solid #111827;
          color: #4b5563;
          font-weight: 900;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          box-shadow: 3px 3px 0px #111827;
          margin: 0 auto;
        }
      `}} />

      {/* Top Header */}
      <header className="editorial-header">
        <div className="container flex items-center justify-between">
          <Link href="/" className="editorial-logo">
            <span>QUIIZEE</span>
            <span className="editorial-logo-badge">&apos;26</span>
          </Link>
          <Link href="/login" className="editorial-btn-black" style={{ width: "auto", padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}>
            Creator Portal →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container" style={{ padding: "4rem 1.5rem 6rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        {/* Playful Chunky Graphic Typography */}
        <div className="chunky-title-container">
          <span className="chunky-letter">Q</span>
          <span className="chunky-letter">U</span>
          <span className="chunky-letter">I</span>
          <span className="chunky-letter">I</span>
          <span className="chunky-letter">Z</span>
          <span className="chunky-letter">E</span>
          <span className="chunky-letter">E</span>
          <span className="year-badge">&apos;26</span>
        </div>

        <div className="hero-subtitle">
          INTERACTIVE ASSESSMENT &amp; GRADING PLATFORM
        </div>

        {/* Side-by-Side on Desktop, Stacked on Mobile Grid */}
        <div className="cards-layout">
          {/* Card 1: Join Assessment */}
          <div className="editorial-card">
            <div>
              <h2 className="card-title">Live Assessment Room</h2>
              <p className="card-desc">
                Have an access code from your instructor? Enter your room instantly without account registration.
              </p>
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/quiz/join" className="editorial-btn-blue">
                Join Quiz Room →
              </Link>
            </div>
          </div>

          {/* Divider: Round OR Badge */}
          <div className="text-center">
            <span className="divider-badge">OR</span>
          </div>

          {/* Card 2: Verify Grade */}
          <div className="editorial-card">
            <div>
              <h2 className="card-title">Verify Your Grade</h2>
              <p className="card-desc">
                Enter your unique result code below to verify scores, review feedback, and view certificates.
              </p>
            </div>
            <form onSubmit={handleCheckResults} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
              <div>
                <input
                  type="text"
                  className="editorial-input"
                  placeholder="e.g. RES-A7X9K2"
                  value={resultCode}
                  onChange={(e) => {
                    setResultCode(e.target.value);
                    if (error) setError("");
                  }}
                />
                {error && <span style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: "0.4rem", display: "block", fontWeight: 700 }}>{error}</span>}
              </div>
              <button
                type="submit"
                className="editorial-btn-black"
                style={{
                  background: "#059669",
                  borderColor: "#111827",
                  boxShadow: "4px 4px 0px #111827",
                  padding: "0.9rem"
                }}
              >
                Check Results →
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: "2.5rem 0", borderTop: "2px solid #111827", background: "#ffffff", color: "#4b5563", textAlign: "center", fontSize: "0.85rem", fontWeight: 700 }}>
        <div className="container">
          <p>© {new Date().getFullYear()} QUIIZEE &apos;26. ENGINEERED FOR INSTRUCTIONAL EXCELLENCE.</p>
        </div>
      </footer>
    </div>
  );
}
