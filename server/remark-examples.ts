import type { Root, Paragraph, Literal } from "mdast";
import type { VFile } from "vfile";
import type { Transformer } from "unified";
import type { Node } from "unist";
import { visit, CONTINUE, SKIP } from "unist-util-visit";

const versionedDocsPrefix = "versioned_docs";
const versionedDocsPattern = `versioned_docs/version-([0-9]+\\.x)/`;

export default function remarkExamples(latestVersion: string): Transformer {
  return (root: Root, vfile: VFile) => {
    visit(root, (node: Node) => {
      if (node.type != "paragraph") {
        return CONTINUE;
      }

      const paragraph = node as Paragraph;
      if (paragraph.children.length !== 1) {
        return CONTINUE;
      }

      const txt = paragraph.children[0] as Literal;
      if (!txt.value) {
        return CONTINUE;
      }

      if (!txt.value.startsWith("import")) {
        return CONTINUE;
      }

      const examplesPath = new RegExp(`import \\w+ from ["']@examples\\/.*["']`);
      if (!examplesPath.test(txt.value)) {
        return CONTINUE;
      }

      let version: string = latestVersion;
      const versionedPathParts = vfile.path.match(versionedDocsPrefix);
      if (versionedPathParts) {
        version = versionedPathParts[1];
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

      return SKIP;
    });
  };
}
