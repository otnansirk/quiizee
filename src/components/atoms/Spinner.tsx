import React from "react";

interface SpinnerProps {
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 36,
  color = "#2563eb",
  className = "",
  style = {},
}) => {
  return (
    <div
      className={`spinner ${className}`}
      style={{
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
        border: `3px solid rgba(0, 0, 0, 0.1)`,
        borderTopColor: color,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        margin: "0 auto",
        ...style,
      }}
    />
  );
};
