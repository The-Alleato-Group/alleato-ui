import * as React from "react";
import { MessageSquare } from "lucide-react";

import { ErrorState } from "./error-state";
import { cn } from "../lib/utils";

export interface CommentThreadProps {
  title?: string;
  headingAs?: "h2" | "h3";
  count?: number;
  composer: React.ReactNode;
  children?: React.ReactNode;
  loading?: boolean;
  error?: React.ReactNode;
  collapsed?: boolean;
  headerActions?: React.ReactNode;
  fillHeight?: boolean;
  listRef?: React.Ref<HTMLDivElement>;
  className?: string;
  ariaLabel?: string;
  id?: string;
  /**
   * Show the "No comments yet" placeholder when `count` is 0. Off for a host
   * panel where the composer already says what to do and the section sits
   * among other always-present sections — a centred empty block there reads
   * as a permanent hole, not a state.
   */
  showEmptyState?: boolean;
  /**
   * Apply the component's own `sm:px-5` side gutter. Off when the host panel
   * already provides a consistent gutter for every section and this thread
   * must sit flush with its siblings instead of carrying a second inset.
   */
  inset?: boolean;
}

/**
 * The one presentation owner for a contextual discussion.
 *
 * Feature adapters retain persistence, permissions, and data shaping. This
 * component owns the visible contract: heading/count, composer-first order,
 * loading/error placement, flat thread rhythm, and scroll behavior.
 */
export function CommentThread({
  title = "Comments",
  headingAs = "h3",
  count,
  composer,
  children,
  loading = false,
  error,
  collapsed = false,
  headerActions,
  fillHeight = false,
  listRef,
  className,
  ariaLabel,
  id,
  showEmptyState = true,
  inset = true,
}: CommentThreadProps) {
  const Heading = headingAs;

  return (
    <section
      id={id}
      aria-label={ariaLabel ?? (title || "Comments")}
      className={cn(
        "min-w-0",
        fillHeight && "flex h-full min-h-0 flex-col",
        className,
      )}
      data-comment-thread
    >
      {title ? (
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-border bg-background px-0",
            inset && "sm:px-5",
            fillHeight && "sticky top-0 z-10",
          )}
          data-comment-header
        >
          <Heading
            className="text-[15px] font-semibold text-foreground"
            aria-label={title}
          >
            {title}
            {count !== undefined && count > 0 ? (
              <span
                className="ml-2 text-[13px] font-medium text-muted-foreground"
                aria-label={`${count} ${count === 1 ? "comment" : "comments"}`}
              >
                ({count})
              </span>
            ) : null}
          </Heading>
          {headerActions ? (
            <div className="ml-auto flex items-center [&_button]:size-8 [&_button]:rounded-lg [&_button]:text-muted-foreground [&_button]:hover:bg-muted">
              {headerActions}
            </div>
          ) : null}
        </div>
      ) : null}

      {!collapsed ? (
        <>
          <div
            className={cn("shrink-0 px-0 py-4", inset && "sm:px-5")}
            data-comment-composer-shell
          >
            {composer}
          </div>
          <div
            ref={listRef}
            className={cn(
              "px-0 pb-6 pt-1",
              inset && "sm:px-5",
              fillHeight && "min-h-0 flex-1 overflow-y-auto",
            )}
            data-comment-history
          >
            {loading ? (
              <div className="space-y-0" aria-label="Loading comments">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex gap-3 py-3">
                    <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
                    <div className="min-w-0 flex-1 space-y-2 pt-1">
                      <div className="h-2.5 w-2/5 animate-pulse rounded bg-muted" />
                      <div className="h-2.5 w-4/5 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div role="alert">
                <ErrorState
                  title="Comments could not be loaded"
                  error={typeof error === "string" ? error : undefined}
                  className="items-start gap-2 py-3 text-left [&>div:first-child]:hidden"
                />
              </div>
            ) : count === 0 && showEmptyState ? (
              <div className="flex flex-col items-center py-12 text-center">
                <MessageSquare
                  className="size-6 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="mt-3 text-[13px] font-medium text-muted-foreground">
                  No comments yet
                </p>
                <p className="mt-1 max-w-60 text-xs text-muted-foreground">
                  Start the conversation — @ someone to notify them
                </p>
              </div>
            ) : (
              children
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

export interface CommentReplyGroupProps {
  count: number;
  children?: React.ReactNode;
  composer?: React.ReactNode;
  className?: string;
}

/** One-level reply hierarchy with a single quiet structural cue. */
export function CommentReplyGroup({
  count,
  children,
  composer,
  className,
}: CommentReplyGroupProps) {
  if (count === 0 && !composer) return null;

  return (
    <div
      className={cn(
        "mt-4 ml-4 border-l border-border/70 pl-4 sm:ml-5 sm:pl-5",
        className,
      )}
    >
      {children}
      {composer ? (
        <div className={cn(count > 0 && "mt-4")}>{composer}</div>
      ) : null}
    </div>
  );
}
