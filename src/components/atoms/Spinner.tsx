import React from "react";

interface SpinnerProps {
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeClass = typeof size === "number" ? `w-[${size}px] h-[${size}px]` : size === "sm" ? "w-5 h-5" : size === "lg" ? "w-12 h-12" : "w-9 h-9";
  
  return (
    <div
      className={`animate-spin mx-auto rounded-full border-3 border-black/10 border-t-primary ${sizeClass} ${className}`}
    />
  );
};
