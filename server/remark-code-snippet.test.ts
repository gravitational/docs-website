import { describe, expect, test } from "@jest/globals";
import { VFile, VFileOptions } from "vfile";
import { remark } from "remark";
import { readFileSync } from "fs";
import { resolve } from "path";
import mdx from "remark-mdx";
import remarkCodeSnippet, {
  RemarkCodeSnippetOptions,
} from "../server/remark-code-snippet";

const transformer = (
  options: VFileOptions,
  pluginOptions: RemarkCodeSnippetOptions = {
    resolve: true,
    langs: ["code", "bash", "var"],
  },
) =>
  remark()
    .use(mdx as any)
    .use(remarkCodeSnippet as any, pluginOptions)
    .processSync(new VFile(options) as any);

describe("server/remark-code-snippet", () => {
  test("Fixture match result on resolve", () => {
    const value = readFileSync(
      resolve("server/fixtures/includes/includes-code-snippet-simplest.mdx"),
      "utf-8",
    );

    const result = transformer({
      value,
      path: "/docs/index.mdx",
    }).toString();

    const expected = readFileSync(
      resolve("server/fixtures/result/code-snippet-simplest.mdx"),
      "utf-8",
    );

    expect(result).toEqual(expected);
  });

  test("Multiline command support", () => {
    const value = readFileSync(
      resolve("server/fixtures/includes/includes-code-snippet-multiline.mdx"),
      "utf-8",
    );

    const result = transformer({
      value,
      path: "/docs/index.mdx",
    }).toString();

    const expected = readFileSync(
      resolve("server/fixtures/result/code-snippet-multiline.mdx"),
      "utf-8",
    );

    expect(result).toEqual(expected);
  });

  test("Heredoc format support", () => {
    const value = readFileSync(
      resolve("server/fixtures/includes/includes-code-snippet-heredoc.mdx"),
      "utf-8",
    );

    const result = transformer({
      value,
      path: "/docs/index.mdx",
    }).toString();

    const expected = readFileSync(
      resolve("server/fixtures/result/code-snippet-heredoc.mdx"),
      "utf-8",
    );

    expect(result).toEqual(expected);
  });

  test("Support output to file mode for heredoc format", () => {
    const value = readFileSync(
      resolve(
        "server/fixtures/includes/includes-code-snippet-output-to-file-mode.mdx",
      ),
      "utf-8",
    );

    expect(() =>
      transformer({
        value,
        path: "/docs/index.mdx",
      }),
    ).not.toThrow();
  });

  test("If a multiline command ends with a slash", () => {
    const value = readFileSync(
      resolve(
        "server/fixtures/includes/includes-code-snippet-multiline-error.mdx",
      ),
      "utf-8",
    );

    expect(() =>
      transformer({
        value,
        path: "/docs/index.mdx",
      }),
    ).not.toThrow();
  });

  test("If a heredoc format command ends without a closing tag", () => {
    const value = readFileSync(
      resolve(
        "server/fixtures/includes/includes-code-snippet-heredoc-error.mdx",
      ),
      "utf-8",
    );

    expect(() =>
      transformer({
        value,
        path: "/docs/index.mdx",
      }),
    ).not.toThrow();
  });

  test("Returns correct error message on heredoc format lint", () => {
    const value = readFileSync(
      resolve(
        "server/fixtures/includes/includes-code-snippet-heredoc-error.mdx",
      ),
      "utf-8",
    );

    expect(() =>
      transformer(
        {
          value,
          path: "/docs/index.mdx",
        },
        { lint: true, resolve: false, langs: ["code", "bash"] },
      ),
    ).toThrow("No closing line for heredoc format");
  });

  test("Returns correct error message on multiline command lint", () => {
    const value = readFileSync(
      resolve(
        "server/fixtures/includes/includes-code-snippet-multiline-error.mdx",
      ),
      "utf-8",
    );

    expect(() =>
      transformer(
        {
          value,
          path: "/docs/index.mdx",
        },
        { lint: true, resolve: false, langs: ["code", "bash"] },
      ),
    ).toThrow(
      "The last string in the multiline command has to be without symbol \\",
    );
  });

  test("Variables in command support", () => {
    const value = readFileSync(
      resolve("server/fixtures/includes/includes-var-in-command.mdx"),
      "utf-8",
    );

    const result = transformer({
      value,
      path: "/docs/index.mdx",
    }).toString();

    const expected = readFileSync(
      resolve("server/fixtures/result/var-in-command.mdx"),
      "utf-8",
    );

    expect(result).toEqual(expected);
  });

  test("Variables in var-block support", () => {
    const value = readFileSync(
      resolve("server/fixtures/includes/includes-var-in-block-var.mdx"),
      "utf-8",
    );

    const result = transformer({
      value,
      path: "/docs/index.mdx",
    }).toString();

    const expected = readFileSync(
      resolve("server/fixtures/result/var-in-block-var.mdx"),
      "utf-8",
    );

    expect(result).toEqual(expected);
  });

  test("Variables in code after command support", () => {
    const value = readFileSync(
      resolve("server/fixtures/includes/includes-var-after-commands.mdx"),
      "utf-8",
    );

    const result = transformer({
      value,
      path: "/docs/index.mdx",
    }).toString();

    const expected = readFileSync(
      resolve("server/fixtures/result/var-after-commands.mdx"),
      "utf-8",
    );

    expect(result).toEqual(expected);
  });

  test("Variables in multiline command support", () => {
    const value = readFileSync(
      resolve("server/fixtures/includes/includes-var-in-multiline-command.mdx"),
      "utf-8",
    );

    const result = transformer({
      value,
      path: "/docs/index.mdx",
    }).toString();

    const expected = readFileSync(
      resolve("server/fixtures/result/var-in-multiline-command.mdx"),
      "utf-8",
    );

    expect(result).toEqual(expected);
  });

  test("Includes empty lines in example command output", () => {
    const value = readFileSync(
      resolve("server/fixtures/code-snippet-empty-line.mdx"),
      "utf-8",
    );

    const result = transformer({
      value,
      path: "/docs/index.mdx",
    }).toString();

    const expected = readFileSync(
      resolve("server/fixtures/result/code-snippet-empty-line.mdx"),
      "utf-8",
    );

    expect(result).toEqual(expected);
  });
});
