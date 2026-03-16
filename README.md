# AI Text → DOCX App

**⚠️ IMPORTANT NOTE FOR WEB USERS ⚠️**  
> **The "Export to DOCX" button ONLY WORKS when running the app locally on your PC.**  
> If you are using the web version, the export feature will fail. Instead, use the **"Copy Content"** button in the preview pane to copy the formatted text and paste it directly into Microsoft Word.

A browser-based tool that takes AI-generated text (Markdown + LaTeX), shows a live formatted preview, and exports it to a polished Word document (`.docx`) using Pandoc.


---

## Table of Contents

1. [What It Does](#what-it-does)
2. [How It Works](#how-it-works)
3. [Do I Need to Upload node_modules?](#do-i-need-to-upload-node_modules)
4. [Requirements](#requirements)
5. [Download & Install](#download--install)
6. [Running Locally](#running-locally)
7. [Using the App](#using-the-app)
8. [Building for GitHub Pages](#building-for-github-pages)
9. [Deploying to GitHub Pages](#deploying-to-github-pages)
10. [Customising the Word Template](#customising-the-word-template)
11. [Project Structure](#project-structure)
12. [Scripts Reference](#scripts-reference)
13. [Troubleshooting](#troubleshooting)

---

## What It Does

| Feature | Details |
| :--- | :--- |
| **Live preview** | See your text formatted as you type — headings, bold, tables, code |
| **LaTeX math** | Renders `$E=mc^2$` and `$$...$$` block equations inline |
| **Auto-fix** | Repairs common AI formatting issues (bad table separators, extra blank lines, etc.) |
| **DOCX export** | Sends text to a local server → Pandoc converts → `.docx` file downloads |
| **Word template** | Use your own `.docx` template to control fonts and heading styles |

---

## How It Works

```
You type / paste text
        ↓
normalizeText()        ← fixes AI formatting quirks
        ↓
  ┌─────────────────────────────────┐
  │  Browser (static, GitHub Pages) │
  │  • markdown-it renders preview  │
  │  • KaTeX renders math           │
  └─────────────────────────────────┘
        ↓  (Export button clicked)
  POST http://localhost:5000/export   ← your local machine only
        ↓
  Express server (Node.js)
        ↓
  Pandoc → output.docx
        ↓
  File downloads in browser
```

---

## Requirements

You need these installed on your computer before starting:

### 1. Node.js (v18 or newer)

Node.js runs the frontend build tools and the backend server.

1. Go to **https://nodejs.org**
2. Download the **LTS** version (recommended)
3. Run the installer — accept all defaults
4. Verify: open a new terminal and run:
   ```
   node --version
   npm --version
   ```
   You should see version numbers like `v20.x.x` and `10.x.x`

### 2. Pandoc (v3 or newer)

Pandoc converts the Markdown text to a Word `.docx` file. Without it, export will fail.

1. Go to **https://pandoc.org/installing.html**
2. Click **Windows** and download the `.msi` installer
3. Run the installer — it adds `pandoc` to your system PATH automatically
4. **Close and reopen** any terminal windows after installing
5. Verify:
   ```
   pandoc --version
   ```
   You should see `pandoc 3.x.x` or similar

> **Note:** If you skip Pandoc, the preview still works. Only the Export button requires it.

---

## Download & Install

### Step 1 — Get the code

**Option A: Download ZIP** (no Git needed)
1. Go to the GitHub repo page
2. Click the green **Code** button → **Download ZIP**
3. Extract the ZIP to a folder of your choice (e.g., `C:\Projects\ai-docx-app\`)

**Option B: Clone with Git**
```bash
git clone https://github.com/your-username/ai-docx-app.git
cd ai-docx-app
```

### Step 2 — Install dependencies

**Windows — easiest way:**  
Double-click **`install.bat`** in the project folder.  
Wait for it to finish. It installs both frontend and backend packages.

**Manual way** (any OS):
```bash
# From the project root folder:
npm install

# Then install backend packages:
cd server
npm install
cd ..
```

This step downloads all the required packages into `node_modules/` folders.  
It may take 1–2 minutes on first run. Subsequent installs are much faster.

---

## Running Locally

You need **two** things running at the same time:
- The **frontend** (Next.js dev server) on port 3000
- The **backend** (Express + Pandoc) on port 5000

**Windows — easiest way:**  
Double-click **`run.bat`**  
Two terminal windows open automatically. Leave them both running.

**Manual way:**

Open **two separate terminals** in the project folder.

Terminal 1 — Backend:
```bash
cd server
npm start
```
You should see:
```
Server running on http://localhost:5000
Template path : ...\server\template\template.docx
Template found: true
```

Terminal 2 — Frontend:
```bash
npm run dev
```
You should see:
```
▲ Next.js 16.x
- Local: http://localhost:3000
✓ Ready in ...ms
```

Then open **http://localhost:3000** in your browser.

> The frontend runs in development mode (`npm run dev`) which does NOT use `basePath`.  
> Do NOT open `localhost:3000/ai-docx-app/` in dev mode — just use `localhost:3000/`.

---

## Using the App

### Basic workflow

1. **Paste or type** AI-generated text into the left **Editor** panel
2. The right **Preview** panel updates instantly with formatted output
3. Click **Export to DOCX** to download a Word file

### What the editor supports

**Markdown:**
```markdown
# Heading 1
## Heading 2

**bold text**   *italic text*   `inline code`

- Bullet list item
- Another item

1. Numbered list
2. Second item

| Column A | Column B |
| :---     | ---:     |
| Left     | Right    |
```

**LaTeX math:**
```
Inline: $E = mc^2$

Block:
$$
\int_0^\infty f(x)\, dx = 1
$$
```

### Auto-fixes applied to AI text

The app automatically repairs common issues before preview and export:
- `Title:` (bare heading labels) → `## Title`
- `1) item` → `1. item` (list style)
- Em-dash separators `| :— |` → `| :--- |` (table fix for Pandoc)
- Missing table separator rows → injected automatically
- Empty table cells `||` → `| |`
- 3+ blank lines → collapsed to 2
- LaTeX blocks are never touched

### Export notes

- Export requires the **backend server to be running** (`run.bat` or `cd server && npm start`)
- If you see **"Failed to fetch"**: the backend isn't running — start it first
- If you see **"Server error"**: Pandoc isn't installed or not found in PATH
- The exported file is named `output.docx` — rename it as needed

---

## Building for GitHub Pages

The frontend compiles to a static site (no server needed) that can be hosted on GitHub Pages.

```bash
npm run build
```

This creates the `/out` folder containing all HTML, CSS, and JavaScript files — optimised and ready to upload.

The build uses `basePath: "/ai-docx-app"` and `assetPrefix: "/ai-docx-app/"` so all links work correctly under `https://username.github.io/ai-docx-app/`.

> The backend server (`/server`) is **not deployed** to GitHub Pages.  
> On the live GitHub Pages site, the preview works but Export will fail unless you run the backend locally.

---

## Deploying to GitHub Pages

### Option A — GitHub Pages from branch (recommended)

1. Build the static export:
   ```bash
   npm run build
   ```
2. The `/out` folder now contains the complete static site
3. Push your repo to GitHub (including `/out`)
4. Go to your repo on GitHub → **Settings → Pages**
5. Under **Source**, select **Deploy from a branch**
6. Set branch to `main` (or whichever branch you use), folder to `/ (root)` — or use a `gh-pages` branch
7. Wait 1–2 minutes, then visit: `https://your-username.github.io/ai-docx-app/`

### Option B — GitHub Actions (automated)

Create `.github/workflows/deploy.yml` to automatically build and deploy on every push.  
Ask for this if you want it set up.

### Naming your repo

If your repo is named `ai-docx-app`, the GitHub Pages URL will be:
```
https://your-username.github.io/ai-docx-app/
```
This matches the `basePath: "/ai-docx-app"` in `next.config.ts`. ✅

If you rename the repo, update `next.config.ts`:
```ts
const BASE = "/your-repo-name";   // ← change this
```
Then rebuild: `npm run build`

---

## Customising the Word Template

When you export, Pandoc uses `server/template/template.docx` as a style reference.  
This controls fonts, heading styles, margins, and table formatting in the output.

**To use your own styles:**
1. Open Microsoft Word (or LibreOffice Writer)
2. Create a document and customise the styles:
   - **Normal** — body text font and size
   - **Heading 1, 2, 3** — heading fonts and colours
   - **Table** — table borders and shading
3. Save the file as `server/template/template.docx` (overwrite the existing file)
4. Restart the backend server (`Ctrl+C` then `npm start` again)

The next export will use your custom template.

---

## Project Structure

```
ai-docx-app/
│
├── app/                        Next.js App Router
│   ├── page.tsx                Main page — split layout, state management
│   ├── layout.tsx              Root HTML, Google Fonts (Inter)
│   └── globals.css             Design system, CSS variables, dark theme
│
├── components/
│   ├── TextEditor.tsx          Left pane — raw text editor textarea
│   ├── Preview.tsx             Right pane — markdown-it + KaTeX rendered HTML
│   └── ExportButton.tsx        Fetches backend, blob download, loading/error states
│
├── lib/
│   ├── normalize.ts            AI text cleanup + Pandoc table repair
│   └── markdown.ts             markdown-it instance configured with KaTeX plugin
│
├── server/
│   ├── server.js               Express API: POST /export → Pandoc → .docx response
│   ├── package.json            Backend dependencies (express, cors, body-parser)
│   └── template/
│       └── template.docx       Pandoc Word reference template (replace to customise)
│
├── public/                     Static assets served by Next.js
├── out/                        Static export output (generated — do not edit manually)
│
├── next.config.ts              output: export, basePath for GitHub Pages
├── package.json                Frontend scripts and dependencies
├── tsconfig.json               TypeScript config
├── postcss.config.mjs          Tailwind CSS v4 PostCSS config
├── .gitignore                  Excludes node_modules, .next, etc.
│
├── install.bat                 Windows: install all dependencies
├── run.bat                     Windows: start both servers
└── README.md                   This file
```

---

## Scripts Reference

### Frontend (run from project root)

| Script | Command | What it does |
| :--- | :--- | :--- |
| Dev server | `npm run dev` | Start Next.js with hot reload → `localhost:3000` |
| Build | `npm run build` | Compile static export to `/out` |
| Export | `npm run export` | Alias for `npm run build` |
| Preview build | `npm start` | Serve `/out` with `npx serve` → `localhost:3000` |

### Backend (run from `/server` folder)

| Script | Command | What it does |
| :--- | :--- | :--- |
| Start | `npm start` | Start Express server → `localhost:5000` |
| Dev | `npm run dev` | Same as start (no hot reload needed) |

---

## Troubleshooting

### "Failed to fetch" on Export
The backend server is not running.  
→ Open a terminal, go to the `/server` folder, run `npm start`

### "Server error 500" on Export
Pandoc is not installed or not in your system PATH.  
→ Install Pandoc from https://pandoc.org/installing.html  
→ Close and reopen your terminal after installing  
→ Verify with `pandoc --version`

### Preview shows but Export downloads a broken file
The text may contain syntax Pandoc can't handle.  
→ The normalization step fixes most issues automatically  
→ Check for unclosed `$` signs in math expressions

### Page loads at localhost:3000 but shows 404
You may have tried `localhost:3000/ai-docx-app/` — that path only works in production.  
→ In dev mode, always use `http://localhost:3000/` (no path prefix)

### Tables look correct in preview but broken in the exported .docx
This is the AI formatting issue — tables need blank lines around them and proper `| --- |` separators.  
→ The normalizer handles this automatically, but very unusual table structures may still fail  
→ Try adding a blank line before and after the table in the editor

### Port 3000 or 5000 already in use
Another process is using the port.  
→ Find and close it, or change the port:  
  - Frontend: add `-- --port 3001` to the dev command  
  - Backend: change `const PORT = 5000` in `server/server.js`
