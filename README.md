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

Install from a GitHub tag (the package is not published to npm):

```bash
pnpm add github:The-Alleato-Group/alleato-ui#v0.3.0
```

To update an app, change the tag in its `package.json` and reinstall.

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

   Without them the stacks fall back to an installed Inter/Oswald, then
   system fonts. Apps that do not use `next/font` can skip this step.

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

- `src/ds/*` — design-system components: status-badge, empty-state,
  error-state, heading, text, eyebrow, stat, kpi, chart-card, section-header,
  section-card, InfoAlert, ConfirmDeleteDialog, EditModeActions, SplitButton,
  filter-menu, tag-input, CreatableOptionInput, selection-checkbox,
  expanding-search, density-control, inline-add-button, icon-badge, tone-dot,
  timeline, inspector, kanban, review-before-commit, comment-avatar,
  comment-row, data-table. Import as `@alleato/ui/ds/<name>`.
- `src/layout/headings.tsx` — PageTitle, PageEyebrow, SectionHeading,
  SubsectionHeading, LabelHeading. Import as `@alleato/ui/layout/headings`.
- `src/ds/*` also includes shared detail fields, trend metrics, date-range
  selection, viewer-local timestamps, comment display/composition, mention
  suggestions, and safe rich-text display. Apps supply the current comment
  author and own persistence; the package owns presentation and parsing.

Optional peers, needed only for the component that uses them: `recharts`
(chart), `react-hook-form` (form), `sonner` + `next-themes` (sonner),
`next` (kpi, section-card links), `framer-motion` (animated empty state).

## Rules

- A value lives in `styles/tokens.css` and nowhere else. Apps do not redefine
  tokens; they ask for a change here.
- An app does not keep its own copy of a component in this package. If it
  needs a variant, add the variant here.
- Every token change is checked against production by `test/theme.test.ts`.

## Develop and release

```bash
pnpm install
pnpm check        # typecheck + tests
```

Release: bump `version` in `package.json`, commit, then
`git tag -a vX.Y.Z -m "..." && git push origin vX.Y.Z`. The `release`
workflow re-runs the checks and creates the GitHub release notes. Then bump the
tag in each app.

## License

UNLICENSED — Alleato Group, all rights reserved. Built on
[shadcn/ui](https://ui.shadcn.com) (MIT); see `NOTICE`.
