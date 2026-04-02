import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import rehypeProcessCustomComponents from "./rehype-prepare-html";

describe("server/llms/rehype-prepare-html", () => {
  const transformer = (html: string) =>
    unified()
      .use(rehypeParse, { fragment: true })
      .use(rehypeProcessCustomComponents)
      .use(rehypeStringify)
      .processSync(html);

  test("Var: replaces wrapper-input span with the input placeholder text", () => {
    const result = transformer(
      readFileSync(resolve("server/fixtures/llms/var-component.html"), "utf-8"),
    );

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/llms/result/var-component.html"),
        "utf-8",
      ).trim(),
    );
  });

  test("Admonition: wraps block in hr separators and uppercases the type title", () => {
    const result = transformer(
      readFileSync(resolve("server/fixtures/llms/admonition.html"), "utf-8"),
    );

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/llms/result/admonition.html"),
        "utf-8",
      ).trim(),
    );
  });

  test("Tabs: restructures so each tab label is directly followed by its content", () => {
    const result = transformer(
      readFileSync(resolve("server/fixtures/llms/tabs.html"), "utf-8"),
    );

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/llms/result/tabs.html"),
        "utf-8",
      ).trim(),
    );
  });

  test("Code block: extracts line text into a clean pre/code structure", () => {
    const result = transformer(
      readFileSync(resolve("server/fixtures/llms/code-block.html"), "utf-8"),
    );

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/llms/result/code-block.html"),
        "utf-8",
      ).trim(),
    );
  });

  test("Code block: prepends data-content prefix to command lines", () => {
    const result = transformer(
      readFileSync(
        resolve("server/fixtures/llms/code-block-commands.html"),
        "utf-8",
      ),
    );

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/llms/result/code-block-commands.html"),
        "utf-8",
      ).trim(),
    );
  });

  test("Link with inner content: only headings keep the link, other elements are unwrapped", () => {
    const result = transformer(
      readFileSync(
        resolve("server/fixtures/llms/anchor-mixed-content.html"),
        "utf-8",
      ),
    );

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/llms/result/anchor-mixed-content.html"),
        "utf-8",
      ).trim(),
    );
  });

  test("Link with deeply nested content: traverses into wrapper divs, headings keep the link and other elements are unwrapped", () => {
    const result = transformer(
      readFileSync(
        resolve("server/fixtures/llms/anchor-mixed-content-nested.html"),
        "utf-8",
      ),
    );

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/llms/result/anchor-mixed-content-nested.html"),
        "utf-8",
      ).trim(),
    );
  });

  test("Heading anchor links: removes hash-link anchors from all heading levels", () => {
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

  test("Heading anchor links: does not remove non-hash-link anchors from headings", () => {
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

  test("Irrelevant components: removes thumbsFeedback and checkpoint components, preserving other content", () => {
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

  test("Irrelevant components: removes empty HTML comments", () => {
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

  test("H1 repositioning: moves h1 out of a header element to the top of the tree", () => {
    const result = transformer(
      readFileSync(resolve("server/fixtures/llms/reposition-h1.html"), "utf-8"),
    );

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/llms/result/reposition-h1.html"),
        "utf-8",
      ).trim(),
    );
  });

  test("H1 repositioning: removes duplicate h1 elements after repositioning", () => {
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
