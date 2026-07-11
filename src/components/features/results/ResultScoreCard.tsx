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
          const errData = (await res.json().catch(() => ({}))) as any;
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
      className={`grid gap-4 mb-6 ${
        isCertificateAvailable
          ? "grid-cols-1 md:grid-cols-2"
          : "grid-cols-1"
      }`}
    >
      {/* Large Glowing Score Display */}
      <div className="card results-score-card p-4 sm:p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#1a1a2e]/80 to-[#141424]/90 border border-white/12 shadow-[0_10px_30px_rgba(0,0,0,0.3),_0_0_30px_rgba(99,102,241,0.15)]">
        <div className="text-xs text-white font-bold uppercase tracking-wider mb-2">
          {status === "submitted" ? "Current Auto-Graded Score" : "Total Score Earned"}
        </div>

        {numTotalScore !== null ? (
          <div className="flex items-baseline justify-center gap-2 mb-1.5">
            <span
              className={`results-score-num text-5xl sm:text-6xl font-black leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] ${
                status === "submitted" ? "text-yellow-300" : "text-emerald-500"
              }`}
            >
              {numTotalScore}
            </span>
            <span className="results-score-den text-xl sm:text-2xl text-white/60 font-semibold">
              / {numMaxScore}
            </span>
          </div>
        ) : (
          <div className="text-3xl sm:text-4xl font-extrabold text-yellow-300 mb-2 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            Pending Review
          </div>
        )}

        {status === "submitted" ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="badge badge-warning text-xs px-3 py-1 font-bold m-0 bg-amber-500/15 text-yellow-300 border border-amber-500/40">
              Pending Essay Review
            </div>
            {percentage !== null && (
              <div className="text-xs sm:text-sm text-slate-200 font-semibold">
                Auto-graded accuracy: {percentage}% (+ up to remaining points after teacher review)
              </div>
            )}
          </div>
        ) : percentage !== null ? (
          <div
            className={`badge m-0 text-xs px-3 py-1 font-bold border ${
              percentage >= 70
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                : "bg-white/15 text-white border-white/40"
            }`}
          >
            {percentage}% Accuracy
          </div>
        ) : (
          <div className="badge badge-warning m-0 text-xs font-bold">
            Awaiting Essay Grading
          </div>
        )}
      </div>

      {/* Celebratory Certificate Banner */}
      {isCertificateAvailable && (
        <div className="card results-cert-card p-4 sm:p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-indigo-500/20 to-purple-500/25 border border-purple-500/40 shadow-[0_10px_35px_rgba(168,85,247,0.25),_0_0_25px_rgba(99,102,241,0.2)] relative overflow-hidden">
          <h2 className="results-cert-title text-xl font-extrabold text-black dark:text-white mb-1.5 leading-snug">
            Congratulations!
          </h2>
          <p className="text-sm text-foreground mb-4 opacity-90">
            You earned a Certificate of Completion for demonstrating mastery in
            this assessment!
          </p>

          {certError && (
            <div className="fixed inset-0 z-[9999] bg-[#FAF9F6] flex items-center justify-center p-6 text-gray-900 font-sans">
              <div className="bg-white border-4 border-gray-900 rounded-3xl p-10 sm:p-12 max-w-lg w-full text-center shadow-[8px_8px_0px_#111827] relative">
                <div className="inline-block bg-red-500 text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 border-2 border-gray-900 rounded-md mb-6 shadow-[3px_3px_0px_#111827]">
                  01 &nbsp;|&nbsp; Notice
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tight text-gray-900 mb-4 leading-tight">
                  Certificate<br />Notice
                </h1>
                <div className="text-gray-700 text-base leading-relaxed font-semibold break-words mb-8">
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
                  className="block w-full bg-indigo-600 text-white py-4 px-6 border-4 border-gray-900 rounded-xl font-black uppercase text-base tracking-wider shadow-[5px_5px_0px_#111827] cursor-pointer transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_#111827]"
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
            className={`btn btn-block font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/50 ${
              loadingCert ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {loadingCert ? "Generating PDF Certificate..." : "Download PDF Certificate"}
          </button>
        </div>
      )}
    </div>
  );
};
