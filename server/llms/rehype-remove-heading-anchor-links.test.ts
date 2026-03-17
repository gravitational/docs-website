import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import rehypeRemoveHeadingAnchorLinks from "./rehype-remove-heading-anchor-links";

describe("server/llms/rehype-remove-heading-anchor-links", () => {
  const transformer = (html: string) =>
    unified()
      .use(rehypeParse, { fragment: true })
      .use(rehypeRemoveHeadingAnchorLinks)
      .use(rehypeStringify)
      .processSync(html);

  test("removes hash-link anchors from all heading levels", () => {
    const result = transformer(
      readFileSync(
        resolve("server/fixtures/llms/heading-anchor-links.html"),
        "utf-8",
      ),
    );

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/llms/result/heading-anchor-links.html"),
        "utf-8",
      ).trim(),
    );
  });

  test("does not remove non-hash-link anchors from headings", () => {
    const result = transformer(
      readFileSync(
        resolve("server/fixtures/llms/heading-with-regular-link.html"),
        "utf-8",
      ),
    );

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/llms/result/heading-with-regular-link.html"),
        "utf-8",
      ).trim(),
    );
  });
});
