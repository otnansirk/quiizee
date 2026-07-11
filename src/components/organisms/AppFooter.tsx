import React from "react";

interface AppFooterProps {
  padding?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  className = "",
}) => {
  return (
    <footer
      className={`py-10 border-t-2 border-foreground bg-background text-muted-foreground text-center text-sm font-bold ${className}`}
    >
      <div className="container mx-auto px-4">
        <p>
          © {new Date().getFullYear()} QUIIZEE &apos;26. ENGINEERED FOR INSTRUCTIONAL EXCELLENCE.
        </p>
      </div>
    </footer>
  );
};
