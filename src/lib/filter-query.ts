/**
 * Shared table filter query model used by the Alleato platform and ASRS.
 *
 * The old model was `Record<fieldId, value>`: one field, one value, implicit
 * "equals", implicit AND. That cannot express the filters people actually ask
 * for ("status is not Draft", "status is any of Out for Signature, Approved"),
 * so every table was limited to picking a single value per field.
 *
 * This model is a list of explicit rules joined by one conjunction — the same
 * shape Notion and Linear expose:
 *
 *     where status is any of [Out for Signature, Approved]
 *       and type is not [purchase_order]
 *
 * Three kinds of consumers share it, which is why it holds no React:
 *   1. `TableFilterBuilder`   — builds/edits rules (UI)
 *   2. `UnifiedTablePage`     — applies rules to fetched rows (client)
 *   3. API routes             — translate rules to SQL (server pushdown)
 *
 * Rule 3 is why `values` is always `string[]`: a rule must survive a URL round
 * trip and a server hop without a type-specific decoder on each side. Field
 * type drives interpretation at the point of comparison instead.
 */

/** Field kinds a rule can target. Mirrors `FilterConfig["type"]`. */
export type FilterFieldType =
  | "select"
  | "multiSelect"
  | "dateRange"
  | "text"
  | "boolean"
  | "date"
  | "number";

export type FilterOperator =
  // enum / select
  | "is"
  | "is_not"
  | "any_of"
  | "none_of"
  // text
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  // number
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  // date
  | "on"
  | "before"
  | "after"
  | "on_or_before"
  | "on_or_after"
  | "between"
  // presence — valid for every type
  | "is_empty"
  | "not_empty";

/** How many values the operator consumes. Drives the UI and the codec. */
export type FilterOperatorArity = "none" | "one" | "many" | "two";

export interface FilterOperatorDef {
  operator: FilterOperator;
  label: string;
  arity: FilterOperatorArity;
}

export interface FilterRule {
  field: string;
  operator: FilterOperator;
  /**
   * Always a string array, even for single-value operators (index 0) and
   * `is_empty`/`not_empty` (empty array). Keeps the URL codec and the server
   * translator free of per-type branching.
   */
  values: string[];
}

export interface FilterQuery {
  conjunction: "and" | "or";
  rules: FilterRule[];
}

export const EMPTY_FILTER_QUERY: FilterQuery = { conjunction: "and", rules: [] };

// ─── Operator registry ───────────────────────────────────────────────────────

const PRESENCE_OPERATORS: FilterOperatorDef[] = [
  { operator: "is_empty", label: "is empty", arity: "none" },
  { operator: "not_empty", label: "is not empty", arity: "none" },
];

const OPERATORS_BY_TYPE: Record<FilterFieldType, FilterOperatorDef[]> = {
  select: [
    { operator: "is", label: "is", arity: "one" },
    { operator: "is_not", label: "is not", arity: "one" },
    { operator: "any_of", label: "is any of", arity: "many" },
    { operator: "none_of", label: "is none of", arity: "many" },
    ...PRESENCE_OPERATORS,
  ],
  multiSelect: [
    { operator: "any_of", label: "is any of", arity: "many" },
    { operator: "none_of", label: "is none of", arity: "many" },
    { operator: "is", label: "is", arity: "one" },
    { operator: "is_not", label: "is not", arity: "one" },
    ...PRESENCE_OPERATORS,
  ],
  text: [
    { operator: "contains", label: "contains", arity: "one" },
    { operator: "not_contains", label: "does not contain", arity: "one" },
    { operator: "is", label: "is", arity: "one" },
    { operator: "is_not", label: "is not", arity: "one" },
    { operator: "starts_with", label: "starts with", arity: "one" },
    { operator: "ends_with", label: "ends with", arity: "one" },
    ...PRESENCE_OPERATORS,
  ],
  number: [
    { operator: "eq", label: "=", arity: "one" },
    { operator: "neq", label: "≠", arity: "one" },
    { operator: "gt", label: ">", arity: "one" },
    { operator: "gte", label: "≥", arity: "one" },
    { operator: "lt", label: "<", arity: "one" },
    { operator: "lte", label: "≤", arity: "one" },
    { operator: "between", label: "is between", arity: "two" },
    ...PRESENCE_OPERATORS,
  ],
  date: [
    { operator: "on", label: "is", arity: "one" },
    { operator: "before", label: "is before", arity: "one" },
    { operator: "after", label: "is after", arity: "one" },
    { operator: "on_or_before", label: "is on or before", arity: "one" },
    { operator: "on_or_after", label: "is on or after", arity: "one" },
    { operator: "between", label: "is between", arity: "two" },
    ...PRESENCE_OPERATORS,
  ],
  dateRange: [
    { operator: "between", label: "is between", arity: "two" },
    { operator: "on", label: "is", arity: "one" },
    { operator: "before", label: "is before", arity: "one" },
    { operator: "after", label: "is after", arity: "one" },
    ...PRESENCE_OPERATORS,
  ],
  boolean: [
    { operator: "is", label: "is", arity: "one" },
    ...PRESENCE_OPERATORS,
  ],
};

