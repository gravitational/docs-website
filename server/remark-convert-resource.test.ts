import { jest, beforeEach, describe, expect, test } from "@jest/globals";
import remarkConvertResource from "../server/remark-convert-resource";
import { VFile, VFileOptions } from "vfile";
import { remark } from "remark";
import mdx from "remark-mdx";
import { spawnSync } from "child_process";

const mockedSpawnSync = jest.fn();

const transformer = (
  options: VFileOptions,
  mockedSpawnSync: typeof spawnSync,
) =>
  remark()
    .use(mdx as any)
    .use(remarkConvertResource as any, {
      // Not used, since we mock child_process.
      binaryPath: "./converter",
      spawner: mockedSpawnSync,
    })
    .processSync(new VFile(options) as any);

describe("server/remark-convert-resource", () => {
  interface testCase {
    description: string;
    input: string;
    binaryStatusHCL: number;
    binaryOutputHCL: string;
    binaryStatusKube: number;
    binaryOutputKube: string;
    expected: string;
  }

  beforeEach(() => {
    mockedSpawnSync.mockReset();
  });

  const testCases: testCase[] = [
    {
      description: "hcl and kubernetes conversions",
      input: `\`\`\`teleport-resource
tctl yaml
\`\`\`
`,
      binaryStatusHCL: 0,
      binaryOutputHCL: "sample hcl",
      binaryStatusKube: 0,
      binaryOutputKube: "kube yaml",
      expected: `<Tabs>
  <TabItem label="tctl">
    \`\`\`yaml
    tctl yaml
    \`\`\`
  </TabItem>

  <TabItem label="Terraform provider">
    \`\`\`hcl
    sample hcl
    \`\`\`
  </TabItem>

  <TabItem label="Kubernetes operator">
    \`\`\`yaml
    kube yaml
    \`\`\`
  </TabItem>
</Tabs>
`,
    },
    {
      description: "kubernetes conversion",
      input: `\`\`\`teleport-resource
tctl yaml
\`\`\`
`,
      binaryStatusHCL: 2,
      binaryOutputHCL: "",
      binaryStatusKube: 0,
      binaryOutputKube: "kube yaml",
      expected: `<Tabs>
  <TabItem label="tctl">
    \`\`\`yaml
    tctl yaml
    \`\`\`
  </TabItem>

  <TabItem label="Kubernetes operator">
    \`\`\`yaml
    kube yaml
    \`\`\`
  </TabItem>
</Tabs>
`,
    },
    {
      description: "hcl conversion",
      input: `\`\`\`teleport-resource
tctl yaml
\`\`\`
`,
      binaryStatusHCL: 0,
      binaryOutputHCL: "sample hcl",
      binaryStatusKube: 2,
      binaryOutputKube: "",
      expected: `<Tabs>
  <TabItem label="tctl">
    \`\`\`yaml
    tctl yaml
    \`\`\`
  </TabItem>

  <TabItem label="Terraform provider">
    \`\`\`hcl
    sample hcl
    \`\`\`
  </TabItem>
</Tabs>
`,
    },
    {
      description: "no conversions",
      input: `\`\`\`teleport-resource
tctl yaml
\`\`\`
`,
      binaryStatusHCL: 2,
      binaryOutputHCL: "",
      binaryStatusKube: 2,
      binaryOutputKube: "",
      expected: `\`\`\`yaml
tctl yaml
\`\`\`
`,
    },
  ];

  test.each(testCases)("$description", (testCase) => {
    // Configure the HCL conversion, which we expect to happen
    // before the Kubernetes conversion, then configure the Kubernetes
    // conversion. We need to do this in the correct order since
    // mockReturnValueOnce pushes to a queue of mock configurations.
    mockedSpawnSync.mockReturnValueOnce({
      stdout: testCase.binaryOutputHCL,
      status: testCase.binaryStatusHCL,
      pid: 111,
      output: [testCase.binaryOutputHCL],
      signal: null,
      stderr: "",
    });

    mockedSpawnSync.mockReturnValueOnce({
      stdout: testCase.binaryOutputKube,
      status: testCase.binaryStatusKube,
      pid: 111,
      output: [testCase.binaryOutputKube],
      signal: null,
      stderr: "",
    });

    const result = transformer(
      {
        value: testCase.input,
      },
      mockedSpawnSync,
    ).toString();

    expect(result).toEqual(testCase.expected);
  });
});
