"use client";

import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// Status variant system — ONE place for all status-to-color mappings
// ---------------------------------------------------------------------------

export type StatusVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "purple"
  | "rose";

// Status defaults to a small colored dot followed by plain text. The fill
// repeats on every row of every table and reads as noise, not signal
// (DESIGN.md). Detail-level controls can opt into the pill
// presentation explicitly without changing dense table status rendering.
const dotColors: Record<StatusVariant, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  info: "bg-info",
  neutral: "bg-muted-foreground/40",
  purple: "bg-purple-500",
  rose: "bg-rose-500",
};

const pillColors: Record<StatusVariant, string> = {
  success: "border-transparent bg-success/10 text-success dark:bg-success/20",
  warning: "border-transparent bg-warning/10 text-warning dark:bg-warning/20",
  error: "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20",
  info: "border-transparent bg-info/10 text-info dark:bg-info/20",
  neutral: "border-transparent bg-muted text-muted-foreground",
  purple: "border-transparent bg-purple-500/10 text-purple-600 dark:bg-purple-500/20",
  rose: "border-transparent bg-rose-500/10 text-rose-600 dark:bg-rose-500/20",
};

// ---------------------------------------------------------------------------
// Domain status → variant mapping
// Add every domain status here. This is THE source of truth.
// ---------------------------------------------------------------------------

const STATUS_TO_VARIANT: Record<string, StatusVariant> = {
  // Approval statuses
  approved: "success",
  active: "success",
  live: "success",
  connecting: "warning",
  offline: "error",
  accepted: "success",
  // Lifecycle labels describe different operational states. Keep them visually
  // distinct in dense tables so a completed project cannot be mistaken for an
  // active one at a glance. "complete"/"completed" are the same state under
  // two spellings — both map here, not just one.
  completed: "info",
  complete: "info",
  closed: "neutral",
  paid: "success",
  synced: "success",
  executed: "success",
  reviewed: "success",
  sent: "success",

  // Progress report statuses
  ready: "info",

  // Warning statuses
  pending: "warning",
  "pending approval": "warning",
  "in progress": "warning",
  "in review": "warning",
  "under review": "warning",
  "under_review": "warning",
  "revise and resubmit": "warning",
  "revision requested": "warning",
  "revision_requested": "warning",
  "changes requested": "warning",
  changes_requested: "warning",
  submitted: "warning",
  // AI-authored task pending human triage (MT2 task triage, 2026-09) — an
  // "info" pill, not a warning: nothing is overdue or wrong, it just is not
  // real work yet.
  suggested: "info",
  invited: "warning",
  open: "neutral",
  partial: "warning",
  "out for bid": "warning",
  "out for signature": "warning",

  // Error statuses
  rejected: "error",
  overdue: "error",
  failed: "error",
  cancelled: "error",
  void: "error",
  deleted: "error",
  terminated: "error",

  // Info statuses
  "not synced": "info",

  // Site-map inventory statuses
  "needs review": "warning",
  "missing nav": "warning",
  "internal only": "info",
  deprecated: "neutral",
  broken: "error",
  planned: "purple",
  "design issues": "rose",

  // Neutral statuses
  draft: "neutral",
  inactive: "neutral",
  archived: "neutral",
  unknown: "neutral",
  none: "neutral",

  // Attribution / provenance statuses (project creation log)
  "legacy gap": "warning",
  legacy_gap: "warning",

  // App error statuses
  new: "error",
  triaged: "info",
  in_progress: "warning",
  needs_human: "warning",
  fixed: "success",
  ignored: "neutral",

  // Training-docs publish + QA statuses
  published: "success",
  passing: "success",
  passed: "success",
  failing: "error",
  "needs update": "warning",
  needs_update: "warning",
  "not tested": "info",
  not_tested: "info",

  // Project health (project_current_state.health_status)
  "on track": "success",
  watch: "warning",
  "at risk": "warning",
  "needs attention": "warning",
  healthy: "success",

  // Severity levels
  critical: "error",
  high: "warning",
  medium: "info",
  low: "neutral",

  // Admin Dashboard page statuses (frontend/src/app/(admin)/admin/admin-dashboard-route-catalog.ts);
  // "live" is already mapped under Approval statuses above.
  "in development": "warning",
  redirect: "info",

  // Marketing publish pipeline (marketing_content_calendar_items.publish_state).
  // Deliberately distinct from the general "cancelled" (error, above): a
  // marketing schedule someone withdrew on purpose is not a failure.
  not_scheduled: "neutral",
  scheduled: "info",
  publishing: "warning",
  canceled: "neutral",
};

