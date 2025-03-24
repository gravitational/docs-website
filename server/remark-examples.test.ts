import { describe, expect, test } from "@jest/globals";

import { VFile, VFileOptions } from "vfile";
import { readFileSync } from "fs";
import { resolve } from "path";
import { remark } from "remark";
import mdx from "remark-mdx";
import remarkExamples from "../server/remark-examples";

const transformer = (vfileOptions: VFileOptions) => {
  const file: VFile = new VFile(vfileOptions);

  return remark()
    .use(mdx as any)
    .use(remarkExamples as any)
    .processSync(file as any);
};

describe("server/remark-examples", () => {
  interface testCase {
    description: string;
    input: string;
    expected: string;
  }

  const testCases: Array<testCase> = [];

  test.each(testCases)("$description", (tc) => {
    const result = transformer({
      value,
      path: "/content/4.0/docs/pages/filename.mdx",
    }).toString();

    expect(result).toEqual(tc.expected);
  });
});
