# @alleato/ui

The Alleato look, shared by every Alleato web app: design tokens (colors,
radii, fonts, shadows, motion), element defaults, and the shadcn components
built on them. Change the look here once; every app picks it up on its next
version bump.

| App | Uses |
| --- | --- |
| Alleato OS (`projects.alleatogroup.com`) | tokens + components |
| Learning app (`training/`: `/training`, `/content`, `/knowledge`, `/docs`) | tokens + components |
| ASRS estimator | tokens (components after it adopts Tailwind 4) |

## Install

Until the npm release exists, install from a GitHub tag:

```bash
pnpm add github:The-Alleato-Group/alleato-ui#v0.1.0
```

After it is on npm: `pnpm add @alleato/ui`.

## Set up a Next.js + Tailwind 4 app

1. Global stylesheet:

   ```css
   @import "tailwindcss";
   @import "@alleato/ui/theme.css";
   ```

2. `next.config.ts` — the components ship as TypeScript source:

   ```ts
   const nextConfig = { transpilePackages: ["@alleato/ui"] };
   ```

3. Fonts — load Inter and Oswald with `next/font` using these exact variable
   names, and put both classes on `<html>`:

   ```ts
   const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
   const oswald = Oswald({ subsets: ["latin"], weight: ["400"], variable: "--font-oswald" });
   ```

   Without them the stacks fall back to locally installed Inter/Oswald, then
   system fonts.

4. Import components by path:

   ```tsx
   import { Button } from "@alleato/ui/components/button";
   import { cn } from "@alleato/ui/lib/utils";
   ```

Dark mode is the `.dark` class on an ancestor (next-themes `attribute="class"`).

## What is in it

- `styles/tokens.css` — every variable, light on `:root`, dark on `.dark`.
  Plain CSS; colors are bare HSL triplets so `hsl(var(--primary) / 0.12)` works.
- `styles/base.css` — element defaults (ink, ground, field fill, placeholders,
  Oswald uppercase page titles).
- `styles/theme.css` — the Tailwind 4 entry: the two files above, the
  animation utilities, the `dark` variant, and the utility names
  (`bg-primary`, `text-muted-foreground`, `rounded-lg`, ...).
- `src/components/*` — accordion, alert, alert-dialog, avatar, badge,
  breadcrumb, button, button-group, calendar, card, chart, checkbox,
  collapsible, command, context-menu, dialog, drawer, dropdown-menu, form,
  hover-card, input, input-group, label, number-input, pagination, popover,
  progress, radio-group, responsive-dialog, scroll-area, select, separator,
  sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs,
  textarea, toggle, toggle-group, tooltip.

Optional peers, needed only for the component that uses them: `recharts`
(chart), `react-hook-form` (form), `sonner` + `next-themes` (sonner).

## Rules

- A value lives in `styles/tokens.css` and nowhere else. Apps do not redefine
  tokens; they ask for a change here.
- An app does not keep its own copy of a component in this package. If it
  needs a variant, add the variant here.
- Every token change is checked against production by `test/theme.test.ts`.

## Keeping the package in step with the main app

Until the main app imports this package (plan AUI-020), the main app is still
where components are edited. Copy its current versions here with:

```bash
node scripts/sync-from-app.mjs <project-management checkout at origin/main>
```

It fails loudly if a component, the token block, or one of the package's own
edits can no longer be found.

## Develop and release

```bash
pnpm install
pnpm check        # typecheck + tests
```

Release: bump `version` in `package.json`, commit, then
`git tag vX.Y.Z && git push --tags`. The `release` workflow publishes to npm
with provenance once npm trusted publishing is configured for this repo.

## License

UNLICENSED — Alleato Group, all rights reserved. Built on
[shadcn/ui](https://ui.shadcn.com) (MIT); see `NOTICE`.
