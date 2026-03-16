const text = `
| Category | Details |
| --- | --- |
| **Scheduling** | **Week 1:** Geotechnical data review.<br>

<br>**Week 2:** Structural analysis.<br>

<br>**Week 3:** AutoCAD detailing.<br>

<br>**Week 4:** Final design. |
`;

let out = text;
out = out.replace(/(<br>)\s+/gi, '$1');
console.log(out);
