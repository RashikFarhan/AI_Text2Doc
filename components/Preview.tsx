"use client";

import { useMemo } from "react";
import { renderMarkdown } from "@/lib/markdown";
import "katex/dist/katex.min.css";

interface PreviewProps {
  text: string;
}

export default function Preview({ text }: PreviewProps) {
  // Compute HTML synchronously — no useEffect flash, no stale state
  const html = useMemo(() => renderMarkdown(text), [text]);

  return (
    <>
      <div className="panel-header">
        <span
          className="panel-dot"
          style={{
            background: "#34d399",
            boxShadow: "0 0 6px rgba(52,211,153,0.4)",
          }}
        />
        <span className="panel-title">Preview</span>
      </div>
      <div className="preview-body">
        {text ? (
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="preview-empty">
            <div className="preview-empty-icon">⬡</div>
            <p className="preview-empty-text">Formatted preview will appear here</p>
          </div>
        )}
      </div>
    </>
  );
}
