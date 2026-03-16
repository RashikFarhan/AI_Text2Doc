const text = `
**Client Name:** [Student to fill]
**Address:** [Student to fill]
**Phone Number:** [Student to fill]
**Date (dd/mm/yyyy):** 15/03/2026
**Worker name:** Noor Mashraf
**Job Details:** Design of a Reinforced Concrete Spread Foundation
**Two (2) viable options for the design of civil concrete foundation structure.**
**Option 1: Isolated Square Spread Footing**
`;

let out = text;
// 3a. Trim trailing whitespace
out = out.split("\n").map((l) => l.trimEnd()).join("\n");

// 3b. "Title:" bare headings → "## Title"
out = out.replace(
  /^([A-Z][^\n:]{0,80}):\s*$/gm,
  (_, label) => `## ${label.trim()}`
);

// 3c. "1) item" → "1. item"
out = out.replace(/^(\d{1,2})\)\s+/gm, "$1. ");

// 3d. Fix bullets broken over two lines (e.g. '*' on its own line)
out = out.replace(/^(\s*[\*\-\+])\s*\n\s*([^\n\*\-\+\|])/gm, "$1 $2");

// 3e. Fix whitespace inside bold/italic tags that break markdown parsers.
out = out.replace(/\*\*([^\*\n]+?)\s+\*\*/g, "**$1** ");
out = out.replace(/(^|[^\*])\*([^\*\n]+?)\s+\*(?=[^\*]|$)/g, "$1*$2* ");

// 3f. Collapse 3+ blank lines → 2
out = out.replace(/\n{3,}/g, "\n\n");

// 3g. Trim leading & trailing whitespace per line
out = out.split("\n").map((l) => l.trimStart().trimEnd()).join("\n");

console.log("== OUT ==");
console.log(out);
