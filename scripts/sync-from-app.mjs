#!/usr/bin/env node
// Copies the shared primitives and tokens out of the main Alleato app
// (project-management frontend/) into this package, byte-for-byte except for
// import paths. Used until the main app itself imports @alleato/ui (plan
// AUI-020); after that this package is the source and the script is deleted.
//
//   node scripts/sync-from-app.mjs <path-to-project-management checkout at origin/main>
//
// Fails loudly when a component, the token block, or a package-only edit it
// re-applies can no longer be found, instead of silently shipping a stale copy.
import fs from "node:fs";
import path from "node:path";

const appRoot = process.argv[2];
if (!appRoot) throw new Error("usage: sync-from-app.mjs <project-management checkout>");
const pkgRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const uiDir = path.join(appRoot, "frontend/src/components/ui");
const outDir = path.join(pkgRoot, "src/components");

const rewriteImports = (source) =>
  source
    .replace(/from (["'])@\/components\/ui\/([a-z-]+)\1/g, 'from "./$2"')
    .replace(/from (["'])@\/lib\/utils\1/g, 'from "../lib/utils"')
    .replace(/from (["'])@\/hooks\/use-mobile\1/g, 'from "../hooks/use-mobile"');

// Package-only edits: each must still apply, or the sync stops.
const PACKAGE_EDITS = {
  "number-input.tsx": (s) => (s.startsWith('"use client"') ? s : `"use client";\n\n${s}`),
  "sonner.tsx": (s) => {
    const next = s
      .replace('import { ToastInstrumentation } from "./toast-instrumentation";\n', "")
      .replace(/<>\s*<ToastInstrumentation \/>\s*(<Sonner[\s\S]*?\/>)\s*<\/>/, "$1");
    if (next.includes("ToastInstrumentation")) throw new Error("sonner.tsx: could not strip app toast instrumentation");
    return next;
  },
};

for (const file of fs.readdirSync(outDir)) {
  const from = path.join(uiDir, file);
  if (!fs.existsSync(from)) throw new Error(`component missing in app: ${from}`);
  let source = rewriteImports(fs.readFileSync(from, "utf8"));
  if (/from ["']@\//.test(source)) throw new Error(`${file}: imports an app-only module`);
  if (PACKAGE_EDITS[file]) source = PACKAGE_EDITS[file](source);
  fs.writeFileSync(path.join(outDir, file), source);
}
fs.copyFileSync(path.join(appRoot, "frontend/src/hooks/use-mobile.ts"), path.join(pkgRoot, "src/hooks/use-mobile.ts"));

// Tokens: the first `@layer base { :root {...} .dark {...} }` block of globals.css.
const globals = fs.readFileSync(path.join(appRoot, "frontend/src/app/globals.css"), "utf8");
const start = globals.indexOf("@layer base {\n  :root {");
if (start < 0) throw new Error("globals.css: token block not found");
let depth = 0;
let end = start;
for (let i = globals.indexOf("{", start); i < globals.length; i++) {
  if (globals[i] === "{") depth++;
  else if (globals[i] === "}" && --depth === 0) { end = i + 1; break; }
}
let block = globals.slice(start, end);
// App chrome and third-party integrations stay in the app.
const APP_ONLY = [/\n\s*\/\* =+\n\s*MOBILE NAV BAND[\s\S]*?--mobile-nav-band:[^;]+;\n/, /\n\s*\/\* Procore \/ Alleato Brand Colors \*\/\n(\s*--procore-[^\n]+\n)+/, /\n\s*\/\* Third-party integration brand colors \*\/\n\s*--integration-telegram:[^\n]+\n/, /\n\s*--schedule-view-active:[^\n]+/g];
for (const pattern of APP_ONLY) {
  if (!pattern.test(block)) throw new Error(`globals.css: expected app-only token not found: ${pattern}`);
  block = block.replace(pattern, "\n");
}
const tokensPath = path.join(pkgRoot, "styles/tokens.css");
const tokens = fs.readFileSync(tokensPath, "utf8");
const header = tokens.slice(0, tokens.indexOf("@layer base {"));
const docsStart = tokens.indexOf("    /* Documentation reader");
const docs = tokens.slice(docsStart, tokens.indexOf("\n\n", tokens.indexOf("--docs-card-shadow")) + 1);
if (docsStart < 0) throw new Error("tokens.css: documentation reader tokens missing");
const anchor = "    --font-heading-weight: 600;\n";
if (!block.includes(anchor)) throw new Error("globals.css: --font-heading-weight anchor missing");
block = block.replace(anchor, `${anchor}\n${docs}`);
fs.writeFileSync(tokensPath, `${header}${block}\n`);
console.log(`synced ${fs.readdirSync(outDir).length} components and the token block from ${appRoot}`);
