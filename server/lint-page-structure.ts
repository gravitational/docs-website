import { lintRule } from "unified-lint-rule";
import { visit } from "unist-util-visit";
import type { Heading, Paragraph, Text } from "mdast";
import type { EsmNode, MdxAnyElement, MdxastNode } from "./types-unist";
import type { Node, Parent, Position } from "unist";

const mdxNodeTypes = new Set(["mdxJsxFlowElement", "mdxJsxTextElement"]);

interface stepNumber {
  numerator: number;
  denominator: number;
  position: Position;
}

interface h2WithIndex {
  node: Text;
  rootIndex: number; // Index of this child within the root node
}

interface paragraphWithIndex {
  node: Paragraph;
  rootIndex: number; // Index of this child within root
}

const stepNumberPattern = `^Step ([0-9]+)/([0-9]+)`;
const messageSuffix = `Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.`;

export const remarkLintPageStructure = lintRule(
  "remark-lint:page-structure",
  (root: Node, vfile) => {
    const h2s: Array<h2WithIndex> = [];
    const paras: Array<paragraphWithIndex> = [];

    // Collect paragraphs and headings from first-level children of root.
    (root as Parent).children.forEach((node, idx) => {
      const hed = node as Heading;
      if (hed.type == "heading" && hed.depth == 2) {
        // A Heading as parsed by remark-mdx only has a single child, the
        // heading text.
        h2s.push({
          node: hed.children[0] as Text,
          rootIndex: idx,
        });
      }

      const para = node as Paragraph;
      if (para.type == "paragraph") {
        paras.push({
          node: para,
          rootIndex: idx,
        });
      }
    });

    // See if there is a paragraph that comes before the first H2 in root's
    // children. We compare indices instead of line numbers because
    // remark-includes preserves the line numbers of any partials it includes.
    if (
      h2s.length > 0 &&
      !paras.some((para) => {
        return para.rootIndex < h2s[0].rootIndex;
      })
    ) {
      vfile.message(
        "This guide is missing at least one introductory paragraph before the first H2. Use introductory paragraphs to explain the purpose and scope of this guide. " +
          messageSuffix,
        h2s[0].node.position,
      );
    }

    const hasStep = h2s.some((h) => h.node.value.match(/^Step [0-9]/) !== null);
    if (hasStep && h2s[0].node.value !== "How it works") {
      vfile.message(
        "In a how-to guide, the first H2-level section must be called `## How it works`. Use this section to include 1-3 paragraphs that describe the high-level architecture of the setup shown in the guide. " +
          messageSuffix,
        h2s[0].node.position,
      );
    }
    const stepNumbers: Array<stepNumber> = [];
    h2s.forEach((heading) => {
      const parts = heading.node.value.match(stepNumberPattern);
      if (parts !== null) {
        stepNumbers.push({
          numerator: parseInt(parts[1]),
          denominator: parseInt(parts[2]),
          position: heading.node.position,
        });
      }
    });

    const expectedDenominator = stepNumbers.length;
    for (let i = 0; i < stepNumbers.length; i++) {
      const expectedNumerator = i + 1;
      if (
        stepNumbers[i].numerator !== expectedNumerator ||
        stepNumbers[i].denominator !== expectedDenominator
      ) {
        vfile.message(
          `This guide has an incorrect sequence of steps - expecting a section called "## Step ${expectedNumerator}/${expectedDenominator}". ` +
            messageSuffix,
          stepNumbers[i].position,
        );
      }
    }
  },
);
