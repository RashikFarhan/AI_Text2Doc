const text = `
*
First item
-
Second item
*
Third item

**Bold text ** and *Italic text *
*List without space
**bold** *
*italic *
***bold italic***
`;

// 1. Fix bullet points separated by newline
// e.g.
// *
// Item
let out = text.replace(/^([\*\-\+])\s*\n\s*/gm, '$1 ');

// 2. Fix trailing spaces inside bold asterisks: "**bold **" -> "**bold** "
out = out.replace(/\*\*([^\*\n]+?)\s+\*\*/g, '**$1** ');

// 3. Fix trailing spaces inside italic asterisks: "*italic *" -> "*italic* "
// only if it's not part of bold (**). We use negative lookbehinds/lookaheads or just standard regex.
out = out.replace(/(^|[^\*])\*([^\*\n]+?)\s+\*(?=[^\*]|$)/g, '$1*$2* ');

// 4. Missing space after bullet (can cause it to be treated as plain text or emphasis)
// *bullet -> * bullet
out = out.replace(/^([\*\-\+])([^\s\*\-\+])/gm, '$1 $2');

console.log(out);
