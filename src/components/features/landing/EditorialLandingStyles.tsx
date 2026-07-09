"use client";

import React from "react";

export const EditorialLandingStyles: React.FC = () => {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #111827;
          color: #ffffff;
          padding: 0.9rem 1.75rem;
          border-radius: 12px;
          font-weight: 800;
          font-size: 1rem;
          text-decoration: none;
          border: 2px solid #111827;
          box-shadow: 4px 4px 0px #111827;
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
          cursor: pointer;
          width: 100%;
          text-align: center;
        }
        .editorial-btn-black:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px #111827;
          background: #2563eb;
        }
        .editorial-btn-black:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px #111827;
        }
        .editorial-btn-blue {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #2563eb;
          color: #ffffff;
          padding: 0.9rem 1.75rem;
          border-radius: 12px;
          font-weight: 800;
          font-size: 1rem;
          text-decoration: none;
          border: 2px solid #111827;
          box-shadow: 4px 4px 0px #111827;
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
          cursor: pointer;
          width: 100%;
          text-align: center;
        }
        .editorial-btn-blue:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px #111827;
          background: #1d4ed8;
        }
        .editorial-btn-blue:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px #111827;
        }
        .chunky-title-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .chunky-letter {
          font-size: clamp(3.5rem, 8vw, 6.5rem);
          font-weight: 900;
          line-height: 1;
          color: #ffffff;
          background: #111827;
          padding: 0.2rem 0.6rem;
          border-radius: 16px;
          border: 3px solid #111827;
          box-shadow: 5px 5px 0px #2563eb;
          display: inline-block;
          transform: rotate(-2deg);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .chunky-letter:nth-child(even) {
          background: #2563eb;
          box-shadow: 5px 5px 0px #111827;
          transform: rotate(2deg);
        }
        .chunky-letter:hover {
          transform: scale(1.08) rotate(0deg);
          z-index: 10;
        }
        .year-badge {
          font-size: clamp(1.2rem, 3vw, 2.2rem);
          font-weight: 900;
          color: #111827;
          background: #fde047;
          padding: 0.3rem 0.8rem;
          border-radius: 12px;
          border: 3px solid #111827;
          box-shadow: 4px 4px 0px #111827;
          align-self: flex-start;
          transform: rotate(6deg);
          margin-left: 0.5rem;
        }
        .hero-subtitle {
          font-size: clamp(0.85rem, 2.5vw, 1.2rem);
          font-weight: 900;
          color: #111827;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 3.5rem;
          text-align: center;
          background: #f3f4f6;
          padding: 0.6rem 1.25rem;
          border-radius: 50px;
          border: 2px solid #111827;
          box-shadow: 4px 4px 0px #111827;
        }
        .cards-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
          width: 100%;
          max-width: 950px;
          align-items: stretch;
        }
        @media (min-width: 768px) {
          .cards-layout {
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
          }
        }
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
      `,
      }}
    />
  );
};
