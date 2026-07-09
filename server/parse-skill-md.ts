import { fromMarkdown } from "mdast-util-from-markdown";
import { frontmatterFromMarkdown } from "mdast-util-frontmatter";
import { frontmatter } from "micromark-extension-frontmatter";
import { visit, EXIT, SKIP } from "unist-util-visit";
import type { Text } from "mdast";
import { toHast } from "mdast-util-to-hast";
import { toHtml } from "hast-util-to-html";
import { load as loadYaml } from "js-yaml";

// Extracts the readable name and description from the content of a SKILL.md file.
// The readable name is taken from the first H1 heading, and the description from the
// first paragraph following it.
export function parseSkillMarkdown(content: Buffer | string): {
  readableName: string | null;
  description: string | null;
} {
  const tree = fromMarkdown(content, {
    extensions: [frontmatter(["yaml"])],
    mdastExtensions: [frontmatterFromMarkdown(["yaml"])],
  });

  let readableName: string | null = null;
  let description: string | null = null;
  let prevNodeWasH1 = false;

  visit(tree, undefined, (node) => {
    // Use the frontmatter description as a fallback in case the body text doesn't have a proper description.
    if (node.type === "yaml") {
      const parsed = loadYaml(node.value) as Record<string, unknown>;
      if (parsed && typeof parsed.description === "string") {
        description = parsed.description.trim();
        return SKIP;
      }
    }
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
    } else if (node.type !== "paragraph" && prevNodeWasH1) {
      // If we encounter a non-paragraph node after the H1, reset the flag
      // to avoid capturing unrelated content as the description.
      prevNodeWasH1 = false;
    }
  });

  return { readableName, description };
}
