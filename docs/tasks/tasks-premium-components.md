---
title: Premium shared components and motion
id_prefix: PCM
status: done
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

- [x] PCM-005: Verify behavior, rendering, keyboard and reduced motion. **Files:** `test`, browser evidence. **Done when:** Focused behavior tests, typecheck, suite and catalog build pass; light/dark at 375/768/1440 render and interactions/focus are checked. Effort: M. Evidence: typecheck; 344 tests across 19 files; static build with 142 stories; Chromium light/dark at 375/768/1440; filter apply/reset/cancel, saved toggles, keyboard radio selection, focus return, phone geometry and broken-image fallback passed.
- [x] PCM-006: Merge and publish a versioned shared package. **Files:** package version, README, workflow. **Done when:** Remote main contains the changes, release workflow passes and tag/release readback succeeds. Effort: S. Evidence: PR #31 merged as b04fffdf0746dec7c904d397fc75c9ac09389fc9; main CI 44150918621 and Release 44150944156 passed; v0.8.0 read back as published and not draft.

Gate: Report source release separately from app adoption or hosted catalog deployment.

## Decisions & blockers

- No attachment accompanied “components shown”; use the existing shared catalog as context. Scope is the named reusable set and composed filter flow, not every screen of Airbnb.
- [Airbnb filter flow](https://mobbin.com/flows/c88c5d8a-56ab-4823-87fc-7ed6f335c0fd), [Airbnb choices](https://mobbin.com/screens/dad4c99d-a212-419f-a44f-2f373d2f83db), [Fresha comparison](https://mobbin.com/screens/9dd18f7e-0f22-4234-8933-4910bc9a796e), [Revolut comparison](https://mobbin.com/screens/d6d26e5a-fcb7-4903-bc5b-af4099a0df59).
- Mobbin establishes layout/states, not measured animation timing. Airbnb's [official release](https://news.airbnb.com/airbnb-2025-summer-release) confirms its animated design direction. Timings here are our maintained implementation, not an extracted proprietary motion specification.
- Preserve existing Alleato branding and the owner-approved stationary desktop dialog fade. New components use scoped CSS modules; no global redesign of consumer applications.
- Web React exports only. Native ports and deployed consumer adoption require their own implementation and verification.

## Verification details

- Package archive contains all six public components, CSS module and motion tokens. No extra animation dependency.
- UI-R01/R03: pass for the inspected collection at 375/768/1440; no page/descendant horizontal overflow. UI-C02: all new controls have at least 44px targets. UI-C03/C04/C06/C07/C09: names, keyboard selection, dismiss/focus restoration, semantic states and bottom-attached full-width phone sheet verified in Chromium.
- Reduced motion: reveal/favorite animation names are `none`. Indicator, Switch and Dialog durations are at most 0.01ms because the existing global reduced-motion rule uses an important duration override. Dialog retains the `enter` animation name; it is effectively instantaneous, not a literal `animation: none` result.
- `pnpm check:ui` is not configured in alleato-ui (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`). The MKH checkout's required checker separately passed (0 new findings), but that checker does not scan this shared repository. Source hooks found no issues in the new CSS after replacing overshoot easing and removing dimension transitions. Existing legacy spring tokens were preserved for existing consumers.
- Full WCAG certification, VoiceOver/TalkBack, device keyboard/zoom checks, React Native ports and deployed app adoption are not claimed.
- Local browser script/log: `/tmp/verify-premium.cjs`, `/tmp/alleato-premium-browser.log`; screenshots `/tmp/alleato-premium-{light,dark}-{375,768,1440}.png`. A standalone static copy serves the reviewed artifact at http://localhost:6018/?path=/story/premium-interaction-library--collection.

## Log

- 2026-11-17: Inspected current remote main and isolated catalog checkout; rebased catalog onto f1f7775. Existing dirty checkouts preserved.

- 2026-11-17: Implemented and pushed d40a9f1. Full package checks, rendered interaction checks and archive inspection passed. Source publication remains separate from application adoption.

- 2026-11-17: Published [v0.8.0](https://github.com/The-Alleato-Group/alleato-ui/releases/tag/v0.8.0) from b04fffd. [Release workflow](https://github.com/The-Alleato-Group/alleato-ui/actions/runs/44150944156) and main CI passed. Persistent sample screenshots are in `docs/tasks/evidence/premium-components/`. Consumer rollout and hosted catalog deployment are separate from this source-package delivery.
