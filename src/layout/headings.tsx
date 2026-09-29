import type { ElementType, ReactNode } from "react";
import { cn } from "../lib/utils";
import { titleCase } from "../lib/title-case";

/**
 * EVERY heading level in the app, defined once, in this file.
 *
 * The point of putting them together is that the available options can be read
 * at a glance. Before writing `<p className="text-xs font-semibold
 * text-muted-foreground">`, look here — that shape already has a name, and
 * hand-rolling it is how six slightly different section headings end up on
 * one page.
 *
 * The rules the levels encode:
 *
 *  - **Eyebrows use the primary Inter sans stack.** They organize the page without
 *    competing with actions, statuses, or the selected-navigation accent.
 *  - **Everything below the eyebrow is near-ink**, not muted grey. A section
 *    heading is structure, and structure should be legible.
 *  - **Section headings use Inter**. Oswald is reserved for `PageTitle`;
 *    section and subsection headings keep the primary sans stack.
 *  - **Oswald headings are uppercase.** Sans semantic headings retain Title
 *    Case, while the title face always carries the shared uppercase treatment.
 *  - **Labels are sentence case, never all caps, never letter-spaced.** The
 *    micro-label (`LabelHeading`, every field label and every column header)
 *    keeps its authored case (owner, 2026-09-23, on the live task review
 *    card). Broadened the same day: `uppercase` (and the widening
 *    `tracking-wide`/`wider`/`widest`/`[…em]` that goes with it) is banned on
 *    text everywhere, not just labels — `PageTitle` above is the only
 *    exception. `design-system/no-uppercase-text` errors on both.
 *  - **There is no description slot.** A page title stands alone; if it needs a
 *    sentence underneath to explain it, the title is wrong. Scope qualifiers
 *    live in the control that sets them. (Noise gate #93.)
 */

type HeadingProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  id?: string;
  /**
   * Headings the product authors are Title Cased by the component. A heading
   * whose text is content (an AI-written headline, a record title) passes
   * `preserveCase` so the words stay as written.
   */
  preserveCase?: boolean;
};

type PageTitleProps = HeadingProps & {
  /** Optional brand rule used by authored title treatments such as Figma detail frames. */
  accentRule?: boolean;
};

/**
 * Level 0 — the neutral Inter eyebrow above a page title or section rule.
 * One per page context: it names the section you are inside ("Accounting").
 */
export function PageEyebrow({
  children,
  className,
  as: Tag = "p",
  id,
}: HeadingProps) {
  return (
    <Tag
      id={id}
      className={cn(
        // Regular family, regular tracking, authored case: an all-caps
        // tracked eyebrow above an all-caps display title was two shouting
        // headings stacked (owner, 2026-09-22, the commitment page inside the
        // iPhone app). The eyebrow reads quietly; the title carries the weight.
        "font-sans text-sm font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * Level 1 — the page title. Oswald, near-ink, one per page.
 */
export function PageTitle({
  children,
  className,
  as: Tag = "h1",
  id,
  accentRule = false,
}: PageTitleProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "font-title text-3xl font-medium uppercase tracking-tight text-foreground sm:text-4xl",
        accentRule &&
          "relative pb-3 after:absolute after:bottom-0 after:left-0 after:h-1 after:w-24 after:bg-primary after:content-['']",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * Level 2 — a section within a page ("Monthly payroll", "By account").
 * Inter medium, larger than the old 11px label, near-ink rather than muted.
 * Title Case, not uppercase (owner, 2026-09-23: `uppercase` is banned on
 * text everywhere except the Oswald `PageTitle` — this component used to
 * carry the old all-caps tracked treatment and disagreed with its own doc
 * comment above; fixed at the owner instead of leaving every call site to
 * repeat the fix).
 */
export function SectionHeading({
  children,
  className,
  as: Tag = "h2",
  id,
  preserveCase = false,
}: HeadingProps) {
  return (
    <Tag
      id={id}
      className={cn("font-sans text-lg font-medium text-foreground", className)}
    >
      {typeof children === "string" && !preserveCase ? titleCase(children) : children}
    </Tag>
  );
}

/**
 * Level 3 — a group inside a section. Title case, slightly bolder than body
 * copy, and deliberately untracked so compact detail panes stay readable.
 */
export function SubsectionHeading({
  children,
  className,
  as: Tag = "h3",
  id,
  preserveCase = false,
}: HeadingProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "font-sans text-sm font-semibold normal-case tracking-normal text-foreground",
        className,
      )}
    >
      {typeof children === "string" && !preserveCase ? titleCase(children) : children}
    </Tag>
  );
}

/**
 * The one micro-label treatment, as a class string, for the owners that must
 * keep their own element (`<th>` in the table primitives, a `role="columnheader"`
 * span). Everything else renders `LabelHeading`. 12/16, medium, muted,
 * sentence case, no letter-spacing — never the display face, never accent,
 * never `uppercase` (owner, 2026-09-23: "field labels must not be all caps",
 * everywhere; this reversed the 11px uppercase tracked label of 2026-09-20).
 */
export const LABEL_HEADING_CLASS =
  "text-xs leading-4 font-medium text-muted-foreground";

/**
 * Level 4 — a column header or a field label inside a dense block. Sans, not
 * Oswald: at this size the condensed face costs legibility and buys nothing.
 * This is the one level that stays muted, because it labels rather than divides.
 * Authored case: a label is never transformed to caps.
 */
export function LabelHeading({
  children,
  className,
  as: Tag = "p",
  id,
}: HeadingProps) {
  return (
    <Tag id={id} className={cn(LABEL_HEADING_CLASS, className)}>
      {children}
    </Tag>
  );
}
