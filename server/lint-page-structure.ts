import { lintRule } from "unified-lint-rule";
import { visit } from "unist-util-visit";
import type { Heading, Text } from "mdast";
import type { EsmNode, MdxAnyElement, MdxastNode } from "./types-unist";
import type { Node, Position } from "unist";

const mdxNodeTypes = new Set(["mdxJsxFlowElement", "mdxJsxTextElement"]);

interface stepNumber {
  numerator: number;
  denominator: number;
  position: Position;
}

const stepNumberPattern = `^Step ([0-9]+)/([0-9]+)`;
const messageSuffix = `Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.`;

export const remarkLintPageStructure = lintRule(
  "remark-lint:page-structure",
  (root: Node, vfile) => {
    const h2s: Array<Text> = [];
    visit(root, undefined, (node: Node) => {
      const hed = node as Heading;
      if (hed.type == "heading" && hed.depth == 2) {
        // A Heading as parsed by remark-mdx only has a single child, the
        // heading text.
        h2s.push(hed.children[0] as Text);
      }
    });

    const hasStep = h2s.some((h) => h.value.match(/^Step [0-9]/) !== null);
    if (hasStep && h2s[0].value !== "How it works") {
      vfile.message(
        "In a how-to guide, the first H2-level section must be called `## How it works`. Use this section to include 1-3 paragraphs that describe the high-level architecture of the setup shown in the guide. " +
          messageSuffix,
        h2s[0].position,
      );
    }
    const stepNumbers: Array<stepNumber> = [];
    h2s.forEach((heading) => {
      const parts = heading.value.match(stepNumberPattern);
      if (parts !== null) {
        stepNumbers.push({
          numerator: parseInt(parts[1]),
          denominator: parseInt(parts[2]),
          position: heading.position,
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
