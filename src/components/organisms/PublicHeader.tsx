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
  style = {},
  className = "",
}) => {
  return (
    <header
      className={className}
      style={{
        padding: "0.75rem 0",
        borderBottom: "2px solid #111827",
        background: "#ffffff",
        position: sticky ? "sticky" : "static",
        top: sticky ? 0 : undefined,
        zIndex: sticky ? 40 : undefined,
        ...style,
      }}
    >
      <div className="container flex items-center justify-between">
        <BrandLogo size={size} />
        <div className="flex items-center gap-3">
          {backToHome && (
            <Link
              href="/"
              className="btn btn-ghost btn-sm"
              style={{
                color: "#111827",
                fontWeight: 800,
                fontSize: "0.85rem",
                padding: "0.35rem 0.75rem",
              }}
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
