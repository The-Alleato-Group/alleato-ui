/**
 * The one layout for a dialog, alert, modal, or drawer action footer: a single
 * compact row, right-aligned, buttons sized to their labels, read left to right
 * as tertiary -> secondary -> primary. It never stacks on a phone; three
 * full-width buttons pinned under a form took a third of the viewport
 * (project-management DESIGN.md "A form's actions are a pinned footer bar",
 * owner 2026-09-23 and 2026-10-14). It wraps only when the labels cannot fit on
 * one line. Buttons keep a 44px touch target until the xl breakpoint.
 */
export const actionRowClassName =
  "flex flex-row flex-wrap items-center justify-end gap-2 [&_[data-slot=button]]:min-h-11 xl:[&_[data-slot=button]]:min-h-9";
