import { describe, expect, test } from "@jest/globals";

import { VFile, VFileOptions } from "vfile";
import { readFileSync } from "fs";
import { resolve } from "path";
import { remark } from "remark";
import mdx from "remark-mdx";
import remarkVariables, {
  RemarkVariablesOptions,
} from "../server/remark-variables";

const variables: Record<string, unknown> = {
  version: "1.0",
  teleport: {
    version: "1.0.1",
  },
};

const transformer = (
  vfileOptions: VFileOptions,
  pluginOptions: RemarkVariablesOptions = { resolve: true },
) => {
  const file: VFile = new VFile(vfileOptions);

  return remark()
    .use(mdx as any)
    .use(remarkVariables as any, { variables, ...pluginOptions })
    .processSync(file as any);
};

describe("server/remark-variables", () => {
  test("Fixture match result", () => {
    const value = readFileSync(
      resolve("server/fixtures/variables-source.mdx"),
      "utf-8",
    );

    const result = transformer({
      value,
      path: "/content/4.0/docs/pages/filename.mdx",
    }).toString();

    const expected = readFileSync(
      resolve("server/fixtures/variables-result.mdx"),
      "utf-8",
    );

    expect(result).toEqual(expected);
  });

  test("Returns correct warnings on lint", () => {
    const value = readFileSync(
      resolve("server/fixtures/variables-source.mdx"),
      "utf-8",
    );

    const result = transformer(
      {
        value,
        path: "/content/4.0/docs/pages/filename.mdx",
      },
      { lint: true, resolve: false },
    );

    const errors = result.messages.map(({ message }) => message);

    const expectedErrors = ["Non existing varaible name (=variable=)"];

    expect(errors).toEqual(expectedErrors);
  });
});
