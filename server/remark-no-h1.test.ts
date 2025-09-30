import { describe, expect, test } from "@jest/globals";
import { VFile, VFileOptions } from "vfile";
import { remark } from "remark";
import mdx from "remark-mdx";
import remarkNoH1 from "./remark-no-h1";
import remarkFrontmatter from "remark-frontmatter";

const transformer = (vfileOptions: VFileOptions) => {
  const file: VFile = new VFile(vfileOptions);

  return remark()
    .use(mdx as any)
    .use(remarkFrontmatter) // Test cases use frontmatter
    .use(remarkNoH1 as any)
    .processSync(file as any);
};

describe("server/remark-no-h1", () => {
  interface testCase {
    description: string;
    input: string;
    expected: string;
    path: string;
  }

  const testCases: Array<testCase> = [
    {
      description: "first element is an H1",
      input: `---
title: My page
description: My page
---

# This is an H1

This is a paragraph.`,
      expected: `---
title: My page
description: My page
---

This is a paragraph.
`,
      path: "docs/mypage.mdx",
    },
      {
      description: "paragraph before H1",
      input: `---
title: My page
description: My page
---

This is the first paragraph.

# This is an H1

This is a paragraph.`,
      expected: `---
title: My page
description: My page
---

This is the first paragraph.

This is a paragraph.
`,
      path: "docs/mypage.mdx",
    },
      {
      description: "multiple H1s",
      input: `---
title: My page
description: My page
---

# This is an H1

This is a paragraph.

# This is an H1

`,
      expected: `---
title: My page
description: My page
---

This is a paragraph.
`,
      path: "docs/mypage.mdx",
    }  ];

  test.each(testCases)("$description", (tc) => {
    const result = transformer({
      value: tc.input,
      path: tc.path,
    }).toString();

    expect(result).toEqual(tc.expected);
  });
});
