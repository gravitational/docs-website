import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import rehypeRepositionH1 from "./rehype-reposition-h1";

describe("server/llms/rehype-reposition-h1", () => {
  const transformer = (html: string) =>
    unified()
      .use(rehypeParse, { fragment: true })
      .use(rehypeRepositionH1)
      .use(rehypeStringify)
      .processSync(html);

  test("moves h1 out of a header element to the top of the tree", () => {
    const result = transformer(
      readFileSync(
        resolve("server/fixtures/llms/reposition-h1.html"),
        "utf-8",
      ),
    );

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/llms/result/reposition-h1.html"),
        "utf-8",
      ).trim(),
    );
  });

  test("removes duplicate h1 elements after repositioning", () => {
    const result = transformer(
      readFileSync(
        resolve("server/fixtures/llms/reposition-h1-with-duplicate.html"),
        "utf-8",
      ),
    );

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve(
          "server/fixtures/llms/result/reposition-h1-with-duplicate.html",
        ),
        "utf-8",
      ).trim(),
    );
  });
});
