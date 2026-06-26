import { fromMarkdown } from "mdast-util-from-markdown";
import { visit, EXIT, SKIP } from "unist-util-visit";
import type { Text } from "mdast";
import { toHast } from "mdast-util-to-hast";
import { toHtml } from "hast-util-to-html";

// Extracts the readable name and description from the content of a SKILL.md file.
// The readable name is taken from the first H1 heading, and the description from the
// first paragraph following it.
export function parseSkillMarkdown(content: Buffer | string): {
  readableName: string | null;
  description: string | null;
} {
  const tree = fromMarkdown(content);

  let readableName: string | null = null;
  let description: string | null = null;
  let prevNodeWasH1 = false;

  visit(tree, undefined, (node) => {
    if (node.type === "heading" && node.depth === 1) {
      const textNode = node.children.find((child) => child.type === "text") as
        | Text
        | undefined;
      if (textNode) {
        readableName = textNode.value;
        prevNodeWasH1 = true;
        return SKIP;
      }
    }

    if (node.type === "paragraph" && prevNodeWasH1) {
      const hast = toHast(node as any);
      if (hast) {
        description = toHtml(hast);
        return EXIT;
      }
    }
  });

  return { readableName, description };
}
