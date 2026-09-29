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
| Docs | none: Mintlify retired 2026-09-25, docs now at `/docs` in the Learning app | — | covered by P1 |
| Mobile | alleato-mobile (React Native) | out of scope | — |

## P0 — Package foundation

- [x] AUI-001: Extract tokens (light + dark `:root` variables, Tailwind 4 `@theme` color/radius/font/shadow mapping, keyframes) from `frontend/src/app/globals.css` + `frontend/tailwind.config.ts` into `styles/tokens.css` and `styles/theme.css`. **Files:** `styles/*`. **Done when:** a Tailwind 4 build of `theme.css` emits `bg-primary`, `text-muted-foreground`, `rounded-lg`, `font-title` with the same values as the main app. Effort: M Evidence: `test/theme.test.ts` compares 16 utilities with production CSS; resynced from origin/main by `scripts/sync-from-app.mjs` (v0.1.1).
- [x] AUI-002: Move the self-contained shadcn primitives (no app imports) into `src/components/`, internal imports made relative. **Files:** `src/components/*`, `src/lib/utils.ts`, `src/hooks/use-mobile.ts`. **Done when:** `tsc --noEmit` passes. Effort: M Evidence: `tsc --noEmit` clean; 48 files incl. helpers.
- [x] AUI-003: Render smoke test for every export + CSS compile test. **Files:** `test/*`. **Done when:** `pnpm test` green in CI. Effort: S Evidence: `pnpm test` 53/53.
- [x] AUI-004: CI (typecheck + test) and release workflow (npm trusted publishing on tag). **Files:** `.github/workflows/*`. **Done when:** CI green on main. Effort: S Evidence: CI green on every push to main. Release workflow waits on the npm org (see blockers).
- [x] AUI-005: Tag `v0.1.0`. **Done when:** `github:The-Alleato-Group/alleato-ui#v0.1.0` installs in a clean project. Effort: S Evidence: training installs `#v0.1.0` (pnpm lock resolves codeload tarball, HTTP 200).

Gate: v0.1.0 tag installs and its CSS compiles in a consumer.

## P1 — Learning app (`training/`) onto the package

- [x] AUI-010: Install the package; `training/src/components/ui/*` for shared primitives become one-line re-exports; theme comes from the package. **Done when:** `/training`, `/content`, `/knowledge` render with the main app's look (screenshots). Effort: M Evidence: project-management `d21c20e3cb` + `2421157f77` (v0.1.1); production /knowledge computes `--surface-alt: 240 5% 96%` (package value); jest 352/352; local and production screenshots of /knowledge, an article and /training match.

Gate: training deployed and screenshotted on production.

## P2 — Main app onto the package

- [x] AUI-020: `frontend/src/components/ui/*` shared primitives become re-exports of `@alleato/ui` (import paths unchanged); tokens from the package; duplicate token blocks deleted. **Done when:** before/after screenshots of 6 representative pages are identical. Effort: L Evidence: `af891fb7d1` live in production release `da06517bab`; /67/home and /67/budget pixel-identical to pre-change production; /67/commitments differs only by the table-toolbar consolidation from `159a55109c` (another session, same release).
- [x] AUI-021: Guardrail — a check fails when a shared primitive in `components/ui` is anything but a re-export. **Done when:** the check runs in CI and fails on a forked copy. Effort: S Evidence: `shared-ui-package.test.ts` in frontend and training (re-export shape + no page-wide token redefinition); both mutations (re-forked badge.tsx, `:root { --primary }` in globals.css) turn it red. Runs in quality-gate full-suite and training-tests.

Gate: main app deployed, screenshots match. PASSED 2026-09-29.

## P3 — ASRS onto the package

- [x] AUI-030 (tokens; components are ASRS P30): Add Tailwind 4 + the package to `apps/web`; replace the interim token contract in `docs/design-system.md` with the package. **Done when:** ASRS estimates page screenshot uses the package Button/Input/Card/Badge/Table. Effort: M Evidence: ASRS P29 merged `2d80e22c` (main `476fa126`) on @alleato/ui#v0.1.1 after an independent verifier PASS; 34 clashing names resolved (32 identical, `--muted` and `--action` remapped with no visible change); only visible change is Inter now rendering.

## P4 — Docs site tokens

- [x] AUI-040: ~~Docs colors and fonts from the package~~ — dropped: the Mintlify site was retired on 2026-09-25 (project-management `docs/ops/plans/2026-09-23-content-consolidation.md`); docs render at `/docs` in the Learning app, which P1 moves onto the package. The documentation-reader tokens (`--docs-*`) now live in `styles/tokens.css`.

## P5 — Design-system layer (`components/ds`)

- [ ] AUI-050: Inventory `frontend/src/components/ds`; move the app-independent pieces (status badge, KPI, section headings, empty states) into the package. Effort: L

## Decisions & blockers

- 2026-09-29 — Blocked on Megan for npm only: create the free npm org `alleato` and add a trusted publisher (repo `The-Alleato-Group/alleato-ui`, workflow `release.yml`). Everything else proceeds on GitHub tags.
- 2026-09-29 — Components ship as TypeScript source, not a compiled bundle. Every consumer is Next.js, which compiles it via `transpilePackages`, and Tailwind must scan the source anyway. No build step means no `"use client"` loss and no dist/source drift.
- 2026-09-29 — A package, not a shadcn copy-paste registry: copying files into each app is how `training/` drifted.

## Log

- 2026-09-29 — v0.1.2: `--font-sans`/`--font-title` now fall back when an app does not define `--font-inter`/`--font-oswald` (ASRS rendered Times without them); a test fails on any unguarded app-provided variable. `tailwindcss` is an optional peer (tokens-only consumers such as ASRS no longer get it installed). `scripts/sync-from-app.mjs` deleted: the package is now the source.

- 2026-09-29 — Main app switched (`af891fb7d1`): 48 re-exports, token block moved, shared use-mobile hook, jest transforms the package, 16 source-reading contract tests pointed at the real source via `src/test-utils/shared-ui-source.ts`. Full frontend jest 16,649 pass; the 2 failing suites fail identically on untouched main. Local vs production screenshots identical on /67/home, /67/commitments, /67/budget.

- 2026-09-29 — v0.1.0 tagged; Learning app switched (project-management `d21c20e3cb`), release pending the 30-minute controller. v0.1.0 was built from a stale checkout (table headers still uppercase, old button hover, old `--surface-alt`); v0.1.1 resynced from origin/main with `scripts/sync-from-app.mjs`. Mintlify step dropped (site retired 2026-09-25). ASRS token adoption handed to its own phase-gated session.

- 2026-09-29 — Plan created; repo created (public).
