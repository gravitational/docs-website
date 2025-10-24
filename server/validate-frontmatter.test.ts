import { describe, expect, test } from "@jest/globals";
import { validateFrontmatter, Frontmatter } from "./validate-frontmatter";

describe("validateFrontmatter", () => {
  interface testCase {
    description: string;
    input: Frontmatter;
    errorSubstring: string;
  }

  const testCases: Array<testCase> = {};

  test.each(testCases)("$description", (tc) => {
    if (tc.errorSubstring == "") {
      expect(() => {
        validateFrontmatter(tc.input).not.toThrow();
      });
    }

    expect(() => {
      validateFrontmatter(tc.input).toThrow(tc.errorSubstring);
    });
  });
});
