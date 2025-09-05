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
});
