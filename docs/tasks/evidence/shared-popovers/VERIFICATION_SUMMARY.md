# Shared popover viewport regression

Date: 2026-10-12. Source: base `6621fe6731b922f37e4052abe1c61cb0c329deb4` plus the scoped `src/components/popover.tsx` change.

The canonical live schedule calendar at 390x844 was taller than the viewport: top184, bottom1055, Clear top1010. Its shared PopoverContent had no max-height or internal scroll. Private production proof remains in the PM browser evidence directory; public files here contain sample data only.

The fixture imports the actual package DateRangePicker and PopoverContent. Build: `node scripts/build-layout-example.mjs shared-popovers` passed. Browser served the resulting single-file HTML through a temporary Vercel Sandbox, using the existing PM project. Connector creation returned scope403; the official CLI with the same explicit team/project succeeded. No provider configuration was changed.

At 1440x900, both months and Clear fit. Popup top196, bottom545, clientHeight347, scrollHeight347, overflowY auto.

At 390x844, calendar popup top180, bottom844, clientHeight662, scrollHeight774, maxHeight664px, overflowY auto. A wheel gesture moved scrollTop from0 to112.5 and exposed Clear (top799, bottom831). Clicking Clear changed the sample status to `Sample range cleared.`

The second generic 24-item popup also constrained height and scrolled: top268, bottom844, clientHeight574, scrollHeight1012, scrollTop438. Its bottom button was visible and clickable. No browser warnings/errors were captured.

Screenshots:
- `calendar-desktop-1440.png`
- `calendar-mobile-390.png`
- `calendar-scrolled-mobile-390.png`
- `calendar-cleared-mobile-390.png`
- `long-popup-scrolled-mobile-390.png`

Independent fresh reviewer `/root/popover_patch_review` inspected the actual source diff, compiled CSS and screenshots and returned PASS. `pnpm typecheck` passed. The temporary sandbox was stopped and its stopped status was read back; browser viewport override was reset.

This proves the portable component boundary. Consumer installation and deployed live patch verification are still required before rollout closure. Tracking: [library issue #4](https://github.com/The-Alleato-Group/alleato-ui/issues/4).

## Canonical v0.6.1 deployed patch — 2026-10-12

Consumer release38210486498 succeeds for merge carrier
`3bc4060878dd26cdf0808ea2394446927a811483`. Canonical schedule/resources
page assets identify Ready/Promoted PM deployment
`dpl_HvCfnmZWWfK3AbnzL9UoF31TSpRx`, whose manifest installs v0.6.1. GitHub event is `workflow_dispatch`;
verified controller batching mode is `scheduled` with force false. Trigger
origin is unproven; no agent dispatch or workflow change is made here.

At 390x844, the real date-range popup stays between y184 and844: maxHeight
660px, clientHeight 658, scrollHeight 869, overflowY auto. A wheel gesture
scrolls 211px and exposes enabled Clear at y798.969-830.969. Clicking Clear
changes the host's range to its placeholder and visible missing-range validation;
reload restores the read-only initial range. At 1440x900 both months and Clear
fit (y223-679.484, clientHeight=scrollHeight454). No schedule or capacity
record is saved. Viewport is reset.

Private screenshots and measured runtime observations are in PM
`tests/agent-browser-runs/2026-10-12-shared-ui-v061-live/`; these are actual
new-version canonical proof, separate from the sample screenshots above and
the v0.5.1 overflow baseline. Different independent runtime reviewer `/root/evidence_provenance_review`
returns PASS on actual JPEGs and before/after comparisons, native image
metadata/hashes, provider receipts, installed pins and release logs. The
reviewer session was reused under the machine budget without adding runtimes.
