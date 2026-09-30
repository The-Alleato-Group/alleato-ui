/**
 * Accent colours for `TrendMetricCard` and the plot it loads lazily.
 *
 * Kept out of both so neither imports the other for a value: the chart is what
 * carries `recharts`, and the card must stay free of it on first load.
 *
 * Every entry resolves to a `globals.css` token. The card colours its chart
 * stroke, the region wash behind it, the header percentage and the footer
 * delta from ONE of these, so the whole card reads the same verdict.
 */

/**
 * The semantic verdict on the trend. Which one applies is decided by the card
 * from the data and `goodWhenUp`; a caller may override it when the direction
 * has no natural valence (a headcount, a ratio nobody targets).
 */
export type TrendAccent = "success" | "destructive" | "neutral";

/** Palette for a second, third, ... series on one card. */
export type TrendSeriesColor = "cat-1" | "cat-2" | "cat-3";

type AccentTokens = {
  /** SVG stroke / fill and any inline colour. */
  stroke: string;
  /** The tinted region wash behind the plot — the accent at low alpha. */
  wash: string;
  /** Tailwind text class for the header percentage and footer delta. */
  textClassName: string;
};

export const TREND_ACCENTS: Record<TrendAccent, AccentTokens> = {
  success: {
    stroke: "hsl(var(--status-success))",
    wash: "hsl(var(--status-success) / 0.14)",
    textClassName: "text-success",
  },
  destructive: {
    stroke: "hsl(var(--status-error))",
    wash: "hsl(var(--status-error) / 0.14)",
    textClassName: "text-destructive",
  },
  neutral: {
    stroke: "hsl(var(--muted-foreground))",
    wash: "hsl(var(--muted-foreground) / 0.12)",
    textClassName: "text-muted-foreground",
  },
};

export const TREND_SERIES_COLORS: Record<TrendSeriesColor, string> = {
  "cat-1": "hsl(var(--viz-cat-1))",
  "cat-2": "hsl(var(--viz-cat-2))",
  "cat-3": "hsl(var(--viz-cat-3))",
};

/** Assignment order for series that do not name their own colour. */
export const TREND_SERIES_ORDER: readonly TrendSeriesColor[] = [
  "cat-2",
  "cat-1",
  "cat-3",
];
