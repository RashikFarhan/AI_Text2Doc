const text = `
| Category | Details |
| --- | --- |
| **Scheduling** | **Week 1:** Geotechnical data review.<br>

<br>**Week 2:** Structural analysis.<br>

<br>**Week 3:** AutoCAD detailing.<br>

<br>**Week 4:** Final design. |
`;

let out = text;
// Replace <br> followed by any amount of whitespace/newlines, followed by optional <br>s
out = out.replace(/<br>\s*(?:<br>\s*)*/gi, '<br>');
console.log(out);
