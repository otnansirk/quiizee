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

  const iconSizes: Record<string, number> = {
    sm: 16,
    md: 18,
    lg: 22,
  };
  const iconPx = iconSizes[size] || 16;

  return (
    <Link
      href={href}
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      style={defaultStyles[variant]}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 640 640"
        width={iconPx}
        height={iconPx}
        fill="currentColor"
        style={{ flexShrink: 0 }}
      >
        <path d="M73.4 297.4C60.9 309.9 60.9 330.2 73.4 342.7L233.4 502.7C245.9 515.2 266.2 515.2 278.7 502.7C291.2 490.2 291.2 469.9 278.7 457.4L173.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L173.3 288L278.7 182.6C291.2 170.1 291.2 149.8 278.7 137.3C266.2 124.8 245.9 124.8 233.4 137.3L73.4 297.3z"/>
      </svg>
      <span>{label}</span>
    </Link>
  );
};
