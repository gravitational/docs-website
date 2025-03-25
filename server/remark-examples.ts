import type { Root } from "mdast";
import type { VFile } from "vfile";
import type { Transformer } from "unified";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

export default function remarkExamples(latestVersion: string): Transformer {
  return (root: Root, vfile: VFile) => {
    visit(root, (node: Node) => {
      if (node.type != "text") {
        return;
      }
      if (!node.value.startsWith("import")) {
        return;
      }

      	// TODO: replace the node with the new one
      
      console.log("NODE:", JSON.stringify(node, null, 2));
      return;
    });
  };
}
