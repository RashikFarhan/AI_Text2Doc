const text = `
*
First item
-
  Second item
*

Third item (too many newlines, probably not a bullet split)

    *
Indented piece

**Bold text **
*Italic text *

*List without space
`;

let out = text;
out = out.replace(/^(\s*[\*\-\+])\s*\n\s*([^\n\*\-\+\|])/gm, '$1 $2');
out = out.replace(/\*\*([^\*\n]+?)\s+\*\*/g, '**$1** ');
out = out.replace(/(^|[^\*])\*([^\*\n]+?)\s+\*(?=[^\*]|$)/g, '$1*$2* ');
out = out.replace(/^(\s*[\*\-\+])([^\s\n\*\-\+\|])/gm, '$1 $2');

console.log("== OUT ==");
console.log(out);
