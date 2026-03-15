import type { NextConfig } from "next";

// DEPLOY_TARGET controls what kind of build is produced:
//
//   "ghpages"  → GitHub Pages
//                - output: "export"  (static HTML in /out)
//                - basePath / assetPrefix set to /ai-docx-app
//
//   (not set)  → Vercel / local dev
//                - No static export  (Vercel handles Next.js natively)
//                - No basePath       (served from root URL)
//
// ─── Build commands ────────────────────────────────────────────────────────
//   Vercel / default:  npm run build
//   GitHub Pages:      npm run build:ghpages
// ───────────────────────────────────────────────────────────────────────────

const isGhPages = process.env.DEPLOY_TARGET === "ghpages";
const BASE = "/ai-docx-app";

const nextConfig: NextConfig = {
  ...(isGhPages && { output: "export" }),
  basePath:    isGhPages ? BASE : "",
  assetPrefix: isGhPages ? BASE + "/" : "",
};

export default nextConfig;
