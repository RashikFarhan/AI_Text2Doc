"use client";

import { useState, useMemo } from "react";
import TextEditor from "@/components/TextEditor";
import Preview from "@/components/Preview";
import ExportButton from "@/components/ExportButton";
import { normalizeText } from "@/lib/normalize";
import { renderMarkdown } from "@/lib/markdown";

export default function Home() {
  const [text, setText] = useState("");
  // Mobile: which tab is active — "editor" or "preview"
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  const normalizedText = useMemo(() => normalizeText(text), [text]);
  const normalizedHtml = useMemo(() => renderMarkdown(normalizedText), [normalizedText]);

  const charCount = text.length;
  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  return (
    <div className="app-shell">
      {/* ─ Header ─ */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">✦</div>
          AI Text Formatter
        </div>
        <div className="header-subtitle">
          Markdown + LaTeX → DOCX
        </div>
      </header>

      {/* ─ Mobile Tab Bar (hidden on desktop) ─ */}
      <div className="mobile-tab-bar">
        <button
          className={`mobile-tab ${mobileTab === "editor" ? "mobile-tab-active" : ""}`}
          onClick={() => setMobileTab("editor")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Editor
        </button>
        <button
          className={`mobile-tab ${mobileTab === "preview" ? "mobile-tab-active" : ""}`}
          onClick={() => setMobileTab("preview")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Preview
          {text && <span className="mobile-tab-badge" />}
        </button>
      </div>

      {/* ─ Main Split (desktop) / Tabbed (mobile) ─ */}
      <main className="app-main">
        {/* Left / Editor tab */}
        <section className={`panel panel-left ${mobileTab === "editor" ? "mobile-panel-active" : "mobile-panel-hidden"}`}>
          <TextEditor text={text} setText={setText} />
        </section>

        {/* Right / Preview tab */}
        <section className={`panel panel-right ${mobileTab === "preview" ? "mobile-panel-active" : "mobile-panel-hidden"}`}>
          <Preview text={normalizedText} />
        </section>
      </main>

      {/* ─ Footer ─ */}
      <footer className="app-footer">
        <div className="footer-left">
          <span className="footer-info">
            {wordCount} words · {charCount} characters
          </span>
          <div className="footer-links">
            <a href="https://github.com/RashikFarhan" target="_blank" rel="noopener noreferrer">
              Made by RashikFarhan
            </a>
            <a href="https://github.com/RashikFarhan/AI_Text2Doc" target="_blank" rel="noopener noreferrer" className="github-star-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              Star
            </a>
          </div>
        </div>
        <ExportButton text={normalizedText} normalizedHtml={normalizedHtml} />
      </footer>
    </div>
  );
}
