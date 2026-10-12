# Original shared primitive adoption

Acceptance: six representative consuming pages have identical before/after
screenshots when local shadcn implementations and tokens become package owners.

Verified 2026-10-12 from retained application deployments, using the existing
configured admin identity. No records, permissions, settings or production
aliases were changed; both temporary proof tabs were closed afterward.

| | Deployment | Source | State |
| --- | --- | --- | --- |
| Before | `dpl_EuVmmB1r2V6WuU5gcCo7GVV5mJmV` | `159a55109c2d5d81733b2eec14aabe71d607b949` | Ready, Promoted |
| After | `dpl_Gzu8LEW44tXtJ2JRtiW7M6zeHF7h` | `da06517bab06386ad1f01651d0efc83da40cc1ec` | Ready, Promoted |

Before URL: `https://project-management-agent-3cy9d7fes-the-alleato-group.vercel.app`.
After URL: `https://project-management-agent-1ksrdj1jb-the-alleato-group.vercel.app`.
Provider readback confirms each exact source; observed browser script assets
identify the matching deployment IDs.

Adoption commit `af891fb7d1c688f880c6f536f1fb8ddd29c71002` is an ancestor
of the after carrier. It installs original package v0.1.1, resolved source
`372fd8856f853f49b8aa903e03e76e1e334308e0`. The before Button has a local
implementation; the after Button re-exports the package. Representative page
product source is unchanged between the carriers. Both carriers include the
separate toolbar consolidation, so that unrelated visual delta is excluded by
choosing comparable actual deployments.

| Page | Route | Full-image changed RGB pixels |
| --- | --- | ---: |
| Home | `/67/home` | 0 |
| Commitments | `/67/commitments` | 0 |
| Budget | `/67/budget` | 0 |
| Companies | `/directory/companies` | 0 |
| Meetings | `/67/meetings` | 0 |
| Schedule | `/67/schedule` | 0 |

All twelve unmodified captures are 1280x720. The comparison uses Pillow
ImageChops over the complete images without masks, crops or thresholds.
Meetings shows the same empty state in both releases: this proves presentation
parity, not meeting workflow correctness. Home was recaptured after its icon
finished rendering. Browser warning/error logs were empty on both deployments.

Private production screenshots stay in the PM checkout:
`tests/agent-browser-runs/2026-10-12-shared-ui-primitive-history/`.
Names are `before-<page>-desktop-1280.png` and `after-<page>-desktop-1280.png`.
They are not copied into this public repository.

Independent reviewer `/root/primitive_history_review` returned **PASS** after
opening all twelve images, recomputing every full-image comparison, checking
both provider receipts, source ancestry, original package version and re-export
ownership. This evidence closes AUI-020. It is separate from the subsequent
v0.6.1 table rollout and does not establish that rollout's deployed adoption.
