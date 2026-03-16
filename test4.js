const text = `
**Client Name:** [Student to fill]
**Address:** [Student to fill]
`;

let out = text;
console.log("INITIAL:", JSON.stringify(out));
out = out.split("\n").map((l) => l.trimEnd()).join("\n");
console.log("AFTER 3A:", JSON.stringify(out));

out = out.replace(/^(\s*[\*\-\+])\s*\n\s*([^\n\*\-\+\|])/gm, "$1 $2");
console.log("AFTER 3D (BULLETS):", JSON.stringify(out));

out = out.replace(/\*\*([^\*\n]+?)\s+\*\*/g, "**$1** ");
console.log("AFTER 3E (BOLD):", JSON.stringify(out));

out = out.replace(/(^|[^\*])\*([^\*\n]+?)\s+\*(?=[^\*]|$)/g, "$1*$2* ");
console.log("AFTER 3E (ITALIC):", JSON.stringify(out));
