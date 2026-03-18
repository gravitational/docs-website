import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import rehypeProcessCustomComponents from "./rehype-process-custom-components";

describe("server/llms/rehype-process-custom-components", () => {
  const transformer = (html: string) =>
    unified()
      .use(rehypeParse, { fragment: true })
      .use(rehypeProcessCustomComponents)
      .use(rehypeStringify)
      .processSync(html);

  test("Var: replaces wrapper-input span with the input placeholder text", () => {
    const result = transformer(
      readFileSync(
        resolve("server/fixtures/llms/var-component.html"),
        "utf-8",
      ),
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
      readFileSync(
        resolve("server/fixtures/llms/admonition.html"),
        "utf-8",
      ),
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
});
