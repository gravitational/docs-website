import { lintRule } from "unified-lint-rule";
import { visit, SKIP } from "unist-util-visit";
import type { Node } from "unist";
import { parse } from "yaml";
import type { Literal } from "mdast";

const possibleProducts = new Set([
  "identity-governance",
  "identity-security",
  "mwi",
  "zero-trust",
  "platform-wide",
]);

const possibleTypes = new Set([
  "how-to",
  "conceptual",
  "get-started",
  "reference",
  "faq",
]);

export const remarkLintFrontmatter = lintRule(
  "remark-lint:frontmatter",
  (root: Node, vfile) => {
    let hasFrontmatter = false;

    visit(root, "yaml", (node: Node) => {
      hasFrontmatter = true;

      const frontmatter = parse((node as Literal).value);
      if (!frontmatter.hasOwnProperty("labels")) {
        vfile.message(
          `every docs page must include a frontmatter field called "labels"`,
          node.position,
        );
        return SKIP;
      }

      if (!Array.isArray(frontmatter.labels)) {
        vfile.message(
          `the "labels" frontmatter field must be a list with at least one value`,
          node.position,
        );
        return SKIP;
      }

      const labels = new Set(frontmatter.labels);
      const allLabels = possibleProducts.union(possibleTypes);
      const unrecognizedLabels = labels.difference(allLabels);
      if (unrecognizedLabels.size > 0) {
        vfile.message(
          `unrecognized label values: ${[...unrecognizedLabels.values()].join(", ")} - valid labels are: ${[...allLabels.values()].join(", ")}`,
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
