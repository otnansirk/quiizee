import React from "react";

interface AppFooterProps {
  padding?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  padding = "2.5rem 0",
  style = {},
  className = "",
}) => {
  return (
    <footer
      className={className}
      style={{
        padding,
        borderTop: "2px solid #111827",
        background: "#ffffff",
        color: "#4b5563",
        textAlign: "center",
        fontSize: "0.85rem",
        fontWeight: 700,
        ...style,
      }}
    >
      <div className="container">
        <p>
          © {new Date().getFullYear()} QUIIZEE &apos;26. ENGINEERED FOR INSTRUCTIONAL EXCELLENCE.
        </p>
      </div>
    </footer>
  );
};
