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
      .use(remarkLintFrontmatter as any)
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
      description: "no product",
      input: `---
title: "My page"
description: "Provides documentation."
type: how-to
---
`,
      expected: ['missing frontmatter field "product"'],
    },
    {
      description: "no type",
      input: `---
title: "My page"
description: "Provides documentation."
product: identity-governance
---
`,
      expected: ['missing frontmatter field "type"'],
    },
    {
      description: "no product or type",
      input: `---
title: "My page"
description: "Provides documentation."
---
`,
      expected: [
        'missing frontmatter field "type"',
        'missing frontmatter field "product"',
      ],
    },
    {
      description: "invalid product",
      input: `---
title: "My page"
description: "Provides documentation."
product: "id-gov"
type: "how-to"
---
`,
      expected: [
        'the "product" frontmatter field must be one of: identity-governance, identity-security, mwi, zero-trust, platform-wide',
      ],
    },
    {
      description: "invalid type",
      input: `---
title: "My page"
description: "Provides documentation."
product: "mwi"
type: "architecture"
---
`,
      expected: [
        'the "type" frontmatter field must be one of: how-to, conceptual, get-started, reference, faq, other',
      ],
    },
    {
      description: "valid case",
      input: `---
title: "My page"
description: "Provides documentation."
product: "mwi"
type: "how-to"
---
`,
      expected: [],
    },
    {
      description: "no frontmatter detected",
      // The frontmatter document starts one line too low
      input: `
---
title: "My page"
description: "Provides documentation."
product: "mwi"
type: "how-to"
---
`,
      expected: [
        `the page must begin with a YAML frontmatter document surrounded by "---" separators`,
      ],
    },
  ];

  test.each(testCases)("$description", (tc) => {
    expect(getReasons(tc.input)).toEqual(tc.expected);
  });
});
