import * as nodeFS from "fs";
import path from "path";
import matter from "gray-matter";
import { visitParents } from "unist-util-visit-parents";
import { fromMarkdown } from "mdast-util-from-markdown";
import type { Parent } from "unist";
import type { VFile } from "vfile";
import type { Root, Content } from "mdast";
import type { Transformer } from "unified";

const tocRegexpPattern = "^\\(!toc!\\)$";

// remarkTOC replaces (!toc!) syntax in a page with a list of docs pages at a
// given directory location.
export default function remarkTOC(): Transformer {
  return (root: Content, vfile: VFile) => {
    const lastErrorIndex = vfile.messages.length;

    visitParents(root, (node, ancestors: Parent[]) => {
      if (node.type !== "text") {
        return;
      }
      const parent = ancestors[ancestors.length - 1];

      if (parent.type !== "paragraph") {
        return;
      }
      if (!parent.children || parent.children.length !== 1) {
        return;
      }

      const tocExpr = node.value.trim().match(tocRegexpPattern);
      if (!tocExpr) {
        return;
      }

      const tree = {
        type: "mdxJsxFlowElement",
        name: "DocCardList",
        attributes: [],
        children: [],
      };

      const grandParent = ancestors[ancestors.length - 2] as Parent;
      const parentIndex = grandParent.children.indexOf(parent);

      grandParent.children.splice(parentIndex, 1, tree);
    });
  };
}
