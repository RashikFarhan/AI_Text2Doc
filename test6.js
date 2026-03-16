const text = `
**Client Name:** [Student to fill]
**Address:** [Student to fill]
`;

let out = text;
out = out.replace(/\*\*([^\*\n]+?)[ \t]+\*\*/g, "**$1** ");
out = out.replace(/(^|[^\*])\*([^\*\n]+?)[ \t]+\*(?=[^\*]|$)/g, "$1*$2* ");
console.log("AFTER FIX:", JSON.stringify(out));
