import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import rehypeRemoveIrrelevantComponents from "./rehype-remove-irrelevant-components";

describe("server/llms/rehype-remove-irrelevant-components", () => {
  const transformer = (html: string) =>
    unified()
      .use(rehypeParse, { fragment: true })
      .use(rehypeRemoveIrrelevantComponents)
      .use(rehypeStringify)
      .processSync(html);

  test("removes thumbsFeedback and checkpoint components, preserving other content", () => {
    const result = transformer(
      readFileSync(
        resolve("server/fixtures/llms/irrelevant-components.html"),
        "utf-8",
      ),
    );

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/llms/result/irrelevant-components.html"),
        "utf-8",
      ).trim(),
    );
  });

  test("removes empty HTML comments", () => {
    const result = transformer(
      readFileSync(
        resolve("server/fixtures/llms/empty-comments.html"),
        "utf-8",
      ),
    );

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/llms/result/empty-comments.html"),
        "utf-8",
      ).trim(),
    );
  });
});
