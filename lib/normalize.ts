/**
 * normalizeText
 * Cleans and converts AI-generated text into consistent Markdown,
 * using a placeholder strategy to protect LaTeX and a line-by-line
 * pass to repair pipe tables for Pandoc compatibility.
 */

interface MathEntry {
  placeholder: string;
  original: string;
}

const TABLE_LINE   = /^\s*\|/;
/** A row whose every cell is only colons + dash-like chars */
const DASH_CELL    = /^\s*:?[\-\u2013\u2014]+:?\s*$/;

function isTableLine(line: string): boolean {
  return TABLE_LINE.test(line);
}

function isSeparatorLine(line: string): boolean {
  if (!isTableLine(line)) return false;
  const cells = line.split("|").slice(1, -1);
  return cells.length > 0 && cells.every((c) => DASH_CELL.test(c));
}

function normalizeSeparatorLine(line: string): string {
  const cells = line.split("|").slice(1, -1);
  const fixed = cells.map((cell) => {
    const t = cell.trim();
    const l = t.startsWith(":");
    const r = t.endsWith(":") && t.length > 1;
    if (l && r) return " :---: ";
    if (l)      return " :--- ";
    if (r)      return " ---: ";
    return " --- ";
  });
  return "|" + fixed.join("|") + "|";
}

export function normalizeText(input: string): string {
  if (!input) return "";

  const mathMap: MathEntry[] = [];
  let counter = 0;

  // ── Step 1: Protect $$ ... $$ block math ──────────────────────────────────
  let text = input.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    const ph = `@@MATH_BLOCK_${counter++}@@`;
    mathMap.push({ placeholder: ph, original: match });
    return ph;
  });

  // ── Step 2: Protect $ ... $ inline math ───────────────────────────────────
  text = text.replace(/\$([^\$\n]+?)\$/g, (match) => {
    const ph = `@@MATH_INLINE_${counter++}@@`;
    mathMap.push({ placeholder: ph, original: match });
    return ph;
  });

  // ── Step 3: Basic prose cleanup ────────────────────────────────────────────

  // 3a. Trim trailing whitespace
  text = text.split("\n").map((l) => l.trimEnd()).join("\n");

  // 3b. "Title:" bare headings → "## Title"
  text = text.replace(
    /^([A-Z][^\n:]{0,80}):\s*$/gm,
    (_, label) => `## ${label.trim()}`
  );

  // 3c. "1) item" → "1. item"
  text = text.replace(/^(\d{1,2})\)\s+/gm, "$1. ");

  // 3d. Fix bullets broken over two lines (e.g. '*' on its own line)
  // Matches " * \n text" and joins them to "* text"
  text = text.replace(/^(\s*[\*\-\+])\s*\n\s*([^\n\*\-\+\|])/gm, "$1 $2");

  // 3e. Fix whitespace inside bold/italic tags that break markdown parsers.
  // AI sometimes outputs "**bold **" or "*italic *". Pandoc/markdown-it requires
  // no internal boundary space. This pulls trailing spaces OUTSIDE the asterisks.
  text = text.replace(/\*\*([^\*\n]+?)\s+\*\*/g, "**$1** ");
  text = text.replace(/(^|[^\*])\*([^\*\n]+?)\s+\*(?=[^\*]|$)/g, "$1*$2* ");

  // 3f. Collapse 3+ blank lines → 2
  text = text.replace(/\n{3,}/g, "\n\n");

  // 3g. Trim leading & trailing whitespace per line
  text = text.split("\n").map((l) => l.trimStart().trimEnd()).join("\n");

  // ── Step 4: Pipe-table repair (Pandoc-safe) ────────────────────────────────
  //
  // Problems markdown-it forgives but Pandoc rejects:
  //   (a) Separator uses em-dashes instead of ASCII hyphens
  //   (b) No blank line before the table
  //   (c) Empty cells written as "||" instead of "| |"
  //   (d) Separator row missing (only after HEADER, not between data rows)
  //
  // CRITICAL: only inject a missing separator after the FIRST row of each
  // new table block.  Injecting after every row is what created the bug.

  const lines = text.split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    // (c) Fix empty adjacent pipes everywhere — safe for non-table lines too
    const line = lines[i].replace(/\|\|/g, "| |");

    if (!isTableLine(line)) {
      out.push(line);
      continue;
    }

    // ── This line is part of a table ──

    // (b) Ensure a blank line before the very first row of each table block.
    //     "First row" = the immediately preceding output line is non-table & non-blank.
    const prevOut = out.length > 0 ? out[out.length - 1] : "";
    if (prevOut.trim() !== "" && !isTableLine(prevOut)) {
      out.push("");
    }

    // (a) Normalise separator rows with em/en-dashes
    if (isSeparatorLine(line)) {
      out.push(normalizeSeparatorLine(line));
      continue;
    }

    // Regular table row — push as-is
    out.push(line);

    // (d) Missing separator: only inject after the HEADER row.
    //
    //     After pushing, the last output line IS this row.
    //     The row before it (out[out.length - 2]) is either:
    //       • ""  — blank line we just injected  → this IS the header row
    //       • a non-table line                   → this IS the header row
    //       • a table line (data/sep)            → this is NOT the header row
    //
    //     We only inject a separator when this row IS the header AND the
    //     next line in the input is a table row that's not already a separator.

    const rowBeforeThis = out.length >= 2 ? out[out.length - 2] : "";
    const thisIsHeader  = rowBeforeThis.trim() === "" || !isTableLine(rowBeforeThis);

    if (thisIsHeader) {
      const nextRaw  = i + 1 < lines.length ? lines[i + 1].replace(/\|\|/g, "| |") : "";
      const nextIsTableData = isTableLine(nextRaw) && !isSeparatorLine(nextRaw);

      if (nextIsTableData) {
        // Count columns from the header row we just pushed
        const colCount = line.split("|").length - 2;
        if (colCount > 0) {
          out.push("|" + Array(colCount).fill(" --- ").join("|") + "|");
        }
      }
    }
  }

  text = out.join("\n");

  // ── Step 5: Restore math placeholders ─────────────────────────────────────
  const sorted = [...mathMap].sort((a, b) =>
    b.placeholder.localeCompare(a.placeholder)
  );
  for (const { placeholder, original } of sorted) {
    text = text.split(placeholder).join(original);
  }

  return text.trim();
}
