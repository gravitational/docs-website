import { suite } from "uvu";
import * as assert from "uvu/assert";

import { VFile, VFileOptions } from "vfile";
import { readFileSync } from "fs";
import { resolve } from "path";
import { remark } from "remark";
import remarkMdx from "remark-mdx";
import remarkGFM from "remark-gfm";
import remarkIncludes, {
  ParameterAssignments,
  RemarkIncludesOptions,
  parsePartialParams,
  parseParamDefaults,
  resolveParamValue,
} from "../server/remark-includes";
import { updatePathsInIncludesTests } from "../server/asset-path-helpers";

import { describe, expect, test } from "@jest/globals";

const transformer = (
  vfileOptions: VFileOptions,
  pluginOptions: RemarkIncludesOptions = { resolve: true },
) => {
  const file = new VFile(vfileOptions);

  return remark()
    .use(remarkMdx as any)
    .use(remarkGFM)
    .use(remarkIncludes, {
      rootDir: "server/fixtures/includes/",
      ...pluginOptions,
      updatePaths: updatePathsInIncludesTests,
    })
    .processSync(file as any);
};

const transformerAsJSON = (
  vfileOptions: VFileOptions,
  pluginOptions: RemarkIncludesOptions = { resolve: true },
) => {
  const file = new VFile(vfileOptions);

  const tree = remark()
    .use(remarkMdx as any)
    .use(remarkGFM)
    .parse(file as any);

  const result = remark()
    .use(remarkIncludes, {
      rootDir: "server/fixtures/includes/",
      ...pluginOptions,
      updatePaths: updatePathsInIncludesTests,
    })
    .runSync(tree, file as any);

  // Add a final newline to the result so we can compare to a JSON file.
  return JSON.stringify(result, null, 2) + "\n";
};

