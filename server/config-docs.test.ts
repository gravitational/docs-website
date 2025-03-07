import { describe, expect, test } from "@jest/globals";
import {
  makeDocusaurusNavigationCategory,
  NavigationCategory,
  DocusaurusCategory,
} from "./config-docs";

describe("makeDocusaurusNavigationCategory", () => {
  interface testCase {
    description: string;
    version: string;
    category: NavigationCategory;
    expected: DocusaurusCategory;
  }

  const testCases = [];

  test.each(testCases)("$description", (c) => {
    expect(makeDocusaurusNavigationCategory(c.category, c.version)).toEqual(
      c.expected
    );
  });
});