// DB values arrive in mixed shapes ("needs_review", "in progress", "Draft").
// Normalize to lowercase, space-separated words before both the color lookup
// and the display text, so "needs_review" matches the "needs review" entry
// above and renders as "Needs Review" instead of the raw snake_case.
function normalizeStatusKey(status: string): string {
  return status.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

/** Exported for the rare non-badge display of a raw status string (e.g. a board-view group heading). */
export function humanizeStatus(status: string): string {
  return normalizeStatusKey(status).replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveVariant(status: string | null | undefined): StatusVariant {
  if (typeof status !== "string") return "neutral";
  return STATUS_TO_VARIANT[normalizeStatusKey(status)] ?? "neutral";
}

// ---------------------------------------------------------------------------
// StatusBadge — Pass a raw status string, get the right colors automatically
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  /**
   * The raw status string from your data (e.g. "Draft", "Approved", "Pending").
   * Nullable on purpose: callers routinely pass an optional column, and a badge
   * is never important enough to crash the page that hosts it.
   */
  status: string | null | undefined;
  /** Override the automatic variant if needed */
  variant?: StatusVariant;
  /** Back-compat alias for older call sites that passed a domain type. */
  type?: string | null;
  /** Detail-level controls may opt into a compact semantic pill. */
  presentation?: "dot" | "pill";
  className?: string;
}

export function StatusBadge({
  status,
  variant,
  type,
  presentation = "dot",
  className,
}: StatusBadgeProps) {
  // No status is not a status — render nothing rather than an empty marker.
  const raw = typeof status === "string" ? status.trim() : "";
  if (!raw) return null;
  const label = humanizeStatus(raw);
  const resolved = variant ?? resolveVariant(type ?? status);
  return (
    <span
      data-status-variant={resolved}
      data-status-presentation={presentation}
      className={cn(
        "inline-flex items-center text-xs font-medium",
        presentation === "pill"
          ? cn("gap-1.5 rounded-full border px-2 py-0.5", pillColors[resolved])
          : "gap-1.5",
        className,
      )}
    >
      {presentation === "dot" ? (
        <span
          aria-hidden="true"
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotColors[resolved])}
        />
      ) : null}
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// StatusDot — same dot as StatusBadge, with muted text for compact/secondary views
// ---------------------------------------------------------------------------

interface StatusDotProps {
  /** The raw status string from your data */
  status: string;
  /** Override the automatic variant if needed */
  variant?: StatusVariant;
  className?: string;
}

export function StatusDot({ status, variant, className }: StatusDotProps) {
  const resolved = variant ?? resolveVariant(status);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[resolved])} />
      <span className="text-muted-foreground">{humanizeStatus(status)}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// StatusText — Preserve authored notices, filenames, and identifiers verbatim.
// StatusBadge and StatusDot normalize enum labels; this primitive renders prose.
// ---------------------------------------------------------------------------

interface StatusTextProps {
  status: string;
  className?: string;
}

const textColors: Record<StatusVariant, string> = {
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
  info: "text-info",
  neutral: "text-muted-foreground",
  purple: "text-purple-600",
  rose: "text-rose-600",
};

export function StatusText({ status, className }: StatusTextProps) {
  const resolved = resolveVariant(status);
  return (
    <span className={cn("text-xs font-medium", textColors[resolved], className)}>
      {status}
    </span>
  );
}
