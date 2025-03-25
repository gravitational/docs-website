import type { Root } from "mdast";
import type { VFile } from "vfile";
import type { Transformer } from "unified";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

export default function remarkExamples(latestVersion: string): Transformer {
  return (root: Root, vfile: VFile) => {
    visit(root, (node: Node) => {
      return;
    });
  };
}
