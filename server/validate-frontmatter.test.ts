import { describe, expect, test } from "@jest/globals";
import { validateFrontmatter, Frontmatter } from "./validate-frontmatter";

describe("validateFrontmatter", () => {
  const allowedFields = ["title", "description", "tags"];

  interface testCase {
    description: string;
    input: Frontmatter;
    errorRegExp: RegExp;
  }

  const testCases: Array<testCase> = {
    // TODO: all fields
    // TODO: no fields (okay)
    // TODO: missing fields (okay)
    // TODO: extra fields (include both in error)
  };

  test.each(testCases)("$description", (tc) => {
    if (tc.errorRegExp == "") {
      expect(() => {
        validateFrontmatter(tc.input, allowedFields).not.toThrow();
      });
    }

    expect(() => {
      validateFrontmatter(tc.input, allowedFields).toThrow(tc.errorRegExp);
    });
  });
});
