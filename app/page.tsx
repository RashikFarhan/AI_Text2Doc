"use client";

import { useState, useMemo } from "react";
import TextEditor from "@/components/TextEditor";
import Preview from "@/components/Preview";
import ExportButton from "@/components/ExportButton";
import { normalizeText } from "@/lib/normalize";

export default function Home() {
  // Raw text from the editor — never mutated
  const [text, setText] = useState("");

  // Normalized text derived from raw — used by preview and export
  const normalizedText = useMemo(() => normalizeText(text), [text]);

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
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Markdown + LaTeX → DOCX
        </div>
      </header>

      {/* ─ Main Split ─ */}
      <main className="app-main">
        {/* Left: raw editor */}
        <section className="panel panel-left">
          <TextEditor text={text} setText={setText} />
        </section>

        {/* Right: normalised preview */}
        <section className="panel panel-right">
          <Preview text={normalizedText} />
        </section>
      </main>

      {/* ─ Footer ─ */}
      <footer className="app-footer">
        <span className="footer-info">
          {wordCount} words · {charCount} characters
        </span>
        {/* Export also uses normalised text */}
        <ExportButton text={normalizedText} />
      </footer>
    </div>
  );
}