export function operatorsForFieldType(
  type: FilterFieldType,
): FilterOperatorDef[] {
  return OPERATORS_BY_TYPE[type] ?? OPERATORS_BY_TYPE.text;
}

export function operatorDef(
  type: FilterFieldType,
  operator: FilterOperator,
): FilterOperatorDef | undefined {
  return operatorsForFieldType(type).find(
    (candidate) => candidate.operator === operator,
  );
}

export function defaultOperatorForFieldType(
  type: FilterFieldType,
): FilterOperator {
  return operatorsForFieldType(type)[0].operator;
}

export function operatorArity(
  type: FilterFieldType,
  operator: FilterOperator,
): FilterOperatorArity {
  return operatorDef(type, operator)?.arity ?? "one";
}

/**
 * A rule is "complete" when it has the values its operator needs. Incomplete
 * rules are kept in the builder (you are mid-edit) but never applied and never
 * written to the URL — otherwise picking a field would instantly empty the
 * table.
 */
export function isRuleComplete(
  rule: FilterRule,
  type: FilterFieldType,
): boolean {
  const arity = operatorArity(type, rule.operator);
  const filled = rule.values.filter((value) => value !== "" && value != null);
  if (arity === "none") return true;
  if (arity === "two") return filled.length >= 2;
  return filled.length >= 1;
}

// ─── URL codec ───────────────────────────────────────────────────────────────
//
// `and;status:any_of:Out%20for%20Signature|Approved;type:is_not:purchase_order`
//
// Chosen over base64 JSON so a filtered table URL stays readable and hand
// editable when someone pastes one into Slack. Values are percent-encoded, so
// a value containing `;`, `:`, or `|` round-trips intact.

const RULE_SEPARATOR = ";";
const PART_SEPARATOR = ":";
const VALUE_SEPARATOR = "|";

const ALL_OPERATORS = new Set<string>(
  Object.values(OPERATORS_BY_TYPE).flatMap((defs) =>
    defs.map((def) => def.operator),
  ),
);

export function encodeFilterQuery(query: FilterQuery): string {
  if (!query.rules.length) return "";
  const encodedRules = query.rules.map((rule) => {
    const values = rule.values
      .map((value) => encodeURIComponent(value))
      .join(VALUE_SEPARATOR);
    return [rule.field, rule.operator, values].join(PART_SEPARATOR);
  });
  return [query.conjunction, ...encodedRules].join(RULE_SEPARATOR);
}

/**
 * Defensive by contract: this parses a user-editable URL. Anything malformed —
 * unknown operator, empty field, junk conjunction — is dropped rather than
 * thrown, because a bad filter param must never blank a page.
 */
export function decodeFilterQuery(raw: string | null | undefined): FilterQuery {
  if (!raw) return EMPTY_FILTER_QUERY;
  const tokens = raw.split(RULE_SEPARATOR).filter((token) => token.length > 0);
  if (!tokens.length) return EMPTY_FILTER_QUERY;

  const conjunction = tokens[0] === "or" ? "or" : "and";
  const ruleTokens = tokens[0] === "or" || tokens[0] === "and" ? tokens.slice(1) : tokens;

  const rules: FilterRule[] = [];
  for (const token of ruleTokens) {
    const parts = token.split(PART_SEPARATOR);
    if (parts.length < 2) continue;
    const [field, operator, rawValues = ""] = parts;
    if (!field || !ALL_OPERATORS.has(operator)) continue;
    const values = rawValues
      .split(VALUE_SEPARATOR)
      .filter((value) => value.length > 0)
      .map((value) => safeDecode(value));
    rules.push({ field, operator: operator as FilterOperator, values });
  }
  return { conjunction, rules };
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // A hand-mangled `%` in a pasted URL must not throw a URIError at render.
    return value;
  }
}

// ─── Comparison ──────────────────────────────────────────────────────────────

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

/**
 * Enum and text comparison is case-insensitive on purpose. Commitment status is
 * stored capitalized ("Out for Signature"), normalized to lowercase by the list
 * API, and declared capitalized in the filter options — the server already
 * compares with `ilike`. A case-sensitive client comparison would return zero
 * rows for a filter the server considers a match.
 */
function textValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(normalizeText);
  return [normalizeText(value)];
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Dates compare at day granularity so "is 2026-08-18" matches any time that day. */
function toDayNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  }
  const raw = String(value);
  const isoDayMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDayMatch) {
    return Date.UTC(
      Number(isoDayMatch[1]),
      Number(isoDayMatch[2]) - 1,
      Number(isoDayMatch[3]),
    );
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return Date.UTC(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
  );
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  const text = normalizeText(value);
  if (text === "true" || text === "yes") return true;
  if (text === "false" || text === "no") return false;
  return null;
}

