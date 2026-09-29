"use client";

import * as React from "react";

import { Button } from "../components/button";
import { Checkbox } from "../components/checkbox";
import { cn } from "../lib/utils";

import { InfoAlert } from "./InfoAlert";

export type ReviewBeforeCommitCheck = {
  id: string;
  label: string;
};

export type ReviewBeforeCommitReceipt = {
  title: string;
  description: string;
  /**
   * The persisted record's identifier, shown as "{recordLabel}: {recordId}".
   * Omit it when the server names the record only by its link (a guided
   * creation whose receipt carries an href but no number) — the line then
   * ends at the description instead of printing an empty "Record ID:".
   */
  recordId?: string;
  recordLabel?: string;
  action?: React.ReactNode;
};

/** A secondary or tertiary action in the one button row. */
export type ReviewBeforeCommitAction = {
  /** The button label, and the words the sentence uses for it. */
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /**
   * What clicking it does, as the sentence says it: "to make changes" by
   * default ("… or Edit details to make changes."). Override when the label
   * is not an edit path ("Done editing" → "to return to the review").
   */
  purpose?: string;
};

export interface ReviewBeforeCommitProps {
  /** The one heading, naming the object under review: "Review task". */
  heading: string;
  /**
   * The exact persisted business transition — the primary button's label,
   * for example "Create purchase order".
   */
  actionLabel: string;
  /**
   * The provenance clause of the one sentence under the heading, without a
   * trailing period: "All values suggested by Briggs from Weekly Leadership
   * Meeting 2026-09-21". The component appends the action clause from its
   * own button labels, so the sentence and the buttons cannot drift.
   */
  provenance?: string | null;
  /** The reviewed fields, the record title first. */
  children: React.ReactNode;
  /** Secondary tier: the correction path, rendered as an outline button. */
  correctionAction?: ReviewBeforeCommitAction | null;
  /** Tertiary tier: the discard path, rendered as text only. */
  discardAction?: ReviewBeforeCommitAction | null;
  checks: readonly ReviewBeforeCommitCheck[];
  checkedIds: ReadonlySet<string>;
  onCheckedChange: (id: string, checked: boolean) => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  /**
   * Why the final action cannot run yet, stated for the reader ("Add a title
   * before creating the task."). While set, the action is disabled and this
   * sentence is the one helper line beside it — the shared disabled contract:
   * a disabled button is never the only validation message.
   */
  blockedReason?: string | null;
  /** Replaces the derived "Creating …" label while `isSubmitting`. */
  submittingLabel?: string;
  error?: string | null;
  /** The recovery for `error` ("Retry autosave"), rendered beside it. */
  errorAction?: React.ReactNode;
  receipt?: ReviewBeforeCommitReceipt | null;
  className?: string;
}

/**
 * The one sentence under the heading: the consumer's provenance clause plus
 * the action clause derived from the button labels.
 */
export function reviewBeforeCommitSentence({
  provenance,
  actionLabel,
  correctionAction,
}: {
  provenance?: string | null;
  actionLabel: string;
  correctionAction?: Pick<ReviewBeforeCommitAction, "label" | "purpose"> | null;
}): string {
  const actionClause = correctionAction
    ? `Click ${actionLabel} to confirm or ${correctionAction.label} ${correctionAction.purpose ?? "to make changes"}.`
    : `Click ${actionLabel} to confirm.`;
  const provenanceClause = provenance?.trim().replace(/\.+$/, "");
  return provenanceClause
    ? `${provenanceClause}. ${actionClause}`
    : actionClause;
}

/**
 * Governs a consequential draft review: one heading naming the object, one
 * sentence (provenance + the two actions), the fields with the record title
 * first, any required checks, one button row in three tiers, and the
 * receipt. It deliberately owns no domain write behavior; each caller
 * supplies its canonical server boundary.
 */
