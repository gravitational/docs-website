import { describe, expect, test } from "@jest/globals";
import { remarkLintTokenCount } from "./lint-token-count";
import { remark } from "remark";
import mdx from "remark-mdx";

const getReasons = (value: string) => {
  return remark()
    .use(mdx as any)
    .use(remarkLintTokenCount as any)
    .processSync(value)
    .messages.map((m) => m.reason);
};

describe("server/lint-token-count", () => {
  interface testCase {
    name: string;
    content: string;
    expected: Array<string>;
  }

  const testCases: Array<testCase> = [
    {
      name: "should warn when token count exceeds limit",
      content: "tokens".repeat(30001),
      expected: [
        "This page has an estimated token count of 30001, which exceeds the limit of 30000. Consider splitting the page into smaller sections. Disable this warning by adding {/* lint ignore token-count remark-lint */} in the end of the file.",
      ],
    },
    {
      name: "should not warn when token count is within limit",
      content: "tokens".repeat(1000),
      expected: [],
    },
  ];

  test.each(testCases)("$name", (tc) => {
    expect(getReasons(tc.content)).toEqual(tc.expected);
  });
});
