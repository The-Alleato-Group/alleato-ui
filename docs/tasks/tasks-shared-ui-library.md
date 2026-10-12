---
title: Shared Alleato UI library (@alleato/ui)
id_prefix: AUI
status: in-progress
project: Alleato OS
created: 2026-09-29
updated: 2026-10-11
source: Megan, 2026-09-24 + 2026-09-29 — "consistent components across the main app and the docs ... a shared UI component library with shadcn"
---

# Shared Alleato UI library

Delivery lane: High-risk for P7 (broad table refactor across consumers). Earlier
bounded presentation slices retain their Standard evidence. Application routing,
data, permission and persistence contracts stay with their existing owners.

One package owns the Alleato look — design tokens, fonts, and the shadcn
primitives — and every Alleato web app installs it instead of keeping its own
copy. Source of truth for the look is the main app (`projects.alleatogroup.com`,
repo `The-Alleato-Group/project-management`, `frontend/`).

Decisions (Megan, 2026-09-29): own repo `The-Alleato-Group/alleato-ui`, public.
Apps install from a GitHub tag: `github:The-Alleato-Group/alleato-ui#vX.Y.Z`.
Not published to npm (Megan, 2026-09-29: not needed for three internal apps).

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
- [x] AUI-004: CI (typecheck + test) and release workflow (GitHub release notes on tag; npm dropped 2026-09-29). **Files:** `.github/workflows/*`. **Done when:** CI green on main. Effort: S Evidence: CI green on every push to main. Release workflow re-checks the tag and creates GitHub release notes.
- [x] AUI-005: Tag `v0.1.0`. **Done when:** `github:The-Alleato-Group/alleato-ui#v0.1.0` installs in a clean project. Effort: S Evidence: training installs `#v0.1.0` (pnpm lock resolves codeload tarball, HTTP 200).

Gate: v0.1.0 tag installs and its CSS compiles in a consumer.

## P1 — Learning app (`training/`) onto the package

- [x] AUI-010: Install the package; `training/src/components/ui/*` for shared primitives become one-line re-exports; theme comes from the package. **Done when:** `/training`, `/content`, `/knowledge` render with the main app's look (screenshots). Effort: M Evidence: project-management `d21c20e3cb` + `2421157f77` (v0.1.1); production /knowledge computes `--surface-alt: 240 5% 96%` (package value); jest 352/352; local and production screenshots of /knowledge, an article and /training match.

Gate: training deployed and screenshotted on production.

## P2 — Main app onto the package

- [ ] AUI-020: `frontend/src/components/ui/*` shared primitives become re-exports of `@alleato/ui` (import paths unchanged); tokens from the package; duplicate token blocks deleted. **Done when:** before/after screenshots of 6 representative pages are identical. Effort: L. Reopened during the completion audit: the historical evidence covers three of the required six pages. Evidence: `af891fb7d1` live in production release `da06517bab`; /67/home and /67/budget pixel-identical to pre-change production; /67/commitments differs only by the table-toolbar consolidation from `159a55109c` (another session, same release).
- [x] AUI-021: Guardrail — a check fails when a shared primitive in `components/ui` is anything but a re-export. **Done when:** the check runs in CI and fails on a forked copy. Effort: S Evidence: `shared-ui-package.test.ts` in frontend and training (re-export shape + no page-wide token redefinition); both mutations (re-forked badge.tsx, `:root { --primary }` in globals.css) turn it red. Runs in quality-gate full-suite and training-tests.

Gate: main app deployed, screenshots match. PASSED 2026-09-29.

## P3 — ASRS onto the package

- [ ] AUI-030 (tokens implemented; component acceptance remains open): Add Tailwind 4 + the package to `apps/web`; replace the interim token contract in `docs/design-system.md` with the package. **Done when:** ASRS estimates page screenshot uses the package Button/Input/Card/Badge/Table. Effort: M Evidence: ASRS P29 merged `2d80e22c` (main `476fa126`) on @alleato/ui#v0.1.1 after an independent verifier PASS; 34 clashing names resolved (32 identical, `--muted` and `--action` remapped with no visible change); only visible change is Inter now rendering.

