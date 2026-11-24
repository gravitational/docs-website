import { describe, expect, test } from "@jest/globals";
import {
  ALL_FILTER_ID,
  OTHER_FILTER_ID,
  countIntegrationsByFilter,
  filterIntegrations,
  matchesFilter,
  matchesQuery,
} from "./filterIntegrations";

const filters = [
  { name: "Users & Login", id: "users-login" },
  { name: "Databases", id: "databases" },
  { name: "Observability", id: "observability" },
];

const integrations = [
  { title: "GitHub", tags: ["users-login"] },
  {
    title: "PostgreSQL",
    description: "Open source RDBMS",
    tags: ["databases"],
  },
  { title: "Amazon RDS", tags: ["databases", "users-login"] },
  { title: "Untagged" },
  { title: "Typo", tags: ["database"] },
];

const titles = (items: { title: string }[]) => items.map((i) => i.title);

describe("matchesQuery", () => {
  test.each([
    ["", "GitHub", true],
    ["   ", "GitHub", true],
    ["git", "GitHub", true],
    ["  hub  ", "GitHub", true],
    ["gitlab", "GitHub", false],
  ])("query %a against %b is %c", (query, title, expected) => {
    expect(matchesQuery({ title }, query)).toBe(expected);
  });

  test("matches the description", () => {
    expect(matchesQuery(integrations[1], "rdbms")).toBe(true);
  });
});

describe("matchesFilter", () => {
  test("every integration matches the all filter", () => {
    expect(
      integrations.every((i) => matchesFilter(i, ALL_FILTER_ID, filters)),
    ).toBe(true);
  });

  test("matches integrations tagged with the filter", () => {
    expect(matchesFilter(integrations[2], "users-login", filters)).toBe(true);
    expect(matchesFilter(integrations[1], "users-login", filters)).toBe(false);
    expect(matchesFilter(integrations[3], "users-login", filters)).toBe(false);
  });

  test("the other filter matches integrations outside the filters", () => {
    expect(
      integrations
        .filter((i) => matchesFilter(i, OTHER_FILTER_ID, filters))
        .map((i) => i.title),
    ).toEqual(["Untagged", "Typo"]);
  });
});

describe("filterIntegrations", () => {
  test("returns all integrations by default", () => {
    expect(filterIntegrations(integrations, {})).toEqual(integrations);
  });

  test("filters by search query", () => {
    expect(titles(filterIntegrations(integrations, { query: "sql" }))).toEqual([
      "PostgreSQL",
    ]);
  });

  test("filters by tag, keeping the original order", () => {
    expect(
      titles(
        filterIntegrations(integrations, { filterId: "databases", filters }),
      ),
    ).toEqual(["PostgreSQL", "Amazon RDS"]);
  });

  test("combines the filter and the search query", () => {
    expect(
      titles(
        filterIntegrations(integrations, {
          filterId: "users-login",
          query: "amazon",
          filters,
        }),
      ),
    ).toEqual(["Amazon RDS"]);
  });

  test("filters by the other filter", () => {
    expect(
      titles(
        filterIntegrations(integrations, {
          filterId: OTHER_FILTER_ID,
          filters,
        }),
      ),
    ).toEqual(["Untagged", "Typo"]);
  });

  test("returns nothing for a filter without integrations", () => {
    expect(
      filterIntegrations(integrations, { filterId: "observability", filters }),
    ).toEqual([]);
  });
});

describe("countIntegrationsByFilter", () => {
  test("counts integrations per filter, adds other and omits empty filters", () => {
    expect(countIntegrationsByFilter(integrations, filters)).toEqual([
      { name: "Users & Login", id: "users-login", count: 2 },
      { name: "Databases", id: "databases", count: 2 },
      { name: "Other", id: OTHER_FILTER_ID, count: 2 },
    ]);
  });

  test("counts only integrations matching the search query", () => {
    expect(countIntegrationsByFilter(integrations, filters, "amazon")).toEqual([
      { name: "Users & Login", id: "users-login", count: 1 },
      { name: "Databases", id: "databases", count: 1 },
      { name: "Other", id: OTHER_FILTER_ID, count: 0 },
    ]);
  });

  test("omits other when every integration belongs to a filter", () => {
    expect(
      countIntegrationsByFilter(integrations.slice(0, 3), filters).map(
        (f) => f.id,
      ),
    ).toEqual(["users-login", "databases"]);
  });

  test("returns nothing without filters", () => {
    expect(countIntegrationsByFilter(integrations, [])).toEqual([]);
  });
});
