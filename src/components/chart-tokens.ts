/**
 * Chart design tokens. No `recharts` import, deliberately.
 *
 * `CHART_HOVER_OVERLAY` lived in `chart.tsx`, whose first import is the whole
 * of `recharts`. Files that wanted nothing but this string — `margin-vs-bid`
 * and `charts/revenue-burnoff` — were pulling the entire charting library into
 * their entrypoint's first load to read one colour. Tokens belong somewhere a
 * caller can reach without paying for a renderer.
 */

/**
 * One deliberately quiet hover wash for categorical charts.
 *
 * Keep this shared: Recharts otherwise supplies different cursor fills for
 * bars depending on whether a caller uses ChartContainer, the lightweight
 * chart helpers, or a domain-specific composition.
 */
export const CHART_HOVER_OVERLAY = "rgba(255, 255, 255, 0.01)";
