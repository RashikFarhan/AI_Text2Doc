"use client";

import { useState } from "react";

interface ExportButtonProps {
  text?: string;
}

export default function ExportButton({ text }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!text || text.trim() === "") {
      setError("Nothing to export — paste some text first.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      // Convert response to blob and trigger download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "output.docx";
      document.body.appendChild(a);
      a.click();

      // Clean up
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      let message = err instanceof Error ? err.message : "Export failed";
      
      // Catch network errors specifically (which happens on Vercel since localhost:5000 is unreachable)
      if (err instanceof TypeError && message.toLowerCase().includes("fetch")) {
        message = "DOCX Export only works locally. Please run 'run.bat' on your PC.";
      }
      
      setError(message);
      setTimeout(() => setError(null), 8000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {error && (
        <span
          style={{
            fontSize: "12px",
            color: "#f87171",
            background: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: "6px",
            padding: "4px 10px",
            maxWidth: "280px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={error}
        >
          ⚠ {error}
        </span>
      )}

      <button
        className="export-btn"
        onClick={handleExport}
        disabled={loading}
        style={loading ? { opacity: 0.7, cursor: "not-allowed", transform: "none" } : {}}
      >
        {loading ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: "spin 1s linear infinite" }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              width={16}
              height={16}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Export to DOCX
          </>
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
