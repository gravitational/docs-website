import type { Root, Paragraph, Literal } from "mdast";
import type { VFile } from "vfile";
import type { Transformer } from "unified";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

export default function remarkExamples(latestVersion: string): Transformer {
  return (root: Root, vfile: VFile) => {
    // TODO: Get the version from the path
    const version = "FIXME";

    visit(root, (node: Node) => {
      console.log("NODE:", JSON.stringify(node, null, 2));
      if (node.type != "paragraph") {
        return;
      }

      const paragraph = node as Paragraph;
      if (paragraph.children.length != 1) {
        return;
      }

      const txt = paragraph.children[0] as Literal;

      if (!txt.value) {
        return;
      }

      if (!txt.value.startsWith("import")) {
        return;
      }

      const examplesPath = new RegExp(`import \w+ from ["']@examples/.*["']`);
      if (!examplesPath.test(txt.value)) {
        return;
      }

      paragraph.children = [
        {
          type: "text",
          value: txt.value.replace(
            "@examples",
            `!!raw-loader!@site/content/${version}/examples`
          ),
        },
      ];

      return;
    });
  };
}
