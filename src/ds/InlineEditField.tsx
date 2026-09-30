"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "../components/button";
import { Calendar } from "../components/calendar";
import { Input } from "../components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/popover";
import { Textarea } from "../components/textarea";
import { CreatableOptionInput } from "./CreatableOptionInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select";
import { cn } from "../lib/utils";

export interface InlineEditFieldOption {
  value: string;
  label: string;
}

export interface InlineEditFieldProps {
  /** Current value as a string (date → YYYY-MM-DD, boolean → "true"/"false"). */
  value: string;
  /** Optional rich read-mode display (e.g. a StatusBadge or formatted date). */
  display?: React.ReactNode;
  type?:
    | "text"
    | "number"
    | "date"
    | "select"
    | "creatable"
    | "boolean"
    | "textarea";
  /** Options for selectable fields. `creatable` suggests these while allowing a new value. */
  options?: readonly InlineEditFieldOption[];
  placeholder?: string;
  /**
   * Optional call-to-action rendered when the value is empty, e.g.
   * "Add phone number". There is NO default: an empty field renders no
   * placeholder ink at all (noise gate #4 — a dash is not a value). A
   * placeholder that is itself a dash/"null"/"n/a" is ignored for the same
   * reason, so a legacy dash call site cannot reintroduce one.
   */
  emptyLabel?: string;
  /** Used in the success/error toast, e.g. "Start Date". */
  label?: string;
  /** Keep a textarea visible for long-form detail content instead of requiring a trigger click. */
  alwaysEditable?: boolean;
  /**
   * Controlled edit state, for a caller that opens the editor from its own
   * affordance (a pencil in the section heading). Pair with `onEditingChange`;
   * omit both for the default self-managed trigger.
   */
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  /**
   * Suppress the hover pencil on the read trigger. Use when the pencil lives
   * elsewhere (a heading row) or when this field is one part of a compound
   * value and a pencil between the parts would read as part of the text.
   */
  hideIcon?: boolean;
  /** Persist the new value. Throw to signal failure (the field reverts). */
  onSave: (value: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const BOOLEAN_OPTIONS: InlineEditFieldOption[] = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

/**
 * The shared "clear" sentinel for a nullable select. Radix Select forbids an
 * empty-string item value, so every nullable inline select in the app carries
 * a "None" item with this value and maps it back to `null` on save. It is a
 * control value, never content: read mode treats it as an absence, so a field
 * with no relation renders nothing rather than the literal `__none__`
 * (2026-09-20, prime contract Contractor / Architect).
 */
export const NONE_SELECT_VALUE = "__none__";

/**
 * Spellings of "no answer" that arrive as if they were values: a literal dash
 * from a CSV import, the string "null" from a JSON column, an empty object or
 * array from a join. All of them are absence, not data.
 */
const EMPTY_VALUE_TOKENS = new Set([
  "",
  "-",
  "\u2013",
  "\u2014",
  "null",
  "undefined",
  "n/a",
  "{}",
  "[]",
  NONE_SELECT_VALUE.toLowerCase(),
]);

/**
 * True when a field has no answer to show.
 *
 * A computed zero is NEVER empty. "0", "0.00", "$0.00" and "0.00%" are proof
 * that a calculation ran; suppressing them makes a broken sum and a real zero
 * look identical. Likewise "false" is a real answer for a boolean field.
 */
export function isEmptyFieldValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Date) return false;
  if (typeof value === "object") return Object.keys(value).length === 0;
  if (typeof value !== "string") return false;
  return EMPTY_VALUE_TOKENS.has(value.trim().toLowerCase());
}

/**
 * Click-to-edit field for detail pages. Renders as a read-only value with a
 * hover/focus edit affordance (an empty field renders no placeholder text but
 * keeps the full row as a keyboard-reachable, height-stable hit area);
 * clicking turns it into the matching editor
 * (text/number/date/select/boolean/textarea) that commits on blur/Enter/change
 * where appropriate and reverts (with a toast) if the save throws.
 */
