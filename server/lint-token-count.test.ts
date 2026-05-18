import { describe, expect, test } from "@jest/globals";
import {
  remarkLintTokenCountWarn,
  remarkLintTokenCountError,
  WARNING_THRESHOLD,
  ERROR_THRESHOLD,
} from "./lint-token-count";
import { VFile } from "vfile";
import { remark } from "remark";
import mdx from "remark-mdx";

// Helper function to generate markdown content with a specified token count.
// The content includes frontmatter and a repeated word to increase the token count.
const mockContent = (tokenCount: number) =>
  "---\ntitle: Test page\ndescription: This is a test page.\n---\n\nFirst paragraph.\n\n" +
  "word\n".repeat(tokenCount);

// Helper function to process the markdown content with the remark plugins and return the lint messages.
const getMessages = (value: string) => {
  return remark()
    .use(mdx as any)
    .use(remarkLintTokenCountWarn as any)
    .use(remarkLintTokenCountError as any, ["error"])
    .processSync(new VFile({ value, path: "mypath.mdx" }) as any)
    .messages.map((m) => ({ reason: m.reason, fatal: m.fatal }));
};

describe("server/lint-token-count", () => {
  test("no message for pages well below the warning threshold", () => {
    const content = mockContent(1000);
    expect(getMessages(content)).toEqual([]);
  });

  test("warning for pages between the warning and error thresholds", () => {
    const content = mockContent(WARNING_THRESHOLD + 500);
    const messages = getMessages(content);
    expect(messages).toHaveLength(1);
    expect(messages[0].fatal).toBe(false);
    expect(messages[0].reason).toMatch(/approaching the limit/);
  });

  test("error for pages exceeding the error threshold", () => {
    const content = mockContent(ERROR_THRESHOLD + 500);
    const messages = getMessages(content);
    expect(messages).toHaveLength(1);
    expect(messages[0].fatal).toBe(true);
    expect(messages[0].reason).toMatch(/exceeds the limit/);
  });

  test("warning message includes the error threshold", () => {
    const content = mockContent(WARNING_THRESHOLD + 500);
    const messages = getMessages(content);
    expect(messages[0].reason).toContain(String(ERROR_THRESHOLD));
  });

  test("error message includes the error threshold", () => {
    const content = mockContent(ERROR_THRESHOLD + 500);
    const messages = getMessages(content);
    expect(messages[0].reason).toContain(String(ERROR_THRESHOLD));
  });
});
