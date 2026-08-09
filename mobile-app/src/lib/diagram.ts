/**
 * lib/diagram.ts
 * Client-side ASCII & Unicode diagram to SVG converter.
 * Converts ASCII/Unicode flowcharts, multi-column box cards, and branching trees
 * into crisp, responsive vector SVG diagrams for preview and export.
 */

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Universal diagram to SVG dispatcher
 */
export function renderDiagramToSvg(rawText: string): string {
  if (!rawText || !rawText.trim()) return "";

  const trimmed = rawText.trim();
  const lines = trimmed.split("\n").map((l) => l.trimEnd());

  // 1. Check for Multi-Column Box / Master Card (e.g. MASTER PRE-PROCESSING LAYER)
  if (
    lines.some((l) => /^[┌\+].*[┐\+]$/.test(l.trim())) &&
    lines.some((l) => /[├\+].*[┤\+]/.test(l.trim()))
  ) {
    const boxSvg = tryRenderMultiColumnBox(lines);
    if (boxSvg) return boxSvg;
  }

  // 2. Check for Branching Decision Tree (e.g. EXTRACTED COEFFICIENT MATRIX -> MODE A / MODE B)
  if (
    lines.some((l) => /[▼▲↓↑]/.test(l)) &&
    lines.some((l) => /[┌┬┴┐╔╦╩╗]/.test(l)) &&
    lines.some((l) => /\[.+\]/.test(l))
  ) {
    const treeSvg = tryRenderBranchingTree(lines);
    if (treeSvg) return treeSvg;
  }

  // 3. Check for Sequential Step Flowchart (e.g. [ Step 1 ] ──► [ Step 2 ])
  if (
    lines.some((l) => /\[.+\]/.test(l) && /(?:──►|──>|-->|==>|->|◄──|<--|<==|<-|[►◄])/.test(l))
  ) {
    const flowSvg = tryRenderFlowchart(lines);
    if (flowSvg) return flowSvg;
  }

  // 4. Fallback: High-Fidelity Monospaced SVG Canvas
  return renderMonospaceSvgCanvas(lines);
}

/**
 * Renders Sequential Step Flowcharts ([ Node 1 ] ──► [ Node 2 ])
 */
function tryRenderFlowchart(lines: string[]): string | null {
  interface NodeRow {
    nodes: string[];
    direction: "right" | "left";
  }

  const rows: NodeRow[] = [];

  for (const line of lines) {
    const nodeMatches = [...line.matchAll(/\[\s*([^\]]+?)\s*\]/g)];
    if (nodeMatches.length > 0) {
      const hasLeftArrow = /◄──|<--|<==|<-|◄/.test(line);
      rows.push({
        nodes: nodeMatches.map((m) => m[1].trim()),
        direction: hasLeftArrow ? "left" : "right",
      });
    }
  }

  if (rows.length === 0) return null;

  const nodeWidth = 220;
  const nodeHeight = 46;
  const nodeGapX = 50;
  const rowGapY = 50;
  const padding = 24;

  const maxNodesInRow = Math.max(...rows.map((r) => r.nodes.length));
  const totalWidth = padding * 2 + maxNodesInRow * nodeWidth + (maxNodesInRow - 1) * nodeGapX;
  const totalHeight = padding * 2 + rows.length * nodeHeight + (rows.length - 1) * rowGapY;

  const svgElements: string[] = [];

  rows.forEach((row, rowIndex) => {
    const y = padding + rowIndex * (nodeHeight + rowGapY);
    const count = row.nodes.length;

    row.nodes.forEach((nodeText, nodeIndex) => {
      const x = padding + nodeIndex * (nodeWidth + nodeGapX);

      // Node Box
      svgElements.push(`
  <g class="flow-node">
    <rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" rx="8" ry="8" fill="transparent" stroke="currentColor" stroke-width="1.5"/>
    <text x="${x + nodeWidth / 2}" y="${y + nodeHeight / 2 + 5}" text-anchor="middle" fill="currentColor" font-size="12" font-weight="600">${escapeXml(nodeText)}</text>
  </g>`);

      // Horizontal Arrows
      if (nodeIndex < count - 1) {
        if (row.direction === "right") {
          const arrowStartX = x + nodeWidth;
          const arrowEndX = x + nodeWidth + nodeGapX;
          const arrowY = y + nodeHeight / 2;
          svgElements.push(`
  <line x1="${arrowStartX}" y1="${arrowY}" x2="${arrowEndX - 6}" y2="${arrowY}" stroke="currentColor" stroke-width="2" marker-end="url(#diag-arrow-right)"/>`);
        } else if (row.direction === "left") {
          const arrowStartX = x + nodeWidth + nodeGapX;
          const arrowEndX = x + nodeWidth;
          const arrowY = y + nodeHeight / 2;
          svgElements.push(`
  <line x1="${arrowStartX}" y1="${arrowY}" x2="${arrowEndX + 6}" y2="${arrowY}" stroke="currentColor" stroke-width="2" marker-end="url(#diag-arrow-left)"/>`);
        }
      }
    });

    // Vertical Connector from row 0 to row 1
    if (rowIndex === 0 && rows.length > 1) {
      const lastNodeX = padding + (count - 1) * (nodeWidth + nodeGapX) + nodeWidth / 2;
      const startY = y + nodeHeight;
      const endY = y + nodeHeight + rowGapY;
      svgElements.push(`
  <line x1="${lastNodeX}" y1="${startY}" x2="${lastNodeX}" y2="${endY - 6}" stroke="currentColor" stroke-width="2" marker-end="url(#diag-arrow-down)"/>`);
    }
  });

  return `
<div class="diagram-svg-wrapper">
<svg viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="diagram-svg" style="max-width: ${totalWidth}px;">
  <defs>
    <marker id="diag-arrow-right" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="currentColor"/>
    </marker>
    <marker id="diag-arrow-left" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 10 1 L 0 5 L 10 9 z" fill="currentColor"/>
    </marker>
    <marker id="diag-arrow-down" viewBox="0 0 10 10" refX="5" refY="6" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 1 0 L 5 10 L 9 0 z" fill="currentColor"/>
    </marker>
  </defs>
  <rect x="2" y="2" width="${totalWidth - 4}" height="${totalHeight - 4}" rx="12" ry="12" fill="transparent" stroke="currentColor" stroke-width="1.5"/>
  ${svgElements.join("\n")}
</svg>
</div>`;
}

