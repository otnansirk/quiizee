import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/atoms/BrandLogo";

interface PublicHeaderProps {
  size?: "sm" | "md" | "lg";
  sticky?: boolean;
  backToHome?: boolean;
  rightAction?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  size = "sm",
  sticky = true,
  backToHome = false,
  rightAction,
  className = "",
}) => {
  return (
    <header
      className={`py-3 border-b-2 border-foreground bg-background ${
        sticky ? "sticky top-0 z-40" : "static"
      } ${className}`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <BrandLogo size={size} />
        <div className="flex items-center gap-3">
          {backToHome && (
            <Link
              href="/"
              className="btn btn-ghost btn-sm text-foreground font-extrabold text-sm px-3 py-1.5"
            >
              Back to Home
            </Link>
          )}
          {rightAction}
        </div>
      </div>
    </header>
  );
};
