---
title: Premium shared components and motion
id_prefix: PCM
status: in-progress
project: alleato-ui
created: 2026-11-17
updated: 2026-11-17
source: Megan's Mobbin reference and shared component library request
---

# Tasks — Premium shared components and motion

**Outcome:** Extend the existing shared web library with a cohesive Airbnb-inspired component set, reusable motion, interactive catalog examples, and a published release. The library owns presentation; consumers own data, navigation and persistence.

## P0 — Reference and ownership

- [x] PCM-001: Inspect existing library and compare Mobbin references. **Files:** existing package, stories. **Done when:** An inspected reference and explicit component scope are recorded. Effort: S. Evidence: Airbnb, Fresha and Revolut web screens inspected; Airbnb selected for choice controls, compact counters, media cards and filter composition.
- [x] PCM-002: Publish the existing catalog source from its isolated checkout. **Files:** `.storybook`, `stories`, catalog plan. **Done when:** Rebased catalog passes checks and lands on remote main. Effort: S. Evidence: PR #30 merged as d655712; typecheck, 334 tests and static build passed.

Gate: Reuse existing primitives and keep unrelated checkout changes untouched.

## P1 — Shared implementation

- [x] PCM-003: Add controlled segmented selection, selection cards, quantity stepper, favorite button, media card and motion reveal. **Files:** `src/ds`, `styles`. **Done when:** Importable components share motion tokens, preserve semantics and work with reduced motion. Effort: L. Evidence: six package exports and scoped CSS module, shared motion tokens, focused behavior tests and typecheck.
- [x] PCM-004: Compose an interactive premium workbench and component state stories. **Files:** `stories/premium`, catalog welcome. **Done when:** Each component has usable examples; filters reuse the canonical responsive dialog and existing form controls. Effort: M. Evidence: Collection plus six focused stories, static build and 375/768/1440 light/dark rendering.

Gate: Components contain no app data/provider dependencies; motion is optional and state remains legible without it.

## P2 — Verify and release

- [ ] PCM-005: Verify behavior, rendering, keyboard and reduced motion. **Files:** `test`, browser evidence. **Done when:** Focused behavior tests, typecheck, suite and catalog build pass; light/dark at 375/768/1440 render and interactions/focus are checked. Effort: M.
- [ ] PCM-006: Merge and publish a versioned shared package. **Files:** package version, README, workflow. **Done when:** Remote main contains the changes, release workflow passes and tag/release readback succeeds. Effort: S.

Gate: Report source release separately from app adoption or hosted catalog deployment.

## Decisions & blockers

- No attachment accompanied “components shown”; use the existing shared catalog as context. Scope is the named reusable set and composed filter flow, not every screen of Airbnb.
- [Airbnb filter flow](https://mobbin.com/flows/c88c5d8a-56ab-4823-87fc-7ed6f335c0fd), [Airbnb choices](https://mobbin.com/screens/dad4c99d-a212-419f-a44f-2f373d2f83db), [Fresha comparison](https://mobbin.com/screens/9dd18f7e-0f22-4234-8933-4910bc9a796e), [Revolut comparison](https://mobbin.com/screens/d6d26e5a-fcb7-4903-bc5b-af4099a0df59).
- Mobbin establishes layout/states, not measured animation timing. Airbnb's [official release](https://news.airbnb.com/airbnb-2025-summer-release) confirms its animated design direction. Timings here are our maintained implementation, not an extracted proprietary motion specification.
- Preserve existing Alleato branding and the owner-approved stationary desktop dialog fade. New components use scoped CSS modules; no global redesign of consumer applications.
- Web React exports only. Native ports and deployed consumer adoption require their own implementation and verification.

## Log

- 2026-11-17: Inspected current remote main and isolated catalog checkout; rebased catalog onto f1f7775. Existing dirty checkouts preserved.
