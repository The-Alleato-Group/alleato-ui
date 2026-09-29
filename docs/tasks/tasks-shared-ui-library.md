---
title: Shared Alleato UI library (@alleato/ui)
id_prefix: AUI
status: in-progress
project: Alleato OS
created: 2026-09-29
updated: 2026-09-29
source: Megan, 2026-09-24 + 2026-09-29 — "consistent components across the main app and the docs ... a shared UI component library with shadcn"
---

# Shared Alleato UI library

One package owns the Alleato look — design tokens, fonts, and the shadcn
primitives — and every Alleato web app installs it instead of keeping its own
copy. Source of truth for the look is the main app (`projects.alleatogroup.com`,
repo `The-Alleato-Group/project-management`, `frontend/`).

Decisions (Megan, 2026-09-29): own repo `The-Alleato-Group/alleato-ui`, public;
published publicly on npm as `@alleato/ui`. Until the npm org exists, apps
install from a GitHub tag: `github:The-Alleato-Group/alleato-ui#vX.Y.Z`.

Consumers:

| App | Repo | Framework | Starts from |
| --- | --- | --- | --- |
| Main app | project-management `frontend/` | Next 15, Tailwind 4 | source of truth |
| Learning app | project-management `training/` | Next 15, Tailwind 4 | stale fork: 20/51 ui + 31/54 ds files drifted |
| ASRS | MeganHarrison/alleato-asrs `apps/web` | Next 16, no Tailwind | no primitives yet |
| Docs | alleato-docs-site (Mintlify) | cannot install packages | tokens only (colors, fonts) |
| Mobile | alleato-mobile (React Native) | out of scope | — |

## P0 — Package foundation

- [ ] AUI-001: Extract tokens (light + dark `:root` variables, Tailwind 4 `@theme` color/radius/font/shadow mapping, keyframes) from `frontend/src/app/globals.css` + `frontend/tailwind.config.ts` into `styles/tokens.css` and `styles/theme.css`. **Files:** `styles/*`. **Done when:** a Tailwind 4 build of `theme.css` emits `bg-primary`, `text-muted-foreground`, `rounded-lg`, `font-title` with the same values as the main app. Effort: M
- [ ] AUI-002: Move the self-contained shadcn primitives (no app imports) into `src/components/`, internal imports made relative. **Files:** `src/components/*`, `src/lib/utils.ts`, `src/hooks/use-mobile.ts`. **Done when:** `tsc --noEmit` passes. Effort: M
- [ ] AUI-003: Render smoke test for every export + CSS compile test. **Files:** `test/*`. **Done when:** `pnpm test` green in CI. Effort: S
- [ ] AUI-004: CI (typecheck + test) and release workflow (npm trusted publishing on tag). **Files:** `.github/workflows/*`. **Done when:** CI green on main. Effort: S
- [ ] AUI-005: Tag `v0.1.0`. **Done when:** `github:The-Alleato-Group/alleato-ui#v0.1.0` installs in a clean project. Effort: S

Gate: v0.1.0 tag installs and its CSS compiles in a consumer.

## P1 — Learning app (`training/`) onto the package

- [ ] AUI-010: Install the package; `training/src/components/ui/*` for shared primitives become one-line re-exports; theme comes from the package. **Done when:** `/training`, `/content`, `/knowledge` render with the main app's look (screenshots). Effort: M

Gate: training deployed and screenshotted on production.

## P2 — Main app onto the package

- [ ] AUI-020: `frontend/src/components/ui/*` shared primitives become re-exports of `@alleato/ui` (import paths unchanged); tokens from the package; duplicate token blocks deleted. **Done when:** before/after screenshots of 6 representative pages are identical. Effort: L
- [ ] AUI-021: Guardrail — a check fails when a shared primitive in `components/ui` is anything but a re-export. **Done when:** the check runs in CI and fails on a forked copy. Effort: S

Gate: main app deployed, screenshots match.

## P3 — ASRS onto the package

- [ ] AUI-030: Add Tailwind 4 + the package to `apps/web`; replace the interim token contract in `docs/design-system.md` with the package. **Done when:** ASRS estimates page screenshot uses the package Button/Input/Card/Badge/Table. Effort: M

## P4 — Docs site tokens

- [ ] AUI-040: Docs colors and fonts generated from the package tokens (`docs.json` + `style.css`). **Done when:** docs.alleatogroup.com shows the same primary color and fonts. Effort: S

## P5 — Design-system layer (`components/ds`)

- [ ] AUI-050: Inventory `frontend/src/components/ds`; move the app-independent pieces (status badge, KPI, section headings, empty states) into the package. Effort: L

## Decisions & blockers

- 2026-09-29 — Blocked on Megan for npm only: create the free npm org `alleato` and add a trusted publisher (repo `The-Alleato-Group/alleato-ui`, workflow `release.yml`). Everything else proceeds on GitHub tags.
- 2026-09-29 — Components ship as TypeScript source, not a compiled bundle. Every consumer is Next.js, which compiles it via `transpilePackages`, and Tailwind must scan the source anyway. No build step means no `"use client"` loss and no dist/source drift.
- 2026-09-29 — A package, not a shadcn copy-paste registry: copying files into each app is how `training/` drifted.

## Log

- 2026-09-29 — Plan created; repo created (public).
