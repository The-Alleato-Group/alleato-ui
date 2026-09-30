"use client";

import * as React from "react";

import { Textarea } from "../components/textarea";
import {
  filterMentionCandidates,
  mentionDisplayName,
  mentionTokenName,
  type MentionableUser,
} from "../lib/mentions";
import { cn } from "../lib/utils";
import { CommentAvatar } from "./comment-avatar";

const MAX_SUGGESTIONS = 8;

export interface MentionTextareaProps extends Omit<
  React.ComponentProps<typeof Textarea>,
  "value" | "onChange"
> {
  value: string;
  onChange: (value: string) => void;
  /** People offered after `@`. An empty list disables suggestions. */
  users: readonly MentionableUser[];
  /** Cmd/Ctrl+Enter, when no suggestion is open. */
  onSubmit?: () => void;
  /** Increment to insert `@` at the caret and open the same suggestion list. */
  mentionRequest?: number;
  /** Layout classes for the positioning wrapper around the textarea and list. */
  containerClassName?: string;
}

/**
 * A comment textarea with `@` mention suggestions.
 *
 * Typing `@` opens a list above the input filtered by what follows; arrow keys
 * move, Enter/Tab insert `@Display Name `, Escape closes. The value stays plain
 * text — pair it with `extractMentionIds` at submit time to get the ids.
 */
export const MentionTextarea = React.forwardRef<
  HTMLTextAreaElement,
  MentionTextareaProps
>(function MentionTextarea(
  {
    value,
    onChange,
    users,
    onSubmit,
    mentionRequest,
    containerClassName,
    onKeyDown,
    className,
    ...rest
  },
  forwardedRef,
) {
  const localRef = React.useRef<HTMLTextAreaElement>(null);
  React.useImperativeHandle(forwardedRef, () => localRef.current!);
  const textareaRef = localRef;
  const lastMentionRequest = React.useRef(mentionRequest);
  const [query, setQuery] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listId = React.useId();

  const suggestions = React.useMemo(
    () =>
      query === null
        ? []
        : filterMentionCandidates(users, query).slice(0, MAX_SUGGESTIONS),
    [users, query],
  );
  const open = suggestions.length > 0;

  function syncQuery(text: string, cursor: number) {
    const before = text.slice(0, cursor);
    const match = before.match(/(?:^|\s)@([\w.-]*)$/);
    setQuery(match ? match[1] : null);
    setActiveIndex(0);
  }

  function insertMention(user: MentionableUser) {
    const textarea = textareaRef.current;
    const cursor = textarea?.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const atIndex = before.lastIndexOf("@");
    if (atIndex < 0) return;
    const mention = `@${mentionTokenName(user, users)} `;
    const next = value.slice(0, atIndex) + mention + value.slice(cursor);
    onChange(next);
    setQuery(null);
    requestAnimationFrame(() => {
      const element = textareaRef.current;
      if (!element) return;
      element.focus();
      const position = atIndex + mention.length;
      element.setSelectionRange(position, position);
    });
  }

  React.useEffect(() => {
    if (
      mentionRequest === undefined ||
      mentionRequest === lastMentionRequest.current
    ) {
      return;
    }
    lastMentionRequest.current = mentionRequest;

    const textarea = textareaRef.current;
    if (!textarea || textarea.disabled) return;
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? start;
    const needsSpace = start > 0 && !/\s$/.test(value.slice(0, start));
    const insertion = `${needsSpace ? " " : ""}@`;
    const next = `${value.slice(0, start)}${insertion}${value.slice(end)}`;
    const caret = start + insertion.length;
    onChange(next);
    setQuery("");
    setActiveIndex(0);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  }, [mentionRequest, onChange, value]);

  return (
    <div className={cn("relative", containerClassName)}>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Mention suggestions"
          className="absolute bottom-full left-0 z-10 mb-1 max-h-56 w-full max-w-sm overflow-y-auto rounded-lg border border-border/50 bg-popover p-1 text-popover-foreground shadow-sm"
        >
          {suggestions.map((user, index) => (
            <li
              key={user.id}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-[13px]",
                index === activeIndex ? "bg-muted" : "hover:bg-muted",
              )}
              onMouseDown={(event) => {
                event.preventDefault();
                insertMention(user);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <CommentAvatar name={mentionDisplayName(user)} size={24} />
              <span className="min-w-0 truncate font-medium text-foreground">
                {mentionTokenName(user, users)}
              </span>
              {user.email ? (
                <span className="ml-auto max-w-40 truncate text-[11px] text-muted-foreground">
                  {user.email}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <Textarea
        {...rest}
        ref={textareaRef}
        value={value}
        className={className}
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        onChange={(event) => {
          onChange(event.target.value);
          syncQuery(event.target.value, event.target.selectionStart);
        }}
        onClick={(event) => {
          syncQuery(value, event.currentTarget.selectionStart);
        }}
        onKeyDown={(event) => {
          if (open) {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) =>
                Math.min(index + 1, suggestions.length - 1),
              );
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
              return;
            }
            if ((event.key === "Enter" || event.key === "Tab") && !event.shiftKey) {
              event.preventDefault();
              insertMention(suggestions[activeIndex] ?? suggestions[0]);
              return;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setQuery(null);
              return;
            }
          }
          if (
            onSubmit &&
            event.key === "Enter" &&
            (event.metaKey || event.ctrlKey)
          ) {
            event.preventDefault();
            onSubmit();
            return;
          }
          onKeyDown?.(event);
        }}
        onBlur={(event) => {
          setQuery(null);
          rest.onBlur?.(event);
        }}
      />
    </div>
  );
});