/**
 * Renders Multi-Column Box Cards (e.g. Master Pre-processing Layer)
 */
function tryRenderMultiColumnBox(lines: string[]): string | null {
  const contentLines: string[] = [];
  for (const line of lines) {
    if (/^[┌\+─═\s]+[┐\+]$/.test(line.trim())) continue;
    if (/^[├\+─═┬┴┼\s]+[┤\+]$/.test(line.trim())) continue;
    if (/^[└\+─═\s]+[┘\+]$/.test(line.trim())) continue;

    // Extract text between | or │
    const stripped = line.replace(/^[│\|]/, "").replace(/[│\|]$/, "");
    contentLines.push(stripped);
  }

  if (contentLines.length === 0) return null;

  // First line is usually title
  const title = contentLines[0].trim();
  const remaining = contentLines.slice(1);

  // Split into left and right columns if | or │ is present
  const leftCol: string[] = [];
  const rightCol: string[] = [];

  for (const line of remaining) {
    if (line.includes("│") || line.includes("|")) {
      const parts = line.split(/[│\|]/);
      leftCol.push(parts[0].trim());
      if (parts[1]) rightCol.push(parts[1].trim());
    } else {
      leftCol.push(line.trim());
    }
  }

  // Find column sub-headers if present
  let col1Header = "";
  let col2Header = "";
  const col1Items: string[] = [];
  const col2Items: string[] = [];

  leftCol.forEach((item) => {
    if (!item) return;
    if (!col1Header && !item.startsWith("•") && !item.startsWith("*")) {
      col1Header = item;
    } else {
      col1Items.push(item);
    }
  });

  rightCol.forEach((item) => {
    if (!item) return;
    if (!col2Header && !item.startsWith("•") && !item.startsWith("*")) {
      col2Header = item;
    } else {
      col2Items.push(item);
    }
  });

  const totalWidth = 820;
  const headerHeight = 44;
  const subHeaderHeight = col1Header || col2Header ? 40 : 0;
  const maxItems = Math.max(col1Items.length, col2Items.length, 1);
  const totalHeight = headerHeight + subHeaderHeight + maxItems * 26 + 40;

  return `
<div class="diagram-svg-wrapper">
<svg viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="diagram-svg" style="max-width: ${totalWidth}px;">
  <defs>
    
    
  </defs>

  <rect x="2" y="2" width="${totalWidth - 4}" height="${totalHeight - 4}" rx="10" ry="10" fill="transparent" stroke="currentColor" stroke-width="1.5"/>

  <!-- Title Header -->
  <path d="M 2 12 Q 2 2 12 2 L ${totalWidth - 12} 2 Q ${totalWidth - 2} 2 ${totalWidth - 2} 12 L ${totalWidth - 2} ${headerHeight} L 2 ${headerHeight} Z" fill="transparent" stroke="currentColor" stroke-width="1"/>
  <text x="${totalWidth / 2}" y="28" text-anchor="middle" fill="currentColor" font-size="14" font-weight="700" letter-spacing="1.5">${escapeXml(title)}</text>

  ${
    col1Header || col2Header
      ? `
  <line x1="2" y1="${headerHeight + subHeaderHeight}" x2="${totalWidth - 2}" y2="${headerHeight + subHeaderHeight}" stroke="currentColor" stroke-width="1"/>
  <line x1="${totalWidth / 2}" y1="${headerHeight}" x2="${totalWidth / 2}" y2="${totalHeight - 2}" stroke="currentColor" stroke-width="1"/>
  <text x="${totalWidth / 4}" y="${headerHeight + 25}" text-anchor="middle" fill="currentColor" font-size="13" font-weight="600">${escapeXml(col1Header)}</text>
  <text x="${(3 * totalWidth) / 4}" y="${headerHeight + 25}" text-anchor="middle" fill="currentColor" font-size="13" font-weight="600">${escapeXml(col2Header)}</text>`
      : `<line x1="${totalWidth / 2}" y1="${headerHeight}" x2="${totalWidth / 2}" y2="${totalHeight - 2}" stroke="currentColor" stroke-width="1"/>`
  }

  <!-- Left Column Items -->
  <g fill="currentColor" font-size="13">
    ${col1Items.map((item, idx) => `<text x="24" y="${headerHeight + subHeaderHeight + 28 + idx * 24}">${escapeXml(item)}</text>`).join("\n    ")}
  </g>

  <!-- Right Column Items -->
  <g fill="currentColor" font-size="13">
    ${col2Items.map((item, idx) => `<text x="${totalWidth / 2 + 24}" y="${headerHeight + subHeaderHeight + 28 + idx * 24}">${escapeXml(item)}</text>`).join("\n    ")}
  </g>
</svg>
</div>`;
}

