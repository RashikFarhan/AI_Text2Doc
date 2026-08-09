const fs = require('fs');

function patch(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Strip hardcoded dark background and blue accents, replacing with currentColor
  code = code.replace(/fill="#0b0f19"/g, 'fill="transparent"');
  code = code.replace(/fill="#1e293b"/g, 'fill="transparent"');
  code = code.replace(/fill="#f8fafc"/g, 'fill="currentColor"');
  code = code.replace(/fill="#60a5fa"/g, 'fill="currentColor"');
  code = code.replace(/fill="#93c5fd"/g, 'fill="currentColor"');
  code = code.replace(/fill="#cbd5e1"/g, 'fill="currentColor"');
  code = code.replace(/fill="#34d399"/g, 'fill="currentColor"');
  code = code.replace(/fill="url\(#boxBgGrad\)"/g, 'fill="transparent"');
  code = code.replace(/fill="url\(#titleBgGrad\)"/g, 'fill="transparent"');
  code = code.replace(/fill="#1d4ed8"\s+fill-opacity="0.25"/g, 'fill="transparent"');
  code = code.replace(/fill="#059669"\s+fill-opacity="0.25"/g, 'fill="transparent"');
  
  code = code.replace(/stroke="#3b82f6"/g, 'stroke="currentColor"');
  code = code.replace(/stroke="#1e293b"/g, 'stroke="currentColor"');
  code = code.replace(/stroke="#60a5fa"/g, 'stroke="currentColor"');
  code = code.replace(/stroke="#334155"/g, 'stroke="currentColor"');
  
  // Remove linear gradients in defs (but keep markers!)
  code = code.replace(/<linearGradient[\s\S]*?<\/linearGradient>/g, '');
  
  fs.writeFileSync(file, code);
  console.log('Patched', file);
}

patch('lib/diagram.ts');
patch('mobile-app/src/lib/diagram.ts');
