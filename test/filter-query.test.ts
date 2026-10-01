import { describe, expect, it } from "vitest";

import {
  applyFilterQuery,
  decodeFilterQuery,
  encodeFilterQuery,
  filterQueryFromLegacyFilters,
  legacyFiltersFromFilterQuery,
  type FilterFieldResolver,
  type FilterQuery,
} from "../src/lib/filter-query";

interface Row {
  status: string;
  amount: number;
  company: string | null;
}

const rows: Row[] = [
  { status: "draft", amount: 100, company: "Acme" },
  { status: "out for signature", amount: 500, company: "Bolt" },
  { status: "approved", amount: 900, company: null },
];

const resolvers: Record<string, FilterFieldResolver<Row>> = {
  status: { type: "select", getValue: (row) => row.status },
  amount: { type: "number", getValue: (row) => row.amount },
  company: { type: "text", getValue: (row) => row.company },
};

describe("shared filter query contract", () => {
  it("retains the readable URL encoding used in saved table views", () => {
    const query: FilterQuery = {
      conjunction: "or",
      rules: [
        { field: "status", operator: "any_of", values: ["Out for Signature", "Approved"] },
        { field: "company", operator: "contains", values: ["A;B|C:"] },
      ],
    };
    expect(encodeFilterQuery(query)).toBe("or;status:any_of:Out%20for%20Signature|Approved;company:contains:A%3BB%7CC%3A");
    expect(decodeFilterQuery(encodeFilterQuery(query))).toEqual(query);
  });

  it("retains all-or-any and case-insensitive comparisons", () => {
    const query: FilterQuery = {
      conjunction: "and",
      rules: [
        { field: "status", operator: "any_of", values: ["Out for Signature", "Approved"] },
        { field: "amount", operator: "gte", values: ["500"] },
      ],
    };
    expect(applyFilterQuery(rows, query, resolvers)).toEqual(rows.slice(1));
    expect(applyFilterQuery(rows, {
      conjunction: "or",
      rules: [
        { field: "status", operator: "is", values: ["Draft"] },
        { field: "amount", operator: "gte", values: ["500"] },
      ],
    }, resolvers)).toEqual(rows);
  });

  it("keeps legacy view conversion and unrepresentable-rule detection", () => {
    const query = filterQueryFromLegacyFilters(
      { status: "approved", amount: 900 },
      { status: "select", amount: "number" },
    );
    expect(query.rules).toEqual([
      { field: "status", operator: "is", values: ["approved"] },
      { field: "amount", operator: "eq", values: ["900"] },
    ]);
    expect(legacyFiltersFromFilterQuery(query)).toEqual({
      filters: { status: "approved" },
      unpushableFields: ["amount"],
    });
  });

  it("does not apply malformed URL filters", () => {
    expect(decodeFilterQuery("and;status:made_up:draft").rules).toEqual([]);
    expect(applyFilterQuery(rows, decodeFilterQuery("and;status:made_up:draft"), resolvers)).toEqual(rows);
  });
});
