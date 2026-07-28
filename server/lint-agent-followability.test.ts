import { describe, expect, test } from "@jest/globals";
import { VFile } from "vfile";
import { remark } from "remark";
import mdx from "remark-mdx";
import remarkFrontmatter from "remark-frontmatter";
import { remarkLintAgentFollowability } from "./lint-agent-followability";

const getReasons = (value: string) => {
  return remark()
    .use(mdx as any)
    .use(remarkLintAgentFollowability as any)
    .processSync(new VFile({ value, path: "mypath.mdx" }) as any)
    .messages.map((m) => m.reason);
};

describe("server/lint-agent-followability", () => {
  describe('linting "How it works" H2s in how-to guides', () => {
    interface testCase {
      description: string;
      input: string;
      expected: Array<string>;
    }

    const testCases: Array<testCase> = [
      {
        description: `no h2 heading with a step`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction.

## Prerequisites

- A Teleport cluster

## Installation

This step shows you how to install Teleport.
`,
        expected: [],
      },
      {
        description: `one step h2 with no command`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction.

## Prerequisites

- A Teleport cluster

## Step 1/1. Use your browser to install Teleport

This step shows you how to install Teleport.
`,
        expected: [
          'In a how-to guide, each H2 beginning "Step " must include at least one command so CLI users and AI agents can follow it. Step 1/1 has no command. Disable this warning by adding {/* lint ignore agent-followability remark-lint */} before this line.',
        ],
      },
      {
        description: `one step h2 with command`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction.

## Prerequisites

- A Teleport cluster

## Step 1/1. Use your browser to install Teleport

Run the following command:

\`\`\`code
$ curl example.com | bash
\`\`\`
`,
        expected: [],
      },
      {
        description: `one step h2 with command in a tab item`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction.

## Prerequisites

- A Teleport cluster

## Step 1/1. Use your browser to install Teleport

Run the following command depending on your system:

<Tabs>
<TabItem label="Linux">

\`\`\`code
$ curl example.com/linux-install | bash
\`\`\`

</TabItem>
<TabItem label="Windows">

\`\`\`code
$ curl example.com/windows-install | bash
\`\`\`

</TabItem>
</Tabs>
`,
        expected: [],
      },
      {
        description: `one step h2 with command and a step h3 with no command`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction.

## Prerequisites

- A Teleport cluster

## Step 1/1. Use your browser to install Teleport

Complete the following sub-steps.

### Step 1/2

Run the following command:

\`\`\`code
$ curl example.com | bash
\`\`\`

### Step 2/2

Open a browser and make sure it works.
`,
        expected: [],
      },
      {
        description: `no command in second of three steps`,
        input: `---
title: Docs Page
description: Provides instructions about a feature.
---

This is an introduction.

## Prerequisites

- A Teleport cluster

## Step 1/3. Run the installation command

Run the following command:

\`\`\`code
$ curl example.com | bash
\`\`\`

## Step 2/3. Check that installation succeeded

Run the \`version\` command to make sure you did it.

## Step 3/3. Run a command

\`\`\`code
$ mycommand help
\`\`\`
`,
        expected: [
          'In a how-to guide, each H2 beginning "Step " must include at least one command so CLI users and AI agents can follow it. Step 2/3 has no command. Disable this warning by adding {/* lint ignore agent-followability remark-lint */} before this line.',
        ],
      },
    ];

    test.each(testCases)("$description", (tc) => {
      expect(getReasons(tc.input)).toEqual(tc.expected);
    });
  });
});
