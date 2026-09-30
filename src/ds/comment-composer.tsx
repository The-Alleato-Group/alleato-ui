"use client";

import * as React from "react";
import { ArrowUp, AtSign, Loader2 } from "lucide-react";

import { Button } from "../components/button";
import {
  extractMentionIds,
  type MentionableUser,
} from "../lib/mentions";
import { MentionTextarea, type MentionTextareaProps } from "./mention-textarea";
import { CommentAvatar } from "./comment-avatar";

export type CommentComposerSubmission = {
  body: string;
  mentionedUserIds: string[];
};

export interface CommentComposerProps extends Omit<
  MentionTextareaProps,
  "className" | "disabled" | "onSubmit" | "users" | "mentionRequest"
> {
  users: readonly MentionableUser[];
  /** Identity comes from the host app; this package never reads auth state. */
  author: { name: string; avatarUrl?: string | null; avatarName?: string };
  onSubmit: (submission: CommentComposerSubmission) => void | Promise<void>;
  pending?: boolean;
  disabled?: boolean;
  /** Attachment-backed composers can submit even when the body is empty. */
  hasAdditionalContent?: boolean;
  /** Reply fields may submit on Enter; Shift+Enter always starts a new line. */
  submitOnEnter?: boolean;
  submitLabel?: string;
  submitAriaLabel?: string;
  submitDisabled?: boolean;
  startActions?: React.ReactNode;
  endActions?: React.ReactNode;
  submitHint?: React.ReactNode;
  before?: React.ReactNode;
  after?: React.ReactNode;
  mentionError?: React.ReactNode;
  containerProps?: Omit<React.ComponentProps<"div">, "children" | "className">;
}

/**
 * The one native comment-input owner.
 *
 * Every product comment surface composes this field instead of wiring a plain
 * textarea or `MentionTextarea` directly. It owns mention-id extraction,
 * suggestion-safe keyboard submission, trimming, pending/empty guards, and
 * accessible failure placement. Persistence and attachment storage remain with
 * the feature adapter that owns those contracts.
 */
export const CommentComposer = React.forwardRef<
  HTMLTextAreaElement,
  CommentComposerProps
>(function CommentComposer(
  {
    users,
    author,
    value,
    onChange,
    onSubmit,
    pending = false,
    disabled = false,
    hasAdditionalContent = false,
    submitOnEnter = false,
    submitLabel = "Post",
    submitAriaLabel,
    submitDisabled = false,
    startActions,
    endActions,
    submitHint,
    before,
    after,
    mentionError,
    containerProps,
    onKeyDown,
    ...textareaProps
  },
  forwardedRef,
) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [mentionRequest, setMentionRequest] = React.useState(0);
  React.useImperativeHandle(
    forwardedRef,
    () => textareaRef.current as HTMLTextAreaElement,
  );
  const body = value.trim();
  const canSubmit =
    !pending &&
    !disabled &&
    !submitDisabled &&
    (body.length > 0 || hasAdditionalContent);

  function submit() {
    if (!canSubmit) return;
    void onSubmit({
      body,
      mentionedUserIds: extractMentionIds(body, users),
    });
  }

  function insertMentionTrigger() {
    setMentionRequest((request) => request + 1);
  }

  const field = (
    <MentionTextarea
      {...textareaProps}
      ref={textareaRef}
      value={value}
      onChange={onChange}
      users={users}
      mentionRequest={mentionRequest}
      onSubmit={submit}
      disabled={disabled || pending}
      className="max-h-40 min-h-16 resize-none overflow-y-auto rounded-none border-0 bg-transparent px-3 py-2 text-sm leading-[1.5] text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
      onKeyDown={(event) => {
        if (
          submitOnEnter &&
          event.key === "Enter" &&
          !event.shiftKey &&
          !event.metaKey &&
          !event.ctrlKey
        ) {
          event.preventDefault();
          submit();
          return;
        }
        onKeyDown?.(event);
      }}
    />
  );

  const submitButtonLabel =
    submitAriaLabel ?? (submitLabel === "Post" ? "Post comment" : submitLabel);
  const submitButton = (
    <Button
      type="button"
      variant="default"
      size="icon-sm"
      aria-label={submitButtonLabel}
      disabled={!canSubmit}
      onClick={submit}
      className="shrink-0 rounded-full shadow-none disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ArrowUp className="size-4" strokeWidth={1.8} />
      )}
    </Button>
  );

  const error = mentionError ? (
    <p className="px-3 pb-3 text-xs text-destructive" role="alert">
      {mentionError}
    </p>
  ) : null;

  return (
    <div
      {...containerProps}
      className="overflow-visible rounded-lg border border-input bg-background shadow-none transition-[border-color,box-shadow] focus-within:border-input focus-within:ring-1 focus-within:ring-ring"
      data-comment-composer
    >
      <div className="flex items-center gap-2 px-3 pt-3">
        <CommentAvatar
          name={author.avatarName ?? author.name}
          src={author.avatarUrl}
          size={28}
        />
        <span className="truncate text-[13px] font-semibold text-foreground">
          {author.name}
        </span>
      </div>
      {before}
      {field}
      <div className="flex h-11 items-center gap-1 px-2 pl-2.5">
        {startActions ? (
          <div className="flex items-center">{startActions}</div>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Mention someone"
          title="Mention someone"
          disabled={disabled || pending}
          className="size-7 rounded-md text-muted-foreground hover:text-foreground"
          onClick={insertMentionTrigger}
        >
          <AtSign className="size-4" />
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {endActions}
          {submitHint}
          {submitButton}
        </div>
      </div>
      {error}
      {after ? <div className="px-3 pb-3">{after}</div> : null}
    </div>
  );
});
