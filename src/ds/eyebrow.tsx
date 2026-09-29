"use client";

import { PageEyebrow } from "../layout/headings";

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * The neutral Inter eyebrow above a page title or section rule.
 *
 * Delegates to `PageEyebrow` so there is exactly ONE definition of this level —
 * see `components/layout/headings.tsx` for the full set. Accent color remains
 * reserved for selected navigation and primary actions, not page structure.
 */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <PageEyebrow as="span" className={className}>
      {children}
    </PageEyebrow>
  );
}