## P4 — Docs site tokens

- [x] AUI-040: ~~Docs colors and fonts from the package~~ — dropped: the Mintlify site was retired on 2026-09-25 (project-management `docs/ops/plans/2026-09-23-content-consolidation.md`); docs render at `/docs` in the Learning app, which P1 moves onto the package. The documentation-reader tokens (`--docs-*`) now live in `styles/tokens.css`.

## P5 — Design-system layer (`components/ds`)

- [x] AUI-050: First batch of `components/ds` in the package (v0.2.0): 32 app-independent components, `layout/headings`, `lib/title-case`. Evidence: project-management `06310e2b0a` (re-exports in both apps, guardrail extended and mutation-checked); package test `design-rules.test.ts` enforces the no-uppercase / no-wide-tracking rule on package source.
- [ ] AUI-051: Second `ds` batch: components tied to app helpers (DetailField/InlineEditField/EditableDetailField, date-range-picker, document-picker, local-date-time, trend-metric-*, comment-composer/thread, mention-textarea, rich-text). Each needs its app dependency (formatters, date utils, mentions, API client) passed in or moved first. Effort: L. v0.3.2 includes the pure design-system components and their app adoption in project-management PR #2139; `document-picker` still owns project-specific attachment APIs and needs a data/presentation boundary ([issue #2141](https://github.com/The-Alleato-Group/project-management/issues/2141)). Production visual proof is pending.
- [ ] AUI-052: ASRS P30 on package components (owned by the ASRS Orchestrator; Stage A foundation in progress, Stage B screens after LC-076). Effort: L

## P6 — Portable page layouts and responsive list presentation

Acceptance contract: extract the existing canonical implementations, preserve
their markup, responsive classes and interaction behavior, and make routing and
identity explicit host adapters. A React consumer must not need PM's aliases,
project context or API client to render these components. The package owns both
layout contexts so consumers cannot accidentally create separate providers.

