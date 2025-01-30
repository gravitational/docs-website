import { describe, expect, test } from "@jest/globals";
import { retargetHref } from "./asset-path-helpers";

describe("server/asset-path-helpers: retargetHref", () => {
  interface testCase {
    description: string;
    originalPath: string;
    partialPath: string;
    includerPath: string;
    contentRootDir: string;
    expected: string;
  }

  const testCases: Array<testCase> = [
    {
      description: "href in same directory as including page",
      originalPath: "../../admin-guides/database-access/introduction.mdx",
      includerPath: "/docs/pages/admin-guides/database-access/sql-server.mdx",
      partialPath: "/docs/pages/includes/database-access/standard-intro.mdx",
      contentRootDir: "/",
      expected: "../../admin-guides/database-access/introduction.mdx",
    },
  ];

  test.each(testCases)("$description", (tc) => {
    const actual = retargetHref(
      tc.originalPath,
      tc.includerPath,
      tc.partialPath,
      tc.contentRootDir
    );
    expect(actual).toEqual(tc.expected);
  });
});
