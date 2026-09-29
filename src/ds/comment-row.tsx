import * as React from "react";
import { Trash2 } from "lucide-react";

import { Button } from "../components/button";
import { cn } from "../lib/utils";
import { CommentAvatar } from "./comment-avatar";

export interface CommentRowProps {
  authorName: string;
  /** Rendered text only; pass a `<LocalDateTime>` for a viewer-local stamp. */
  timestamp: React.ReactNode;
  body: React.ReactNode;
  avatarUrl?: string | null;
  timestampTitle?: string;
  onReply?: () => void;
  onDelete?: () => void;
  deletePending?: boolean;
  afterBody?: React.ReactNode;
  className?: string;
}

/**
 * Canonical visual owner for a displayed comment.
 *
 * Persistence adapters provide content and actions; author, time, avatar,
 * prose rhythm, and action placement stay identical on every surface.
 */
export function CommentRow({
  authorName,
  timestamp,
  body,
  avatarUrl,
  timestampTitle,
  onReply,
  onDelete,
  deletePending = false,
  afterBody,
  className,
}: CommentRowProps) {
  return (
    <div
      className={cn(
        "group -mx-2 flex gap-3 rounded-lg px-2 py-3 hover:bg-muted",
        className,
      )}
      data-comment-row
    >
      <CommentAvatar name={authorName} src={avatarUrl} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="min-w-0 truncate text-[13.5px] font-semibold text-foreground">
            {authorName.trim() || "Author unavailable"}
          </span>
          <span
            className="ml-auto shrink-0 text-xs font-normal text-muted-foreground"
            title={timestampTitle}
          >
            {timestamp}
          </span>
        </div>
        <div className="mt-1 max-w-prose whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-[1.6] text-foreground">
          {body}
        </div>
        {afterBody}
        {onReply ? (
          <Button
            type="button"
            variant="link"
            className="mt-1 min-h-11 min-w-11 justify-start p-0 text-xs font-normal text-muted-foreground underline-offset-2 hover:text-foreground sm:min-h-7"
            onClick={onReply}
          >
            Reply
          </Button>
        ) : null}
      </div>
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Delete comment"
          title="Delete comment"
          disabled={deletePending}
          className="min-h-11 min-w-11 shrink-0 text-muted-foreground transition-opacity hover:text-destructive sm:min-h-8 sm:min-w-8 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
