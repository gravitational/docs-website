import { describe, expect, test } from "@jest/globals";
import { VFile } from "vfile";
import { remark } from "remark";
import mdx from "remark-mdx";
import remarkFrontmatter from "remark-frontmatter";
import { remarkLintNoHumanInteractionSteps } from "./lint-no-human-interaction-steps";

const getReasons = (value: string) => {
  return remark()
    .use(mdx as any)
    .use(remarkFrontmatter as any)
    .use(remarkLintNoHumanInteractionSteps as any)
    .processSync(new VFile({ value, path: "mypath.mdx" }) as any)
    .messages.map((m) => m.reason);
};

const messageSuffix = `Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.`;

describe("server/lint-no-human-interaction-steps", () => {
  interface testCase {
    description: string;
    input: string;
    expected: Array<string>;
  }

  describe("steps with shell commands are not flagged", () => {
    const testCases: Array<testCase> = [
      {
        description: "step with a direct shell command",
        input: `---
title: My Guide
---

Introduction.

## Step 1/1. Install Teleport

\`\`\`code
$ tsh login --proxy=example.teleport.sh
\`\`\`
`,
        expected: [],
      },
      {
        description: "step with a shell command inside a Tabs component",
        input: `---
title: My Guide
---

Introduction.

## Step 1/1. Install Teleport

<Tabs>
<TabItem label="Linux">

\`\`\`code
$ apt install teleport
\`\`\`

</TabItem>
<TabItem label="macOS">

\`\`\`code
$ brew install teleport
\`\`\`

</TabItem>
</Tabs>
`,
        expected: [],
      },
      {
        description: "step with a mix of UI instructions and a shell command",
        input: `---
title: My Guide
---

Introduction.

## Step 1/1. Set up the connector

1. In the Teleport Web UI, navigate to **Add New** -> **Integration**.
2. Select the tile for your identity provider.

You can verify the connector with the following command:

\`\`\`code
$ tctl get saml/my-connector
\`\`\`
`,
        expected: [],
      },
    ];

    test.each(testCases)("$description", (tc) => {
      expect(getReasons(tc.input)).toEqual(tc.expected);
    });
  });

  describe("steps with automatable non-shell code are not flagged", () => {
    const testCases: Array<testCase> = [
      {
        description: "step with a sql code block",
        input: `---
title: My Guide
---

Introduction.

## Step 1/1. Configure the database admin user

\`\`\`sql
CREATE USER "teleport-admin" login createrole;
GRANT rds_iam TO "teleport-admin" WITH ADMIN OPTION;
\`\`\`
`,
        expected: [],
      },
      {
        description: "step with a diff code block",
        input: `---
title: My Guide
---

Introduction.

## Step 1/1. Update the join token roles

Edit the \`spec.roles\` field in your token resource manifest:

\`\`\`diff
-   roles: [Kube]
+   roles: [Kube,App]
\`\`\`
`,
        expected: [],
      },
      {
        description: "step with an ini config block",
        input: `---
title: My Guide
---

Introduction.

## Step 1/1. Configure JWT authentication in Grafana

Add an \`auth.jwt\` section in Grafana's main configuration file:

\`\`\`ini
[auth.jwt]
enabled = true
header_name = Authorization
jwk_set_url = https://teleport.example.com/.well-known/jwks.json
\`\`\`
`,
        expected: [],
      },
      {
        description: "step with a toml config block",
        input: `---
title: My Guide
---

Introduction.

## Step 1/1. Configure the agent

Edit your agent configuration:

\`\`\`toml
[agent]
token = "my-token"
server = "teleport.example.com:443"
\`\`\`
`,
        expected: [],
      },
      {
        description: "step with an hcl config block",
        input: `---
title: My Guide
---

Introduction.

## Step 1/1. Configure the Terraform provider

\`\`\`hcl
provider "teleport" {
  addr = "teleport.example.com:443"
}
\`\`\`
`,
        expected: [],
      },
      {
        description: "step with a file-path-commented config block",
        input: `---
title: My Guide
---

Introduction.

## Step 1/1. Configure your services

Configure your Teleport process with a custom \`teleport.yaml\` file:

\`\`\`yaml
# /etc/teleport.yaml
version: v3
teleport:
  join_params:
    token_name: my-token
    method: oracle
\`\`\`
`,
        expected: [],
      },
    ];

    test.each(testCases)("$description", (tc) => {
      expect(getReasons(tc.input)).toEqual(tc.expected);
    });
  });

  describe("steps without shell commands are flagged", () => {
    const testCases: Array<testCase> = [
      {
        description: "step with no code fences at all",
        input: `---
title: My Guide
---

Introduction.

## Step 1/1. Assign user groups

1. Go to the **Assignments** tab and click the **Assign** dropdown.
2. Select "Assign to Groups" and search for the groups you want.
3. Click **Assign** next to each group and click **Done**.
`,
        expected: [
          `Step "Step 1/1. Assign user groups" contains no shell commands (lines starting with "$ "). Steps that contain only UI instructions require human interaction and cannot be followed by an automated agent. Consider adding a CLI-based alternative. ${messageSuffix}`,
        ],
      },
      {
        description:
          "step with code fences that contain only values to paste into a UI form (the Step 2 case)",
        input: `---
title: My Guide
---

Introduction.

## Step 1/1. Configure the SAML app

1. In the Okta Console, go to **Applications** and click **Create App Integration**.
2. In the **Single sign on URL** field, enter:

   \`\`\`
   https://example.teleport.sh/v1/webapi/saml/acs/okta
   \`\`\`

3. Click **Save**.
`,
        expected: [
          `Step "Step 1/1. Configure the SAML app" contains no shell commands (lines starting with "$ "). Steps that contain only UI instructions require human interaction and cannot be followed by an automated agent. Consider adding a CLI-based alternative. ${messageSuffix}`,
        ],
      },
    ];

    test.each(testCases)("$description", (tc) => {
      expect(getReasons(tc.input)).toEqual(tc.expected);
    });
  });

  describe("non-step sections are not flagged", () => {
    const testCases: Array<testCase> = [
      {
        description: "prerequisites section with no code",
        input: `---
title: My Guide
---

Introduction.

## Prerequisites

- A Teleport cluster
- An Okta organization

## Step 1/1. Install Teleport

\`\`\`code
$ tsh login
\`\`\`
`,
        expected: [],
      },
      {
        description: "next steps section with no code",
        input: `---
title: My Guide
---

Introduction.

## Step 1/1. Install Teleport

\`\`\`code
$ tsh login
\`\`\`

## Next steps

- See [the reference guide](./reference.mdx) for more information.
`,
        expected: [],
      },
    ];

    test.each(testCases)("$description", (tc) => {
      expect(getReasons(tc.input)).toEqual(tc.expected);
    });
  });

  describe("guides with multiple steps report each offending step", () => {
    const testCases: Array<testCase> = [
      {
        description: "two human-only steps out of four",
        input: `---
title: My Guide
---

Introduction.

## Step 1/4. Choose a connector

1. Visit the Teleport Web UI and navigate to **Add New** -> **Integration**.
2. Select the **Okta** tile.

You can inspect an existing connector:

\`\`\`code
$ tctl get saml/okta
\`\`\`

## Step 2/4. Create and configure an Okta app

1. In Okta Console, go to **Applications** and click **Browse App Catalog**.
2. In the **Teleport cluster domain** field, enter your proxy domain:

   \`\`\`
   example.teleport.sh
   \`\`\`

3. Click **Done**.

## Step 3/4. Assign user groups

1. Go to the **Assignments** tab and click the **Assign** dropdown.
2. Click **Assign** next to each group and click **Done**.

## Step 4/4. Verify the integration

\`\`\`code
$ tsh login --proxy=example.teleport.sh --auth=okta
\`\`\`
`,
        expected: [
          `Step "Step 2/4. Create and configure an Okta app" contains no shell commands (lines starting with "$ "). Steps that contain only UI instructions require human interaction and cannot be followed by an automated agent. Consider adding a CLI-based alternative. ${messageSuffix}`,
          `Step "Step 3/4. Assign user groups" contains no shell commands (lines starting with "$ "). Steps that contain only UI instructions require human interaction and cannot be followed by an automated agent. Consider adding a CLI-based alternative. ${messageSuffix}`,
        ],
      },
    ];

    test.each(testCases)("$description", (tc) => {
      expect(getReasons(tc.input)).toEqual(tc.expected);
    });
  });
});
