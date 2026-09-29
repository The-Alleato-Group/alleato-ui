import { readFileSync } from "node:fs";
import path from "node:path";
import { compile } from "@tailwindcss/node";

const root = path.resolve(__dirname, "..");

async function build(candidates: string[]) {
  const input = '@import "tailwindcss";\n@import "./styles/theme.css";';
  const compiler = await compile(input, { base: root, onDependency: () => {} });
  return compiler.build(candidates).replace(/\s+/g, " ");
}

function ruleBody(css: string, className: string) {
  const escaped = className.replace(/[:/.[\]()%]/g, (m) => `\\${m}`);
  const match = css.match(new RegExp(`\\.${escaped.replace(/\\/g, "\\\\")} \\{([^}]*)\\}`));
  return match?.[1].trim();
}

// Values read from production CSS (projects.alleatogroup.com, 2026-09-29).
// The package must generate the same declarations the main app ships today.
const PRODUCTION: Record<string, string> = {
  "rounded-lg": "border-radius: var(--radius);",
  "rounded-md": "border-radius: calc(var(--radius) - 2px);",
  "rounded-sm": "border-radius: calc(var(--radius) - 4px);",
  "rounded-panel": "border-radius: var(--panel-radius);",
  "bg-primary": "background-color: hsl(var(--primary));",
  "bg-button-primary": "background-color: hsl(var(--button-primary));",
  "bg-success": "background-color: hsl(var(--status-success));",
  "bg-surface-summary": "background-color: hsl(var(--surface-summary));",
  "bg-surface-alt": "background-color: hsl(var(--surface-alt));",
  "bg-card": "background-color: hsl(var(--card));",
  "bg-sidebar": "background-color: var(--sidebar);",
  "text-muted-foreground": "color: hsl(var(--muted-foreground));",
  "text-heading-label": "color: hsl(var(--heading-label));",
  "text-primary": "color: hsl(var(--primary));",
  "border-border": "border-color: hsl(var(--border));",
  "border-input": "border-color: hsl(var(--input));",
};

describe("theme.css", () => {
  it("generates the same utility values as the main app", async () => {
    const css = await build(Object.keys(PRODUCTION));
    for (const [className, expected] of Object.entries(PRODUCTION)) {
      expect({ className, body: ruleBody(css, className) }).toEqual({
        className,
        body: expected,
      });
    }
  });

  it("ships light and dark values for every semantic color it maps", () => {
    const tokens = readFileSync(path.join(root, "styles/tokens.css"), "utf8");
    const theme = readFileSync(path.join(root, "styles/theme.css"), "utf8");
    const used = new Set(
      [...theme.matchAll(/var\(--([a-z0-9-]+)\)/g)].map((m) => m[1]),
    );
    const defined = new Set(
      [...tokens.matchAll(/^\s*--([a-z0-9-]+):/gm)].map((m) => m[1]),
    );
    // Values Tailwind or the consumer supplies, not tokens.css.
    const external = new Set(["duration", "angle", "radix-collapsible-content-height"]);
    const missing = [...used].filter((name) => !defined.has(name) && !external.has(name));
    expect(missing).toEqual([]);
  });

  it("scans the package's own components", async () => {
    const theme = readFileSync(path.join(root, "styles/theme.css"), "utf8");
    expect(theme).toContain('@source "../src"');
  });
});
