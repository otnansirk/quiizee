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
}) => {
  const sizeMap = {
    sm: {
      box: "w-[30px] h-[30px] rounded-[7px] text-[0.95rem]",
      text: "text-[1.1rem]",
      badge: "text-[0.75rem] py-[0.1rem] px-[0.35rem]",
    },
    md: {
      box: "w-[36px] h-[36px] rounded-[8px] text-[1.1rem]",
      text: "text-[1.3rem]",
      badge: "text-[0.85rem] py-[0.15rem] px-[0.4rem]",
    },
    lg: {
      box: "w-[42px] h-[42px] rounded-[10px] text-[1.25rem]",
      text: "text-[1.4rem]",
      badge: "text-[0.9rem] py-[0.2rem] px-[0.5rem]",
    },
  };

  const currentSize = sizeMap[size];

  const content = (
    <span className={`flex items-center gap-2 no-underline ${className}`}>
      <span
        className={`${currentSize.box} bg-foreground flex items-center justify-center font-black text-background shadow-[2px_2px_0px_#2563eb] flex-shrink-0`}
      >
        Q
      </span>
      <span
        className={`${currentSize.text} font-black text-foreground tracking-[-0.04em] whitespace-nowrap`}
      >
        QUIIZEE{" "}
        <span
          className={`${currentSize.badge} bg-foreground text-background rounded-[4px] align-middle font-bold`}
        >
          &apos;26
        </span>
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="no-underline">
        {content}
      </Link>
    );
  }

  return content;
};
