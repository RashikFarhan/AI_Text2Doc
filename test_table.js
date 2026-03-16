const text = `| Category | Details |
| --- | --- |
| **Scheduling** | **Week 1:** Geotechnical data review... <br>

<br>**Week 2:** Structural analysis... <br>

<br>**Week 3:** AutoCAD detailing... <br>

<br>**Week 4:** Final design... submission. |`;

const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({ breaks: true });
console.log(md.render(text));
