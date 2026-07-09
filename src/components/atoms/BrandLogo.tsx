import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  href = "/",
  className = "",
  style = {},
}) => {
  const sizeMap = {
    sm: {
      box: "30px",
      boxRadius: "7px",
      boxFont: "0.95rem",
      textFont: "1.1rem",
      badgeFont: "0.75rem",
      badgePadding: "0.1rem 0.35rem",
    },
    md: {
      box: "36px",
      boxRadius: "8px",
      boxFont: "1.1rem",
      textFont: "1.3rem",
      badgeFont: "0.85rem",
      badgePadding: "0.15rem 0.4rem",
    },
    lg: {
      box: "42px",
      boxRadius: "10px",
      boxFont: "1.25rem",
      textFont: "1.4rem",
      badgeFont: "0.9rem",
      badgePadding: "0.2rem 0.5rem",
    },
  };

  const currentSize = sizeMap[size];

  const content = (
    <span
      className={`flex items-center gap-2 ${className}`}
      style={{ textDecoration: "none", ...style }}
    >
      <span
        style={{
          width: currentSize.box,
          height: currentSize.box,
          borderRadius: currentSize.boxRadius,
          background: "#111827",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          color: "#fff",
          fontSize: currentSize.boxFont,
          boxShadow: "2px 2px 0px #2563eb",
          flexShrink: 0,
        }}
      >
        Q
      </span>
      <span
        style={{
          fontSize: currentSize.textFont,
          fontWeight: 900,
          color: "#111827",
          letterSpacing: "-0.04em",
          whiteSpace: "nowrap",
        }}
      >
        QUIIZEE{" "}
        <span
          style={{
            fontSize: currentSize.badgeFont,
            background: "#111827",
            color: "#fff",
            padding: currentSize.badgePadding,
            borderRadius: "4px",
            verticalAlign: "middle",
          }}
        >
          &apos;26
        </span>
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return content;
};