- [x] AUI-060: Move PageContainer, workspace/table layout contexts, PageTabs presentation and PageShellFrame into the package. **Files:** `src/layout/page-container.tsx`, `workspace-gutter-context.tsx`, `table-page-layout-context.tsx`, `page-tabs.tsx`, `page-shell-frame.tsx`, `package.json`. **Done when:** package exports typecheck and focused tests prove nested gutter ownership, navigation callbacks and form scroll reset. Effort: M. Evidence: `pnpm check` passed typecheck and 149 tests on 2026-10-10; the 11 focused layout tests exercise these boundaries without Next.js routing.
- [x] AUI-061: Move the existing MobileCardList into the package with a structural column contract. **Files:** `src/ds/mobile-card-list.tsx`, `test/layouts.test.tsx`. **Done when:** tests prove identity/metadata, selection, keyboard activation, row permission predicates and propagation without importing UnifiedTablePage. Effort: M. Evidence: package tests pass selection isolation, keyboard activation, row-click predicates and empty/identity handling; no app alias or network imports remain.
- [x] AUI-062: Replace PM and Training layout copies with re-exports or routing/header adapters and pin the release. **Files:** PM and Training package/lock files, `components/layout/{PageContainer,PageTabs,page-shell,workspace-gutter-context,table-page-layout-context}.tsx`, PM `tables/unified/mobile-card-list.tsx`, shared-package guardrails. **Done when:** focused consumer tests pass and guardrails reject a recreated local presentation owner. Effort: M. Evidence: [merged PM PR #2927](https://github.com/The-Alleato-Group/project-management/pull/2927), merge `ca45b76f44c9782bd7f52bbb4e9774d24e7a074a`. Final PM 130 and Training 94 focused checks, full consumer quality gate and fresh Codex review passed.
- [x] AUI-063: Release the package and publish the exact consumer scope. **Files:** package version/readme, this plan, PM per-session evidence. **Done when:** immutable tag, source SHA/readback and applicable deployment receipt are recorded. Effort: S. Evidence: v0.5.1 source `81b638baa8a209ad13043c5a30635469150424a3`, green release CI; PM and Training both have Ready production receipts carried by `beb1848dd468b59d07969696beb45b4286d15f71` containing the merged consumer scope.
- [x] AUI-064: Capture and inspect desktop/mobile proof on a canonical consumer route. **Files:** `docs/tasks/evidence/shared-layouts/`. **Done when:** the changed consumer version renders on the canonical route and the screenshots are viewable in the closeout. Effort: M. Evidence: authenticated canonical `/67/commitments` (43 rows) and `/content` (8 rows), inspected at 1440px and 390px. Private PM evidence: `tests/agent-browser-runs/2026-10-12-shared-ui-v051-live/`; source/release readback: PM `docs/ops/evidence/working-context/2026-10-12-0328-shared-ui-tables.md`.

Gate: P6 remains open until source publication, consumer checks and deployed
desktop/mobile proof are all recorded. A component render is package evidence,
not proof of a deployed application.

## P7 — Remaining application presentation boundaries

Acceptance contract: move the canonical PM table implementation, preserving its
markup and sorting, filter, selection, editing, column ordering, print, loading,
pagination, split-pane and mobile contracts. The package must have no application
aliases or endpoints. Host adapters retain identity/navigation, saved-view CRUD,
bulk-write dialogs, preferences and failure reporting. Missing host integration
must throw a specific error. Required evidence: focused package and consumer
regressions, independent diff review, immutable release, scoped consumer
publication, deployment receipts and canonical desktop/mobile screenshots.

- [ ] AUI-070: Separate UnifiedTablePage's portable table/toolbar/state presentation from app preferences, reporting and shell adapters. **Files:** PM `components/tables/unified/`, package table modules. Tracking: [PM #2926](https://github.com/The-Alleato-Group/project-management/issues/2926). **Done when:** existing table regressions pass with a cross-project consumer and no copied table configuration/JSX. Effort: L.
- [ ] AUI-071: Finish the document picker boundary tracked in PM issue #2141. **Files:** package presentation and PM attachment adapter. **Done when:** APIs, upload/storage and permissions stay app-owned while presentation is shared and verified. Effort: L.

Gate: do not claim all application components are portable while these boundaries
or ASRS AUI-052 remain open.

## Decisions & blockers

- 2026-10-10 — P6 starts from PM `origin/main` (not the older detached primary checkout). The primary checkout has unrelated package metadata edits, so an isolated clean main checkout owns the conflicting consumer files. The existing package plan remains the single cross-repository checklist.
- 2026-10-10 — Full PageHeader/project-context presentation and UnifiedTablePage are not safe copy targets. P6 extracts the shell frame and tab/card owners first; host adapters retain header identity and navigation. P7 records the remaining boundaries.

- 2026-09-29 — ~~Blocked on Megan for npm~~ Dropped (Megan): GitHub tags are enough. Was: create the free npm org `alleato` and add a trusted publisher (repo `The-Alleato-Group/alleato-ui`, workflow `release.yml`). Everything else proceeds on GitHub tags.
- 2026-09-29 — Components ship as TypeScript source, not a compiled bundle. Every consumer is Next.js, which compiles it via `transpilePackages`, and Tailwind must scan the source anyway. No build step means no `"use client"` loss and no dist/source drift.
- 2026-09-29 — A package, not a shadcn copy-paste registry: copying files into each app is how `training/` drifted.

## Log

- 2026-10-10 — Resumed shared component extraction. Owned package files are the P6 exports, focused tests, README/version and this plan. Owned consumer files are the exact P6 app adapters, metadata, lockfiles and shared-package guardrails; unrelated primary-checkout files are preserved.

- 2026-09-30 — v0.3.1 candidate adds InlineEditField and EditableDetailField to the v0.3.0 second batch. `CommentComposer` takes author identity from its consumer; rich-text parsing remains React-node based without raw HTML execution. The document picker remains an app data adapter until its API and upload boundary is separated from presentation.

- 2026-09-29 — ASRS P30 handed to the ASRS Orchestrator (Megan: ASRS takes the package element defaults, Oswald uppercase titles). v0.2.0 adds the first `ds` batch; main app + Learning app switched in `06310e2b0a`. Disk hit 100% mid-run (1.8 GB free); `pnpm store prune` + npm cache clean recovered ~6 GB.

- 2026-09-29 — npm dropped: package marked private, release workflow creates GitHub release notes instead of publishing, issue #1 closed.

- 2026-09-29 — v0.1.2: `--font-sans`/`--font-title` now fall back when an app does not define `--font-inter`/`--font-oswald` (ASRS rendered Times without them); a test fails on any unguarded app-provided variable. `tailwindcss` is an optional peer (tokens-only consumers such as ASRS no longer get it installed). `scripts/sync-from-app.mjs` deleted: the package is now the source.

- 2026-09-29 — Main app switched (`af891fb7d1`): 48 re-exports, token block moved, shared use-mobile hook, jest transforms the package, 16 source-reading contract tests pointed at the real source via `src/test-utils/shared-ui-source.ts`. Full frontend jest 16,649 pass; the 2 failing suites fail identically on untouched main. Local vs production screenshots identical on /67/home, /67/commitments, /67/budget.

- 2026-09-29 — v0.1.0 tagged; Learning app switched (project-management `d21c20e3cb`), release pending the 30-minute controller. v0.1.0 was built from a stale checkout (table headers still uppercase, old button hover, old `--surface-alt`); v0.1.1 resynced from origin/main with `scripts/sync-from-app.mjs`. Mintlify step dropped (site retired 2026-09-25). ASRS token adoption handed to its own phase-gated session.

- 2026-09-29 — Plan created; repo created (public).

- 2026-10-10 — P6 package candidate v0.4.0 passes `pnpm check` (typecheck, 149 tests); focused source-linked PM checks pass 126 tests and Training shared ownership checks pass 93. Source-linked checks map React to the consumer peer to avoid a second React instance. Training also replaces its eight remaining v0.3 package-owned DS copies; identity stays in its CommentComposer adapter. Consumer publication and deployed visual proof remain open.

- 2026-10-10 — v0.4.0 source `3e0f31aa6ebbf150febe6be745ec3156c0f99042` is published; release workflow [38097368788](https://github.com/The-Alleato-Group/alleato-ui/actions/runs/38097368788) passed typecheck and 150 tests. A standalone React example has desktop/phone browser proof and checked selection/tab interaction. This proves package portability, not deployed PM/Training adoption; AUI-063/064 stay open pending the consumer merge/release. UnifiedTablePage follow-up is PM #2926; document picker remains #2141.

- 2026-10-10 — Consumer scope is published in [draft PM PR #2927](https://github.com/The-Alleato-Group/project-management/pull/2927), head `2f2edf49a040090ca3eeb3e39798dd1719862380`. Changed-quality, guardrails and Training CI passed; the full frontend suite and actual Codex code review were still running at closeout. Auto-merge is not armed while review is pending. The standalone example [verification summary](evidence/shared-layouts/VERIFICATION_SUMMARY.md) and desktop/mobile screenshots are package portability evidence only. Live `/directory/employees` proof was limited by the configured test role, and `/tasks` had no rows; neither proves the new consumer version.

- 2026-10-10 — Retired the isolated consumer checkout after proving its complete 26-file tree equals the published PR head. Recovery is retained in PM `refs/codex/snapshots/shared-ui-layouts-20261010` (`e718257691fec2660f00076e1d92e6310ca088e4`) and `/Users/meganharrison/.codex/worktrees/shared-ui-layouts-consumer.patch`. The primary checkout's unrelated changes and shared dependencies were preserved. Codex artifact attachment was unavailable (`Transport closed`); the PR and proof remain accessible through their direct links.

- 2026-10-11 — PR #2927 review repair is published at `59347eb9065b55afa8abeb2d2cfecf0cf5025580`: per-session evidence replaces the shared context edit; the print regression now checks the package owner and app adapter together. Focused 117 tests and ESLint pass. Review thread resolved; PR is ready and auto-merge is armed for the main merge queue. CI reruns are pending. AUI-071 presentation extraction starts while that verification runs; package DTOs and views own no endpoints, entity rules, upload constraints or persistence.

- 2026-10-11 — AUI-071 package candidate v0.5.0 extracts `DocumentAttachmentsView`, `LinkedDocumentsView` and `DocumentLinkView` from the canonical identical PM/Training source. Exact package ownership: `src/ds/document-picker.tsx`, `test/document-picker.test.tsx`, `package.json`, `README.md`, `scripts/build-layout-example.mjs`, this plan, and `docs/tasks/evidence/shared-documents/`. Package `pnpm check` passes typecheck and 158 tests. Focused PM 119 and Training 94 tests pass; PM ESLint passes. Desktop/390px standalone screenshots and the controlled category edit were inspected; browser errors were empty. API methods/payloads, cache invalidation, upload constraints and current entity policies remain host-owned. App merge/deployment/canonical proof stays open.

- 2026-10-11 — v0.5.0 is source-published at `6e35c4c5170944f172144ea22f2beb91f32d3ba1`; immutable tag object `087024beaf754a1d4f60994060ee459252d36dbc` dereferences to that source. [Release CI 38105313092](https://github.com/The-Alleato-Group/alleato-ui/actions/runs/38105313092) and regular CI passed. Consumer pins/locks resolve v0.5.0 with focused checks passing; consumer publication is being prepared after the v0.4.0 adoption merge. Existing admin verification credentials were discovered without changing permissions; canonical page proof is retrying with that existing identity.

- 2026-10-11 — Existing configured admin identity passed authenticated desktop/mobile baseline proof on `/67/commitments` with actual file-card rows; initial test-role limitation is resolved without permission changes. v0.5.1 makes the public list Edit action conditional on an available edit-state callback, preventing an unreachable action in partial host integrations; a focused regression covers that boundary. App adoption uses this patch release.

- 2026-10-11 — Final consumer scope is consolidated in [PR #2927](https://github.com/The-Alleato-Group/project-management/pull/2927), head `82f0d6532ff8d7cc07e69eee8828271abb975489`, using v0.5.1 source `81b638baa8a209ad13043c5a30635469150424a3`. [Release CI 38105552392](https://github.com/The-Alleato-Group/alleato-ui/actions/runs/38105552392) passes typecheck and 159 tests. Final focused PM checks pass 130 tests; Training ownership checks pass 94. This final head has fresh independent Codex review and consumer CI running, with auto-merge unarmed. Its layout-only predecessor passed the full quality gate. The old merge-queue entry was explicitly removed through GitHub `dequeuePullRequest` before the final source update; `gh pr merge --disable-auto` does not dequeue an already queued PR.

- 2026-10-11 — Final consumer checkout retired after clean status and exact remote-head readback. Recovery is PM `refs/codex/snapshots/shared-ui-final-20261011` at the published PR head. Canonical authenticated baseline screenshots are retained in PM ignored proof artifacts `tests/agent-browser-runs/2026-10-11T02-32-12-683Z-shared-layouts-existing-admin-baseline/`, and the existing admin auth state is retained separately in a private ignored file. Package screenshots remain standalone sample evidence. AUI-051/062/063/064/071 stay open pending final review, merged source, release receipts and deployed canonical page proof. No primary-checkout product files or account permissions were changed. Codex PR attachment remains unavailable (`Transport closed`); the direct PR link is authoritative.

- 2026-10-11 — Resumed the full-plan completion audit. PR #2927 final head passed its full quality gate and fresh Codex review, and is queued for merge. Codex artifact attachment now succeeds. AUI-030 is reopened because its checked tokens-only evidence did not fulfill its original component screenshot criterion. Current ASRS AGENTS directs new estimator development into PM while preserving standalone until cutover; P30 adoption must respect that ownership. P7 uses isolated PM main because the primary table owner has concurrent edits. Package table candidate moves the canonical implementation and exposes explicit host adapters; TypeScript and focused interaction verification are in progress. The machine rejected the first scratch write for disk exhaustion; regenerable npm cache was cleared and concurrent cache reclamation recovered space. No primary product files were changed.

- 2026-10-11 — PR #2927 merged at `ca45b76f44c9782bd7f52bbb4e9774d24e7a074a`. Ready PM and Training production deployments carry that source through `beb1848dd468b59d07969696beb45b4286d15f71`. Canonical authenticated desktop/390px screenshots of commitments and Content Studio were inspected; P6 adoption, publication and visual items are now checked. The attachment view also renders on an existing commitment at both sizes, but this record has no attachments: populated-document and permission evidence remains open for AUI-071. No live records were modified.

- 2026-10-11 — P7 candidate v0.6.0 moves the canonical table/toolbar and shared split/modal/panel owners into the package. The package has no application aliases or endpoints and requires explicit host services. Package TypeScript and all 187 tests pass. PM interaction/source contracts pass (including 98 table tests, 11 row/split/edit tests, package ownership and 39 panel/print contracts); Training ownership passes 113 tests. PM targeted ESLint has zero errors and one inherited currency-format warning in the retained app formatter. A standalone sample builds with compiled CSS modules included. Candidate browser proof, independent review, release and consumer publication remain open. The in-app browser blocks direct file URLs; no alternate browser or protocol bypass was attempted. New local processes remain prohibited by the process-budget gate while two active shared dev servers are running.

- 2026-10-11 — Full table extraction is published in [draft library PR #3](https://github.com/The-Alleato-Group/alleato-ui/pull/3), source `125a585a08a52c883a8b7d669f93cc177090cf12`; [CI 38200048224](https://github.com/The-Alleato-Group/alleato-ui/actions/runs/38200048224) passes. Both consumer locks now resolve that immutable candidate commit. The installed PM package passes a single focused release checkpoint: 60 suites, 487 tests. Standalone desktop, 390px, split and filtered-selection/edit screenshots were inspected using an isolated HTTP preview of sample-only content; the preview verified the generated artifact hash and was stopped afterward. [Candidate verification](evidence/shared-tables/VERIFICATION_SUMMARY.md) records the exact scope. A host-example nested-heading error was localized and corrected without altering the table owner. P7 remains open for fresh independent review, release and deployed adoption.

- 2026-10-12 — Consumer candidate published in [draft PM PR #2956](https://github.com/The-Alleato-Group/project-management/pull/2956). First fresh-context P7 review returned FAIL: Training's manifest changed but its workspace lock did not, so a clean installation would lack the new table exports. The initial lock command inherited the root workspace. Regenerating with explicit `--ignore-workspace` repairs the boundary; actual frozen Training installation and 114 ownership checks pass. Both consumer suites now enforce matching immutable manifest/lock entries; a controlled stale-lock mutation is rejected. A different fresh reviewer must pass before release.

- 2026-10-12 — Second fresh P7 review returned FAIL despite correct installed pins: Training's compiler exposed header/bulk-editor differences and its old table owns `viewLabel`, `onDeleteBatch` and domain `deleteCopy`, which the initial PM-only extraction omitted. Preserve these portable behaviors in the shared table/mobile cards, and translate Training's existing header/string-only bulk editor once in its table adapter. Regressions cover named view/delete copy and one batched deletion containing only visible, allowed rows. Training's bulk adapter rejects unsupported null clears and preserves writer failures. The repaired candidate must pass an actual installed Training typecheck and another fresh gate. A scratch source-mapped compile had incorrect type-root resolution; its React/Jest diagnostics do not establish product defects.
