"use client";

import React from "react";
import Link from "next/link";

export interface EditorialHeroCardsProps {
  resultCode: string;
  error: string;
  onResultCodeChange: (val: string) => void;
  onSubmitCheckResults: (e: React.FormEvent) => void;
}

export const EditorialHeroCards: React.FC<EditorialHeroCardsProps> = ({
  resultCode,
  error,
  onResultCodeChange,
  onSubmitCheckResults,
}) => {
  return (
    <main
      className="container"
      style={{
        padding: "4rem 1.5rem 6rem",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
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
              Have an access code from your instructor? Enter your room
              instantly without account registration.
            </p>
          </div>
          <div style={{ marginTop: "1.5rem" }}>
            <Link href="/quiz/join" className="editorial-btn-blue">
              Join Quiz Room
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
              Enter your unique result code below to verify scores, review
              feedback, and view certificates.
            </p>
          </div>
          <form
            onSubmit={onSubmitCheckResults}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            <div>
              <input
                type="text"
                className="editorial-input"
                placeholder="e.g. RES-A7X9K2"
                value={resultCode}
                onChange={(e) => onResultCodeChange(e.target.value)}
              />
              {error && (
                <span
                  style={{
                    color: "#dc2626",
                    fontSize: "0.8rem",
                    marginTop: "0.4rem",
                    display: "block",
                    fontWeight: 700,
                  }}
                >
                  {error}
                </span>
              )}
            </div>
            <button
              type="submit"
              className="editorial-btn-black"
              style={{
                background: "#059669",
                borderColor: "#111827",
                boxShadow: "4px 4px 0px #111827",
                padding: "0.9rem",
              }}
            >
              Check Results
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};
