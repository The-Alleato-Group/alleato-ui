"use client";

import * as React from "react";

import { DetailField, type DetailFieldProps } from "./DetailField";
import { InlineEditField, type InlineEditFieldProps } from "./InlineEditField";

type EditableDetailFieldProps = Omit<
  DetailFieldProps,
  "children" | "value" | "currency" | "date"
> &
  Omit<InlineEditFieldProps, "label"> & {
    editLabel?: string;
  };

/**
 * A DetailField whose value is edited in place.
 *
 * `emptyPlaceholder` is the single opt-in escape hatch for an empty field, and
 * it must be a real call to action ("Add phone number") — never placeholder
 * ink. Omit it and the field renders no characters at all while the row stays
 * a keyboard-reachable, height-stable click target (noise gate #4). A dash
 * passed here is ignored by InlineEditField for the same reason.
 */
export function EditableDetailField({
  label,
  editLabel,
  span,
  emptyPlaceholder,
  hideLabel,
  layout,
  className,
  ...inlineEditProps
}: EditableDetailFieldProps): React.ReactElement {
  return (
    <DetailField
      label={label}
      span={span}
      emptyPlaceholder={emptyPlaceholder}
      hideLabel={hideLabel}
      layout={layout}
      className={className}
    >
      <InlineEditField
        label={editLabel ?? label}
        emptyLabel={emptyPlaceholder}
        placeholder={emptyPlaceholder}
        {...inlineEditProps}
      />
    </DetailField>
  );
}

export type { EditableDetailFieldProps };
