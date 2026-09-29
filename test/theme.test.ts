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

type Hsl = [number, number, number];

function darkTokens(): string {
  const tokens = readFileSync(path.join(root, "styles/tokens.css"), "utf8");
  const start = tokens.indexOf("  .dark {");
  if (start === -1) throw new Error("dark token block not found");
  return tokens.slice(start);
}

function readHslToken(scope: string, name: string): Hsl {
  const match = scope.match(
    new RegExp(
      `--${name}:\\s*(?:hsl\\()?([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%`,
    ),
  );
  if (!match) throw new Error(`--${name} must be a direct HSL token`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function luminance([r, g, b]: [number, number, number]): number {
  const linear = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(a: Hsl, b: Hsl): number {
  const toRgb = ([h, s, l]: Hsl): [number, number, number] => {
    const saturation = s / 100;
    const lightness = l / 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const second = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const match = lightness - chroma / 2;
    const channels =
      h < 60
        ? [chroma, second, 0]
        : h < 120
          ? [second, chroma, 0]
          : h < 180
            ? [0, chroma, second]
            : h < 240
              ? [0, second, chroma]
              : h < 300
                ? [second, 0, chroma]
                : [chroma, 0, second];
    return channels.map((channel) => Math.round((channel + match) * 255)) as [number, number, number];
  };
  const [high, low] = [luminance(toRgb(a)), luminance(toRgb(b))].sort(
    (left, right) => right - left,
  );
  return (high + 0.05) / (low + 0.05);
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

  it("gives a fallback to every variable an app may leave undefined", () => {
    // A var() with no fallback that resolves to nothing makes the whole
    // declaration invalid: with --font-inter unset, --font-sans rendered every
    // ASRS page in Times (2026-09-29).
    const styles = ["tokens.css", "base.css", "theme.css"]
      .map((file) => readFileSync(path.join(root, "styles", file), "utf8"))
      .join("\n");
    const defined = new Set(
      [...styles.matchAll(/(?:^|[\s{;])--([a-z0-9-]+)\s*:/g)].map((m) => m[1]),
    );
    // Set inline by the component that reads them, not by the app.
    const componentSet = new Set(["duration", "angle", "radius", "gap", "radix-collapsible-content-height"]);
    const unguarded = [...styles.matchAll(/var\(--([a-z0-9-]+)\s*\)/g)]
      .map((m) => m[1])
      .filter((name) => !defined.has(name) && !componentSet.has(name) && !name.startsWith("tw-"));
    expect([...new Set(unguarded)]).toEqual([]);
  });

  it("scans the package's own components", async () => {
    const theme = readFileSync(path.join(root, "styles/theme.css"), "utf8");
    expect(theme).toContain('@source "../src"');
  });
});

describe("dark semantic token contrast", () => {
  const dark = darkTokens();

  it.each(["foreground", "muted-foreground", "primary", "status-error"])(
    "%s clears 4.5:1 on the carbon canvas",
    (token) => {
      expect(
        contrast(readHslToken(dark, token), readHslToken(dark, "background")),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("keeps filled actions and sidebar navigation legible", () => {
    expect(
      contrast(
        readHslToken(dark, "primary-foreground"),
        readHslToken(dark, "primary"),
      ),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(
        readHslToken(dark, "destructive-foreground"),
        readHslToken(dark, "status-error"),
      ),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(
        readHslToken(dark, "sidebar-foreground"),
        readHslToken(dark, "sidebar"),
      ),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
