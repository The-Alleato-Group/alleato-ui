"use client";

import * as React from "react";

import { Input } from "../components/input";

export interface CreatableOption {
  value: string;
  label: string;
}

/**
 * Compact input that suggests the established vocabulary while allowing an
 * operator to retain project-specific metadata. Existing labels are persisted
 * as their stable values; a new label is saved exactly as entered.
 */
export function CreatableOptionInput({
  value,
  options,
  placeholder,
  onCommit,
  onCancel,
  className,
}: {
  value: string;
  options: readonly CreatableOption[];
  placeholder: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
  className?: string;
}): React.ReactElement {
  const listId = React.useId();
  const displayValue = React.useCallback(
    (nextValue: string) =>
      options.find((option) => option.value === nextValue)?.label ?? nextValue,
    [options],
  );
  const [draft, setDraft] = React.useState(() => displayValue(value));
  const committedRef = React.useRef(false);

  React.useEffect(() => {
    setDraft(displayValue(value));
    committedRef.current = false;
  }, [displayValue, value]);

  const commit = React.useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    const trimmed = draft.trim();
    const matchingOption = options.find(
      (option) =>
        option.label.localeCompare(trimmed, undefined, { sensitivity: "accent" }) ===
          0 ||
        option.value.localeCompare(trimmed, undefined, { sensitivity: "accent" }) ===
          0,
    );
    onCommit(matchingOption?.value ?? trimmed);
  }, [draft, onCommit, options]);

  return (
    <>
      <Input
        autoFocus
        list={listId}
        variant="inline"
        className={className}
        value={draft}
        placeholder={placeholder}
        data-row-interactive="true"
        aria-label={placeholder}
        onChange={(event) => {
          committedRef.current = false;
          setDraft(event.target.value);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
    </>
  );
}
