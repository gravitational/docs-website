import type { Root, Paragraph, Literal } from "mdast";
import type { MdxjsEsm } from "mdast-util-mdxjs-esm";
import type { VFile } from "vfile";
import type { Transformer } from "unified";
import type { Node } from "unist";
import * as acorn from "acorn";
import { visit, CONTINUE, SKIP } from "unist-util-visit";
import mdx from "remark-mdx";
import { remark } from "remark";
import { fromMarkdown } from "mdast-util-from-markdown";
import { mdxjsEsmFromMarkdown } from "mdast-util-mdxjs-esm";
import { mdxjsEsm } from "micromark-extension-mdxjs-esm";

const versionedDocsPattern = `versioned_docs/version-([0-9]+\\.x)/`;

export default function remarkExamples(latestVersion: string): Transformer {
  return (root: Root, vfile: VFile) => {
    visit(root, (node: Node) => {
      if (node.type != "mdxjsEsm") {
        return CONTINUE;
      }

      console.log(JSON.stringify(node, null, 2));

      const esm = node as unknown as MdxjsEsm;
      const examplesPath = new RegExp(
        `import \\w+ from ["']@examples\\/.*["']`
      );
      if (!examplesPath.test(esm.value)) {
        return CONTINUE;
      }

      let version: string = latestVersion;
      const versionedPathParts = vfile.path.match(versionedDocsPattern);
      if (versionedPathParts) {
        version = versionedPathParts[1];
      }

      const program = fromMarkdown(
        esm.value.replace(
          "@examples",
          `!!raw-loader!@site/content/${version}/examples`
        ),
        {
          extensions: [mdxjsEsm({ acorn, addResult: true })],
          mdastExtensions: [mdxjsEsmFromMarkdown()],
        }
      );

      console.log("program:", JSON.stringify(program, null, 2));

      // TODO: parse the new import statement and replace the mdxJsEsm node's
      // children with it.
      //      paragraph.children = [
      //        {
      //          type: "text",
      //          value: txt.value.replace(
      //            "@examples",
      //            `!!raw-loader!@site/content/${version}/examples`
      //          ),
      //        },
      //      ];

      return SKIP;
    });
  };
}
