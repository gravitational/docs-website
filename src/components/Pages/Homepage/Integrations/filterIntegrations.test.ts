import { describe, expect, test } from "@jest/globals";
import {
  ALL_FILTER_ID,
  groupIntegrations,
  matchesQuery,
  searchIntegrations,
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
];

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

describe("searchIntegrations", () => {
  test("returns all integrations for an empty query", () => {
    expect(searchIntegrations(integrations, "")).toEqual(integrations);
  });

  test("returns only the matching integrations", () => {
    expect(searchIntegrations(integrations, "sql").map((i) => i.title)).toEqual(
      ["PostgreSQL"],
    );
  });
});

describe("groupIntegrations", () => {
  test("groups by filter order and omits empty groups", () => {
    const groups = groupIntegrations(integrations, filters, ALL_FILTER_ID);
    expect(
      groups.map((g) => [g.id, g.integrations.map((i) => i.title)]),
    ).toEqual([
      ["users-login", ["GitHub", "Amazon RDS"]],
      ["databases", ["PostgreSQL", "Amazon RDS"]],
    ]);
  });

  test("defaults to all filters", () => {
    expect(groupIntegrations(integrations, filters)).toHaveLength(2);
  });

  test("returns only the selected group", () => {
    const groups = groupIntegrations(integrations, filters, "databases");
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("Databases");
    expect(groups[0].integrations.map((i) => i.title)).toEqual([
      "PostgreSQL",
      "Amazon RDS",
    ]);
  });

  test("returns nothing when the selected group has no integrations", () => {
    expect(groupIntegrations(integrations, filters, "observability")).toEqual(
      [],
    );
  });
});
