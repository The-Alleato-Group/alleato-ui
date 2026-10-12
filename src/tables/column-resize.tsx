"use client";

import * as React from "react";

/** Minimum width (px) a column can be dragged down to during a resize. */
export const MIN_COLUMN_RESIZE_WIDTH = 120;
/** Keyboard nudge (px) applied per Left/Right arrow press on a resize handle. */
export const COLUMN_RESIZE_KEYBOARD_STEP = 12;

/**
 * Pure width computation for a column-resize drag, clamped to the minimum.
 * Extracted so the resize floor is regression-tested without rendering the table.
 * `minWidth` defaults to the table floor; compact grids (the Gantt task pane,
 * whose "%" column is 72px wide) pass their own.
 */
export function computeResizedColumnWidth(
  startWidth: number,
  deltaX: number,
  minWidth: number = MIN_COLUMN_RESIZE_WIDTH,
): number {
  return Math.max(minWidth, startWidth + deltaX);
}

interface ColumnResizeDragOptions {
  /** Floor for the dragged width. Defaults to `MIN_COLUMN_RESIZE_WIDTH`. */
  minWidth?: number;
  /** Called at most once per animation frame with the clamped width. */
  onResize: (columnId: string, width: number) => void;
}

/**
 * One owner for the column-resize drag every column grid in the app uses:
 * the unified table and the Gantt task pane share it so a header handle
 * behaves the same everywhere (same floor semantics, same rAF coalescing,
 * same cursor/selection lock, same "a click after a drag is not a click").
 *
 * Listeners attach synchronously inside `startColumnResize` — NOT via an
 * effect keyed on state — so the drag is tracked from the very first pixel
 * instead of after a re-render, which is slow on large tables and made
 * resize feel laggy.
 */
export function useColumnResizeDrag({
  minWidth = MIN_COLUMN_RESIZE_WIDTH,
  onResize,
}: ColumnResizeDragOptions) {
  const resizeStateRef = React.useRef<{
    columnId: string;
    startX: number;
    startWidth: number;
  } | null>(null);
  // True from the first drag movement until the synthetic click that follows
  // mouseup is consumed — lets a header's onClick skip sorting after a resize.
  const didResizeRef = React.useRef(false);
  // Coalesces mousemove width updates into one state write per animation frame.
  const resizeRafRef = React.useRef<number | null>(null);
  const onResizeRef = React.useRef(onResize);
  React.useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);

  const startColumnResize = React.useCallback(
    (event: React.MouseEvent, columnId: string, startWidth: number) => {
      event.preventDefault();
      event.stopPropagation();

      resizeStateRef.current = { columnId, startX: event.clientX, startWidth };
      didResizeRef.current = false;
      // Suppress text selection and lock the resize cursor for the whole drag.
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const resizeState = resizeStateRef.current;
        if (!resizeState) return;
        didResizeRef.current = true;
        const nextWidth = computeResizedColumnWidth(
          resizeState.startWidth,
          moveEvent.clientX - resizeState.startX,
          minWidth,
        );
        if (resizeRafRef.current !== null) return;
        resizeRafRef.current = window.requestAnimationFrame(() => {
          resizeRafRef.current = null;
          onResizeRef.current(resizeState.columnId, nextWidth);
        });
      };

      const handleMouseUp = () => {
        resizeStateRef.current = null;
        if (resizeRafRef.current !== null) {
          window.cancelAnimationFrame(resizeRafRef.current);
          resizeRafRef.current = null;
        }
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [minWidth],
  );

  return { startColumnResize, didResizeRef };
}

interface ColumnResizeHandleProps {
  columnId: string;
  onResizeStart: (event: React.MouseEvent<HTMLDivElement>) => void;
  /**
   * Current column width in px. Required together with `onKeyResize` to make
   * the handle keyboard-operable; omit both to keep the default decorative
   * (mouse-only) handle.
   */
  width?: number;
  /**
   * When provided (with `width`), the handle becomes a focusable, keyboard
   * resizable control (Left/Right to resize, Home to floor, End to jump to a
   * generous cap) instead of the default `aria-hidden` decoration. Pass this
   * for a grid that has no other accessible route to column *width* — the
   * unified table's column picker covers show/hide, not width, so this stays
   * opt-in rather than a blanket change to every caller.
   */
  onKeyResize?: (columnId: string, width: number) => void;
  /** Accessible name for the keyboard-operable variant. Required with `onKeyResize`. */
  label?: string;
  /** Floor passed through to the keyboard step's clamp. Defaults to the table floor. */
  minWidth?: number;
}

/**
 * The drag handle on a column header's trailing edge. Rendered inside a
 * `relative` header cell; it spans the cell's full height on the right edge.
 * Decorative for assistive tech (`aria-hidden`) by default: the column picker
 * is the accessible route to column layout for callers that don't opt into
 * `onKeyResize`.
 */
export function ColumnResizeHandle({
  columnId,
  onResizeStart,
  width,
  onKeyResize,
  label,
  minWidth = MIN_COLUMN_RESIZE_WIDTH,
}: ColumnResizeHandleProps) {
  const isKeyboardOperable = onKeyResize !== undefined && width !== undefined;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isKeyboardOperable) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onKeyResize(columnId, computeResizedColumnWidth(width, -COLUMN_RESIZE_KEYBOARD_STEP, minWidth));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      onKeyResize(columnId, computeResizedColumnWidth(width, COLUMN_RESIZE_KEYBOARD_STEP, minWidth));
    } else if (event.key === "Home") {
      event.preventDefault();
      onKeyResize(columnId, minWidth);
    }
  };

  return (
    <div
      data-column-resizer={columnId}
      className="absolute inset-y-0 right-0 w-1.5 cursor-col-resize select-none outline-none hover:bg-border focus-visible:bg-primary active:bg-primary transition-colors"
      onMouseDown={onResizeStart}
      // A click on the handle itself (no drag) must not bubble to the header's
      // sort onClick.
      onClick={(event) => event.stopPropagation()}
      {...(isKeyboardOperable
        ? {
            role: "slider" as const,
            tabIndex: 0,
            "aria-label": label,
            "aria-orientation": "horizontal" as const,
            "aria-valuemin": minWidth,
            "aria-valuenow": Math.round(width),
            onKeyDown: handleKeyDown,
          }
        : { "aria-hidden": "true" as const })}
    />
  );
}
