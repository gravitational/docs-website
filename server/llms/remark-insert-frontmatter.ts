import { Plugin } from "unified";
import { Root, Text } from "mdast";
import { visit, EXIT } from "unist-util-visit";

const getPageTitle = (tree: Root): string => {
  let title = "";
  visit(tree, "heading", (node) => {
    if (node.depth === 1) {
      title = (node.children[0] as Text).value;
      return EXIT; // Stop traversing after finding the h1
    }
  });
  return title;
};

const insertFrontmatter = (title: string): string => {
  return `---\ntitle: ${title}\ntoken_count:\n---`;
};

// A remark plugin to insert a YAML frontmatter block at the beginning of the markdown file with the page title and an empty token_count field.
// The token_count field is left empty here and populated in a separate post-build step (see ./add-token-counts.ts).
// The token counter reads the final .md files as strings to ensure the token count is more accurate as it includes any additional processing.
const remarkInsertFrontmatter: Plugin<[], Root, Root> = function () {
  return (tree: Root) => {
    const title = getPageTitle(tree);

    tree.children.unshift({
      type: "html",
      value: insertFrontmatter(title),
    });
  };
};

export default remarkInsertFrontmatter;
