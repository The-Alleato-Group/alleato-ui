/**
 * Layout constants shared by `TrendMetricCard` and the chart it loads lazily.
 *
 * Kept out of both so neither has to import the other: the chart is what
 * carries `recharts`, and the card's table needs this same value to line up
 * under the floating header.
 */

/**
 * Height reserved at the top of the plot for the header that floats over it.
 * Measured, not guessed: the range picker's box ends 69px below the card's top
 * edge, so a taller value than that keeps the tallest bar and the line's peak
 * clear of the controls. A percentage headroom on the Y domain cannot do this
 * job -- on a flat series 15% of the range is a few pixels.
 */
export const HEADER_BAND = 88;
