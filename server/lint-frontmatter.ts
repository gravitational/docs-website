import { lintRule } from "unified-lint-rule";
import { visit } from "unist-util-visit";
import type { Node } from "unist";
import { parse } from "yaml";
import type { Literal } from "mdast";

const possibleProducts = [
  "identity-governance",
  "identity-security",
  "mwi",
  "zero-trust",
  "platform-wide",
];

const possibleTypes = [
  "how-to",
  "conceptual",
  "get-started",
  "reference",
  "faq",
  "other",
];

interface LintFrontmatterOptions {
  allowedFields: Array<string>;
}

export const remarkLintFrontmatter = lintRule(
  "remark-lint:frontmatter",
  (root: Node, vfile, options: LintFrontmatterOptions) => {
    let hasFrontmatter = false;
    const { allowedFields } = options;
    const allowedSet = new Set(allowedFields);

    visit(root, "yaml", (node: Node) => {
      hasFrontmatter = true;

      // Include frontmatter parsing errors as linting errors.
      let frontmatter;
      try {
        frontmatter = parse((node as Literal).value);
      } catch (err) {
        vfile.message(`page has invalid YAML in frontmatter: ${err.message}`);
        return;
      }

      // Special case: there are no frontmatter fields. This check only catches
      // unrecognized fields, so ignore the empty frontmatter object.
      if (!frontmatter) {
        return;
      }

      const actual = new Set(Object.keys(frontmatter));
      const extraFields = [...actual.difference(allowedSet)];
      if (extraFields.length > 0) {
        vfile.message(
          `page frontmatter has unrecognized fields: ${extraFields.join(", ")}`,
        );
      }
    });
    if (!hasFrontmatter) {
      vfile.message(
        `the page must begin with a YAML frontmatter document surrounded by "---" separators`,
        root.position,
      );
    }
  },
);