/**
 * Evaluate one rule against one already-resolved row value.
 *
 * Returns `true` for a rule whose operator does not apply to the field type, so
 * an unrecognized combination widens the result set instead of silently
 * emptying the table.
 */
export function evaluateFilterRule(
  rawValue: unknown,
  rule: FilterRule,
  type: FilterFieldType,
): boolean {
  if (rule.operator === "is_empty") return isEmptyValue(rawValue);
  if (rule.operator === "not_empty") return !isEmptyValue(rawValue);

  if (!isRuleComplete(rule, type)) return true;

  const values = rule.values.filter((value) => value !== "" && value != null);

  switch (rule.operator) {
    case "is":
    case "any_of": {
      if (type === "boolean") {
        const expected = toBoolean(values[0]);
        return expected === null ? true : toBoolean(rawValue) === expected;
      }
      const actual = textValues(rawValue);
      const expected = values.map(normalizeText);
      return actual.some((candidate) => expected.includes(candidate));
    }
    case "is_not":
    case "none_of": {
      if (type === "boolean") {
        const expected = toBoolean(values[0]);
        return expected === null ? true : toBoolean(rawValue) !== expected;
      }
      const actual = textValues(rawValue);
      const excluded = values.map(normalizeText);
      // An empty cell is "not Draft" — matching Notion, and the reason
      // "everything not in draft" is usable at all.
      return !actual.some((candidate) => excluded.includes(candidate));
    }
    case "contains":
      return textValues(rawValue).some((candidate) =>
        candidate.includes(normalizeText(values[0])),
      );
    case "not_contains":
      return !textValues(rawValue).some((candidate) =>
        candidate.includes(normalizeText(values[0])),
      );
    case "starts_with":
      return textValues(rawValue).some((candidate) =>
        candidate.startsWith(normalizeText(values[0])),
      );
    case "ends_with":
      return textValues(rawValue).some((candidate) =>
        candidate.endsWith(normalizeText(values[0])),
      );
    case "eq":
    case "neq":
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const actual = toNumber(rawValue);
      const expected = toNumber(values[0]);
      if (actual === null || expected === null) return false;
      if (rule.operator === "eq") return actual === expected;
      if (rule.operator === "neq") return actual !== expected;
      if (rule.operator === "gt") return actual > expected;
      if (rule.operator === "gte") return actual >= expected;
      if (rule.operator === "lt") return actual < expected;
      return actual <= expected;
    }
    case "on":
    case "before":
    case "after":
    case "on_or_before":
    case "on_or_after": {
      const actual = toDayNumber(rawValue);
      const expected = toDayNumber(values[0]);
      if (actual === null || expected === null) return false;
      if (rule.operator === "on") return actual === expected;
      if (rule.operator === "before") return actual < expected;
      if (rule.operator === "after") return actual > expected;
      if (rule.operator === "on_or_before") return actual <= expected;
      return actual >= expected;
    }
    case "between": {
      if (type === "number") {
        const actual = toNumber(rawValue);
        const low = toNumber(values[0]);
        const high = toNumber(values[1]);
        if (actual === null || low === null || high === null) return false;
        return actual >= Math.min(low, high) && actual <= Math.max(low, high);
      }
      const actual = toDayNumber(rawValue);
      const low = toDayNumber(values[0]);
      const high = toDayNumber(values[1]);
      if (actual === null || low === null || high === null) return false;
      return actual >= Math.min(low, high) && actual <= Math.max(low, high);
    }
    default:
      return true;
  }
}

// ─── Application ─────────────────────────────────────────────────────────────

export interface FilterFieldResolver<T> {
  type: FilterFieldType;
  /** Pull the comparable value for this field out of a row. */
  getValue: (item: T) => unknown;
}

export function countActiveRules(
  query: FilterQuery,
  resolvers: Record<string, FilterFieldResolver<unknown>>,
): number {
  return query.rules.filter((rule) => {
    const resolver = resolvers[rule.field];
    return resolver ? isRuleComplete(rule, resolver.type) : false;
  }).length;
}

export function isEmptyFilterQuery(query: FilterQuery | null | undefined): boolean {
  return !query || query.rules.length === 0;
}

/**
 * Apply a query to rows already in memory. Rules whose field has no resolver
 * are skipped here — `UnifiedTablePage` reports them as unsupported rather than
 * dropping rows on a comparison it cannot make.
 */
