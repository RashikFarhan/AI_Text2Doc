/**
 * normalizeText
 * Converts raw AI-generated text into clean, standard Markdown suitable for
 * both real-time web preview (KaTeX/markdown-it) and local DOCX export (Pandoc).
 *
 * Pipeline:
 *  0. Protect existing fenced code blocks (``` and ~~~).
 *  1. Unfragment multi-line / broken table rows (rejoin lines split across pipes).
 *  2. Normalize & protect LaTeX math ($$, $, \[, \], \(, \), AMS environments).
 *  3. Auto-detect & fence ASCII/Unicode diagrams, flowcharts, and timelines.
 *  4. Surgically normalize bold/italic whitespace without breaking adjacent tags.
 *  5. Clean lists, headings, and excessive whitespace.
 *  6. Pandoc-safe table repair (alignment, em-dashes, missing separators, column balance).
 *  7. Restore math and code block placeholders.
 */

interface PlaceholderEntry {
  placeholder: string;
  original: string;
}

export function normalizeText(input: string): string {
  if (!input) return "";

  let text = input;

  // ── Step 0: Protect existing fenced code blocks ──────────────────────────
  const codeMap: PlaceholderEntry[] = [];
  let codeCounter = 0;
  text = text.replace(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g, (match) => {
    const ph = `@@CODE_BLOCK_${codeCounter++}@@`;
    codeMap.push({ placeholder: ph, original: match });
    return ph;
  });

  // ── Step 1: Pre-process Multiline / Fragmented Table Rows ─────────────────
  // AI output often breaks table cells across lines like:
  // | Col 1 | Col 2
  // \n\n | Col 3
  const rawLines = text.split("\n");
  const unfragmentedLines: string[] = [];
  let inFragmentedTable = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (inFragmentedTable) {
      if (trimmed === "") {
        // Look ahead: if next non-empty line starts with |, this blank line is inside a fragmented table
        let nextPipe = false;
        for (let j = i + 1; j < Math.min(rawLines.length, i + 5); j++) {
          const nextTrim = rawLines[j].trim();
          if (nextTrim === "") continue;
          if (nextTrim.startsWith("|")) {
            nextPipe = true;
          }
          break;
        }
        if (nextPipe) {
          continue; // Skip internal blank line in fragmented table
        } else {
          inFragmentedTable = false;
          unfragmentedLines.push(line);
          continue;
        }
      }

      if (trimmed.startsWith("|")) {
        const lastIdx = unfragmentedLines.length - 1;
        const prevLine = unfragmentedLines[lastIdx];

        if (prevLine && (!prevLine.trim().endsWith("|") || prevLine.trim().endsWith("||"))) {
          unfragmentedLines[lastIdx] = prevLine.trim() + " " + trimmed;
        } else if (prevLine && prevLine.trim().endsWith("|")) {
          const pipeCount = (prevLine.match(/\|/g) || []).length;
          if (pipeCount <= 2 && !/^\s*\|?\s*:?[\-\u2013\u2014]+:?\s*\|?\s*$/.test(prevLine)) {
            unfragmentedLines[lastIdx] = prevLine.trimEnd() + " " + trimmed.replace(/^\|/, "").trim();
          } else {
            unfragmentedLines.push(line);
          }
        } else {
          unfragmentedLines.push(line);
        }
        continue;
      } else {
        const lastIdx = unfragmentedLines.length - 1;
        if (lastIdx >= 0 && unfragmentedLines[lastIdx].includes("|")) {
          unfragmentedLines[lastIdx] = unfragmentedLines[lastIdx].trimEnd() + " " + trimmed;
          continue;
        }
      }
    }

    if (trimmed.startsWith("|") && trimmed.includes("|", 1)) {
      inFragmentedTable = true;
    }
    unfragmentedLines.push(line);
  }
  text = unfragmentedLines.join("\n");

  // Collapse empty lines between table pipes
  text = text.replace(/(\|.*?)\n\s*\n\s*\|\s*/g, "$1 | ");

  // ── Step 2: Normalize & Protect LaTeX Math ───────────────────────────────
  const mathMap: PlaceholderEntry[] = [];
  let mathCounter = 0;

  // 2a. Normalize \[ ... \] display math to $$ ... $$ (supports \\[, \\\[ from mobile)
  text = text.replace(/\\+\[([\s\S]*?)\\+\]/g, (_, math) => `$$\n${math.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "").trim()}\n$$`);

  // 2b. Normalize \( ... \) inline math to $ ... $ (supports \\(, \\\( from mobile)
  text = text.replace(/\\+\(([\s\S]*?)\\+\)/g, (_, math) => `$${math.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "").trim()}$`);

  // 2c. Protect existing $$ ... $$ block math FIRST so inner environments (bmatrix, aligned, etc.) are never double-wrapped
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    let cleanMath = math.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "").trim();
    // Convert \begin{align} to \begin{aligned} for KaTeX & Pandoc compatibility
    cleanMath = cleanMath
      .replace(/\\begin\{align\*?\}/g, "\\begin{aligned}")
      .replace(/\\end\{align\*?\}/g, "\\end{aligned}");
    const ph = `@@MATH_BLOCK_${mathCounter++}@@`;
    mathMap.push({ placeholder: ph, original: `$$\n${cleanMath}\n$$` });
    return ph;
  });

  // 2d. Protect $ ... $ inline math (distinguishing from currency like $500 to $1,000)
  text = text.replace(/(^|[^\$])\$([^\$\n]+?)\$(?!\d)/g, (match, prefix, math) => {
    if (/^\s*\d+([,\.]\d+)?\s*$/.test(math)) {
      return match; // Currency, preserve as-is
    }
    let cleanMath = math.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "").trim();
    // Convert pipe in math to \vert so Markdown tables don't split columns at math pipes
    cleanMath = cleanMath.replace(/\|\|/g, "\\Vert ").replace(/(?<!\\)\|/g, "\\vert ");
    const ph = `@@MATH_INLINE_${mathCounter++}@@`;
    mathMap.push({ placeholder: ph, original: `$${cleanMath}$` });
    return `${prefix}${ph}`;
  });

  // 2e. Normalize standalone \begin{env} ... \end{env} that were not enclosed in $$ or $
  const mathEnvs = [
    "equation", "equation\\*", "align", "align\\*", "aligned",
    "gather", "gather\\*", "multline", "multline\\*", "flalign", "flalign\\*",
    "alignat", "alignat\\*", "matrix", "pmatrix", "bmatrix", "Bmatrix", "vmatrix", "Vmatrix", "cases"
  ];
  const envRegex = new RegExp(`\\\\begin\\{(${mathEnvs.join("|")})\\}([\\s\\S]*?)\\\\end\\{\\1\\}`, "g");
  text = text.replace(envRegex, (match, env, inner) => {
    const safeEnv = env.startsWith("align") ? "aligned" : env;
    const ph = `@@MATH_BLOCK_${mathCounter++}@@`;
    mathMap.push({ placeholder: ph, original: `$$\n\\begin{${safeEnv}}${inner}\\end{${safeEnv}}\n$$` });
    return ph;
  });

  // ── Step 3: Auto-detect ASCII diagrams / timelines / box charts ───────────
  const lines = text.split("\n");
  const processedLines: string[] = [];
  let inDiagram = false;
  let diagramBuffer: string[] = [];

  const isDiagramChar = (l: string): boolean => {
    return /[┌┐└┘├┤┬┴┼│─═║╔╗╚╝╠╣╦╩╬▲▼◄►↑↓←→↔↕⇒⇐⇔──►◄──]/.test(l) ||
      /(?:\s*(?:\[[^\]]+\]|\([^\)]+\))\s*(?:──►|──>|-->|==>|->|<--|<==|<-|◄──|◄───)\s*)/.test(l) ||
      /(?:^\s*\+[-=+]+\+\s*$)/.test(l);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isMdTable = /^\s*\|.*\|\s*$/.test(line) && !/[┌┐└┘├┤┬┴┼│─═║╔╗╚╝╠╣╦╩╬]/.test(line);

    if (!isMdTable && isDiagramChar(line)) {
      if (!inDiagram) {
        inDiagram = true;
        diagramBuffer = [];
        // Pull preceding centered/bracket title headers into diagram
        while (processedLines.length > 0) {
          const prev = processedLines[processedLines.length - 1];
          if (prev.trim() !== "" && (prev.startsWith("   ") || prev.startsWith("\t") || /^\s*\[.+\]\s*$/.test(prev))) {
            diagramBuffer.unshift(processedLines.pop()!);
          } else {
            break;
          }
        }
      }
      diagramBuffer.push(line);
    } else {
      if (inDiagram) {
        if (line.trim() !== "" && (line.startsWith(" ") || line.startsWith("\t") || /^\s*[•\*\-\+]/.test(line))) {
          diagramBuffer.push(line);
          continue;
        }
        if (
          line.trim() === "" &&
          i + 1 < lines.length &&
          (isDiagramChar(lines[i + 1]) || lines[i + 1].startsWith("   ") || /^\s*[•\*\-\+]/.test(lines[i + 1]))
        ) {
          diagramBuffer.push(line);
          continue;
        }
        // Flush diagram
        processedLines.push("```diagram");
        processedLines.push(...diagramBuffer);
        processedLines.push("```");
        inDiagram = false;
        diagramBuffer = [];
      }
      processedLines.push(line);
    }
  }

  if (inDiagram) {
    processedLines.push("```diagram");
    processedLines.push(...diagramBuffer);
    processedLines.push("```");
  }
  text = processedLines.join("\n");

  // ── Step 4: Bold and Italic Normalization ─────────────────────────────────
  // Safe bold fix: moves whitespace from inside ** to outside
  text = text.replace(/(^|[^\*])\*\*([^\*\n]+?)\*\*(?=[^\*]|$)/g, (match, prefix, content) => {
    const trimmed = content.trim();
    if (!trimmed) return match;
    const leadingSpace = /^[ \t]+/.test(content) ? " " : "";
    const trailingSpace = /[ \t]+$/.test(content) ? " " : "";
    return `${prefix}${leadingSpace}**${trimmed}**${trailingSpace}`;
  });

  // Safe italic fix: moves whitespace from inside * to outside
  text = text.replace(/(^|[^\*])\*([^\*\n]+?)\*(?=[^\*]|$)/g, (match, prefix, content) => {
    const trimmed = content.trim();
    if (!trimmed) return match;
    const leadingSpace = /^[ \t]+/.test(content) ? " " : "";
    const trailingSpace = /[ \t]+$/.test(content) ? " " : "";
    return `${prefix}${leadingSpace}*${trimmed}*${trailingSpace}`;
  });

  // Safe underscore bold: __bold__
  text = text.replace(/(^|[^_])__([^_\n]+?)__(?=[^_]|$)/g, (match, prefix, content) => {
    const trimmed = content.trim();
    if (!trimmed) return match;
    const leadingSpace = /^[ \t]+/.test(content) ? " " : "";
    const trailingSpace = /[ \t]+$/.test(content) ? " " : "";
    return `${prefix}${leadingSpace}**${trimmed}**${trailingSpace}`;
  });

  // ── Step 5: Prose & List Cleanup ─────────────────────────────────────────
  // 5a. Numbered lists: "1) item" -> "1. item"
  text = text.replace(/^(\d{1,2})\)\s+/gm, "$1. ");

  // 5b. Fix bullets broken over two lines (e.g. '*' on its own line)
  text = text.replace(/^(\s*[\*\-\+])\s*\n\s*([^\n\*\-\+\|#>`~])/gm, "$1 $2");

  // 5c. Collapse multiple consecutive <br> newlines
  text = text.replace(/(<br\s*\/?>)\s*\n+/gi, "$1 ");

  // 5d. Collapse 3+ blank lines to 2
  text = text.replace(/\n{3,}/g, "\n\n");

  // ── Step 6: Table Normalization & Pandoc Repair ───────────────────────────
  const tableLines = text.split("\n");
  const finalLines: string[] = [];
  let inTable = false;
  let tableHeaderCols = 0;

  const isTableSep = (l: string): boolean => {
    const cells = l.split("|").slice(1, -1);
    return cells.length > 0 && cells.every((c) => /^\s*:?[\-\u2013\u2014]+:?\s*$/.test(c));
  };

  const normSep = (l: string): string => {
    const cells = l.split("|").slice(1, -1);
    return (
      "|" +
      cells
        .map((c) => {
          const t = c.trim();
          const left = t.startsWith(":");
          const right = t.endsWith(":") && t.length > 1;
          if (left && right) return " :---: ";
          if (left) return " :--- ";
          if (right) return " ---: ";
          return " --- ";
        })
        .join("|") +
      "|"
    );
  };

  for (let i = 0; i < tableLines.length; i++) {
    const line = tableLines[i];
    const isTLine = /\|/.test(line) && !/^```/.test(line);

    if (isTLine) {
      let trimmed = line.trim();
      if (!trimmed.startsWith("|")) trimmed = "| " + trimmed;
      if (!trimmed.endsWith("|")) trimmed = trimmed + " |";
      trimmed = trimmed.replace(/\|\|/g, "| |");

      if (!inTable) {
        if (finalLines.length > 0 && finalLines[finalLines.length - 1].trim() !== "") {
          finalLines.push("");
        }
        inTable = true;
        tableHeaderCols = trimmed.split("|").length - 2;
        finalLines.push(trimmed);

        const nextRaw = i + 1 < tableLines.length ? tableLines[i + 1].trim() : "";
        if (!isTableSep(nextRaw)) {
          finalLines.push("|" + Array(Math.max(1, tableHeaderCols)).fill(" --- ").join("|") + "|");
        }
      } else {
        if (isTableSep(trimmed)) {
          finalLines.push(normSep(trimmed));
        } else {
          const currentCols = trimmed.split("|").length - 2;
          if (tableHeaderCols > 0 && currentCols < tableHeaderCols) {
            const missing = tableHeaderCols - currentCols;
            trimmed = trimmed.slice(0, -1) + Array(missing).fill(" |").join("") + "|";
          }
          finalLines.push(trimmed);
        }
      }
    } else {
      if (inTable) {
        if (line.trim() !== "") {
          finalLines.push("");
        }
        inTable = false;
        tableHeaderCols = 0;
      }
      finalLines.push(line);
    }
  }

  text = finalLines.join("\n");

  // ── Step 7: Restore placeholders ─────────────────────────────────────────
  const sortedMath = [...mathMap].sort((a, b) => b.placeholder.localeCompare(a.placeholder));
  for (const { placeholder, original } of sortedMath) {
    text = text.split(placeholder).join(original);
  }

  const sortedCode = [...codeMap].sort((a, b) => b.placeholder.localeCompare(a.placeholder));
  for (const { placeholder, original } of sortedCode) {
    text = text.split(placeholder).join(original);
  }

  return text.trim();
}
