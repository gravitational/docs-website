import { describe, expect, test } from "@jest/globals";
import rehypeMdxToHast from "./rehype-mdx-to-hast";
import { VFile, VFileOptions } from "vfile";
import { remark } from "remark";
import { readFileSync } from "fs";
import { resolve } from "path";
import mdx from "remark-mdx";
import { rehypeHLJS } from "./rehype-hljs";
import { unified } from "unified";
import remarkRehype from "remark-rehype";
import remarkParse from "remark-parse";
import rehypeStringify from "rehype-stringify";
import { definer as hcl } from "highlightjs-terraform";

describe("server/rehype-hljs-var", () => {
  // transformer executes remark and rehype plugins to transform a VFile using
  // rehypeHLJS. It uses legacy logic from gravitational/docs.
  // TODO: Use an approach that more closely reflects the remark/rehype execution
  // logic of Docusaurus.
  const transformer = (options: VFileOptions) =>
    unified()
      .use(remarkParse as any)
      .use(mdx)
      .use(remarkRehype as any, {
        passThrough: [
          "mdxFlowExpression",
          "mdxJsxFlowElement",
          "mdxJsxTextElement",
          "mdxTextExpression",
          "mdxjsEsm",
        ],
      })
      .use(rehypeHLJS, {
        aliases: {
          bash: ["bsh", "systemd", "code", "powershell"],
        },
        languages: { hcl: hcl },
      })
      .use(rehypeMdxToHast as any)
      .use(rehypeStringify)
      .processSync(new VFile(options));

  test("Insert Var components as HTML nodes: Var gets its own hljs span", () => {
    const result = transformer({
      value: readFileSync(
        resolve("server/fixtures/yaml-snippet-var.mdx"),
        "utf-8"
      ),
      path: "/docs/index.mdx",
    });

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/result/yaml-snippet-var.html"),
        "utf-8"
      ).trim()
    );
  });

  test("Insert Var components as HTML nodes: Var part of a broader span in go", () => {
    const result = transformer({
      value: readFileSync(
        resolve("server/fixtures/go-comment-var.mdx"),
        "utf-8"
      ),
      path: "/docs/index.mdx",
    });

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/result/go-comment-var.html"),
        "utf-8"
      ).trim()
    );
  });

  test("Insert Var components as HTML nodes: Var part of a broader span in YAML", () => {
    const result = transformer({
      value: readFileSync(
        resolve("server/fixtures/yaml-comment-vars.mdx"),
        "utf-8"
      ),
      path: "/docs/index.mdx",
    });

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/result/yaml-comment-vars.html"),
        "utf-8"
      ).trim()
    );
  });

  test("Insert Var components as HTML nodes: text after a Var", () => {
    const result = transformer({
      value: readFileSync(resolve("server/fixtures/hcl-vars.mdx"), "utf-8"),
      path: "/docs/index.mdx",
    });

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/result/hcl-vars.html"),
        "utf-8"
      ).trim()
    );
  });

  test("Insert Var components as HTML nodes: powershell snippet", () => {
    const result = transformer({
      value: readFileSync(
        resolve("server/fixtures/powershell-var.mdx"),
        "utf-8"
      ),
      path: "/docs/index.mdx",
    });

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/result/powershell-var.html"),
        "utf-8"
      ).trim()
    );
  });

  test("Ignore VarList in code snippet components", () => {
    // This throws if the plugin interprets VarList components as being Vars.
    transformer({
      value: readFileSync(resolve("server/fixtures/varlist.mdx"), "utf-8"),
      path: "/docs/index.mdx",
    });
  });

  test("Next node as one of several code node children", () => {
    const result = transformer({
      value: readFileSync(resolve("server/fixtures/hcl-addr-var.mdx"), "utf-8"),
      path: "/docs/index.mdx",
    });

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/result/hcl-addr-var.html"),
        "utf-8",
      ).trim(),
    );
  });

  test("Vars and text snippet label", () => {
    const result = transformer({
      value: readFileSync(
        resolve("server/fixtures/text-snippet-label-var.mdx"),
        "utf-8",
      ),
      path: "/docs/index.mdx",
    });

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/result/text-snippet-label-var.html"),
        "utf-8",
      ).trim(),
    );
  });

  test("Vars and no snippet label", () => {
    const result = transformer({
      value: readFileSync(
        resolve("server/fixtures/no-snippet-label-var.mdx"),
        "utf-8",
      ),
      path: "/docs/index.mdx",
    });

    expect((result.value as string).trim()).toBe(
      readFileSync(
        resolve("server/fixtures/result/no-snippet-label-var.html"),
        "utf-8",
      ).trim(),
    );
  });
});
