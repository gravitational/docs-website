import { lintRule } from "unified-lint-rule";
import type { Heading, Code, Text } from "mdast";
import type { Node, Parent } from "unist";

const stepHeadingPattern = /^Step [0-9]+\/[0-9]+/;
const messageSuffix = `Disable this warning by adding {/* lint ignore page-structure remark-lint */} before this line.`;

// Returns true if the subtree rooted at node contains a code block that an
// automated agent can execute without human interaction. This includes:
//   - Shell commands (lines starting with "$ ")
//   - SQL blocks (lang="sql"): database commands are machine-executable
//   - Diff/patch blocks (lang="diff"): patches can be applied programmatically
//   - Config file blocks: a code block whose first non-empty line is a file
//     path comment (e.g. `# /etc/teleport.yaml`) represents a file to write,
//     which is automatable
function hasShellCommand(node: Node): boolean {
  const code = node as Code;
  if (code.type === "code") {
    if (code.lang === "sql" || code.lang === "diff") {
      return true;
    }
    const lines = code.value.split("\n");
    if (lines.some((line) => line.startsWith("$ "))) {
      return true;
    }
    const firstNonEmpty = lines.find((l) => l.trim() !== "") ?? "";
    if (firstNonEmpty.match(/^#\s*\//)) {
      return true;
    }
    return false;
  }
  const parent = node as Parent;
  if (parent.children) {
    return parent.children.some(hasShellCommand);
  }
  return false;
}

export const remarkLintNoHumanInteractionSteps = lintRule(
  "remark-lint:no-human-interaction-steps",
  (root: Node, vfile) => {
    const children = (root as Parent).children;

    // Collect the root-level indices of all h2 headings so we can slice each
    // step section precisely.
    const h2Indices: number[] = [];
    children.forEach((child, idx) => {
      const hed = child as Heading;
      if (hed.type === "heading" && hed.depth === 2) {
        h2Indices.push(idx);
      }
    });

    // For each h2 that is a step heading, check whether its section contains
    // at least one shell command.
    h2Indices.forEach((headingIdx, i) => {
      const headingNode = children[headingIdx] as Heading;
      const textNode = headingNode.children[0] as Text;
      if (!stepHeadingPattern.test(textNode.value)) {
        return;
      }

      // The section runs from the node after the heading to the next h2 (or
      // end of document).
      const nextH2Idx = h2Indices[i + 1] ?? children.length;
      const sectionNodes = children.slice(headingIdx + 1, nextH2Idx);

      if (!sectionNodes.some(hasShellCommand)) {
        vfile.message(
          `Step "${textNode.value}" contains no shell commands (lines starting with "$ "). ` +
            `Steps that contain only UI instructions require human interaction and cannot be ` +
            `followed by an automated agent. Consider adding a CLI-based alternative. ` +
            messageSuffix,
          textNode.position,
        );
      }
    });
  },
);
