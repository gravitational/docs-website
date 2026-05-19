import { describe, expect, test } from "@jest/globals";
import { VFile } from "vfile";
import { remark } from "remark";
import mdx from "remark-mdx";
import remarkFrontmatter from "remark-frontmatter";
import { remarkLintPageStructure } from "./lint-page-structure";

const getReasons = (value: string) => {
  return (
    remark()
      .use(mdx as any)
      // remark-frontmatter is a requirement for using this plugin
      .use(remarkFrontmatter as any)
      .use(remarkLintPageStructure as any)
      .processSync(new VFile({ value, path: "mypath.mdx" }) as any)
      .messages.map((m) => m.reason)
  );
};

describe("server/lint-page-structure", () => {
  describe('linting "How it works" H2s in how-to guides', () => {
    interface testCase {
      description: string;
      input: string;
      expected: Array<string>;
    }

    const testCases: Array<testCase> = [
      {
        description: `missing "How it works" section in a how-to guide`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction.

## Prerequisites

- A Teleport cluster

## Step 1/1. Install Teleport

This step shows you how to install Teleport.
`,
        expected: [
          "In a how-to guide, the first H2-level section must be called `## How it works`. Use this section to include 1-3 paragraphs that describe the high-level architecture of the setup shown in the guide. Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.",
        ],
      },
      {
        description: `"How it works" is not the first section`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction.

## Prerequisites

- A Teleport cluster

## How it works

Here is architectural information

## Step 1/1. Install Teleport

This step shows you how to install Teleport.
`,
        expected: [
          "In a how-to guide, the first H2-level section must be called `## How it works`. Use this section to include 1-3 paragraphs that describe the high-level architecture of the setup shown in the guide. Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.",
        ],
      },
      {
        description: `valid "How it works" section in a how-to guide`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction.

## How it works

Here is architectural information.

## Prerequisites

- A Teleport cluster

## Step 1/1. Install Teleport

This step shows you how to install Teleport.
`,
        expected: [],
      },
      {
        description: `missing "How it works" section in a non-how-to guide`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction.

## Prerequisites

- A Teleport cluster

## Concepts

Here's some conceptual information.
`,
        expected: [],
      },
    ];

    test.each(testCases)("$description", (tc) => {
      expect(getReasons(tc.input)).toEqual(tc.expected);
    });
  });

  describe("linting step numbering", () => {
    interface testCase {
      description: string;
      input: string;
      expected: Array<string>;
    }

    const testCases: Array<testCase> = [
      {
        description: "missing steps",
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

Introduction.

## How it works

How it works

## Prerequisites

Some requirements

## Step 1/3.

Step 1 instructions

## Step 3/3.

Step 3 instructions
`,
        expected: [
          'This guide has an incorrect sequence of steps - expecting a section called "## Step 1/2". Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.',
          'This guide has an incorrect sequence of steps - expecting a section called "## Step 2/2". Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.',
        ],
      },
      {
        description: "inconsistent step denominators",
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

Introduction.

## How it works

How it works

## Prerequisites

Some requirements

## Step 1/3.

Step 1 instructions

## Step 2/4.

Step 2 instructions.

## Step 3/3.

Step 3 instructions
`,
        expected: [
          'This guide has an incorrect sequence of steps - expecting a section called "## Step 2/3". Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.',
        ],
      },
      {
        description: "valid step numbering",
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

Introduction.

## How it works

How it works

## Prerequisites

Some requirements

## Step 1/3.

Step 1 instructions

## Step 2/3.

Step 2 instructions.

## Step 3/3.

Step 3 instructions
`,
        expected: [],
      },
    ];

    test.each(testCases)("$description", (tc) => {
      expect(getReasons(tc.input)).toEqual(tc.expected);
    });
  });

  describe("linting the presence of an intro paragraph", () => {
    interface testCase {
      description: string;
      input: string;
      expected: Array<string>;
    }

    const testCases: Array<testCase> = [
      {
        description: `missing intro paragraph`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

## Prerequisites

- A Teleport cluster

## Concepts

Here's some conceptual information.
`,
        expected: [
          "This guide is missing at least one introductory paragraph before the first H2. Use introductory paragraphs to explain the purpose and scope of this guide. Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.",
        ],
      },
      {
        description: `one intro paragraph`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an intro paragraph.

## Prerequisites

- A Teleport cluster

## Concepts

Here's some conceptual information.
`,
        expected: [],
      },
      {
        description: `multiple intro paragraphs`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an intro paragraph.

This is another intro paragraph.

## Prerequisites

- A Teleport cluster

## Concepts

Here's some conceptual information.
`,
        expected: [],
      },
    ];

    test.each(testCases)("$description", (tc) => {
      expect(getReasons(tc.input)).toEqual(tc.expected);
    });
  });

  describe("linting the presence of an intro paragraph as a child of a jsx component", () => {
    interface testCase {
      description: string;
      input: string;
      expected: Array<string>;
    }

    const testCases: Array<testCase> = [
      {
        description: `missing intro paragraph in jsx component`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
template: landing-page
---
import Hero from '@site/src/components/Hero';

<Hero
  title="Docs Page"
>
## Prerequisites

- A Teleport cluster
</Hero>

## Concepts

Here's some conceptual information.
`,
        expected: [
          "This guide is missing at least one introductory paragraph before the first H2. Use introductory paragraphs to explain the purpose and scope of this guide. Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.",
        ],
      },
      {
        description: `one intro paragraph in jsx component`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
template: landing-page
---
import Hero from '@site/src/components/Hero';

<Hero
  title="Docs Page"
>
This is an intro paragraph.

## Prerequisites

- A Teleport cluster
</Hero>

## Concepts

Here's some conceptual information.
`,
        expected: [],
      },
      {
        description: `multiple intro paragraphs in a jsx component`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
template: landing-page
---
import Hero from '@site/src/components/Hero';

<Hero
  title="Docs Page"
>
This is an intro paragraph.

This is another intro paragraph.

## Prerequisites

- A Teleport cluster
</Hero>

## Concepts

Here's some conceptual information.
`,
        expected: [],
      },
    ];

    test.each(testCases)("$description", (tc) => {
      expect(getReasons(tc.input)).toEqual(tc.expected);
    });
  });

  describe("linting outcome statements in guides", () => {
    interface testCase {
      description: string;
      input: string;
      expected: Array<string>;
    }

    const testCases: Array<testCase> = [
      {
        description: "introductory how-to section with no outcome statement",
        input: `---
title: My Page
description: This is a page.
page_type: how-to
---

This is the introduction of this how-to guide.

## Prerequisites

- A computer
`,
        expected: [
          `In a how-to guide, the introductory section must include an outcome statement with one of the following prefixes: "After following this guide, you will", "This guide shows you how to", "In this guide, you will". This must be a concrete objective you expect the reader to have achieved. Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.`,
        ],
      },
      {
        description:
          'no violations with "After following this guide, you will"',
        input: `---
title: My Page
description: This is a page.
page_type: how-to
---

This is the introduction of this how-to guide.

After following this guide, you will have a working implementation of our
product.

## Prerequisites

- A computer
`,
        expected: [],
      },
      {
        description: "outcome statement with code and link in paragraph",
        input: `---
title: My Page
description: This is a page.
page_type: how-to
---

This is the introduction of this how-to guide.

After following this guide, you will have a working implementation of our
product, \`example\`, which you can read about on the [main
site](https://example.com).

## Prerequisites

- A computer
`,
        expected: [],
      },
      {
        description: 'no violations with "This guide shows you how to"',
        input: `---
title: My Page
description: This is a page.
page_type: how-to
---

This is the introduction of this how-to guide.

This guide shows you how to enable our product.

## Prerequisites

- A computer
`,
        expected: [],
      },
      {
        description: 'no violations with "In this guide, you will"',
        input: `---
title: My Page
description: This is a page.
page_type: how-to
---

This is the introduction of this how-to guide.

In this guide, you will enable our product.

## Prerequisites

- A computer
`,
        expected: [],
      },
      {
        description: 'no violations with "In this guide, you will"',
        input: `---
title: My Page
description: This is a page.
page_type: how-to
---

This is the introduction of this how-to guide.

In this guide, you will:
- Install our product.
- Roll it out across your infrastructure.
- Enroll all of the users in your organization.

## Prerequisites

- A computer
`,
        expected: [],
      },
      {
        description: "introductory reference section with no outcome statement",
        input: `---
title: My Page
description: This is a page.
page_type: reference
---

This is the introduction of this guide.

## Supported fields 

`,
        expected: [
          `In a reference page, the introductory section must include an outcome statement with the prefix, "This page lists the", plus the kinds of items that this page provides a reference for. Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.`,
        ],
      },
      {
        description:
          "introductory troubleshooting outcome statement in multiple lines",
        input: `---
title: Troubleshooting Apps
description: This is a page.
page_type: troubleshooting
---

This page describes common issues that you might encounter in managing access to applications
with Teleport and how to work around or resolve them.

## Supported fields

`,
        expected: [],
      },
    ];

    test.each(testCases)("$description", (tc) => {
      expect(getReasons(tc.input)).toEqual(tc.expected);
    });
  });
});

