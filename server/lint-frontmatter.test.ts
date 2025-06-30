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
labels:
  - how-to
---
`,
      expected: [
        'missing item under the "labels" frontmatter field for product - must include one of: identity-governance, identity-security, mwi, zero-trust, platform-wide',
      ],
    },
    {
      description: "no type",
      input: `---
title: "My page"
description: "Provides documentation."
labels: 
 - identity-governance
---
`,
      expected: [
        'missing item under the "labels" frontmatter field for guide type - must include one of: how-to, conceptual, get-started, reference, faq, other',
      ],
    },
    {
      description: "valid case",
      input: `---
title: "My page"
description: "Provides documentation."
labels:
  - mwi
  - how-to
  - arbitrary
---
`,
      expected: [],
    },
    {
      description: "multiple products",
      input: `---
title: "My page"
description: "Provides documentation."
labels:
  - how-to
  - identity-security
  - identity-governance
---
`,
      expected: [
        'too many "labels" frontmatter values for product - must include one of: identity-governance, identity-security, mwi, zero-trust, platform-wide',
      ],
    },
    {
      description: "multiple guide types",
      input: `---
title: "My page"
description: "Provides documentation."
labels:
  - how-to
  - reference
  - identity-security
---
`,
      expected: [
        'too many "labels" frontmatter values for guide type - must include one of: how-to, conceptual, get-started, reference, faq, other',
      ],
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
    {
      description: "no labels field",
      input: `---
title: "My page"
description: "Provides documentation."
---
`,
      expected: [
        'every docs page must include a frontmatter field called "labels"',
      ],
    },
    {
      description: "labels field is not a list",
      input: `---
title: "My page"
description: "Provides documentation."
labels: label
---
`,
      expected: [
        'the "labels" frontmatter field must be a list with at least one value',
      ],
    },
  ];

  test.each(testCases)("$description", (tc) => {
    expect(getReasons(tc.input)).toEqual(tc.expected);
  });
});