/**
 * Renders Branching Decision Trees (Root -> Left & Right Cards)
 */
function tryRenderBranchingTree(lines: string[]): string | null {
  let rootTitle = "";
  let leftTitle = "";
  let rightTitle = "";
  const leftBullets: string[] = [];
  const rightBullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for root title (single bracketed item on a line before fork)
    if (/^\s*\[\s*([^\]]+?)\s*\]\s*$/.test(line) && !rootTitle) {
      const m = line.match(/^\s*\[\s*([^\]]+?)\s*\]\s*$/);
      if (m) rootTitle = m[1].trim();
      continue;
    }

    // Check for child headers line with two bracketed items: [ MODE A... ]  [ MODE B... ]
    const cardHeaders = [...line.matchAll(/\[\s*([^\]]+?)\s*\]/g)];
    if (cardHeaders.length >= 2 && !leftTitle && !rightTitle) {
      leftTitle = cardHeaders[0][1].trim();
      rightTitle = cardHeaders[1][1].trim();
      continue;
    }

    // Check for bullet items across columns
    if (line.includes("•") || line.includes("*")) {
      const splitMatch = line.search(/[ \t]{4,}|\s*•\s*[A-Z]/);
      if (line.indexOf("•") !== line.lastIndexOf("•")) {
        const secondBulletIdx = line.indexOf("•", line.indexOf("•") + 1);
        leftBullets.push(line.slice(0, secondBulletIdx).trim());
        rightBullets.push(line.slice(secondBulletIdx).trim());
      } else {
        const parts = line.split(/[ \t]{4,}/);
        if (parts.length >= 2) {
          if (parts[0].trim()) leftBullets.push(parts[0].trim());
          if (parts[1].trim()) rightBullets.push(parts[1].trim());
        } else if (parts.length === 1 && parts[0].trim()) {
          leftBullets.push(parts[0].trim());
        }
      }
    }
  }

  if (!rootTitle) rootTitle = "DECISION TREE";
  if (!leftTitle) leftTitle = "MODE A";
  if (!rightTitle) rightTitle = "MODE B";

  const totalWidth = 840;
  const rootWidth = 320;
  const rootHeight = 44;
  const cardWidth = 380;
  const cardHeight = Math.max(leftBullets.length, rightBullets.length, 3) * 26 + 60;

  const rootX = (totalWidth - rootWidth) / 2;
  const rootY = 24;

  const stemEndY = rootY + rootHeight + 24;
  const forkY = stemEndY;

  const leftCardX = 24;
  const rightCardX = totalWidth - cardWidth - 24;
  const cardsY = forkY + 30;

  const leftCenter = leftCardX + cardWidth / 2;
  const rightCenter = rightCardX + cardWidth / 2;

  const totalHeight = cardsY + cardHeight + 24;

  return `
<div class="diagram-svg-wrapper">
<svg viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="diagram-svg" style="max-width: ${totalWidth}px;">
  <defs>
    <marker id="diag-arrow-down-tree" viewBox="0 0 10 10" refX="5" refY="6" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 1 0 L 5 10 L 9 0 z" fill="currentColor"/>
    </marker>
  </defs>

  <rect x="2" y="2" width="${totalWidth - 4}" height="${totalHeight - 4}" rx="12" ry="12" fill="transparent" stroke="currentColor" stroke-width="1.5"/>

  <!-- Root Node -->
  <rect x="${rootX}" y="${rootY}" width="${rootWidth}" height="${rootHeight}" rx="8" ry="8" fill="transparent" stroke="currentColor" stroke-width="1.5"/>
  <text x="${totalWidth / 2}" y="${rootY + 27}" text-anchor="middle" fill="currentColor" font-size="13" font-weight="700" letter-spacing="1">${escapeXml(rootTitle)}</text>

  <!-- Connectors -->
  <line x1="${totalWidth / 2}" y1="${rootY + rootHeight}" x2="${totalWidth / 2}" y2="${stemEndY}" stroke="currentColor" stroke-width="2"/>
  <path d="M ${leftCenter} ${cardsY - 6} L ${leftCenter} ${forkY} L ${rightCenter} ${forkY} L ${rightCenter} ${cardsY - 6}" fill="none" stroke="currentColor" stroke-width="2"/>
  <line x1="${leftCenter}" y1="${cardsY - 10}" x2="${leftCenter}" y2="${cardsY}" stroke="currentColor" stroke-width="2" marker-end="url(#diag-arrow-down-tree)"/>
  <line x1="${rightCenter}" y1="${cardsY - 10}" x2="${rightCenter}" y2="${cardsY}" stroke="currentColor" stroke-width="2" marker-end="url(#diag-arrow-down-tree)"/>

  <!-- Left Card -->
  <g class="tree-card">
    <rect x="${leftCardX}" y="${cardsY}" width="${cardWidth}" height="${cardHeight}" rx="8" ry="8" fill="transparent" stroke="currentColor" stroke-width="1.5"/>
    <rect x="${leftCardX}" y="${cardsY}" width="${cardWidth}" height="36" rx="8" ry="8" fill="transparent" stroke="currentColor" stroke-width="1"/>
    <text x="${leftCenter}" y="${cardsY + 23}" text-anchor="middle" fill="currentColor" font-size="12" font-weight="700">${escapeXml(leftTitle)}</text>
    <g fill="currentColor" font-size="12">
      ${leftBullets.map((it, idx) => `<text x="${leftCardX + 16}" y="${cardsY + 62 + idx * 24}">${escapeXml(it)}</text>`).join("\n      ")}
    </g>
  </g>

  <!-- Right Card -->
  <g class="tree-card">
    <rect x="${rightCardX}" y="${cardsY}" width="${cardWidth}" height="${cardHeight}" rx="8" ry="8" fill="transparent" stroke="currentColor" stroke-width="1.5"/>
    <rect x="${rightCardX}" y="${cardsY}" width="${cardWidth}" height="36" rx="8" ry="8" fill="transparent" stroke="currentColor" stroke-width="1"/>
    <text x="${rightCenter}" y="${cardsY + 23}" text-anchor="middle" fill="currentColor" font-size="12" font-weight="700">${escapeXml(rightTitle)}</text>
    <g fill="currentColor" font-size="12">
      ${rightBullets.map((it, idx) => `<text x="${rightCardX + 16}" y="${cardsY + 62 + idx * 24}">${escapeXml(it)}</text>`).join("\n      ")}
    </g>
  </g>
</svg>
</div>`;
}

