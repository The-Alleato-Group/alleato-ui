# Main-app ASRS shared UI acceptance

Megan confirmed on 2026-10-12: “ASRs is the main app”. The owning route is
`https://projects.alleatogroup.com/asrs`, rendered by PM
`frontend/src/features/asrs/route-page.tsx`. This supersedes the standalone
destination for AUI-030/052; the standalone application's data, access and
deployment retirement remain with the separate cutover owner.

## Acceptance contract

The canonical dashboard, estimate list and workbook, historical datasets, FM
reference lists/details and chat presentation must reuse package primitives or
their existing PM host adapters. Shared presentation owns styling; existing
application owners retain data, routing, calculations, pricing, persistence,
permissions and AI execution. No copied primitive or ASRS-local token vocabulary
may substitute for the shared owner. Completion needs applicable regression
evidence, actual deployed desktop/390px proof and independent review.

## Source ownership

| Presentation | Canonical owner and package boundary |
| --- | --- |
| Buttons and inputs | PM re-exports of package Button/Input/NumberInput |
| Field labels and choices | Existing TextField/NumberField/SelectField adapters, package Input/NumberInput/Select/Label |
| Dashboard cards | Navigable links compose the package-owned `chartCardSurfaceClassName`; StatusBadge and LocalDateTime are package owners |
| Tables and mobile cards | Estimate/history/FM routes reuse UnifiedTablePage and its app host adapter; workbook quantity/result tables use package DataTable |
| Dialogs and menus | Canonical estimate/drawing adapters compose package AlertDialog/Dialog/DropdownMenu; their callbacks remain app-owned |
| Form sections and layouts | Existing PM FormSection/Grid and PageShell adapters preserve the supplied ASRS frame; portable page/layout presentation is package-owned |
| Chat | ASRS supplies the FM data actions to the existing Eve chat presentation; package Button and existing shared composer owners are reused |

The dashboard deliberately retains semantic navigation links with the existing
package card surface. The generic shadcn Card renders a div and has no asChild
contract; replacing the canonical link with that container would alter the
navigation/markup owner. This is the inspected shared card-presentation mapping,
not a claim that the dashboard renders a literal Card component.

## Baseline deployed walkthrough

The Ready/Promoted PM release `dpl_HvCfnmZWWfK3AbnzL9UoF31TSpRx` carries
`3bc4060878dd26cdf0808ea2394446927a811483` and package v0.6.1. Actual canonical
ASRS script URLs identify this deployment. ASRS feature source is byte-unchanged
between that carrier and the later merged Training repair `4ac4d304…`.

Private business-record evidence remains outside this public repository, in PM
`tests/agent-browser-runs/2026-10-12-shared-ui-v061-live/main-app-asrs/`:

- 26 native JPEG captures at 1440x900 and 390x844: dashboard; workbook inputs,
  pricing, quantities and estimate; estimate list; projects/prices/labor history;
  FM tables, figures and loaded detail; chat with disabled empty Send action.
- Native format/dimension/SHA256 manifest and actual route/deployment observations.
- Phone pages have no page-wide horizontal overflow. The figure detail loads its
  source image. Chat audit inspects presentation without submitting a question.
- No values edited, records saved/deleted, files uploaded, pricing applied,
  permissions changed or AI execution triggered. The saved synthetic workbook
  displays its pre-existing drawing-integrity warning; this audit does not claim
  to repair or approve that source evidence.
- Five initial phone captures had 390x244 native geometry because their resize
  had not settled. They are preserved under rejected-captures and excluded from
  the accepted manifest; replacement captures pass the actual-dimension guard.

## Remaining repair and gate

Independent source audit returned PARTIAL: the canonical shared estimate list
still drew local status dots, and the workbook primary Save action supplied its
50px geometry at the callsite. The repair moves estimate statuses to package
StatusBadge with schema-owned labels, adds the central pending-review warning
mapping, and names the existing Button geometry `size="summary"` while preserving
full-width layout. No calculation/query/write/permission/AI contract changes.

Package focused tests pass (141 assertions). The new consumer regression checks
all three estimate types in table/list views, including Pending Review and the
existing null/legacy Draft fallback. Fresh independent `/root/asrs_library_release_review` returns PASS for the
package release boundary after inspecting the repair and running the six status
regressions. The earlier full-adoption review correctly failed the intentionally
old consumer pin and uncovered a Jest-discovery gap; the consumer test is now
named `.unit.test.tsx`, matching normal discovery. Immutable v0.6.2 now passes
CI38224809562 and release38225654179; tag object
`521768c9c6cbafe769313bd1ba74e6328a689fd5` dereferences to reviewed source
`0d1185ad2a20bd38df7799837e8f5ea9339fcdfd`. Both installed consumers and
exact immutable manifest/lock pairs pass a different fresh consumer review
(`/root/asrs_v062_consumer_review`): 131 PM and116 Training assertions, changed-file
ESLint, preserved schema fallback/callbacks and no unrelated dependency/patch changes.
[PM PR2972](https://github.com/The-Alleato-Group/project-management/pull/2972)
contains the eight-file scope at `ced019743e611f98b43af8d86980da47af7e5b7a`.
Merge and post-repair Ready/deployed proof remain open.

**AUI-030 and AUI-052 remain open.** Baseline renders and source imports do not
close the repaired-owner deployment gate.
