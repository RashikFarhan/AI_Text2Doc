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
  const [isInfoOpen, setIsInfoOpen] = useState(false);

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
          <button 
            className="info-btn" 
            onClick={() => setIsInfoOpen(true)}
            aria-label="Info about AI Text2Doc"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
        </div>
        <div className="header-subtitle">
          Markdown + LaTeX → DOCX
        </div>
      </header>

      {/* ─ Info Flyout (SEO Friendly, CSS Hidden) ─ */}
      <div className={`info-flyout-overlay ${isInfoOpen ? "open" : ""}`} onClick={() => setIsInfoOpen(false)} />
      <div className={`info-flyout ${isInfoOpen ? "open" : ""}`}>
        <div className="info-flyout-header">
          <h2>About AI Text2Doc: The Ultimate AI Text Formatter</h2>
          <button className="info-close-btn" onClick={() => setIsInfoOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="info-flyout-content">
          <p>
            AI Text2Doc is a powerful, free Markdown and LaTeX to DOCX converter designed to solve one of the most frustrating workflow problems: broken AI text formatting.
          </p>
          <p>
            When you generate content using AI tools like ChatGPT, Claude, or Gemini, the output is generated in Markdown (using asterisks for bolding, hashtags for headings, and brackets for code). If you try to directly copy and paste ChatGPT text to Word, the structure instantly breaks. Headings disappear, tables become misaligned, math equations turn into unreadable code, and you are left spending hours manually fixing the layout.
          </p>
          <p>
            This tool acts as a seamless bridge. It instantly reads raw AI output—including complex LaTeX mathematical equations and standard Markdown—and flawlessly translates it into a perfectly styled Microsoft Word document. No more broken paragraphs, no more missing bullets, and no more formatting headaches. Just ready-to-use, professionally polished documents.
          </p>
          
          <h3>Support the Project</h3>
          <p>
            This project was built and is maintained by Rashik Farhan to make document formatting effortless for developers, students, researchers, and professionals.
          </p>
          <p>
            If this tool has saved you time from manually fixing broken AI text, please consider supporting its ongoing development! You can contribute and help others discover this tool by heading over to GitHub and giving the AI_Text2Doc repository a Star. Open-source support keeps projects like this free and growing.
          </p>
          <a href="https://github.com/RashikFarhan/AI_Text2Doc" target="_blank" rel="noopener noreferrer" className="github-star-btn-large">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Star AI_Text2Doc on GitHub
          </a>

          <h3>Frequently Asked Questions (FAQ)</h3>
          
          <h4>Why does AI text formatting break when pasted into Word?</h4>
          <p>
            AI chatbots and platforms generate text using Markdown, a lightweight text markup language. Microsoft Word, however, relies on rich text formatting. When you copy and paste directly from a browser, Word often fails to interpret the Markdown symbols. This results in lost formatting, broken tables, and missing structure. Our tool automatically acts as a Markdown to Word converter, rebuilding the structure natively for DOCX.
          </p>

          <h4>Can I convert LaTeX math equations to Word documents?</h4>
          <p>
            Yes! While most standard converters struggle with advanced mathematics, this tool is explicitly built to render LaTeX to Word. It ensures that your academic formulas, fractions, and scientific equations are perfectly preserved in the final downloadable file.
          </p>

          <h4>Is this AI document formatting tool free to use?</h4>
          <p>
            Absolutely. AI Text2Doc is entirely free, runs quickly in your browser, and requires no software installation or sign-ups.
          </p>

          <h4>Does it support AI-generated tables and code blocks?</h4>
          <p>
            Yes. Whether you are exporting a data table generated by an AI agent or a block of programming code, the converter ensures that grid alignments and syntax structures remain perfectly intact in the downloaded Word file.
          </p>
        </div>
      </div>

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
      </footer>
    </div>
  );
}