describe("server/remark-includes", () => {
  test("Returns correct warnings on lint", () => {
    const value = readFileSync(
      resolve("server/fixtures/includes-source.mdx"),
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

    const expectedErrors = [
      "Includes only works if they are the only content on the line",
      "Wrong import path non-existing.mdx in file /content/4.0/docs/pages/filename.mdx.",
    ];

    expect(errors).toEqual(expectedErrors);
  });

  describe("Removes details box summaries from the enclosing paragraph", () => {
    test("When the summary is its own paragraph", () => {
      const value = readFileSync(
        resolve("server/fixtures/include-details.mdx"),
        "utf-8",
      );

      const expected = readFileSync(
        resolve("server/fixtures/include-details-result.json"),
        "utf-8",
      );

      const result = transformerAsJSON({
        value,
        path: "/content/4.0/docs/pages/filename.mdx",
      });

      expect(result).toEqual(expected);
    });

    test("When the summary shares a paragraph", () => {
      const value = readFileSync(
        resolve("server/fixtures/include-details-shared-graf.mdx"),
        "utf-8",
      );

      const expected = readFileSync(
        resolve("server/fixtures/include-details-shared-p-result.json"),
        "utf-8",
      );

      const result = transformerAsJSON({
        value,
        path: "/content/4.0/docs/pages/filename.mdx",
      });

      expect(result).toEqual(expected);
    });
  });

  test("Leave includes in place on { resolve: false }", () => {
    const value = readFileSync(
      resolve("server/fixtures/includes-source.mdx"),
      "utf-8",
    );

    const result = transformer(
      {
        value,
        path: "/content/4.0/docs/pages/filename.mdx",
      },
      { lint: false, resolve: false },
    ).toString();

    expect(result).toEqual(value);
  });

  test("Multiple includes resolve in code block", () => {
    const value = readFileSync(
      resolve("server/fixtures/includes-multiple-source.mdx"),
      "utf-8",
    );

    const result = transformer({
      value,
      path: "/content/4.0/docs/pages/filename.mdx",
    }).toString();

    const expected = readFileSync(
      resolve("server/fixtures/includes-multiple-result.mdx"),
      "utf-8",
    );

    expect(result).toEqual(expected);
  });

  test("resolveParamValue handles quotes correctly in parameter values", () => {
    interface testCase {
      description: string;
      input: string;
      shouldThrow: boolean;
      expected?: string;
    }
    const cases: testCase[] = [
      {
        description: "mismatched quotes",
        input: `"This is a string'`,
        shouldThrow: true,
      },
      {
        description: "double quotes containing single quotes",
        input: `"This is a 'string'"`,
        shouldThrow: false,
        expected: `This is a 'string'`,
      },
      {
        description: "single quotes containing double quotes",
        input: `'This is a "string"'`,
        shouldThrow: true,
      },
      {
        description: "single quotes containing escaped single quotes",
        input: `'This is a \\'string\\''`,
        shouldThrow: true,
      },
      {
        description: "double quotes containing escaped double quotes",
        input: `"This is a \\"string\\""`,
        shouldThrow: false,
        expected: `This is a "string"`,
      },
      {
        description: "input not wrapped in quotes",
        input: `This is a string`,
        shouldThrow: true,
      },
      {
        description: "empty input",
        input: ``,
        shouldThrow: true,
      },
      {
        description: "single quotes",
        input: `'This is a string'`,
        shouldThrow: true,
      },
    ];

    cases.forEach((c) => {
      if (c.shouldThrow == true) {
        let val: string;
        try {
          val = resolveParamValue(c.input);
          assert.unreachable(
            `${c.description}: should have thrown but returned value ${val}`,
          );
        } catch (err) {
          assert.not.instance(
            err,
            assert.Assertion,
            `${c.description}: should have thrown, but got: ${val}`,
          );
        }
        return;
      }
      if (!c.expected) {
        return;
      }

      let val: string;
      try {
        val = resolveParamValue(c.input);
      } catch (err) {
        assert.instance(
          err,
          assert.Assertion,
          `${c.description}: should not have thrown, but got error: ${err}`,
        );
      }
      expect(val).toEqual(c.expected);
    });
  });

  describe("parsePartialParams correctly parses parameter assignments", () => {
    interface testCase {
      description: string;
      shouldThrow: boolean;
      input: string;
      expected?: ParameterAssignments;
    }

    const cases: testCase[] = [
      {
        description: "straightforward case",
        shouldThrow: false,
        input: `(!includes/example.mdx var1="this is a value" var2="this is also a value"!)`,
        expected: {
          var1: `"this is a value"`,
          var2: `"this is also a value"`,
        },
      },
      {
        description: "no parameters",
        shouldThrow: false,
        input: "(!includes/example.mdx!)",
        expected: {},
      },
      {
        description: "mismatched quotes within matching quotes",
        shouldThrow: false,
        input: `(!includes/example.mdx var1="this is a value' var2='this is also a value"!)`,
        expected: {
          var1: `"this is a value' var2='this is also a value"`,
        },
      },
      {
        description: "mismatched quotes, alternating",
        input: `(!includes/example.mdx var1="this is a value' var2="this is also a value'!)`,
        shouldThrow: true,
      },
      {
        description: "escaped quotes",
        shouldThrow: false,
        input: `(!includes/example.mdx var1="this is a \\"quote\\"" var2="this is a \\"quote\\""!)`,
        expected: {
          var1: `"this is a \\"quote\\""`,
          var2: `"this is a \\"quote\\""`,
        },
      },
      {
        description: "end of input before second quote",
        shouldThrow: true,
        input: `(!includes/example.mdx var1="this is a value" var2="this is also a value!)`,
      },
      {
        description: "quoted value with no key",
        shouldThrow: true,
        input: `(!includes/example.mdx "this is a value" "this is also a value" var1="another value"!)`,
      },
      {
        description: "not an inclusion expression",
        shouldThrow: true,
        input: "example.mdx",
      },
      {
        description: "exclamation point",
        shouldThrow: false,
        input: `(!error-message.mdx message="Installation has failed!"!)`,
        expected: {
          message: `"Installation has failed!"`,
        },
      },
      {
        description: "escaped quotes",
        shouldThrow: false,
        input: `(!error-message.mdx message="Type \\"final\\" to see the final screen."!)`,
        expected: {
          message: `"Type \\"final\\" to see the final screen."`,
        },
      },
      {
        description: "single quotes",
        shouldThrow: true,
        input: `(!error-message.mdx message='Type "Hello"'!)`,
      },
      {
        description: "superfluous spaces around an equals sign",
        shouldThrow: true,
        input: `(!includes/example.mdx var1 = "this is a value" var2="this is also a value"!)`,
      },
    ];

    test.each(cases)("$description", (c) => {
      if (c.shouldThrow) {
        let val: ParameterAssignments;
        try {
          val = parsePartialParams(c.input);
          assert.unreachable(
            `${
              c.description
            }: should have thrown but returned value ${JSON.stringify(val)}`,
          );
        } catch (err) {
          assert.not.instance(
            err,
            assert.Assertion,
            `${c.description}: should have thrown, but got: ${JSON.stringify(
              val,
            )}`,
          );
        }
        return;
      }
      if (!c.expected) {
        return;
      }
      let val: ParameterAssignments;
      try {
        val = parsePartialParams(c.input);
      } catch (err) {
        assert.instance(
          err,
          assert.Assertion,
          `${c.description}: should not have thrown, but got error: ${err}`,
        );
      }
      expect(val).toEqual(c.expected);
    });
  });

  describe("parseParamDefaults correctly parses default parameter assignments", () => {
    interface testCase {
      description: string;
      shouldThrow: boolean;
      input: string;
      expected?: ParameterAssignments;
    }

    const cases: testCase[] = [
      {
        description: "straightforward case",
        shouldThrow: false,
        input: `{{ var1="this is a value" var2="this is also a value" }}`,
        expected: {
          var1: `"this is a value"`,
          var2: `"this is also a value"`,
        },
      },
      {
        description: "not wrapped in double-curly braces",
        shouldThrow: false,
        input: `var1="this is a value" var2="this is also a value"`,
        expected: {},
      },
      {
        description: "only one side includes a double curly brace",
        shouldThrow: false,
        input: `var="this is a value" var2="this is also a value" }}`,
        expected: {},
      },
      {
        description: "not on the first line of the partial",
        shouldThrow: false,
        input: `This is a partial.
{{ var="this is a value" }}
`,
        expected: {},
      },
      {
        description: "multiple default values expressions",
        shouldThrow: false,
        input: `{{ var1="this is a value" var2="this is also a value" }}
This is a partial.
{{ var3="this is another value" var4="this is yet another value" }}
`,
        expected: {
          var1: `"this is a value"`,
          var2: `"this is also a value"`,
        },
      },
      {
        description: "empty input",
        shouldThrow: true,
        input: "",
      },
      {
        description: "short partial",
        shouldThrow: false,
        input: "one",
        expected: {},
      },
      {
        description: "short partial with no defaults and one param",
        shouldThrow: false,
        input: `This is partial with a {{ param }}`,
        expected: {},
      },
      {
        description: "double curly braces and an equals",
        shouldThrow: false,
        input: `{{ = }}`,
        expected: {},
      },
    ];

    test.each(cases)("$description", (c) => {
      if (c.shouldThrow == true) {
        let val: ParameterAssignments;
        try {
          val = parseParamDefaults(c.input);
          assert.unreachable(
            `${
              c.description
            }: should have thrown but returned value ${JSON.stringify(val)}`,
          );
        } catch (err) {
          assert.not.instance(
            err,
            assert.Assertion,
            `${c.description}: should have thrown, but got: ${JSON.stringify(
              val,
            )}`,
          );
        }
        return;
      }
      if (!c.expected) {
        return;
      }
      let val: ParameterAssignments;
      try {
        val = parseParamDefaults(c.input);
      } catch (err) {
        assert.instance(
          err,
          assert.Assertion,
          `${c.description}: should not have thrown, but got error: ${err}`,
        );
      }
      assert.equal(
        c.expected,
        val,
        new Error(
          `${c.description}: expected parsed partial params:\n${JSON.stringify(
            c.expected,
          )}\n...but got:\n${JSON.stringify(val)}`,
        ),
      );
    });
  });

  test("Resolves template variables in includes", () => {
    const value = readFileSync(
      resolve("server/fixtures/includes-vars.mdx"),
      "utf-8",
    );

    const expected = readFileSync(
      resolve("server/fixtures/includes-vars-result.mdx"),
      "utf-8",
    );

    const result = transformer({
      value,
      path: "/content/4.0/docs/pages/filename.mdx",
    }).toString();

    expect(result).toEqual(expected);
  });

  describe("Resolves relative links in partials based on the path of the partial", () => {
    const includingRelativeLink = `Here are instructions on installing the software:

(!include-relative-link.mdx!)
`;
    interface testCase {
      includingPage: string;
      description: string;
      path: string;
      expected: string;
    }
    const testCases: testCase[] = [
      {
        includingPage: includingRelativeLink,
        description: "including file is on the same dir level as the partial",
        path: "server/fixtures/dir/samelevel.mdx",
        expected: `Here are instructions on installing the software:

Check out our [instructions](../installation.mdx).

Here is an image showing a successful installation:

[Successful installation](../installation.png)
`,
      },
      {
        includingPage: includingRelativeLink,
        description: "including file is below the dir level of the partial",
        path: "server/fixtures/dir/dir2/below.mdx",
        expected: `Here are instructions on installing the software:

Check out our [instructions](../../installation.mdx).

Here is an image showing a successful installation:

[Successful installation](../../installation.png)
`,
      },
      {
        includingPage: includingRelativeLink,
        description: "including file is above the dir level of the partial",
        path: "server/fixtures/above.mdx",
        expected: `Here are instructions on installing the software:

Check out our [instructions](installation.mdx).

Here is an image showing a successful installation:

[Successful installation](installation.png)
`,
      },
      {
        includingPage: `Here's how to attach an IAM policy for DB Access:

(!database-access/attach-iam-policies.mdx!)
`,
        description: "relative image path",
        path: "server/fixtures/includes/db-policy.mdx",
        expected: `Here's how to attach an IAM policy for DB Access:

Attach the policy and permission boundary you created earlier to the IAM
identity your Teleport Database Service will be using.

For example, if the Database Service runs as an IAM user, go to the page of the IAM user
in the AWS Management Console, attach the created policy in the "Permissions
policies" section, and set the created boundary policy in the "Permissions
boundary" section.

<Figure>
  ![IAM user](../../img/database-access/iam@2x.png)
</Figure>
`,
      },
      {
        includingPage: "(!includes-relative-link-def.mdx!)",
        description: "relative definition path",
        path: "server/fixtures/definition.mdx",
        expected: `This partial has a relative link [definition].

[definition]: ../installation.mdx
`,
      },
    ];

    test.each(testCases)("$description", (testCase) => {
      const actual = transformer({
        value: testCase.includingPage,
        path: testCase.path,
      }).toString();

      assert.equal(
        actual,
        testCase.expected,
        new Error(
          `${testCase.description}: expected the output:\n` +
            testCase.expected +
            "\n\n" +
            "but got:\n" +
            actual,
        ),
      );
    });
  });

  test("Interprets anchor-only links correctly when loading partials", () => {
    const actual = transformer({
      value: `Here is the outer page.

(!anchor-links.mdx!)

`,
      path: "server/fixtures/mypage.mdx",
    }).toString();

    expect(actual).toEqual(
      `Here is the outer page.

This is a [link to an anchor](#this-is-a-section).

## This is a section.

This is content within the section.
`,
    );
  });
});
