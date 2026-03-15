const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 5000;

// Absolute path to the reference template — resolved relative to this file
// so it works regardless of what directory the server is started from.
const TEMPLATE_PATH = path.join(__dirname, 'template', 'template.docx');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.post('/export', (req, res) => {
  const { text } = req.body;

  if (typeof text !== 'string') {
    return res.status(400).send('Invalid or missing text provided');
  }

  // Isolated temp directory per request
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pandoc-export-'));
  const inputPath  = path.join(tempDir, 'temp.md');
  const outputPath = path.join(tempDir, 'output.docx');

  try {
    fs.writeFileSync(inputPath, text, 'utf8');

    // Build pandoc command.
    // If a reference template exists, include it — otherwise fall back to
    // pandoc's built-in default styles so export never hard-fails.
    const templateExists = fs.existsSync(TEMPLATE_PATH);
    const referenceFlag  = templateExists
      ? `--reference-doc="${TEMPLATE_PATH}"`
      : '';

    const command = `pandoc "${inputPath}" -o "${outputPath}" --mathml ${referenceFlag}`.trim();

    console.log(`[export] Running: ${command}`);
    if (!templateExists) {
      console.warn(`[export] WARNING: template not found at ${TEMPLATE_PATH} — using pandoc defaults`);
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`[export] Pandoc error: ${error.message}`);
        if (stderr) console.error(`[export] stderr: ${stderr}`);
        fs.rmSync(tempDir, { recursive: true, force: true });
        return res.status(500).send('Error generating DOCX document');
      }

      res.download(outputPath, 'output.docx', (downloadError) => {
        if (downloadError) {
          console.error(`[export] Download error: ${downloadError.message}`);
        }
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error(`[export] Cleanup error: ${cleanupError.message}`);
        }
      });
    });

  } catch (err) {
    console.error(`[export] Server error: ${err.message}`);
    try {
      if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Template path : ${TEMPLATE_PATH}`);
  console.log(`Template found: ${fs.existsSync(TEMPLATE_PATH)}`);
});
