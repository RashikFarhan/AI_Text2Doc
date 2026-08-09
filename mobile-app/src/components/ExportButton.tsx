// Mobile ExportButton — no server API calls, uses local docx generation
import { useState, useRef } from "react";
import { generateDocx, shareFile } from "@/lib/export";

interface ExportButtonProps {
  text?: string;
  normalizedHtml?: string;
}

export default function ExportButton({ text, normalizedHtml }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printFrameRef = useRef<HTMLIFrameElement | null>(null);

  // ── DOCX export via pure-JS docx library + Capacitor Share ──────────────
  const handleExport = async () => {
    if (!normalizedHtml || normalizedHtml.trim() === "") {
      setError("Nothing to export — paste some text first.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const uri = await generateDocx(normalizedHtml, text || '');
      if (uri) {
        await shareFile(uri);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      setError(message);
      setTimeout(() => setError(null), 8000);
    } finally {
      setLoading(false);
    }
  };

  // ── PDF export via hidden iframe (works in Android WebView without popup) ──
  const handlePdfExport = () => {
    if (!normalizedHtml || normalizedHtml.trim() === "") {
      setError("Nothing to export — paste some text first.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setPdfLoading(true);

    // Collect all existing stylesheets from the current page to inline into the iframe
    // This ensures KaTeX, fonts, and other styles render correctly in print
    const allStyles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules).map(r => r.cssText).join('\n');
        } catch {
          return '';
        }
      })
      .join('\n');

    const katexLinkHref = Array.from(document.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']"))
      .map(l => l.href)
      .find(h => h.includes('katex'));

    const printContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Text2Doc Export</title>
  ${katexLinkHref ? `<link rel="stylesheet" href="${katexLinkHref}">` : ''}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 210mm;
      background: #fff;
      color: #111;
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.75;
    }
    .page {
      width: 170mm;
      margin: 0 auto;
      padding: 20mm 0;
    }
    h1 { font-size: 22pt; font-weight: 700; margin: 0.8em 0 0.3em; border-bottom: 2px solid #333; padding-bottom: 6px; page-break-after: avoid; }
    h2 { font-size: 18pt; font-weight: 700; margin: 0.7em 0 0.25em; page-break-after: avoid; }
    h3 { font-size: 14pt; font-weight: 700; margin: 0.6em 0 0.2em; page-break-after: avoid; }
    h4, h5, h6 { font-size: 12pt; font-weight: 700; margin: 0.5em 0 0.2em; page-break-after: avoid; }
    p { margin: 0 0 0.8em; orphans: 3; widows: 3; }
    ul, ol { margin: 0 0 0.8em 1.8em; }
    li { margin-bottom: 0.25em; }
    blockquote {
      border-left: 4px solid #888;
      margin: 1em 0;
      padding: 0.5em 0 0.5em 1.2em;
      color: #444;
      font-style: italic;
    }
    hr { border: none; border-top: 1.5px solid #ccc; margin: 1.5em 0; }
    a { color: #1d4ed8; }
    strong { font-weight: 700; }
    em { font-style: italic; }

    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
      font-size: 10pt;
      page-break-inside: avoid;
      table-layout: fixed;
      word-wrap: break-word;
    }
    th {
      background: #f0f0f0;
      font-weight: 700;
      border: 1.5px solid #999;
      padding: 6px 10px;
      text-align: left;
    }
    td {
      border: 1px solid #bbb;
      padding: 5px 10px;
    }

    /* Code */
    code {
      font-family: 'Courier New', monospace;
      font-size: 9.5pt;
      background: #f4f4f4;
      border: 1px solid #ddd;
      border-radius: 3px;
      padding: 1px 5px;
    }
    pre {
      background: #f4f4f4;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 12px 16px;
      font-size: 9pt;
      line-height: 1.5;
      page-break-inside: avoid;
      white-space: pre-wrap;
      word-break: break-all;
    }
    pre code { background: transparent; border: none; padding: 0; }

    /* Math */
    .katex-display { margin: 1em 0; text-align: center; page-break-inside: avoid; overflow-x: auto; }

    /* Diagrams */
    .diagram-svg-wrapper {
      margin: 1em 0;
      text-align: center;
      page-break-inside: avoid;
      overflow-x: auto;
    }
    .diagram-svg-wrapper svg {
      max-width: 100%;
      height: auto;
    }

    @media print {
      @page {
        size: A4;
        margin: 20mm 20mm;
      }
      html, body { width: 100%; }
      .page { width: 100%; padding: 0; }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    ${normalizedHtml}
  </div>
</body>
</html>`;

    // ── KEY FIX: Use a hidden iframe instead of window.open() ──────────────
    // window.open() in Android WebView launches an external browser.
    // Writing into an iframe works entirely within the app's WebView.
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    printFrameRef.current = iframe;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      setPdfLoading(false);
      setError("Could not prepare print frame.");
      document.body.removeChild(iframe);
      return;
    }

    iframeDoc.open();
    iframeDoc.write(printContent);
    iframeDoc.close();

    // Wait for all resources (fonts, KaTeX) inside the iframe to load
    const triggerPrint = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print error:', e);
        }
        // Clean up after a short delay
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          setPdfLoading(false);
        }, 2000);
      }, 600); // Wait 600ms for fonts/KaTeX to render
    };

    iframe.onload = triggerPrint;
    // Fallback in case onload already fired
    setTimeout(triggerPrint, 1200);
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
        <span className="export-error" title={error}>
          ⚠ {error}
        </span>
      )}

      {/* PDF Export */}
      <button
        className="export-btn export-btn-pdf"
        onClick={handlePdfExport}
        disabled={pdfLoading}
        style={pdfLoading ? { opacity: 0.7, cursor: "not-allowed", transform: "none" } : {}}
        title="Export as PDF via system print dialog"
      >
        {pdfLoading ? (
          <>{spinIcon} <span className="hidden sm:inline">Preparing...</span></>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={14} height={14}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span className="hidden sm:inline">Export </span>PDF
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
          <>{spinIcon} <span className="hidden sm:inline">Exporting...</span></>
        ) : (
          <>{downloadIcon} <span className="hidden sm:inline">Export </span>DOCX</>
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
