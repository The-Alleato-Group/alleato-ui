# Shared layout package proof — 2026-10-10

Package release: [v0.4.0](https://github.com/The-Alleato-Group/alleato-ui/releases/tag/v0.4.0), source `3e0f31aa6ebbf150febe6be745ec3156c0f99042`.

This is a standalone React consumer with explicit sample records. It uses the actual package layout/tab/card exports and shared theme CSS. It has no PM routing, identity or API dependencies. It is package evidence, **not deployed PM or Training proof**.

- Release CI: typecheck and 150 tests passed ([run](https://github.com/The-Alleato-Group/alleato-ui/actions/runs/38097368788)).
- Consumer example typecheck: `pnpm exec tsc --noEmit --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --esModuleInterop --skipLibCheck docs/tasks/evidence/shared-layouts/consumer.tsx` passed.
- Browser at 1440×900: Active tab filters three sample projects to two; desktop table uses package typography/status presentation.
- Browser at 390×844: mobile cards replace the desktop table. Checkbox selects the first card, showing `1 selected` without activating navigation. Clicking the card then calls the host callback, showing `Opened Warehouse expansion`.
- Browser error log was cleared before the final load; the final load and interactions had no errors.
- Desktop and phone screenshots were inspected visually. Phone content fits the viewport and the selected state is visible.

Artifacts: [interactive example](index.html), [source](consumer.tsx), [desktop](desktop-1440.png), [phone selected state](mobile-390.png).

Rebuild with `node scripts/build-layout-example.mjs` after installing development dependencies with pnpm. The generated HTML embeds its bundle and shared CSS, so it needs no dev server.

Focused source-linked consumer checks: PM 126 tests (tabs, shell, gutters, mobile cards and ownership); Training 93 ownership checks. PM changed-file ESLint passed. The source-linked harness resolves React from the consumer peer to avoid loading a second React instance. The consumer manifests/lockfiles pin the published v0.4.0 tag.

Production baseline: the existing `/tasks` route was inspected at desktop and 390px through the repository authenticated browser preflight. That test identity has no matching task rows. The staff-only Employees directory correctly denies the configured identity. Neither baseline is counted as proof that the new app consumer version is deployed.
