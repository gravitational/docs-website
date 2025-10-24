import { describe, expect, test } from "@jest/globals";
import { validateFrontmatter, Frontmatter } from "./validate-frontmatter";

describe("validateFrontmatter", () => {
  const allowedFields = ["title", "description", "tags"];

  interface testCase {
    description: string;
    input: Frontmatter;
    errorRegExpPattern: string;
  }

  const testCases: Array<testCase> = [
    {
      description: "all fields present",
      input: {
        title: "My page",
        description: "Description for my page",
        tags: ["one", "two", "three"],
      },
      errorRegExpPattern: "",
    },
    {
      description: "no fields present",
      input: {},
      errorRegExpPattern: "",
    },
    {
      description: "missing field",
      input: {
        title: "My page",
        description: "Description for my page",
      },
      errorRegExpPattern: "",
    },
    {
      description: "one extra field",
      input: {
        title: "My page",
        description: "Description for my page",
        labels: ["one", "two", "three"],
      },
      errorRegExpPattern: `labels`,
    },
    // TODO: two extra fields (include both in error)
  ];

  test.each(testCases)("$description", (tc) => {
    if (tc.errorRegExpPattern == "") {
      expect(() => {
        validateFrontmatter(tc.input, allowedFields);
      }).not.toThrow();
    } else {
      expect(() => {
        validateFrontmatter(tc.input, allowedFields);
      }).toThrow(new RegExp(tc.errorRegExpPattern));
    }
  });
});
