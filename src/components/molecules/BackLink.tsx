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
}) => {
  const sizeClasses = {
    sm: "btn-sm text-sm px-3 py-1.5",
    md: "text-base px-4 py-2",
    lg: "btn-lg text-lg px-5 py-2.5",
  };

  const variantClasses = {
    ghost: "btn btn-ghost inline-flex items-center gap-1.5 rounded-full bg-white/5 text-muted-foreground hover:text-foreground transition-all",
    editorial: "inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-foreground bg-gray-100 text-foreground font-extrabold shadow-[4px_4px_0px_#111827] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111827] transition-all no-underline",
    secondary: "btn btn-secondary inline-flex items-center gap-1.5 rounded-lg transition-all",
    primary: "btn btn-primary inline-flex items-center gap-1.5 rounded-lg transition-all",
  };

  const iconSizes: Record<string, string> = {
    sm: "w-4 h-4",
    md: "w-[18px] h-[18px]",
    lg: "w-5 h-5",
  };

  return (
    <Link
      href={href}
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 640 640"
        className={`${iconSizes[size] || "w-4 h-4"} flex-shrink-0 fill-current`}
      >
        <path d="M73.4 297.4C60.9 309.9 60.9 330.2 73.4 342.7L233.4 502.7C245.9 515.2 266.2 515.2 278.7 502.7C291.2 490.2 291.2 469.9 278.7 457.4L173.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L173.3 288L278.7 182.6C291.2 170.1 291.2 149.8 278.7 137.3C266.2 124.8 245.9 124.8 233.4 137.3L73.4 297.3z"/>
      </svg>
      <span>{label}</span>
    </Link>
  );
};
