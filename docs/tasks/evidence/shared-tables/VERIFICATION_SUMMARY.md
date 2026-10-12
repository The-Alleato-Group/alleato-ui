# Portable unified table candidate

The sample imports the actual package table, shared primitives and CSS module.
It supplies sample rows and a typed host adapter, with no Next.js route hooks,
app aliases, API client or application server. Unsupported host writes fail
explicitly if enabled. No production records or credentials are included.

The generated HTML was served over an isolated Vercel Sandbox HTTP preview.
The preview verified SHA-256
`ab1be2a22f3f9d1a01d702778d020d9319e203cffb79e3237fa0851babccbe10`
before serving it. The temporary session was stopped after verification; its
URL is not a persistent deployment. Direct file navigation was unavailable.

Browser checks passed:

- Ascending project sorting produces Distribution center, Office renovation,
  Warehouse expansion.
- A Status is Active rule removes Office renovation and reports two of three
  rows. Select-all selects exactly those two visible rows.
- The inline Project editor updates the host sample row on Enter. The final
  interaction capture shows Warehouse expansion revised and two selected rows.
- Hiding Owner removes its table column; the shared property-visibility menu
  restores it. The restored ordering also appears in split detail.
- Split view uses the shared list and editable detail fields with the same
  selected-row state.
- At 390x844 the same table renders shared phone cards, without horizontal
  overflow. At 1440x900 it renders the desktop table.
- The corrected host renders supplied title content directly; the DOM has one
  level-one heading. Captures were inspected after viewport layout settled.
- Browser error logs were empty.

Evidence:

- [Desktop](desktop-1440.png)
- [Phone](mobile-390.png)
- [Split view](split-desktop-1440.png)
- [Filtered selection and edit](filtered-selected-edited-1440.png)

Package TypeScript and 187 tests pass. The installed PM candidate passes 60
focused suites and 487 tests, including table, split, modal, panel, print and
stored preferences. Training ownership checks pass 113 tests. Library PR #3 CI
passed at extraction commit `125a585a08a52c883a8b7d669f93cc177090cf12`.

This is package portability evidence. Independent review, immutable v0.6.0
release and deployed consumer proof remain required. v0.5.1 live app captures
prove only the previously released layout and document adoption.

## Repaired candidate gate — 2026-10-12

Fresh reviewer `/root/table_candidate_final_review` returns PASS for release
readiness at `0796a66aee29797a182cf61d45cb113b31792844`, consumed by PM PR #2956
head `692cac7465309a5c503eab8a5e9d5db52255215e`. It independently ran package
TypeScript and 189 tests, installed Training TypeScript and 117 focused tests,
and 217 PM focused tests. It compared both apps' original contracts and checked
actual manifest/lock installation consistency. Training retains view labels,
domain delete copy, allowed visible-row batch deletion and its string-only
bulk editor through a typed host adapter. The same standalone screenshots
were inspected; release and canonical deployed v0.6.0 proof remain open.

## Canonical v0.6.1 runtime — 2026-10-12

Consumer PR2956 merged at `3bc4060878dd26cdf0808ea2394446927a811483`
and release38210486498 succeeded (GitHub event `workflow_dispatch`,
non-forced controller batching mode `scheduled`; trigger origin unproven). PM deployment
`dpl_HvCfnmZWWfK3AbnzL9UoF31TSpRx` and Training deployment
`dpl_Bz9qFiPc8i1g83Te6nWJTPkhJuoy` are Ready/Promoted with that exact
carrier. Actual canonical page script URLs identify each application’s own
receipt. Both installed pins resolve immutable v0.6.1 source
`0f817c22c7e3c51de432b8b747a54341c80e35ab`.

Canonical commitments show 43 existing rows at 1440x900 and shared cards at
390x844. Selection preserves row identity across viewport changes and exposes
an enabled selected-row action through phone View settings (y446-502). No
delete is invoked. Training Content Studio shows 8 existing rows at both sizes;
its phone selection checkbox exposes Edit selected and opens the existing
bulk-edit host dialog for one row. Apply remains disabled until a field is
selected; the dialog is cancelled without a submission and selection is cleared.

All 15 new canonical images, exact dimensions/hashes, runtime observations and
sanitized provider receipts are private in PM
`tests/agent-browser-runs/2026-10-12-shared-ui-v061-live/`. No production
records or credentials are copied into this public package. Independent runtime reviewer `/root/evidence_provenance_review` returns
PASS after inspecting all 15 JPEGs, native format/dimension/hash metadata,
actual provider aliases and carrier SHAs, source pins and release logs. The
reviewer session was reused under the resource governor; it did not create
these artifacts or perform product edits.

The unused Training mobile compatibility path and its anti-fork guard were
separately reviewed and merged in PR2968 at
`4ac4d304157606969a29a55f26412bc8bedb4715`. Its publication does not change
package runtime bytes or the table already rendered by these production builds.
This proof does not establish the standalone ASRS migration.
