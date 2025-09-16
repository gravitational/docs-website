import { lintRule } from "unified-lint-rule";
import { visit } from "unist-util-visit";
import type { Heading, Text, Code } from "mdast";
import type { EsmNode, MdxAnyElement, MdxastNode } from "./types-unist";
import type { Node, Position } from "unist";

interface stepNumber {
  numerator: number;
  denominator: number;
  position: Position;
}

const stepNumberPattern = `^Step ([0-9]+)/([0-9]+)`;
const messageSuffix = `Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.`;
const varPattern = /<Var\s+name="([^"]+)"/g;

export const remarkLintPageStructure = lintRule(
  "remark-lint:page-structure",
  (root: Node, vfile) => {
    // Declare data structures for collecting page structure elements when we
    // traverse the tree. After traversal, we'll explore these data structures
    // to identify issues.
    const h2s: Array<Text> = [];
    const varNames = new Map();
    // The first position of each Var. We only need one since we only use this
    // for single-instance Vars.
    const varPositions = new Map();

    visit(root, undefined, (node: Node) => {
      // Collect the names of Vars that are outside of code blocks.
      //
      const el = node as MdxAnyElement;
      if (el.type == "mdxJsxTextElement" && el.name == "Var") {
        el.attributes.forEach((a) => {
          if (a.name == "name") {
            if (!varNames.has(a.value)) {
              varNames.set(a.value, 0);
              varPositions.set(a.value, el.position);
              return;
            }
            varNames.set(a.value, varNames.get(a.value) + 1);
          }
        });
      }

      const hed = node as Heading;
      if (hed.type == "heading" && hed.depth == 2) {
        // A Heading as parsed by remark-mdx only has a single child, the
        // heading text.
        h2s.push(hed.children[0] as Text);
      }

      // In a code block, Vars are strings, so find them using regular
      // expressions.
      const code = node as Code;
      if (code.type == "code" || code.type == "inlineCode") {
        const vars = code.value.matchAll(varPattern);
        vars.forEach((v) => {
          const varName = v[1];
          if (!varNames.has(varName)) {
            varNames.set(varName, 0);
            varPositions.set(varName, code.position);
            return;
          }
          varNames.set(varName, varNames.get(varName) + 1);
        });
      }
    });

    if (vfile.path.includes("oracle-exadata.mdx")) {
      console.log("varNames in exadata:", varNames);
    }

    varNames.forEach((val, key) => {
      if (val > 0) {
        return;
      }
      vfile.message(
        `There is only a single instance of the Var named "${key}" on this page. Add another instance, making it explicit that the user can assign the variable. ` +
          messageSuffix,
        varPositions.get(key),
      );
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