describe("linting improper Var component use", () => {
  interface testCase {
    description: string;
    input: string;
    expected: Array<string>;
  }

  const testCases: Array<testCase> = [
    {
      description: `single instance of a Var in a code block`,
      input: `---
title: Docs Page
description: Provides instructions about a feature.
---
This is an introduction.

\`\`\`code
<Var name="myvar" />
\`\`\`

`,
      expected: [
        'There is only a single instance of the Var named "myvar" on this page. Add another instance, making it explicit that the user can assign the variable. Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.',
      ],
    },
    {
      description: `var in code block with single quotes`,
      input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an intro paragraph.

## Prerequisites

- A Teleport cluster

## Concepts

Here's some conceptual information.
This is an introduction.

\`\`\`code
<Var name='myvar' />
\`\`\`

`,
      expected: [
        'There is only a single instance of the Var named "myvar" on this page. Add another instance, making it explicit that the user can assign the variable. Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.',
      ],
    },
    {
      description: `single instance of a Var in paragraph`,
      input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction, including <Var name="myvar" />.

`,
      expected: [
        'There is only a single instance of the Var named "myvar" on this page. Add another instance, making it explicit that the user can assign the variable. Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.',
      ],
    },
    {
      description: `valid case`,
      input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction, including <Var name="myvar" />.

\`\`\`code
<Var name="myvar" />
\`\`\`

`,
      expected: [],
    },
    {
      description: `multiple violations`,
      input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction, including <Var name="myvar" />.

\`\`\`code
<Var name="othervar" />
\`\`\`

`,
      expected: [
        'There is only a single instance of the Var named "myvar" on this page. Add another instance, making it explicit that the user can assign the variable. Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.',
        'There is only a single instance of the Var named "othervar" on this page. Add another instance, making it explicit that the user can assign the variable. Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.',
      ],
    },
    // The apostrophe can trip up regular expression matching
    {
      description: `valid case with apostrophe`,
      input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction, including <Var name="myvar's" />.

\`\`\`code
<Var name= "myvar's" />
\`\`\`

`,
      expected: [],
    },
    {
      description: `valid case with slash`,
      input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction, including <Var name="arn:aws:iam::(=aws.aws_account_id=):role/teleport-docdb-user" />.

\`\`\`code
<Var name= "arn:aws:iam::(=aws.aws_account_id=):role/teleport-docdb-user" />
\`\`\`

`,
      expected: [],
    },
    {
      description: `valid case with list item`,
      input: `---
title: Docs Page
description: Provides instructions about a feature.
---

Here is a list:
- Item one
- <Var name="Permission IDs"/>

\`\`\`bash
cat > variables.auto.tfvars << EOF
graph_permission_ids    = [<Var name="Permission IDs"/>]
EOF
\`\`\`

`,
      expected: [],
    },
    {
      description: `valid case with inline code`,
      input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction, including \`<Var name="myvar" />\`.

 \`\`\`code
 <Var name="myvar" />
 \`\`\`

 `,
      expected: [],
    },
  ];

  test.each(testCases)("$description", (tc) => {
    expect(getReasons(tc.input)).toEqual(tc.expected);
  });
});
