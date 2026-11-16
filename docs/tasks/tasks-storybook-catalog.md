---
title: Alleato UI Storybook catalog
id_prefix: ASB
status: done
project: alleato-ui
created: 2026-11-16
updated: 2026-11-16
source: Codex catalog request
---

## P0 — Ownership and setup

- [x] ASB-001: Isolate changes from the active table branch. **Files:** Git worktree. **Done when:** The original checkout is untouched and the catalog starts from remote main. Effort: S. Evidence: isolated worktree at 8e58750.
- [x] ASB-002: Connect Storybook to the existing Next, React, and Tailwind setup. **Files:** .storybook, package.json, pnpm-lock.yaml. **Done when:** Storybook builds with the package theme and exposes a light/dark switch. Effort: S. Evidence: frozen-lockfile install, static build, and verified theme switch.

Gate: Shared theme and preview are available without changing package runtime code.

## P1 — Catalog and verification

- [x] ASB-003: Cover public visual entry points with interactive examples. **Files:** stories. **Done when:** Public visual modules map to named stories and representative controls and states can be exercised. Effort: L. Evidence: 112 public visual modules have dedicated story files; the table host is exercised by the toolbar and unified table examples.
- [x] ASB-004: Verify package checks, the static build, and browser behavior. **Files:** stories, local evidence. **Done when:** The catalog renders without failed stories and representative controls, theme, and responsive behavior pass. Effort: M. Evidence: TypeScript, 333 tests across 18 files, and the static build passed. Chromium rendered 135 stories in each theme and verified navigation, controls, dialog focus and phone layout, form validation, number formatting, and local table search, selection and inline edits.
- [x] ASB-005: Document startup and hand back the preview and screenshot. **Files:** README.md, local evidence. **Done when:** Someone can reopen the local preview and rebuild it from the lockfile. Effort: S. Evidence: README startup and build instructions; static preview served on localhost and desktop and phone captures inspected.

Gate: Verified local implementation. Source publication and hosting are independent.

## Decisions & blockers

- Use the library's own tokens and a local fixture for host-owned table behavior. No package release or hosted deployment is needed for local verification.

## Log

- 2026-11-16: Started in an isolated worktree from origin/main.
- 2026-11-16: Verified the local catalog and captured browser evidence. Branch is local; no release tag or hosted deployment.
