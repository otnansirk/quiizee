"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/organisms/PublicHeader";
import { AppFooter } from "@/components/organisms/AppFooter";
import { EditorialLandingStyles } from "@/components/features/landing/EditorialLandingStyles";
import { EditorialHeroCards } from "@/components/features/landing/EditorialHeroCards";

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
      <EditorialLandingStyles />

      {/* Top Header */}
      <PublicHeader
        size="md"
        className="editorial-header"
        rightAction={
          <Link href="/login" className="editorial-btn-black text-sm px-3 py-1 md:px-4 md:py-2 md:text-base">
            Creator Portal
          </Link>
        }
      />

      {/* Main Content */}
      <EditorialHeroCards
        resultCode={resultCode}
        error={error}
        onResultCodeChange={(val) => {
          setResultCode(val);
          if (error) setError("");
        }}
        onSubmitCheckResults={handleCheckResults}
      />

      {/* Footer */}
      <AppFooter />
    </div>
  );
}