/**
 * Fallback: Monospaced Vector Canvas (Guarantees no font wrapping or border displacement)
 */
function renderMonospaceSvgCanvas(lines: string[]): string {
  const charWidth = 8.5;
  const lineHeight = 20;
  const paddingX = 20;
  const paddingY = 20;

  const maxLen = Math.max(...lines.map((l) => l.length), 40);
  const totalWidth = Math.min(900, Math.max(500, maxLen * charWidth + paddingX * 2));
  const totalHeight = lines.length * lineHeight + paddingY * 2;

  return `
<div class="diagram-svg-wrapper">
<svg viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="diagram-svg diagram-mono" style="max-width: ${totalWidth}px; font-family: 'Geist Mono', 'Fira Code', 'JetBrains Mono', Consolas, monospace;">
  <rect x="2" y="2" width="${totalWidth - 4}" height="${totalHeight - 4}" rx="8" ry="8" fill="transparent" stroke="currentColor" stroke-width="1.5"/>
  <g fill="currentColor" font-size="13" line-height="1.5">
    ${lines.map((l, i) => `<text x="${paddingX}" y="${paddingY + 14 + i * lineHeight}" xml:space="preserve">${escapeXml(l)}</text>`).join("\n    ")}
  </g>
</svg>
</div>`;
}
