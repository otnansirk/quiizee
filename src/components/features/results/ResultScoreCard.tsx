"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export interface ResultScoreCardProps {
  numTotalScore: number | null;
  numMaxScore: number | string;
  percentage: number | null;
  isCertificateAvailable?: boolean;
  resultCode: string;
  status?: "in_progress" | "submitted" | "graded";
}

export const ResultScoreCard: React.FC<ResultScoreCardProps> = ({
  numTotalScore,
  numMaxScore,
  percentage,
  isCertificateAvailable,
  resultCode,
  status,
}) => {
  const searchParams = useSearchParams();
  const [loadingCert, setLoadingCert] = useState<boolean>(false);
  const [certError, setCertError] = useState<string | null>(null);

  useEffect(() => {
    const paramErr = searchParams?.get("certError");
    if (paramErr) {
      setCertError(paramErr);
    }
  }, [searchParams]);

  const handleDownloadCertificate = async () => {
    setLoadingCert(true);
    setCertError(null);
    try {
      const res = await fetch(`/api/results/${encodeURIComponent(resultCode)}/certificate`);
      if (!res.ok) {
        let errText = "Failed to generate certificate.";
        try {
          const errData = await res.json();
          if (errData?.error) errText = errData.error;
        } catch {
          errText = `Server returned status ${res.status}`;
        }
        if (
          errText.toLowerCase().includes("select ") ||
          errText.toLowerCase().includes("failed query") ||
          errText.toLowerCase().includes("postgres") ||
          errText.toLowerCase().includes("password authentication") ||
          errText.toLowerCase().includes("syntax error")
        ) {
          errText = "We encountered a temporary database connection issue while generating your completion certificate. Please try again in a few moments.";
        }
        setCertError(errText);
        setLoadingCert(false);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificate-${resultCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error("Error downloading certificate:", err);
      let clientMsg = err instanceof Error && err.message ? err.message : "Network error while downloading certificate.";
      if (
        clientMsg.toLowerCase().includes("select ") ||
        clientMsg.toLowerCase().includes("failed query") ||
        clientMsg.toLowerCase().includes("postgres") ||
        clientMsg.toLowerCase().includes("password authentication")
      ) {
        clientMsg = "We encountered a temporary network or database issue while generating your certificate. Please try again.";
      }
      setCertError(clientMsg);
    } finally {
      setLoadingCert(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isCertificateAvailable
          ? "repeat(auto-fit, minmax(260px, 1fr))"
          : "1fr",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      {/* Large Glowing Score Display */}
      <div
        className="card results-score-card"
        style={{
          padding: "clamp(0.75rem, 3vw, 2rem)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          background:
            "linear-gradient(145deg, rgba(26, 26, 46, 0.8) 0%, rgba(20, 20, 36, 0.9) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow:
            "0 10px 30px rgba(0, 0, 0, 0.3), 0 0 30px rgba(99, 102, 241, 0.15)",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            color: "#FFF",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "0.5rem",
          }}
        >
          {status === "submitted" ? "Current Auto-Graded Score" : "Total Score Earned"}
        </div>

        {numTotalScore !== null ? (
          <div
            className="flex items-baseline justify-center gap-2"
            style={{ marginBottom: "0.4rem" }}
          >
            <span
              className="results-score-num"
              style={{
                fontSize: "clamp(1.9rem, 7vw, 4rem)",
                fontWeight: 900,
                color: status === "submitted" ? "#fde047" : "#20a250",
                lineHeight: 1,
                letterSpacing: "-0.03em",
                filter: "drop-shadow(0 0 15px rgba(255, 255, 255, 0.4))",
              }}
            >
              {numTotalScore}
            </span>
            <span
              className="results-score-den"
              style={{
                fontSize: "clamp(0.85rem, 2.5vw, 1.6rem)",
                color: "#ffffff94",
                fontWeight: 600,
              }}
            >
              / {numMaxScore}
            </span>
          </div>
        ) : (
          <div
            style={{
              fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
              fontWeight: 800,
              color: "#fde047",
              marginBottom: "0.5rem",
              textShadow: "0 0 20px rgba(245, 158, 11, 0.3)",
            }}
          >
            Pending Review
          </div>
        )}

        {status === "submitted" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
            <div
              className="badge badge-warning"
              style={{
                fontSize: "0.78rem",
                padding: "0.25rem 0.65rem",
                fontWeight: 700,
                margin: 0,
                background: "rgba(245, 158, 11, 0.15)",
                color: "#fde047",
                borderColor: "rgba(245, 158, 11, 0.4)",
              }}
            >
              Pending Essay Review
            </div>
            {percentage !== null && (
              <div style={{ fontSize: "0.82rem", color: "#e2e8f0", fontWeight: 600 }}>
                Auto-graded accuracy: {percentage}% (+ up to remaining points after teacher review)
              </div>
            )}
          </div>
        ) : percentage !== null ? (
          <div
            className="badge badge-accent"
            style={{
              fontSize: "0.78rem",
              padding: "0.25rem 0.65rem",
              fontWeight: 700,
              margin: 0,
              background:
                percentage >= 70
                  ? "rgba(34, 197, 94, 0.15)"
                  : "rgba(255, 255, 255, 0.15)",
              color: percentage >= 70 ? "#43c372" : "#FFF",
              borderColor:
                percentage >= 70
                  ? "rgba(34, 197, 94, 0.4)"
                  : "rgba(255, 255, 255, 0.4)",
            }}
          >
            {percentage}% Accuracy
          </div>
        ) : (
          <div className="badge badge-warning" style={{ margin: 0 }}>
            Awaiting Essay Grading
          </div>
        )}
      </div>

      {/* Celebratory Certificate Banner */}
      {isCertificateAvailable && (
        <div
          className="card results-cert-card"
          style={{
            padding: "clamp(0.75rem, 3vw, 2rem)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.25) 100%)",
            border: "1px solid rgba(168, 85, 247, 0.4)",
            boxShadow:
              "0 10px 35px rgba(168, 85, 247, 0.25), 0 0 25px rgba(99, 102, 241, 0.2)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <h2
            className="results-cert-title"
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "#000",
              marginBottom: "0.4rem",
              lineHeight: 1.3,
            }}
          >
            Congratulations!
          </h2>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--text-primary)",
              marginBottom: "1rem",
              opacity: 0.9,
            }}
          >
            You earned a Certificate of Completion for demonstrating mastery in
            this assessment!
          </p>

          {certError && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                backgroundColor: "#FAF9F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1.5rem",
                color: "#111827",
                fontFamily: "Inter, -apple-system, sans-serif",
              }}
            >
              <div
                style={{
                  background: "#FFFFFF",
                  border: "3px solid #111827",
                  borderRadius: "24px",
                  padding: "3rem 2.5rem",
                  maxWidth: "500px",
                  width: "100%",
                  textAlign: "center",
                  boxShadow: "8px 8px 0px #111827",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    background: "#EF4444",
                    color: "#FFFFFF",
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    padding: "0.35rem 0.85rem",
                    border: "2px solid #111827",
                    borderRadius: "6px",
                    marginBottom: "1.5rem",
                    boxShadow: "3px 3px 0px #111827",
                  }}
                >
                  01 &nbsp;|&nbsp; Notice
                </div>
                <h1
                  style={{
                    fontSize: "2.2rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "-0.04em",
                    color: "#111827",
                    margin: "0 0 1rem 0",
                    lineHeight: 1.1,
                  }}
                >
                  Certificate<br />Notice
                </h1>
                <div
                  style={{
                    color: "#374151",
                    fontSize: "1rem",
                    lineHeight: 1.6,
                    fontWeight: 600,
                    wordBreak: "break-word",
                  }}
                >
                  {certError}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCertError(null);
                    if (typeof window !== "undefined" && window.history.replaceState) {
                      window.history.replaceState({}, "", `/results/${encodeURIComponent(resultCode)}`);
                    }
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    background: "#4F46E5",
                    color: "#FFFFFF",
                    padding: "1rem 1.5rem",
                    border: "3px solid #111827",
                    borderRadius: "12px",
                    textDecoration: "none",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    fontSize: "1rem",
                    letterSpacing: "0.05em",
                    boxShadow: "5px 5px 0px #111827",
                    cursor: "pointer",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                >
                  Return to Results
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={loadingCert}
            onClick={handleDownloadCertificate}
            className="btn btn-primary btn-block"
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
              boxShadow: "0 4px 15px rgba(168, 85, 247, 0.5)",
              fontWeight: 700,
              opacity: loadingCert ? 0.7 : 1,
              cursor: loadingCert ? "not-allowed" : "pointer",
            }}
          >
            {loadingCert ? "Generating PDF Certificate..." : "Download PDF Certificate"}
          </button>
        </div>
      )}
    </div>
  );
};
