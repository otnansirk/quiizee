import React from "react";
import Link from "next/link";

interface BackLinkProps {
  href: string;
  label?: string;
  variant?: "ghost" | "secondary" | "primary" | "editorial";
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
}

export const BackLink: React.FC<BackLinkProps> = ({
  href,
  label = "Back",
  variant = "ghost",
  size = "sm",
  className = "",
  style = {},
}) => {
  const sizeClasses = {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
  };

  const defaultStyles: Record<string, React.CSSProperties> = {
    ghost: {
      padding: "0.4rem 0.8rem",
      fontSize: "0.9rem",
      color: "var(--text-secondary)",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4rem",
      borderRadius: "var(--radius-full)",
      background: "rgba(255, 255, 255, 0.03)",
      ...style,
    },
    editorial: {
      border: "2px solid #111827",
      boxShadow: "4px 4px 0px #111827",
      background: "#f3f4f6",
      color: "#111827",
      fontWeight: 800,
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.4rem",
      padding: "0.75rem 1.25rem",
      borderRadius: "8px",
      ...style,
    },
    secondary: {
      ...style,
    },
    primary: {
      ...style,
    },
  };

  const variantClasses = {
    ghost: "btn btn-ghost",
    editorial: "editorial-btn",
    secondary: "btn btn-secondary",
    primary: "btn btn-primary",
  };

  return (
    <Link
      href={href}
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      style={defaultStyles[variant]}
    >
      <span>←</span> {label}
    </Link>
  );
};
