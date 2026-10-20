# Shared desktop dialog viewport containment

The FM decision journey at1280x720 exposed a shared desktop DialogContent defect: long content extended beyond the viewport and placed the heading and Close control offscreen. ResponsiveDialog and ModalContent delegate to this owner, so the correction belongs in the package.

## Change

Desktop DialogContent now has a viewport-relative maximum height with internal vertical scrolling and contained overscroll. Centered placement, padding, existing Close behavior and the mobile SheetContent branch remain unchanged. Long dialogs start with Close inside the viewport; content can be scrolled to its end and back to the control.

## Checks

- Focused command: `./node_modules/.bin/vitest run test/dialog-responsive.test.tsx --maxWorkers=1`.
- Result:23 tests passed,0 failed. The executed source belongs to the isolated `shared-dialog-viewport/alleato-ui` worktree.
- Covers shared DialogContent/ModalContent desktop containment classes, existing phone behavior, Escape/focus handling, and long ResponsiveDialog Close behavior.
- `git diff --check` passed.
- No full application build or second browser/server was started by this package task.

## Release boundary

Candidate version:v0.6.28. Independent code review and application viewport proof are owned by the coordinating FM journey task; immutable release publication and consumer adoption are separate boundaries. This record does not claim that a consuming application is deployed.

Independent review by the FM integration adapter reviewer passed with no actionable code defect for the dialog/test/version delta atop a39ef381. Reviewed dialog SHA-256:`cea3c5b6c8ec29a17410f4eb34962429c73973d9ce45a0962ed45f345deebe37`. Browser geometry remains a separate runtime check.

## Fullscreen phone reader correction (2026-10-20)

Authenticated project1408 Documents at390×844 reproduced a separate phone sizing defect: the mobile branch discarded size=fullscreen. The sheet capped at828px, but its percentage-height reader grew to1746px because the flex parent's height was indefinite. Paging scrolled the hidden sheet to1089px and moved its title/controls above the viewport.

Fullscreen phone dialogs now receive a definite height from the same visual-viewport variables as SheetContent. Other dialog sizes retain automatic content height; keyboard/safe-area/desktop behavior continues through the existing shared owner. The focused regression fails before the fix and passes afterward; exact class-token assertion avoids confusing max-height with height. Dialog responsiveness and sheet-opening suites pass31 tests. No new browser/server or full local build was started. Candidatev0.6.32; controlled consumer runtime proof and independent source review precede release acceptance.
