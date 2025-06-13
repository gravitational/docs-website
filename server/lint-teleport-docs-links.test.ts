import { describe, expect, test } from "@jest/globals";
import { remarkLintTeleportDocsLinks } from "./lint-teleport-docs-links";
import { VFile } from "vfile";
import { remark } from "remark";
import mdx from "remark-mdx";

const getReasons = (value: string) => {
  return remark()
    .use(mdx as any)
    .use(remarkLintTeleportDocsLinks as any)
    .processSync(new VFile({ value, path: "mypath.mdx" }) as any)
    .messages.map((m) => m.reason);
};

describe("server/lint-absolute-docs-links", () => {
  interface testCase {
    description: string;
    input: string;
    expected: Array<string>;
  }

  const testCases: Array<testCase> = [
    {
      description: "absolute docs path in a Markdown link href",
      input: "This is a [link](https://goteleport.com/docs/installation)",
      expected: [
        "Link reference https://goteleport.com/docs/installation must be a relative link to an *.mdx page",
      ],
    },
    {
      description: "absolute docs path in an a tag",
      input: "<a href='https://goteleport.com/docs/installation'>here</a>",
      expected: [
        "Component href https://goteleport.com/docs/installation must be a relative link to an *.mdx page",
      ],
    },
    {
      description: "JavaScript identifier as href value",
      input:
        "You can <a href={BotLogo} download>download</a> our avatar to set as your Bot Icon.",
      expected: [],
    },
  ];

  test.each(testCases)("$description", (tc) => {
    expect(getReasons(tc.input)).toEqual(tc.expected);
  });
});
