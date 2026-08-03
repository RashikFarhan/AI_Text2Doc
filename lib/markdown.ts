import MarkdownIt from "markdown-it";
// @ts-expect-error markdown-it-katex has no type declarations
import mk from "markdown-it-katex";
import { renderDiagramToSvg } from "./diagram";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  // typographer MUST be false — it replaces quotes/dashes/ellipses
  // which corrupts LaTeX symbols like \text{...} and prime marks
  typographer: false,
});

// Register KaTeX plugin with non-throwing error handling
md.use(mk, {
  throwOnError: false,
  errorColor: "#f87171",
});

// Custom fence renderer for ASCII & Unicode diagrams
const defaultFence =
  md.renderer.rules.fence ||
  function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.fence = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const info = token.info ? token.info.trim().toLowerCase() : "";

  if (["diagram", "svgbob", "ascii", "flowchart", "box"].includes(info)) {
    try {
      const svg = renderDiagramToSvg(token.content);
      if (svg) return svg;
    } catch (e) {
      console.error("Diagram render error:", e);
    }
  }

  return defaultFence(tokens, idx, options, env, self);
};

export function renderMarkdown(text: string): string {
  if (!text) return "";
  return md.render(text);
}
