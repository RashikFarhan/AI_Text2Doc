"use client";

import { useMemo, useRef, useState } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { prepareClipboardData } from "@/lib/clipboard";
import ExportButton from "./ExportButton";
import "katex/dist/katex.min.css";

interface PreviewProps {
  text: string;
}

export default function Preview({ text }: PreviewProps) {
  // Compute HTML synchronously — no useEffect flash, no stale state
  const html = useMemo(() => renderMarkdown(text), [text]);
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!contentRef.current) return;
    try {
      const { html: htmlContent, text: textContent } = await prepareClipboardData(contentRef.current);

      // Write rich HTML + plain text to clipboard buffer.
      // Converts SVG diagrams to embedded high-resolution PNGs so they paste
      // with 100% fidelity into Microsoft Word, Google Docs, Apple Pages, etc.
      const clipboardItem = new ClipboardItem({
        "text/html": new Blob([htmlContent], { type: "text/html" }),
        "text/plain": new Blob([textContent], { type: "text/plain" }),
      });
      await navigator.clipboard.write([clipboardItem]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy rich clipboard data:", err);
      // Fallback for browsers that don't support ClipboardItem
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(contentRef.current.innerText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <>
      <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            className="panel-dot"
            style={{
              background: "#34d399",
              boxShadow: "0 0 6px rgba(52,211,153,0.4)",
            }}
          />
          <span className="panel-title">Preview</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {text && (
            <button
              onClick={handleCopy}
              className="copy-btn"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: copied ? "#34d399" : "var(--text-secondary)",
                fontSize: "12px",
                padding: "6px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s"
              }}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  <span>Copy <span className="hidden sm:inline">Content</span></span>
                </>
              )}
            </button>
          )}
          {text && <ExportButton text={text} normalizedHtml={html} />}
        </div>
      </div>
      <div className="preview-body">
        {text ? (
          <div
            ref={contentRef}
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
