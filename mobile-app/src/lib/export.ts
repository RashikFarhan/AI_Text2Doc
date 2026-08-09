/**
 * lib/export.ts (Mobile)
 * Pure-JS DOCX generation using the `docx` library (no WASM, no server).
 * The rendered HTML from markdown is parsed into structured docx elements.
 * The final .docx file is saved via Capacitor Filesystem and shared via the native Share sheet.
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, ExternalHyperlink,
  UnderlineType, convertInchesToTwip,
} from 'docx';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// ── Helpers ──────────────────────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(blob);
  });
}

// Parse inline HTML into TextRun array (handles bold, italic, code, links)
function parseInlineHtml(html: string): (TextRun | ExternalHyperlink)[] {
  const runs: (TextRun | ExternalHyperlink)[] = [];
  const div = document.createElement('div');
  div.innerHTML = html;

  function processNode(node: Node, bold = false, italic = false, underline = false, code = false) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (!text) return;
      runs.push(new TextRun({
        text,
        bold,
        italics: italic,
        underline: underline ? { type: UnderlineType.SINGLE } : undefined,
        font: code ? 'Courier New' : undefined,
        size: code ? 18 : undefined,
        color: code ? '3B82F6' : undefined,
        highlight: code ? 'cyan' : undefined,
      }));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      const isBold = bold || tag === 'strong' || tag === 'b';
      const isItalic = italic || tag === 'em' || tag === 'i';
      const isCode = code || tag === 'code';
      const isUnderline = underline || tag === 'u';

      if (tag === 'a') {
        const href = el.getAttribute('href') || '';
        const linkText = el.textContent || href;
        runs.push(new ExternalHyperlink({
          link: href,
          children: [new TextRun({ text: linkText, color: '2563EB', underline: { type: UnderlineType.SINGLE } })],
        }));
      } else if (tag === 'br') {
        runs.push(new TextRun({ text: '', break: 1 }));
      } else {
        el.childNodes.forEach(child => processNode(child, isBold, isItalic, isUnderline, isCode));
      }
    }
  }

  div.childNodes.forEach(n => processNode(n));
  return runs;
}

// Convert a DOM element tree into docx Paragraph/Table objects
function domToDocxElements(container: HTMLElement): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  function processElement(el: Element) {
    const tag = el.tagName.toLowerCase();

    if (['h1','h2','h3','h4','h5','h6'].includes(tag)) {
      const level = parseInt(tag[1]) - 1;
      const headingLevels = [
        HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6,
      ];
      elements.push(new Paragraph({
        heading: headingLevels[level],
        children: parseInlineHtml(el.innerHTML),
      }));
    } else if (tag === 'p') {
      elements.push(new Paragraph({ children: parseInlineHtml(el.innerHTML) }));
    } else if (tag === 'blockquote') {
      elements.push(new Paragraph({
        indent: { left: convertInchesToTwip(0.5) },
        children: parseInlineHtml(el.innerHTML),
      }));
    } else if (tag === 'hr') {
      elements.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' } },
        children: [],
      }));
    } else if (tag === 'pre') {
      const codeEl = el.querySelector('code');
      const text = codeEl ? codeEl.textContent || '' : el.textContent || '';
      const lines = text.split('\n');
      lines.forEach(line => {
        elements.push(new Paragraph({
          shading: { type: ShadingType.SOLID, color: '1E293B', fill: '1E293B' },
          children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 18, color: '93C5FD' })],
        }));
      });
    } else if (tag === 'ul' || tag === 'ol') {
      const isOrdered = tag === 'ol';
      let idx = 1;
      el.querySelectorAll('li').forEach(li => {
        const bullet = isOrdered ? `${idx++}. ` : '• ';
        elements.push(new Paragraph({
          indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
          children: [
            new TextRun({ text: bullet, bold: isOrdered }),
            ...parseInlineHtml(li.innerHTML.replace(/<(ul|ol)[\s\S]*<\/(ul|ol)>/gi, '')),
          ],
        }));
        // Handle nested lists
        li.querySelectorAll('li').forEach(nested => {
          elements.push(new Paragraph({
            indent: { left: convertInchesToTwip(1), hanging: convertInchesToTwip(0.25) },
            children: [new TextRun({ text: '  ◦ ' }), ...parseInlineHtml(nested.innerHTML)],
          }));
        });
      });
    } else if (tag === 'table') {
      const rows: TableRow[] = [];
      el.querySelectorAll('tr').forEach((tr, rowIdx) => {
        const cells: TableCell[] = [];
        tr.querySelectorAll('th, td').forEach(cell => {
          cells.push(new TableCell({
            children: [new Paragraph({ children: parseInlineHtml(cell.innerHTML) })],
            shading: rowIdx === 0 ? { type: ShadingType.SOLID, color: '1E3A5F', fill: '1E3A5F' } : undefined,
          }));
        });
        if (cells.length > 0) rows.push(new TableRow({ children: cells }));
      });
      if (rows.length > 0) {
        elements.push(new Table({
          rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: '334155' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: '334155' },
            left: { style: BorderStyle.SINGLE, size: 4, color: '334155' },
            right: { style: BorderStyle.SINGLE, size: 4, color: '334155' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '334155' },
            insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '334155' },
          },
        }));
      }
    } else {
      // Generic container — recurse into children
      el.children && Array.from(el.children).forEach(processElement);
    }
  }

  Array.from(container.children).forEach(processElement);
  return elements;
}

// ── Main Export Function ─────────────────────────────────────────────────────

export async function generateDocx(html: string, rawText: string): Promise<string | null> {
  try {
    // Parse HTML into a temporary container
    const container = document.createElement('div');
    container.innerHTML = html;

    const children = domToDocxElements(container);

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: 'Calibri', size: 24, color: '1E293B' },
          },
          heading1: {
            run: { font: 'Calibri', size: 36, bold: true, color: '1E40AF' },
            paragraph: { spacing: { after: 200, before: 240 } },
          },
          heading2: {
            run: { font: 'Calibri', size: 30, bold: true, color: '1D4ED8' },
            paragraph: { spacing: { after: 160, before: 200 } },
          },
          heading3: {
            run: { font: 'Calibri', size: 26, bold: true, color: '2563EB' },
            paragraph: { spacing: { after: 120, before: 160 } },
          },
        },
      },
      sections: [{ children }],
    });

    const blob = await Packer.toBlob(doc);
    const base64 = await blobToBase64(blob);
    const fileName = `Text2Doc_${Date.now()}.docx`;

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });

    return savedFile.uri;
  } catch (err) {
    console.error('[export] DOCX generation error:', err);
    throw err;
  }
}

export async function shareFile(uri: string) {
  try {
    await Share.share({
      title: 'Text2Doc Export',
      url: uri,
      dialogTitle: 'Share or save your document',
    });
  } catch (err) {
    console.error('[export] Share error:', err);
  }
}
