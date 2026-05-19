import { lintRule } from "unified-lint-rule";
import { visit } from "unist-util-visit";
import type { Code, Heading, Literal, Paragraph, Text } from "mdast";
import type { MdxJsxFlowElement, MdxAnyElement } from "./types-unist";
import type { Node, Parent, Position } from "unist";
import { parse } from "yaml";

interface stepNumber {
  numerator: number;
  denominator: number;
  position: Position | undefined;
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

interface OutcomePatternCheck {
  pattern: string;
  error: string;
}

// allowedOutcomePatterns maps values of the page_type frontmatter field to
// rules for the content of an outcome statement. The opening paragraphs of a
// docs page must include a paragraph that matches the pattern, providing a
// concise description of the scope of the page.
const allowedOutcomePatterns: Record<string, OutcomePatternCheck> = {
  "how-to": {
    pattern: `(After following this guide, you will|This guide shows you how to|In this guide, you will)`,
    error: `In a how-to guide, the introductory section must include an outcome statement with one of the following prefixes: "After following this guide, you will", "This guide shows you how to", "In this guide, you will". This must be a concrete objective you expect the reader to have achieved.`,
  },
  troubleshooting: {
    pattern: `This page describes common issues.+how to work around or resolve them`,
    error: `In a troubleshooting guide, the introductory section must include an outcome statement with the pattern, "This page describes common issues...how to work around or resolve them". An example is, "This page describes common issues with connecting self-hosted MySQL databases to Teleport and how to work around or resolve them.`,
  },
  conceptual: {
    pattern: `This page describes (how|what|the)`,
    error: `In a conceptual guide, the introductory section must include an outcome statement with one of the following prefixes: "This page describes how", "This page describes what", or "This page describes the". The rest of the outcome statement consists of the concept this page sets out to explain.`,
  },
  faq: {
    pattern: `This page provides answers to frequently asked questions about`,
    error: `In a FAQ page, the introductory section must include an outcome statement with the prefix, "This page provides answers to frequently asked questions about", plus the subject of the FAQ page.`,
  },
  reference: {
    pattern: `This page lists the`,
    error: `In a reference page, the introductory section must include an outcome statement with the prefix, "This page lists the", plus the kinds of items that this page provides a reference for.`,
  },
};

export const remarkLintPageStructure = lintRule(
  "remark-lint:page-structure",
  (root: Node, vfile) => {
    const h2s: Array<h2WithIndex> = [];
    const paras: Array<paragraphWithIndex> = [];
    let frontmatter: Record<string, any> = {};
    visit(root, "yaml", (node: Node) => {
      try {
        frontmatter = parse((node as Literal).value) ?? {};
      } catch (err) {
        vfile.message(
          `page has invalid YAML in frontmatter: ${(err as Error).message}`,
        );
        return;
      }
    });

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

      // Also check for possible h2 headings in jsx components.
      const jsx = node as MdxJsxFlowElement;
      if (jsx.type === "mdxJsxFlowElement" && jsx.children) {
        (jsx as Parent).children.forEach((child, childIdx) => {
          const hed = child as Heading;
          if (hed.type == "heading" && hed.depth == 2) {
            h2s.push({
              node: hed.children[0] as Text,
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

    if (h2s.length > 0) {
      const introParas = paras.filter((para) => {
        return para.rootIndex < h2s[0].rootIndex;
      });

      // See if there is a paragraph that comes before the first H2 in root's
      // children. We compare indices instead of line numbers because
      // remark-includes preserves the line numbers of any partials it includes.
      if (introParas.length === 0) {
        vfile.message(
          "This guide is missing at least one introductory paragraph before the first H2. Use introductory paragraphs to explain the purpose and scope of this guide. " +
            messageSuffix,
          h2s[0].node.position,
        );
      }

      const outcome = allowedOutcomePatterns[frontmatter.page_type];
      // If there is no intro paragraph, the error message above will have
      // alerted the author. Otherwise, dig in further to see if there is an
      // outcome statement.
      if (outcome && introParas.length > 0) {
        const outcomeRE = new RegExp(outcome.pattern);
        const hasOutcomeParagraph = introParas.some((pwi) => {
          const para = pwi.node;
          // Collect text nodes from the paragraph. We expect the outcome
          // statement pattern to match text, rather than HTML elements, so we
          // only perform a first-level search for text nodes.
          const txt = para.children.reduce((accum, current) => {
            if (current.type !== "text") {
              return accum;
            }
            // Put all paragraph text on a single line for evaluation.
            return accum + current.value.replaceAll(`\n`, " ");
          }, "");
          return outcomeRE.test(txt);
        });
        if (!hasOutcomeParagraph) {
          vfile.message(
            outcome.error + " " + messageSuffix,
            introParas[0].node.position,
          );
        }
      }
    }

    // We are using the presence of a "## Step" section as a proxy for a how-to
    // guide until we can roll out the page_type frontmatter field to all
    // how-to guides.
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
          const namePattern = `name\\s*=\\s*${varQuote![1]}([^${varQuote![1]}]+)${varQuote![1]}`;
          const varName = v[0].match(new RegExp(namePattern))![1];
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
