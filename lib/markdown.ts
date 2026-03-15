import MarkdownIt from "markdown-it";
// @ts-expect-error markdown-it-katex has no type declarations
import mk from "markdown-it-katex";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  // typographer MUST be false — it replaces quotes/dashes/ellipses
  // which corrupts LaTeX symbols like \text{...} and prime marks
  typographer: false,
});

// Register KaTeX plugin — processes $...$ and $$...$$ after markdown parsing
md.use(mk);

export function renderMarkdown(text: string): string {
  if (!text) return "";
  return md.render(text);
}
