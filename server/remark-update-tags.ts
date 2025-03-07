/*
 * This plugin converts custom tags to Mintlify format.
 */

import type { Transformer } from "unified";
import type { Node, Parent } from "unist";
import type { Root, Text as MdastText, Code as MdastCode } from "mdast";
import type { MdxJsxElement } from "./types-unist";

import { nanoid } from "nanoid";
import { visit } from "unist-util-visit";
import { isMdxNode, getAttribute, getAttributeValue } from "./mdx-helpers";

// const componentNames = new Map([
//   ["tip", "Tip"],
//   ["warning", "Warning"],
//   ["note", "Note"],
// ]);

const isCodeNode = (node: Node): node is MdastCode => node.type === "code";

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

      // Details
      if (isMdxNode(node) && node.name === "Details") {
        parent.children[index] = {
          type: "mdxJsxFlowElement",
          name: "details",
          attributes: [],
          children: [
            {
              type: "mdxJsxFlowElement",
              name: "summary",
              attributes: [],
              children: [
                {
                  type: "text",
                  value: getAttributeValue(node, "title"),
                },
              ],
            },
            {
              type: "mdxJsxFlowElement",
              name: "div",
              attributes: [],
              children: node.children,
            },
          ],
        } as MdxJsxElement;

        return index; // to traverse children
      }

      // Unwrap Component
      if (
        isMdxNode(node) &&
        [
          "Figure",
          "TileSet",
          "TileList",
          "TileListItem",
          "ScopedBlock",
        ].includes(node.name)
      ) {
        parent.children.splice(index, 1, ...node.children); // unwrap children

        return index; // to traverse children
      }

      // Remove components
      if (isMdxNode(node) && ["Icon", "VarList"].includes(node.name)) {
        parent.children.splice(index, 1);

        return index; // index of the next element to traverse, in this case repeat the same index again
      }

      // Remove string styles from nodes
      if (isMdxNode(node)) {
        node.attributes = node.attributes.filter(
          (attrs) =>
            !(attrs.name === "style" && typeof attrs.value === "string")
        );
      }
    });
  };
}