export function InlineEditField({
  value,
  display,
  type = "text",
  options,
  placeholder,
  emptyLabel,
  label,
  alwaysEditable = false,
  editing: controlledEditing,
  onEditingChange,
  hideIcon = false,
  onSave,
  disabled,
  className,
}: InlineEditFieldProps): React.ReactElement {
  const [uncontrolledEditing, setUncontrolledEditing] = React.useState(false);
  const editing = controlledEditing ?? uncontrolledEditing;
  const setEditing = (next: boolean) => {
    setUncontrolledEditing(next);
    onEditingChange?.(next);
  };
  const [draft, setDraft] = React.useState(value);
  const [saving, setSaving] = React.useState(false);

  // Keep the draft in sync with the source value when not actively editing.
  React.useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const isSelect = type === "select" || type === "boolean";
  const isTextarea = type === "textarea";
  const isPersistentTextarea = isTextarea && alwaysEditable;
  const selectOptions =
    type === "boolean" ? (options ?? BOOLEAN_OPTIONS) : (options ?? []);

  const commit = React.useCallback(
    async (next: string) => {
      if (next === value) {
        setEditing(false);
        return;
      }
      setSaving(true);
      try {
        await onSave(next);
        toast.success(`${label ? `${label} ` : ""}updated`);
        setEditing(false);
      } catch (err) {
        toast.error(`Could not update${label ? ` ${label}` : ""}`, {
          description: err instanceof Error ? err.message : undefined,
        });
        setDraft(value);
        setEditing(false);
      } finally {
        setSaving(false);
      }
    },
    [value, onSave, label],
  );

  // What read mode actually shows. `display` (a badge, a formatted date) wins
  // when supplied; otherwise the raw value, unless the value is an absence.
  // A select's raw value is a key ("out_for_signature", a UUID), never what
  // the reader should see: read mode shows the matching option's label, and
  // a key with no option shows nothing rather than leaking the key.
  const selectedOptionLabel = isSelect
    ? (selectOptions.find((option) => option.value === value)?.label ?? null)
    : null;
  const readContent =
    display ??
    (isEmptyFieldValue(value) ? null : isSelect ? selectedOptionLabel : value);
  const hasReadContent =
    readContent !== null && readContent !== undefined && readContent !== "";

  // A caller may opt into a real call to action ("Add phone number"). A dash is
  // not one — it is the placeholder ink the noise gate bans — so it is dropped
  // here rather than at every call site.
  const emptyCallToAction =
    !hasReadContent && emptyLabel && !isEmptyFieldValue(emptyLabel)
      ? emptyLabel
      : null;

  const textareaEditor = (autoFocus = false) => (
    <Textarea
      autoFocus={autoFocus}
      value={draft}
      disabled={disabled || saving}
      aria-label={label ?? "Edit value"}
      placeholder={placeholder}
      className={cn("min-h-24 w-full", className)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => void commit(draft)}
      onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          void commit(draft);
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setDraft(value);
          setEditing(false);
        }
      }}
    />
  );

  // Long-form task and record bodies are inputs, not a sentence that happens
  // to open an editor. Keep the shared save/revert semantics while rendering
  // the textarea from the first paint. It intentionally does not autofocus:
  // selecting a row must not steal keyboard focus from the surrounding table.
  if (isPersistentTextarea) {
    return textareaEditor();
  }

  if (disabled) {
    return <>{hasReadContent ? readContent : emptyCallToAction}</>;
  }

  if (!editing) {
    return (
      <Button
        type="button"
        data-inline-edit-trigger
        data-empty={hasReadContent ? undefined : "true"}
        variant="ghost"
        // With no value and no placeholder there is no text to name the
        // control, so the field's own label names it. Screen reader users get
        // "Set Type", not an unlabelled button.
        aria-label={
          hasReadContent ? undefined : label ? `Set ${label}` : "Set value"
        }
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        title="Click to edit"
        className={cn(
          // `has-[>svg]:px-1.5` restates the padding at the same specificity as
          // Button's size-default `has-[>svg]:px-3`; the pencil is a direct child,
          // so without it the read value sits 6px right of its neighbours.
          "group/inline-edit -mx-1.5 -my-0.5 flex h-auto w-full items-center justify-start rounded px-1.5 py-0.5 text-left text-sm hover:bg-transparent has-[>svg]:px-1.5 dark:hover:bg-transparent focus-visible:bg-muted/60",
          // A read value is 14/20 medium (Button's own weight) so it stands
          // off its 11px label; long-form text is body copy and stays regular.
          // `whitespace-normal` undoes Button's `whitespace-nowrap`: without
          // it a long value runs under the next column instead of wrapping.
          isTextarea ? "font-normal whitespace-normal" : "font-medium whitespace-normal",
          className,
        )}
      >
        {/*
          The whole row is the hit area and the only affordance: `min-h-5`
          reserves exactly one line of `text-sm`, so an empty field occupies the
          same height as a filled one (no jitter down a column of fields) while
          rendering zero characters. Discovery comes from the pencil on hover
          and the existing focus treatment for keyboard users, both of which
          appear on demand instead of sitting in the layout permanently.
        */}
        <span
          className={cn(
            // Values wrap; they are never clipped. `truncate` here turned a
            // 38-character contract title into "26-116 Exol Morrisville ..."
            // beside 400px of empty column (2026-09-20). The row still
            // reserves one line (`min-h-5`) so an empty field keeps its height.
            "min-h-5 min-w-0 flex-1 break-words",
            // A textarea's raw value keeps its line breaks. A caller that
            // passes an element as `display` owns the formatting (a
            // StructuredText, a RichText): forcing pre-wrap around it would
            // reintroduce the hard breaks the element exists to collapse.
            isTextarea && !React.isValidElement(display)
              ? "whitespace-pre-wrap text-left leading-relaxed"
              : isTextarea
                ? "text-left"
                : "leading-5",
          )}
        >
          {hasReadContent ? (
            readContent
          ) : emptyCallToAction ? (
            <span className="text-muted-foreground/60">
              {emptyCallToAction}
            </span>
          ) : null}
        </span>
        {hideIcon ? null : (
          <Pencil
            aria-hidden="true"
            className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground/60 opacity-0 transition-opacity group-hover/inline-edit:opacity-100 group-focus-visible/inline-edit:opacity-100"
          />
        )}
      </Button>
    );
  }

  if (isSelect) {
    return (
      <Select
        value={draft}
        open
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditing(false);
        }}
        onValueChange={(next) => {
          setDraft(next);
          void commit(next);
        }}
        disabled={saving}
      >
        <SelectTrigger className={cn("h-7 w-full", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {selectOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (type === "creatable") {
    return (
      <CreatableOptionInput
        value={draft}
        options={options ?? []}
        placeholder={placeholder ?? "Choose or add an option"}
        className={cn("h-7 w-full", className)}
        onCommit={(next) => {
          setDraft(next);
          void commit(next);
        }}
        onCancel={() => {
          setDraft(value);
          setEditing(false);
        }}
      />
    );
  }

  if (type === "textarea") {
    return textareaEditor(true);
  }

  if (type === "date") {
    const parseDateDraft = (v: string): Date | undefined => {
      if (!v) return undefined;
      const parts = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (parts)
        return new Date(
          Number(parts[1]),
          Number(parts[2]) - 1,
          Number(parts[3]),
        );
      const parsed = parse(v, "MM/dd/yyyy", new Date());
      return isValid(parsed) ? parsed : undefined;
    };
    const dateValue = parseDateDraft(draft);

    return (
      <div className={cn("flex gap-1", className)}>
        <Input
          autoFocus
          value={draft}
          disabled={saving}
          placeholder={placeholder ?? "YYYY-MM-DD"}
          className="h-7 w-full"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => void commit(draft)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void commit(draft);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setDraft(value);
              setEditing(false);
            }
          }}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={saving}
              className="h-7 w-7 shrink-0"
              aria-label="Open calendar"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={(date) => {
                const next = date ? format(date, "yyyy-MM-dd") : "";
                setDraft(next);
                void commit(next);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <Input
      type={type === "number" ? "number" : "text"}
      autoFocus
      value={draft}
      disabled={saving}
      placeholder={placeholder}
      className={cn("h-7 w-full", className)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => void commit(draft)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          void commit(draft);
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setDraft(value);
          setEditing(false);
        }
      }}
    />
  );
}
