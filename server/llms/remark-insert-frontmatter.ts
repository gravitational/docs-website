import { Plugin } from "unified";
import { Root } from "mdast";
import { visit, EXIT } from "unist-util-visit";

const getPageTitle = (tree: Root): string => {
  let title = "";
  visit(tree, "heading", (node) => {
    if (node.depth === 1) {
      visit(node, "text", (textNode) => {
        title += textNode.value;
      });
      return EXIT;
    }
  });
  return title;
};

const insertFrontmatter = (title: string): string => {
  return `---\ntitle: ${title}\ntoken_count:\n---`;
};

// A remark plugin to insert a YAML frontmatter block at the beginning of the markdown file with the page title and an empty token_count field.
// The token_count field will be populated in a separate post-processing step after the markdown files are generated.
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
