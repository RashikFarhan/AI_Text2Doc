const text = `
**Client Name:** [Student to fill]
**Address:** [Student to fill]
`;

const regex = /(^|[^\*])\*([^\*\n]+?)\s+\*(?=[^\*]|$)/g;

let match;
while ((match = regex.exec(text)) !== null) {
  console.log("MATCH:", JSON.stringify(match[0]));
  console.log("Group 1:", JSON.stringify(match[1]));
  console.log("Group 2:", JSON.stringify(match[2]));
}
