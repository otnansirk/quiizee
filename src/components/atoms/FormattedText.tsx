"use client";

import React, { useState } from "react";

export interface FormattedTextProps {
  text?: string | null;
  className?: string;
  inline?: boolean;
}

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayLang = (language && language.trim()) ? language.trim().toUpperCase() : "CODE";

  return (
    <div className="my-3.5 rounded-xl overflow-hidden border border-white/15 bg-[#0d1117] shadow-xl text-left not-italic font-normal">
      {/* Code Block Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-[0.7rem] sm:text-xs font-bold tracking-wider text-gray-400 uppercase font-mono">
          {displayLang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            copied
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-white/10 text-gray-300 hover:bg-white/15 border border-white/10"
          }`}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <span>✓</span>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-4 sm:p-5 overflow-x-auto font-mono text-sm sm:text-base leading-relaxed text-gray-200 m-0 select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Helper to parse inline formatting (`code`, **bold**, *italic*)
const renderInlineFormatting = (text: string, keyPrefix: string): React.ReactNode[] => {
  // We use regex tokenizer for inline tags: inline code `...` or bold **...**
  // Splitting pattern: (`[^`]+`|\*\*[^*]+\*\*)
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return tokens.map((token, index) => {
    if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      const inlineCode = token.slice(1, -1);
      return (
        <code
          key={`${keyPrefix}-code-${index}`}
          className="bg-white/15 text-indigo-300 font-mono text-sm px-1.5 py-0.5 rounded border border-white/10 font-normal mx-0.5"
        >
          {inlineCode}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      const boldText = token.slice(2, -2);
      return (
        <strong key={`${keyPrefix}-bold-${index}`} className="font-extrabold text-current">
          {boldText}
        </strong>
      );
    }
    return <React.Fragment key={`${keyPrefix}-text-${index}`}>{token}</React.Fragment>;
  });
};

export const FormattedText: React.FC<FormattedTextProps> = ({ text, className = "", inline = false }) => {
  if (!text) return null;

  // Split by fenced code blocks: ```lang\ncode\n```
  // Regex explains: ``` followed by optional language (word characters), then newline or content, up to closing ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\r?\n?([\s\S]*?)```/g;

  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockIndex = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Text before the code block
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      segments.push(
        <span key={`text-before-${blockIndex}`} className="whitespace-pre-wrap">
          {renderInlineFormatting(beforeText, `before-${blockIndex}`)}
        </span>
      );
    }

    const lang = match[1] || "";
    let codeContent = match[2] || "";
    // Trim trailing newline before closing ```
    if (codeContent.endsWith("\r\n")) codeContent = codeContent.slice(0, -2);
    else if (codeContent.endsWith("\n")) codeContent = codeContent.slice(0, -1);

    segments.push(<CodeBlock key={`code-${blockIndex}`} code={codeContent} language={lang} />);

    lastIndex = match.index + match[0].length;
    blockIndex++;
  }

  // Remaining text after the last code block
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    segments.push(
      <span key="text-remaining" className="whitespace-pre-wrap">
        {renderInlineFormatting(remainingText, "remaining")}
      </span>
    );
  }

  if (inline && blockIndex === 0) {
    // If inline requested and no code blocks, render inside span
    return <span className={className}>{renderInlineFormatting(text, "inline")}</span>;
  }

  return <div className={`block ${className}`}>{segments}</div>;
};
