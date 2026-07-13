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
    <main className="container mx-auto px-6 py-16 flex-1 flex flex-col justify-center items-center">
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
      <div className="cards-layout grid gap-4 md:gap-12 grid-template-columns: 1fr">
        {/* Card 1: Join Assessment */}
        <div className="editorial-card p-6 md:p-10">
          <div>
            <h2 className="!text-xl md:!text-2xl card-title">Live Assessment Room</h2>
            <p className="card-desc !mb-1 !text-sm md:!text-base">
              Have an access code from your instructor? Enter your room
              instantly without account registration.
            </p>
          </div>
          <div className="mt-6">
            <Link href="/quiz/join" className="editorial-btn-blue px-8 py-3 text-sm rounded-sm md:rounded-lg md:text-base md:py-4">
              Join Quiz Room
            </Link>
          </div>
        </div>

        {/* Divider: Round OR Badge */}
        <div className="text-center">
          <span className="divider-badge">OR</span>
        </div>

        {/* Card 2: Verify Grade */}
        <div className="editorial-card p-6 md:p-10">
          <div>
            <h2 className="!text-xl md:!text-2xl card-title">Verify Your Grade</h2>
            <p className="card-desc !mb-1 !text-sm md:!text-base">
              Enter your unique result code below to verify scores, review
              feedback, and view certificates.
            </p>
          </div>
          <form
            onSubmit={onSubmitCheckResults}
            className="flex flex-col gap-4 mt-4"
          >
            <div>
              <input
                type="text"
                className="editorial-input px-8 py-3 text-sm rounded-sm md:rounded-lg md:text-base md:py-4"
                placeholder="e.g. RES-A7X9K2"
                value={resultCode}
                onChange={(e) => onResultCodeChange(e.target.value)}
              />
              {error && (
                <span className="text-error text-xs mt-1.5 block font-bold">
                  {error}
                </span>
              )}
            </div>
            <button
              type="submit"
              className="editorial-btn-black px-8 py-3 text-sm rounded-sm md:rounded-lg md:text-base md:py-4"
            >
              Check Results
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};
