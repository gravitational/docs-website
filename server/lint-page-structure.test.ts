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

describe("linting heading usage", () => {
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

  describe("linting the absence of a section intro paragraph", () => {
    interface testCase {
      description: string;
      input: string;
      expected: Array<string>;
    }

    const testCases: Array<testCase> = [
      {
        description: `missing section intro paragraph`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an intro.

## Section

### Subsection

Here's some text.
`,
        expected: [
          `This guide is missing a paragraph to introduce the section "Subsection". Explain the section with an introduction or consider removing this heading and promoting its content. Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.`,
        ],
      },
      {
        description: `expected section intro paragraph`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an intro.

## Section

Here is a section intro.

### Subsection

Here's some text.
`,
        expected: [],
      },
{
        description: `at multiple levels`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an intro.

## Section

### Subsection

Here's some text.

### Another subsection

#### An H4 Section

Here's more text.
`,
        expected: [
          `This guide is missing a paragraph to introduce the section "Subsection". Explain the section with an introduction or consider removing this heading and promoting its content. Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.`,
          `This guide is missing a paragraph to introduce the section "An H4 Section". Explain the section with an introduction or consider removing this heading and promoting its content. Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.`
        ],
      },
    ];

    test.each(testCases)("$description", (tc) => {
      expect(getReasons(tc.input)).toEqual(tc.expected);
    });
  });

  describe("linting the absence of a section intro paragraph as a child of a jsx component", () => {
    interface testCase {
      description: string;
      input: string;
      expected: Array<string>;
    }

    const testCases: Array<testCase> = [
      {
        description: `missing section intro paragraph in jsx component`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
template: landing-page
---
import Hero from '@site/src/components/Hero';

<Hero
  title="Docs Page"
>

This is an intro.

## Section

### Subsection

Some text.

</Hero>

`,
        expected: [
          `This guide is missing a paragraph to introduce the section "Section". Explain the section with an introduction or consider removing this heading and promoting its content. Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.`,
        ],
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
