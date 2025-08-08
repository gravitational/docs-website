import { describe, expect, test } from "@jest/globals";
import { remarkLintComponentLinks } from "./lint-component-links";
import { VFile } from "vfile";
import { remark } from "remark";
import mdx from "remark-mdx";

const getReasons = (value: string, path: string = "content/17.x/docs/pages/includes/homepage/products.mdx") => {
  return remark()
    .use(mdx as any)
    .use(remarkLintComponentLinks as any)
    .processSync(new VFile({ value, path }) as any)
    .messages.map((m) => m.reason);
};

describe("server/lint-component-links", () => {
  interface testCase {
    description: string;
    input: string;
    path?: string;
    expected: Array<string>;
  }

  const testCases: Array<testCase> = [
    {
      description: "should skip files not in configured paths",
      input: `<Products productCategories={[{href: './broken-link/'}]} />`,
      path: "content/17.x/docs/pages/index.mdx",
      expected: [],
    },
    {
      description: "should check files in includes/homepage/",
      input: `<Products productCategories={[{features: [{href: './broken-link/'}]}]} />`,
      path: "content/17.x/docs/pages/includes/homepage/products.mdx",
      expected: ["Broken link in Products component"],
    },
    {
      description: "should validate Products component with valid link",
      input: `<Products productCategories={[{
        features: [{
          href: './enroll-resources/'
        }]
      }]} />`,
      expected: [],
    },
    {
      description: "should detect broken link in Products component",
      input: `<Products productCategories={[{
        features: [{
          href: './non-existent-path/'
        }]
      }]} />`,
      expected: ["Broken link in Products component"],
    },
    {
      description: "should ignore non-configured components",
      input: `<SomeOtherComponent href="./broken-link/" />`,
      expected: [],
    },
    {
      description: "should handle multiple hrefs in one component",
      input: `<Products
        productCategories={[
          {
            features: [
              { href: './enroll-resources/' },
              { href: './broken-link/' }
            ]
          }
        ]}
      />`,
      expected: ["Broken link in Products component"],
    },
    {
      description: "should validate folder/folder.mdx pattern",
      input: `<Products productCategories={[{
        features: [{
          href: './machine-workload-identity/machine-id/deployment/'
        }]
      }]} />`,
      expected: [],
    },
  ];

  test.each(testCases)("$description", (tc) => {
    const reasons = getReasons(tc.input, tc.path);
    if (tc.expected.length === 0) {
      expect(reasons).toEqual([]);
    } else {
      expect(reasons.some(reason => 
        tc.expected.some(expected => reason.includes(expected))
      )).toBe(true);
    }
  });
});