export function applyFilterQuery<T>(
  items: T[],
  query: FilterQuery | null | undefined,
  resolvers: Record<string, FilterFieldResolver<T>>,
): T[] {
  if (isEmptyFilterQuery(query)) return items;
  const applicable = query!.rules.filter((rule) => {
    const resolver = resolvers[rule.field];
    return Boolean(resolver) && isRuleComplete(rule, resolver!.type);
  });
  if (!applicable.length) return items;

  const matches = (item: T, rule: FilterRule): boolean => {
    const resolver = resolvers[rule.field]!;
    return evaluateFilterRule(resolver.getValue(item), rule, resolver.type);
  };

  if (query!.conjunction === "or") {
    return items.filter((item) => applicable.some((rule) => matches(item, rule)));
  }
  return items.filter((item) => applicable.every((rule) => matches(item, rule)));
}

// ─── Legacy bridge ───────────────────────────────────────────────────────────
//
// 240 `type: "select"` filter declarations and every existing bookmarked URL
// use the old one-value-per-field shape. Both directions are supported so the
// new builder is additive: old URLs keep working, and pages that still push a
// single value to their API keep receiving one.

export type LegacyFilterValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

export function filterQueryFromLegacyFilters(
  legacy: Record<string, LegacyFilterValue>,
  fieldTypes: Record<string, FilterFieldType>,
): FilterQuery {
  const rules: FilterRule[] = [];
  for (const [field, value] of Object.entries(legacy)) {
    if (value === undefined || value === null || value === "") continue;
    const type = fieldTypes[field] ?? "text";
    if (Array.isArray(value)) {
      if (!value.length) continue;
      rules.push({ field, operator: "any_of", values: value.map(String) });
      continue;
    }
    rules.push({
      field,
      operator: type === "text" ? "contains" : type === "number" ? "eq" : type === "date" || type === "dateRange" ? "on" : "is",
      values: [String(value)],
    });
  }
  return { conjunction: "and", rules };
}

/**
 * Per-field single-value view of a query — what a one-control-per-field UI (the
 * touch filter sheet) can display. A field carrying a rule the control cannot
 * represent (negation, comparators, multiple values under a single-value
 * operator) is reported as unrepresentable rather than shown as a value it is
 * not, so the sheet can label it instead of lying.
 */
export function singleValueViewOfQuery(query: FilterQuery): {
  values: Record<string, string | string[]>;
  unrepresentableFields: string[];
} {
  const values: Record<string, string | string[]> = {};
  const unrepresentableFields: string[] = [];
  for (const rule of query.rules) {
    if (rule.operator === "is" || rule.operator === "contains" || rule.operator === "eq" || rule.operator === "on") {
      if (rule.values.length === 1 && !(rule.field in values)) {
        values[rule.field] = rule.values[0];
        continue;
      }
    }
    if (rule.operator === "any_of" && !(rule.field in values)) {
      values[rule.field] = rule.values;
      continue;
    }
    unrepresentableFields.push(rule.field);
  }
  return { values, unrepresentableFields };
}

/**
 * Merge a single-field edit from a one-control-per-field UI back into the query,
 * leaving every other field's rules — including rich ones — untouched. Clearing
 * the control removes that field's rules.
 */
export function mergeSingleValueIntoQuery(
  query: FilterQuery,
  field: string,
  value: LegacyFilterValue,
  type: FilterFieldType,
): FilterQuery {
  const withoutField = query.rules.filter((rule) => rule.field !== field);
  const isCleared =
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);
  if (isCleared) return { ...query, rules: withoutField };

  const rule: FilterRule = Array.isArray(value)
    ? { field, operator: "any_of", values: value.map(String) }
    : {
        field,
        operator:
          type === "text"
            ? "contains"
            : type === "number"
              ? "eq"
              : type === "date" || type === "dateRange"
                ? "on"
                : "is",
        values: [String(value)],
      };
  return { ...query, rules: [...withoutField, rule] };
}

/**
 * Emit the legacy `Record<field, value>` a page's existing server call still
 * understands. Only single-value `is`-shaped rules translate; anything richer
 * (negation, multi-value, comparators) is intentionally omitted so the caller
 * cannot mistake a partial pushdown for a complete one — `unpushableFields`
 * names exactly what was left out.
 */
export function legacyFiltersFromFilterQuery(query: FilterQuery): {
  filters: Record<string, string>;
  unpushableFields: string[];
} {
  const filters: Record<string, string> = {};
  const unpushableFields: string[] = [];
  if (query.conjunction === "or" && query.rules.length > 1) {
    return { filters, unpushableFields: query.rules.map((rule) => rule.field) };
  }
  for (const rule of query.rules) {
    const isSingleEquality =
      (rule.operator === "is" || rule.operator === "any_of") &&
      rule.values.length === 1;
    if (isSingleEquality && !(rule.field in filters)) {
      filters[rule.field] = rule.values[0];
    } else {
      unpushableFields.push(rule.field);
    }
  }
  return { filters, unpushableFields };
}
