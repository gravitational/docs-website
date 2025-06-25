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

export const remarkLintFrontmatter = lintRule(
  "remark-lint:frontmatter",
  (root: Node, vfile) => {
    let hasFrontmatter = false;

    visit(root, "yaml", (node: Node) => {
      hasFrontmatter = true;

      const frontmatter = parse((node as Literal).value);
      if (!frontmatter.hasOwnProperty("type")) {
        vfile.message(`missing frontmatter field "type"`, node.position);
      } else if (!possibleTypes.includes(frontmatter.type)) {
        vfile.message(
          `the "type" frontmatter field must be one of: ${possibleTypes.join(", ")}`,
          node.position,
        );
      }

      if (!frontmatter.hasOwnProperty("product")) {
        vfile.message(`missing frontmatter field "product"`, node.position);
      } else if (!possibleProducts.includes(frontmatter.product)) {
        vfile.message(
          `the "product" frontmatter field must be one of: ${possibleProducts.join(", ")}`,
          node.position,
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
