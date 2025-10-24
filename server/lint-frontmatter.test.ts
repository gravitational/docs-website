import { describe, expect, test } from "@jest/globals";
import { remarkLintFrontmatter } from "./lint-frontmatter";
import { VFile } from "vfile";
import { remark } from "remark";
import mdx from "remark-mdx";
import remarkFrontmatter from "remark-frontmatter";

const getReasons = (value: string) => {
  return (
    remark()
      .use(mdx as any)
      // remark-frontmatter is a requirement for using this plugin
      .use(remarkFrontmatter as any)
      .use(remarkLintFrontmatter as any, {
        allowedFields: ["title", "description", "tags"],
      })
      .processSync(new VFile({ value, path: "mypath.mdx" }) as any)
      .messages.map((m) => m.reason)
  );
};

describe("server/lint-frontmatter", () => {
  interface testCase {
    description: string;
    input: string;
    expected: Array<string>;
  }

  const testCases: Array<testCase> = [
    {
      description: "all fields present",
      input: `---
title: "My page"
description: "Description for my page"
tags: ["one", "two", "three"]
---

This is a page.`,
      expected: [],
    },
    {
      description: "no fields present",
      input: `---
---

This is a page.`,
      expected: [],
    },
    {
      description: "missing field",
      input: `---
title: "My page"
description: "Description for my page"
---

This is a page.`,
      expected: [],
    },
    {
      description: "one extra field",
      input: `---
title: "My page"
description: "Description for my page"
labels: ["one", "two", "three"]
---
This is a page.`,
      expected: ["page frontmatter has unrecognized fields: labels"],
    },
    {
      description: "two extra fields",
      input: `---
title: "My page"
descrption: "Description for my page"
labels: ["one", "two", "three"]
---

This is a page.`,
      expected: [
        "page frontmatter has unrecognized fields: descrption, labels",
      ],
    },
    {
      description: "invalid frontmatter yaml",
      input: `---
title: "My page",
labels: ["one", "two", "three"]
---

This is a page.`,
      expected: [
        `page has invalid YAML in frontmatter: Unexpected scalar at node end at line 1, column 17:

title: \"My page\",
                ^
`,
      ],
    },
    {
      description: "no frontmatter",
      input: `This is a page.`,
      expected: [
        'the page must begin with a YAML frontmatter document surrounded by "---" separators',
      ],
    },
  ];

  test.each(testCases)("$description", (tc) => {
    expect(getReasons(tc.input)).toEqual(tc.expected);
  });
});
