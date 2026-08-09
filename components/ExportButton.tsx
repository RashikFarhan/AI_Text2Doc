"use client";

import { useState } from "react";

interface ExportButtonProps {
  text?: string;
  normalizedHtml?: string;
}

export default function ExportButton({ text, normalizedHtml }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── DOCX export via pandoc-wasm API route ──────────────────────────────
  const handleExport = async () => {
    if (!text || text.trim() === "") {
      setError("Nothing to export — paste some text first.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "output.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      let message = err instanceof Error ? err.message : "Export failed";
      if (err instanceof TypeError && message.toLowerCase().includes("fetch")) {
        message = "Export is initializing or unavailable. If this persists, try again in a few seconds.";
      }
      setError(message);
      setTimeout(() => setError(null), 8000);
    } finally {
      setLoading(false);
    }
  };

  // ── PDF export via browser print dialog ────────────────────────────────
  const handlePdfExport = () => {
    if (!normalizedHtml || normalizedHtml.trim() === "") {
      setError("Nothing to export — paste some text first.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setPdfLoading(true);

    // Fetch KaTeX CSS from the page's existing link tag so math renders in print
    const katexCssHref = Array.from(document.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']"))
      .map((l) => l.href)
      .find((h) => h.includes("katex"));

    // Build a minimal self-contained print HTML document
    const printContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AI Text Formatter — PDF Export</title>
  ${katexCssHref ? `<link rel="stylesheet" href="${katexCssHref}">` : ""}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 12pt;
      line-height: 1.7;
      color: #111;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .print-page {
      max-width: 170mm;
      margin: 0 auto;
      padding: 20mm 0;
    }
    h1 { font-size: 22pt; margin: 0.6em 0 0.3em; border-bottom: 1.5px solid #333; padding-bottom: 4px; }
    h2 { font-size: 17pt; margin: 0.5em 0 0.25em; }
    h3 { font-size: 14pt; margin: 0.5em 0 0.2em; }
    h4 { font-size: 12pt; margin: 0.5em 0 0.2em; }
    p  { margin: 0.4em 0 0.6em; orphans: 3; widows: 3; }
    ul, ol { margin: 0.4em 0 0.6em 1.6em; }
    li { margin: 0.2em 0; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
      font-size: 10pt;
      break-inside: avoid;
    }
    th, td {
      border: 1px solid #aaa;
      padding: 5px 10px;
      text-align: left;
    }
    th { background: #f0f0f0; font-weight: 700; }
    code {
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 3px;
      padding: 1px 4px;
    }
    pre {
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 10px 14px;
      overflow-x: auto;
      font-size: 9pt;
      line-height: 1.5;
      break-inside: avoid;
    }
    pre code { background: transparent; border: none; padding: 0; }
    blockquote {
      border-left: 3px solid #888;
      margin: 0.8em 0;
      padding: 0.3em 0 0.3em 1.2em;
      color: #444;
      font-style: italic;
    }
    hr { border: none; border-top: 1px solid #ccc; margin: 1.2em 0; }
    .katex-display { margin: 1em 0; text-align: center; break-inside: avoid; }
    .katex { font-size: 1.05em; }
    /* SVG diagrams */
    .diagram-svg-wrapper {
      margin: 1em 0;
      text-align: center;
      break-inside: avoid;
    }
    .diagram-svg-wrapper svg {
      max-width: 100%;
      height: auto;
    }
    /* Force white background on all SVG diagrams */
    .diagram-svg-wrapper svg rect:first-child { fill: #fff !important; }
    @media print {
      @page {
        size: A4;
        margin: 20mm 20mm;
      }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      h1, h2, h3, h4, h5, h6 { break-after: avoid; }
      pre, table, figure, .katex-display, .diagram-svg-wrapper { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="print-page">
    ${normalizedHtml}
  </div>
</body>
</html>`;

    // Open print window
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      setError("Pop-up blocked. Please allow pop-ups for this site and try again.");
      setTimeout(() => setError(null), 6000);
      setPdfLoading(false);
      return;
    }

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for resources (KaTeX CSS, fonts) to load before printing
    printWindow.addEventListener("load", () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setPdfLoading(false);
      }, 400);
    });

    // Fallback if load event already fired
    setTimeout(() => {
      if (!printWindow.closed) {
        setPdfLoading(false);
      }
    }, 3000);
  };

  const spinStyle: React.CSSProperties = { animation: "spin 1s linear infinite" };
  const downloadIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={16} height={16}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
  const spinIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={spinStyle}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );

  return (
    <div className="export-btn-group">
      {error && (
        <span
          className="export-error"
          title={error}
        >
          ⚠ {error}
        </span>
      )}

      {/* PDF Export */}
      <button
        className="export-btn export-btn-pdf"
        onClick={handlePdfExport}
        disabled={pdfLoading}
        style={pdfLoading ? { opacity: 0.7, cursor: "not-allowed", transform: "none" } : {}}
        title="Export as PDF via browser print dialog"
      >
        {pdfLoading ? (
          <>{spinIcon} Preparing...</>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={16} height={16}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Export PDF
          </>
        )}
      </button>

      {/* DOCX Export */}
      <button
        className="export-btn"
        onClick={handleExport}
        disabled={loading}
        style={loading ? { opacity: 0.7, cursor: "not-allowed", transform: "none" } : {}}
        title="Export as .docx (Word) document"
      >
        {loading ? (
          <>{spinIcon} Exporting...</>
        ) : (
          <>{downloadIcon} Export DOCX</>
        )}
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
