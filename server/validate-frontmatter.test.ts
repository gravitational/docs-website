import { describe, expect, test } from "@jest/globals";
import { validateFrontmatter, Frontmatter } from "./validate-frontmatter";

describe("validateFrontmatter", () => {
  const allowedFields = ["title", "description", "tags"];

  interface testCase {
    description: string;
    input: Frontmatter;
    errorSubstring: string;
  }

  const testCases: Array<testCase> = {};

  test.each(testCases)("$description", (tc) => {
    if (tc.errorSubstring == "") {
      expect(() => {
        validateFrontmatter(tc.input, allowedFields).not.toThrow();
      });
    }

    expect(() => {
      validateFrontmatter(tc.input, allowedFields).toThrow(tc.errorSubstring);
    });
  });
});
