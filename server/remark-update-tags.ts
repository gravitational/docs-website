/*
 * This plugin converts custom tags to Mintlify format.
 */

import type { Transformer } from "unified";
import type { Parent } from "unist";
import type { Root } from "mdast";

import { nanoid } from "nanoid";
import { visit } from "unist-util-visit";
import { isMdxNode } from "./mdx-helpers";

export default function remarkMigrationUpdateTags(): Transformer {
  return (root: Root) => {
    visit(root, (node, index, parent: Parent) => {
      // TabItem
      if (isMdxNode(node) && ["TabItem", "TabsItem"].includes(node.name)) {
        node.name = "TabItem";
        node.attributes.push({
          value: nanoid(),
          name: "value",
          type: "mdxJsxAttribute",
        });
      }
    });
  };
}
