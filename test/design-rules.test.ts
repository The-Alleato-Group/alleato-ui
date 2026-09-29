import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * The main app's lint rules cannot see this package's source, so the rules
 * that apply to every Alleato screen are enforced here instead.
 *
 * No all-caps text and no widened letter-spacing (project-management
 * DESIGN.md s3; owner 2026-09-23): the only exceptions are the Oswald page
 * title, the Text primitive's own `transform` option, and keyboard-shortcut
 * hints in menus (glyphs, not words).
 */
const srcDir = path.resolve(__dirname, "../src");
const ALLOWED: Record<string, RegExp[]> = {
  "layout/headings.tsx": [/\buppercase\b/],
  "ds/text.tsx": [/\buppercase\b/],
  "components/dropdown-menu.tsx": [/tracking-widest/],
  "components/context-menu.tsx": [/tracking-widest/],
  "components/command.tsx": [/tracking-widest/],
};
const BANNED = [/\buppercase\b/, /\btracking-(wide|wider|widest)\b/, /\btracking-\[0?\.\d+em\]/];

function codeLines(file: string) {
  return readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "))
    .split("\n")
    .map((text, index) => ({ text: text.replace(/\/\/.*$/, ""), line: index + 1 }));
}

describe("package source follows the Alleato design rules", () => {
  it("has no uppercase or widened tracking outside the allowed primitives", () => {
    const offenders = ["components", "ds", "layout"].flatMap((dir) =>
      readdirSync(path.join(srcDir, dir))
        .filter((file) => file.endsWith(".tsx"))
        .flatMap((file) => {
          const rel = `${dir}/${file}`;
          return codeLines(path.join(srcDir, rel))
            .filter(({ text }) =>
              BANNED.some(
                (rule) => rule.test(text) && !(ALLOWED[rel] ?? []).some((allowed) => allowed.source === rule.source || allowed.test(text)),
              ),
            )
            .map(({ line, text }) => `${rel}:${line} ${text.trim()}`);
        }),
    );
    expect(offenders).toEqual([]);
  });
});
