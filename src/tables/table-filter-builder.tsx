"use client";

import * as React from "react";
import { CalendarIcon, Plus, Trash2, X } from "lucide-react";

import { Button } from "../components/button";
import { Calendar } from "../components/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { Input } from "../components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/popover";
import { Checkbox } from "../components/checkbox";
import { cn } from "../lib/utils";
import {
  defaultOperatorForFieldType,
  isRuleComplete,
  operatorArity,
  operatorDef,
  operatorsForFieldType,
  type FilterFieldType,
  type FilterOperator,
  type FilterQuery,
  type FilterRule,
} from "../lib/filter-query";

/**
 * Notion/Linear-style filter rule builder.
 *
 * Replaces the one-control-per-field filter list, which could only express
 * "field equals one value". Each row here is an explicit rule — field,
 * operator, value(s) — and every row shares one conjunction, so the filters
 * people actually ask for are expressible:
 *
 *     Where  Status  is none of   Draft, Terminated
 *     And    Type    is           Subcontract
 *
 * The builder is deliberately dumb: it edits a `FilterQuery` and hands it back.
 * Applying it (client-side predicate or server pushdown) belongs to the table.
 */

/** Field definition the builder needs. Structurally satisfied by `FilterConfig`. */
export interface FilterFieldDef {
  id: string;
  label: string;
  type: FilterFieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface TableFilterBuilderProps {
  fields: FilterFieldDef[];
  query: FilterQuery;
  onQueryChange: (query: FilterQuery) => void;
  /**
   * Fields this table cannot filter correctly right now — typically a
   * server-paginated table whose API has no pushdown for the field. They are
   * offered but disabled, with the reason shown, because returning wrong rows
   * without saying so is worse than not offering the filter.
   */
  unsupportedFields?: string[];
  unsupportedReason?: string;
}

const SEARCHABLE_OPTION_THRESHOLD = 8;

const CONTROL_CLASS =
  "h-7 justify-between gap-1 px-2 text-xs font-normal text-foreground";

export function TableFilterBuilder({
  fields,
  query,
  onQueryChange,
  unsupportedFields = [],
  unsupportedReason = "Not filterable on this table yet",
}: TableFilterBuilderProps): React.ReactElement {
  const fieldById = React.useMemo(() => {
    const map = new Map<string, FilterFieldDef>();
    for (const field of fields) map.set(field.id, field);
    return map;
  }, [fields]);
  const unsupported = React.useMemo(
    () => new Set(unsupportedFields),
    [unsupportedFields],
  );

  const commit = (rules: FilterRule[], conjunction = query.conjunction) => {
    onQueryChange({ conjunction, rules });
  };

  const addRule = (fieldId: string) => {
    const field = fieldById.get(fieldId);
    if (!field) return;
    commit([
      ...query.rules,
      {
        field: fieldId,
        operator: defaultOperatorForFieldType(field.type),
        values: [],
      },
    ]);
  };

  const updateRule = (index: number, patch: Partial<FilterRule>) => {
    commit(
      query.rules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, ...patch } : rule,
      ),
    );
  };

  const removeRule = (index: number) => {
    commit(query.rules.filter((_, ruleIndex) => ruleIndex !== index));
  };

  if (!query.rules.length) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          No filters. Add a rule to narrow this table.
        </p>
        <FieldPicker
          fields={fields}
          unsupported={unsupported}
          unsupportedReason={unsupportedReason}
          onSelect={addRule}
          trigger={
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add filter rule
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {query.rules.map((rule, index) => {
          const field = fieldById.get(rule.field);
          const isUnsupported = unsupported.has(rule.field);
          return (
            <div
              key={`${rule.field}-${index}`}
              className="flex items-center gap-1.5"
            >
              <ConjunctionCell
                index={index}
                conjunction={query.conjunction}
                onChange={(conjunction) => commit(query.rules, conjunction)}
              />

              <FieldPicker
                fields={fields}
                unsupported={unsupported}
                unsupportedReason={unsupportedReason}
                onSelect={(fieldId) => {
                  const nextField = fieldById.get(fieldId);
                  if (!nextField) return;
                  // Field changed: reset operator and values, since neither is
                  // meaningful across field types.
                  updateRule(index, {
                    field: fieldId,
                    operator: defaultOperatorForFieldType(nextField.type),
                    values: [],
                  });
                }}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      CONTROL_CLASS,
                      "min-w-0 flex-1",
                      isUnsupported && "text-destructive",
                    )}
                    title={
                      isUnsupported
                        ? unsupportedReason
                        : (field?.label ?? rule.field)
                    }
                  >
                    <span className="truncate">
                      {field?.label ?? rule.field}
                    </span>
                  </Button>
                }
              />

              <OperatorPicker
                type={field?.type ?? "text"}
                operator={rule.operator}
                onChange={(operator) => {
                  const nextArity = operatorArity(
                    field?.type ?? "text",
                    operator,
                  );
                  const previousArity = operatorArity(
                    field?.type ?? "text",
                    rule.operator,
                  );
                  // Keep values when the shape still fits (is -> is not), drop
                  // them when it cannot (many -> one, one -> none).
                  const values =
                    nextArity === "none"
                      ? []
                      : nextArity === previousArity
                        ? rule.values
                        : nextArity === "one"
                          ? rule.values.slice(0, 1)
                          : rule.values;
                  updateRule(index, { operator, values });
                }}
              />

              <ValueControl
                field={field}
                rule={rule}
                onChange={(values) => updateRule(index, { values })}
              />

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${field?.label ?? rule.field} filter`}
                onClick={() => removeRule(index)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
      </div>

      {query.rules.some(
        (rule) => unsupported.has(rule.field),
      ) ? (
        <p className="text-xs text-destructive">
          {unsupportedReason}. Rules shown in red are not applied.
        </p>
      ) : null}

      <div className="flex items-center justify-between pt-1">
        <FieldPicker
          fields={fields}
          unsupported={unsupported}
          unsupportedReason={unsupportedReason}
          onSelect={addRule}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Add filter rule
            </Button>
          }
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => commit([])}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete filter
        </Button>
      </div>
    </div>
  );
}

/**
 * "Where" on the first row, an And/Or picker on the second, static text after —
 * the conjunction is global, and showing one picker says so without repeating a
 * control on every row.
 */
function ConjunctionCell({
  index,
  conjunction,
  onChange,
}: {
  index: number;
  conjunction: "and" | "or";
  onChange: (conjunction: "and" | "or") => void;
}): React.ReactElement {
  const label = conjunction === "and" ? "And" : "Or";

  if (index === 0) {
    return (
      <span className="w-12 shrink-0 text-xs text-muted-foreground">Where</span>
    );
  }

  if (index > 1) {
    return (
      <span className="w-12 shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-12 shrink-0 px-1.5 text-xs font-normal"
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-24">
        <DropdownMenuItem className="text-xs" onSelect={() => onChange("and")}>
          And
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs" onSelect={() => onChange("or")}>
          Or
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FieldPicker({
  fields,
  unsupported,
  unsupportedReason,
  onSelect,
  trigger,
}: {
  fields: FilterFieldDef[];
  unsupported: Set<string>;
  unsupportedReason: string;
  onSelect: (fieldId: string) => void;
  trigger: React.ReactElement;
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  // Unavailable fields are named once at the bottom rather than listed as
  // disabled rows: a per-row reason squeezed the field label down to "E…", and a
  // row you cannot pick is not worth the width it costs.
  const availableFields = fields.filter((field) => !unsupported.has(field.id));
  const unavailableLabels = fields
    .filter((field) => unsupported.has(field.id))
    .map((field) => field.label);
  const searchable = availableFields.length > SEARCHABLE_OPTION_THRESHOLD;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <Command>
          {searchable ? <CommandInput placeholder="Find a field" /> : null}
          <CommandList>
            <CommandEmpty>No field found.</CommandEmpty>
            <CommandGroup>
              {availableFields.map((field) => (
                <CommandItem
                  key={field.id}
                  value={field.label}
                  onSelect={() => {
                    onSelect(field.id);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <span className="truncate">{field.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {unavailableLabels.length > 0 ? (
          <p className=" border-border px-3 py-2 text-xs text-muted-foreground">
            {unsupportedReason}: {unavailableLabels.join(", ")}
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function OperatorPicker({
  type,
  operator,
  onChange,
}: {
  type: FilterFieldType;
  operator: FilterOperator;
  onChange: (operator: FilterOperator) => void;
}): React.ReactElement {
  const operators = operatorsForFieldType(type);
  const current = operatorDef(type, operator) ?? operators[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(CONTROL_CLASS, "w-28 shrink-0")}
        >
          <span className="truncate">{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {operators.map((def) => (
          <DropdownMenuItem
            key={def.operator}
            className={cn(
              "text-xs",
              def.operator === operator && "font-medium",
            )}
            onSelect={() => onChange(def.operator)}
          >
            {def.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ValueControl({
  field,
  rule,
  onChange,
}: {
  field: FilterFieldDef | undefined;
  rule: FilterRule;
  onChange: (values: string[]) => void;
}): React.ReactElement | null {
  const type = field?.type ?? "text";
  const arity = operatorArity(type, rule.operator);

  if (arity === "none") {
    return <div className="min-w-0 flex-1" />;
  }

  if (type === "boolean") {
    return (
      <OptionPicker
        options={
          field?.options ?? [
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]
        }
        values={rule.values}
        multiple={false}
        placeholder="Select"
        onChange={onChange}
      />
    );
  }

  if ((type === "select" || type === "multiSelect") && field?.options?.length) {
    return (
      <OptionPicker
        options={field.options}
        values={rule.values}
        multiple={arity === "many"}
        placeholder="Select"
        onChange={onChange}
      />
    );
  }

  if (type === "date" || type === "dateRange") {
    if (arity === "two") {
      return (
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <DatePickerValue
            value={rule.values[0] ?? ""}
            placeholder="Start"
            onChange={(value) => onChange([value, rule.values[1] ?? ""])}
          />
          <DatePickerValue
            value={rule.values[1] ?? ""}
            placeholder="End"
            onChange={(value) => onChange([rule.values[0] ?? "", value])}
          />
        </div>
      );
    }
    return (
      <DatePickerValue
        value={rule.values[0] ?? ""}
        placeholder="Pick a date"
        onChange={(value) => onChange([value])}
      />
    );
  }

  if (arity === "two") {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <Input
          type={type === "number" ? "number" : "text"}
          value={rule.values[0] ?? ""}
          placeholder="Min"
          onChange={(event) =>
            onChange([event.target.value, rule.values[1] ?? ""])
          }
          className="h-7 min-w-0 flex-1 text-xs"
        />
        <Input
          type={type === "number" ? "number" : "text"}
          value={rule.values[1] ?? ""}
          placeholder="Max"
          onChange={(event) =>
            onChange([rule.values[0] ?? "", event.target.value])
          }
          className="h-7 min-w-0 flex-1 text-xs"
        />
      </div>
    );
  }

  return (
    <Input
      type={type === "number" ? "number" : "text"}
      value={rule.values[0] ?? ""}
      placeholder={field?.placeholder ?? "Value"}
      onChange={(event) => onChange([event.target.value])}
      className="h-7 min-w-0 flex-1 text-xs"
    />
  );
}

function OptionPicker({
  options,
  values,
  multiple,
  placeholder,
  onChange,
}: {
  options: { value: string; label: string }[];
  values: string[];
  multiple: boolean;
  placeholder: string;
  onChange: (values: string[]) => void;
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const searchable = options.length > SEARCHABLE_OPTION_THRESHOLD;
  const selected = new Set(values.map((value) => value.toLowerCase()));

  const labelFor = (value: string) =>
    options.find(
      (option) => option.value.toLowerCase() === value.toLowerCase(),
    )?.label ?? value;

  // Show the chosen values, not a count: a filter you glance at should say what
  // it is filtering to. CSS truncation plus the title tooltip handles overflow.
  const summary =
    values.length === 0 ? placeholder : values.map(labelFor).join(", ");

  const toggle = (value: string) => {
    if (!multiple) {
      onChange([value]);
      setOpen(false);
      return;
    }
    const isSelected = selected.has(value.toLowerCase());
    onChange(
      isSelected
        ? values.filter(
            (candidate) => candidate.toLowerCase() !== value.toLowerCase(),
          )
        : [...values, value],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            CONTROL_CLASS,
            "min-w-0 flex-1",
            values.length === 0 && "text-muted-foreground",
          )}
          title={values.map(labelFor).join(", ") || placeholder}
        >
          <span className="truncate">{summary}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <Command>
          {searchable ? <CommandInput placeholder="Find a value" /> : null}
          <CommandList>
            <CommandEmpty>No value found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.has(option.value.toLowerCase());
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option.value)}
                    className="gap-2 text-xs"
                  >
                    {multiple ? (
                      <Checkbox
                        checked={isSelected}
                        aria-hidden
                        tabIndex={-1}
                        className="pointer-events-none"
                      />
                    ) : null}
                    <span className="truncate">{option.label}</span>
                    {!multiple && isSelected ? (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Selected
                      </span>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function DatePickerValue({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}): React.ReactElement {
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            CONTROL_CLASS,
            "min-w-0 flex-1 justify-start",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {selected
              ? selected.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(date ? toIsoDay(date) : "")}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function toIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Rules that are complete enough to apply — the count the toolbar badge shows. */
export function countCompleteRules(
  query: FilterQuery,
  fields: FilterFieldDef[],
): number {
  const typeById = new Map(fields.map((field) => [field.id, field.type]));
  return query.rules.filter((rule) => {
    const type = typeById.get(rule.field);
    return type ? isRuleComplete(rule, type) : false;
  }).length;
}
