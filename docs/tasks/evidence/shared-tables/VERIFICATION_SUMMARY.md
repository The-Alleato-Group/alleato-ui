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