export function ReviewBeforeCommit({
  heading,
  actionLabel,
  provenance = null,
  children,
  correctionAction = null,
  discardAction = null,
  checks,
  checkedIds,
  onCheckedChange,
  onConfirm,
  isSubmitting = false,
  blockedReason = null,
  submittingLabel,
  error = null,
  errorAction,
  receipt = null,
  className,
}: ReviewBeforeCommitProps) {
  const remainingCount = checks.filter(
    (check) => !checkedIds.has(check.id),
  ).length;
  const canConfirm = remainingCount === 0 && !blockedReason && !isSubmitting;
  // Every id derives from this instance's id: a chat renders several review
  // cards on one page, and a fixed id would make each `aria-labelledby`
  // point at the first card's heading.
  const baseId = React.useId();
  const headingId = `${baseId}-heading`;
  const blockedId = `${baseId}-blocked`;
  const prerequisitesId = `${baseId}-checks`;
  const describedBy =
    [
      blockedReason ? blockedId : null,
      checks.length > 0 ? prerequisitesId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  if (receipt) {
    return (
      <section
        aria-labelledby={headingId}
        className={cn("space-y-5", className)}
        data-slot="review-before-commit"
      >
        <div role="status" className="space-y-1">
          <h3
            id={headingId}
            className="text-base font-semibold leading-6 text-foreground"
          >
            {receipt.title}
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">
            {receipt.description}
            {receipt.recordId
              ? ` ${receipt.recordLabel ?? "Record ID"}: ${receipt.recordId}`
              : null}
          </p>
          {receipt.action ? <div className="pt-2">{receipt.action}</div> : null}
        </div>
        {children}
      </section>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className={cn("space-y-5", className)}
      data-slot="review-before-commit"
    >
      <div className="space-y-1">
        <h3
          id={headingId}
          className="text-base font-semibold leading-6 text-foreground"
        >
          {heading}
        </h3>
        <p
          className="text-sm leading-6 text-muted-foreground"
          data-slot="review-before-commit-sentence"
        >
          {reviewBeforeCommitSentence({
            provenance,
            actionLabel,
            correctionAction,
          })}
        </p>
      </div>

      {children}

      {checks.length > 0 ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-foreground">
            Required checks
          </legend>
          <p
            id={prerequisitesId}
            aria-live="polite"
            className="text-sm leading-6 text-muted-foreground"
          >
            {remainingCount > 0
              ? `${remainingCount} required check${remainingCount === 1 ? "" : "s"} remaining.`
              : "All required checks are complete."}
          </p>
          {checks.map((check) => {
            const inputId = `${baseId}-${check.id}`;
            return (
              <label
                key={check.id}
                htmlFor={inputId}
                className="flex min-h-11 items-start gap-3 text-sm leading-6 text-foreground"
              >
                <Checkbox
                  id={inputId}
                  checked={checkedIds.has(check.id)}
                  onCheckedChange={(checked) =>
                    onCheckedChange(check.id, checked === true)
                  }
                  className="mt-1"
                />
                <span>{check.label}</span>
              </label>
            );
          })}
        </fieldset>
      ) : null}

      {error ? (
        <InfoAlert variant="error" role="alert">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{error}</span>
            {errorAction}
          </span>
        </InfoAlert>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button
          type="button"
          disabled={!canConfirm}
          aria-describedby={describedBy}
          aria-busy={isSubmitting || undefined}
          onClick={onConfirm}
        >
          {isSubmitting
            ? (submittingLabel ??
              `${actionLabel.replace(/^Create /, "Creating ")}…`)
            : actionLabel}
        </Button>
        {correctionAction ? (
          <Button
            type="button"
            variant="outline"
            disabled={correctionAction.disabled}
            onClick={correctionAction.onClick}
          >
            {correctionAction.label}
          </Button>
        ) : null}
        {discardAction ? (
          // Text only: ghost has no border and no fill at rest. Not `link`,
          // whose `text-primary` is brand orange — a labeled button never is.
          <Button
            type="button"
            variant="ghost"
            disabled={discardAction.disabled}
            onClick={discardAction.onClick}
          >
            {discardAction.label}
          </Button>
        ) : null}
        {blockedReason ? (
          <p
            id={blockedId}
            aria-live="polite"
            className="basis-full text-sm leading-6 text-muted-foreground sm:basis-auto"
          >
            {blockedReason}
          </p>
        ) : null}
      </div>
    </section>
  );
}
