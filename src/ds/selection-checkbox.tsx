"use client";

import { Checkbox } from "../components/checkbox";

interface SelectionCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Accessible name — a selection checkbox carries no visible label of its own. */
  "aria-label": string;
}

/**
 * A bulk-action row/select-all checkbox — distinct from a form field's
 * checkbox (see `ToggleField`/`RHFCheckboxField`): it toggles which rows a
 * batch action applies to, not a piece of record data, so it carries no
 * label/hint/error affordances of its own, only an accessible name.
 */
export function SelectionCheckbox({
  checked,
  onCheckedChange,
  ...rest
}: SelectionCheckboxProps) {
  return <Checkbox checked={checked} onCheckedChange={(next) => onCheckedChange(next === true)} {...rest} />;
}
