/**
 * lib/clipboard.ts
 * Prepares rich HTML and plain text for pasting into Microsoft Word, Google Docs, etc.
 * Converts client-side vector SVGs into high-resolution PNG data URLs so diagrams
 * paste directly into Word / Docs as embedded images without breaking.
 */

/**
 * Converts an SVG DOM element to a high-DPI PNG Data URL using HTML5 Canvas.
 */
export async function svgToPngDataUrl(svgElement: SVGSVGElement, scale = 2): Promise<string> {
  return new Promise((resolve) => {
    try {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      // Ensure SVG namespace is present
      const cleanSvg = svgString.includes('xmlns="http://www.w3.org/2000/svg"')
        ? svgString
        : svgString.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');

      const svgBlob = new Blob([cleanSvg], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobUrl = URL.createObjectURL(svgBlob);

      const img = new Image();

      // Determine dimensions
      const viewBox = svgElement.viewBox?.baseVal;
      const width = (viewBox && viewBox.width > 0 ? viewBox.width : svgElement.clientWidth || 800) * scale;
      const height = (viewBox && viewBox.height > 0 ? viewBox.height : svgElement.clientHeight || 400) * scale;

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(blobUrl);
            resolve("");
            return;
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          URL.revokeObjectURL(blobUrl);
          const dataUrl = canvas.toDataURL("image/png");
          resolve(dataUrl);
        } catch (err) {
          URL.revokeObjectURL(blobUrl);
          resolve("");
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        resolve("");
      };

      img.src = blobUrl;
    } catch (e) {
      resolve("");
    }
  });
}

/**
 * Prepares rich HTML for clipboard export with inline styles and embedded diagram images.
 */
export async function prepareClipboardData(container: HTMLElement): Promise<{ html: string; text: string }> {
  const clone = container.cloneNode(true) as HTMLElement;

  // 1. Process all diagram SVGs into embedded PNG images for Word & Docs
  const liveSvgs = Array.from(container.querySelectorAll<SVGSVGElement>("svg"));
  const cloneWrappers = Array.from(clone.querySelectorAll<HTMLElement>(".diagram-svg-wrapper, svg"));

  for (let i = 0; i < liveSvgs.length; i++) {
    const liveSvg = liveSvgs[i];
    const dataUrl = await svgToPngDataUrl(liveSvg, 2.5); // 2.5x high-res for crisp Word print/zoom

    if (dataUrl) {
      // Find matching node in clone
      const cloneSvg = clone.querySelectorAll("svg")[i];
      if (cloneSvg) {
        const wrapper = cloneSvg.closest(".diagram-svg-wrapper") || cloneSvg;
        const img = document.createElement("img");
        img.src = dataUrl;
        img.alt = "Diagram";
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.style.display = "block";
        img.style.margin = "16px auto";
        img.style.borderRadius = "8px";

        wrapper.replaceWith(img);
      }
    }
  }

  let html = clone.innerHTML;

  // 2. Add inline styles for Markdown tables (ensures borders and shading in Word / Docs)
  html = html
    .replace(/<table(?![^>]*style)/gi, '<table style="border-collapse: collapse; width: 100%; margin: 16px 0; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 11pt;"')
    .replace(/<th(?![^>]*style)/gi, '<th style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; color: #1e293b; font-weight: 700; text-align: left;"')
    .replace(/<td(?![^>]*style)/gi, '<td style="border: 1px solid #cbd5e1; padding: 8px 12px; color: #334155;"');

  // 3. Add inline styles for code blocks and preformatted text
  html = html
    .replace(/<pre(?![^>]*style)/gi, '<pre style="font-family: \'Consolas\', \'Courier New\', monospace; font-size: 10pt; line-height: 1.4; background-color: #0f172a; color: #93c5fd; padding: 14px 18px; border-radius: 8px; border: 1px solid #1e293b; overflow-x: auto; white-space: pre;"')
    .replace(/<code(?![^>]*style)/gi, '<code style="font-family: \'Consolas\', \'Courier New\', monospace; font-size: 9.5pt; background-color: rgba(148, 163, 184, 0.15); color: #38bdf8; padding: 2px 6px; border-radius: 4px;"');

  // 4. Add inline styles for KaTeX math equations
  html = html.replace(/<span class="katex-display"/gi, '<div style="text-align: center; margin: 14px 0; overflow-x: auto;" class="katex-display"');

  const text = container.innerText;

  return { html, text };
}
