import { lintRule } from "unified-lint-rule";
import { visit } from "unist-util-visit";
import type { Heading, Code, Paragraph, Text } from "mdast";
import type {
  MdxJsxFlowElement,
  EsmNode,
  MdxAnyElement,
  MdxastNode,
} from "./types-unist";
import type { Node, Parent, Position } from "unist";

const mdxNodeTypes = new Set(["mdxJsxFlowElement", "mdxJsxTextElement"]);

interface stepNumber {
  numerator: number;
  denominator: number;
  position: Position;
}

interface headingWithIndex {
  level: number;
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
    const allHeadings: Array<headingWithIndex> = [];
    const paras: Array<paragraphWithIndex> = [];

    // Collect paragraphs and headings from first-level children of root.
    (root as Parent).children.forEach((node, idx) => {
      const hed = node as Heading;
      if (hed.type == "heading") {
        allHeadings.push({
          node: hed.children[0] as Text,
          level: hed.depth,
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

      // Also check for possible h2 headings in jsx components.
      const jsx = node as MdxJsxFlowElement;
      if (jsx.type === "mdxJsxFlowElement" && jsx.children) {
        (jsx as Parent).children.forEach((child, childIdx) => {
          const hed = child as Heading;
          if (hed.type == "heading") {
            allHeadings.push({
              node: hed.children[0] as Text,
              level: hed.depth,
              rootIndex: idx + (childIdx + 1) / 1000, // Make sure the index is between idx and idx+1
            });
          }

          const para = child as Paragraph;
          if (para.type == "paragraph") {
            paras.push({
              node: para,
              rootIndex: idx + (childIdx + 1) / 1000,
            });
          }
        });
      }
    });

    const firstH2 = allHeadings.findIndex((h) => h.level == 2);

    // See if there is a paragraph that comes before the first H2 in root's
    // children. We compare indices instead of line numbers because
    // remark-includes preserves the line numbers of any partials it includes.
    if (
      firstH2 !== -1 &&
      !paras.some((para) => {
        return para.rootIndex < allHeadings[firstH2].rootIndex;
      })
    ) {
      vfile.message(
        "This guide is missing at least one introductory paragraph before the first H2. Use introductory paragraphs to explain the purpose and scope of this guide. " +
          messageSuffix,
        allHeadings[firstH2].node.position,
      );
    }

    const indexToHeading = new Map();
    allHeadings.forEach((h) => {
      indexToHeading.set(h.rootIndex, true);
    });

    allHeadings.forEach((h) => {
      if (indexToHeading.has(h.rootIndex + 1)) {
        vfile.message(
          `This guide is missing content to introduce the section "${h.node.value}". Explain the section with an introduction or consider removing this heading and reducing the levels of the subheadings. ` +
            messageSuffix,
          h.node.position,
        );
      }
    });

    const hasStep = allHeadings.some((h) => {
      return h.level == 2 && h.node.value.match(/^Step [0-9]/) !== null;
    });
    if (hasStep && allHeadings[firstH2].node.value !== "How it works") {
      vfile.message(
        "In a how-to guide, the first H2-level section must be called `## How it works`. Use this section to include 1-3 paragraphs that describe the high-level architecture of the setup shown in the guide. " +
          messageSuffix,
        allHeadings[firstH2].node.position,
      );
    }

    const stepNumbers: Array<stepNumber> = [];
    allHeadings.forEach((heading) => {
      if (heading.level !== 2) {
        return;
      }
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

    const varPattern = /<Var[^>]+\/?>/g;
    const varNameQuotePattern = /name\s*=\s*(["'])/;
    const varNames = new Map();
    // The first position of each Var. We only need one since we only use this
    // for single-instance Vars.
    const varPositions = new Map();

    visit(root, undefined, (node: Node) => {
      // Collect the names of Vars that are outside of code blocks.
      const el = node as MdxAnyElement;
      if (
        (node.type == "mdxJsxTextElement" ||
          node.type == "mdxJsxFlowElement") &&
        el.name == "Var"
      ) {
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

      // In a code block, Vars are strings, so find them using regular
      // expressions.
      const code = node as Code;
      if (code.type == "code" || code.type == "inlineCode") {
        const vars = code.value.matchAll(varPattern);
        vars.forEach((v) => {
          // Determine if the "name" param uses single or double quotes.
          const varQuote = v[0].match(varNameQuotePattern);
          if (!varQuote) {
            vfile.message(
              `Var component found without a valid name`,
              node.position,
            );
          }

          // Extract the name. We know that there is a valid name parameter, so
          // the array indices are guaranteed to be in range.
          const namePattern = `name\\s*=\\s*${varQuote[1]}([^${varQuote[1]}]+)${varQuote[1]}`;
          const varName = v[0].match(new RegExp(namePattern))[1];
          if (!varNames.has(varName)) {
            varNames.set(varName, 0);
            varPositions.set(varName, code.position);
            return;
          }
          varNames.set(varName, varNames.get(varName) + 1);
        });
      }
    });

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
  },
);
