import { describe, expect, test } from "@jest/globals";
import { VFile, VFileOptions } from "vfile";
import { remark } from "remark";
import mdx from "remark-mdx";
import remarkExamples from "./remark-examples";

const transformer = (vfileOptions: VFileOptions) => {
  const file: VFile = new VFile(vfileOptions);

  return remark()
    .use(mdx as any)
    .use(remarkExamples as any, "15.x")
    .processSync(file as any);
};

describe("server/remark-examples", () => {
  interface testCase {
    description: string;
    input: string;
    expected: string;
  }

  const testCases: Array<testCase> = [
    {
      description: "import statement at the beginning of the file",
      input: `---
title: My page
description: My page
---
      import CodeExample from "@examples/access-plugin-minimal/config.go

This is a paragraph.`,
      expected: `---
title: My page
description: My page
---

import CodeExample from "!!raw-loader!@site/content/15.x/examples/access-plugin-minimal/config.go/access-plugin-minimal/config.go

This is a paragraph.`,
    },
  ];

  test.each(testCases)("$description", (tc) => {
    const result = transformer({
      value: tc.input,
      path: "/content/4.0/docs/pages/filename.mdx",
    }).toString();

    expect(result).toEqual(tc.expected);
  });
});
