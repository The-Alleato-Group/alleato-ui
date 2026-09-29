import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../lib/utils";

/**
 * The one chart/graph card shell for the whole app — background, border,
 * radius, shadow and padding live here so a future style change is one edit,
 * not one edit per dashboard. Callers own everything inside it (their own
 * header, legend, chart, table-toggle, etc.); this component only owns the
 * surface.
 *
 * Border and shadow are deliberately NOT the semantic `border-border` /
 * `shadow-xs` utilities:
 * - `border-border` resolves to whatever `--border` is scoped to locally —
 *   inside accounting-exec's dark theme that is a flat 28%-lightness gray,
 *   which read as a heavy line rather than a hairline (owner correction
 *   2026-09-11). A low-opacity black/white edge stays a subtle "light gray"
 *   line in both themes without depending on any page's own CSS variables.
 * - `shadow-xs` is flatter than accounting-exec's original soft, two-layer
 *   lift (`--exec-shadow`). The owner asked only for a visible border to be
 *   ADDED — the existing soft shadow was never meant to be replaced with a
 *   flatter one, so this reproduces it directly rather than through the
 *   design system's shadow-xs/shadow-sm ceiling.
 */
/**
 * The surface alone — border, background, radius and the soft lift — for a
 * bounded card that owns its own padding and header (a KPI row, a home
 * dashboard section). Owner decision 2026-09-17: every card on a dashboard
 * carries this same lift, so it is defined once here and composed, never
 * restated.
 */
export const chartCardSurfaceClassName = cn(
  "rounded-lg border border-black/[0.07] bg-card",
  "shadow-[0_1px_2px_rgba(20,20,23,0.04),0_8px_28px_-12px_rgba(20,20,23,0.14)]",
  "dark:border-white/[0.09] dark:shadow-[0_1px_2px_rgba(0,0,0,0.28),0_14px_40px_-16px_rgba(0,0,0,0.55)]",
  "transition-colors",
);

export function ChartCard({
  children,
  className,
  ...sectionProps
}: {
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"section">, "className" | "children">) {
  return (
    <section
      {...sectionProps}
      className={cn("min-w-0 p-5", chartCardSurfaceClassName, className)}
    >
      {children}
    </section>
  );
}
