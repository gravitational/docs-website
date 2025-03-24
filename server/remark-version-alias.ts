import type { ImportDeclaration } from "estree";
import type { MdxjsEsm } from "mdast-util-mdxjs-esm";
import type { Root, Paragraph, Literal } from "mdast";
import type { VFile } from "vfile";
import type { Transformer } from "unified";
import type { Node } from "unist";
import { visit, CONTINUE, SKIP } from "unist-util-visit";

const versionedDocsPattern = `versioned_docs/version-([0-9]+\\.x)/`;

export default function remarkVersionAlias(latestVersion: string): Transformer {
  return (root: Root, vfile: VFile) => {
    visit(root, (node: Node) => {
      if (node.type != "mdxjsEsm") {
        return CONTINUE;
      }

      // Only process import statements that import an identifier from a default
      // export.
      const esm = node as unknown as MdxjsEsm;
      if (
        !esm.data ||
        !esm.data.estree ||
        esm.data.estree.body.length !== 1 ||
        esm.data.estree.body[0]["type"] != "ImportDeclaration" ||
        esm.data.estree.body[0].specifiers.length !== 1 ||
        esm.data.estree.body[0].specifiers[0].type != "ImportDefaultSpecifier"
      ) {
        return CONTINUE;
      }

      let version: string = latestVersion;
      const versionedPathParts = vfile.path.match(versionedDocsPattern);
      if (versionedPathParts) {
        version = versionedPathParts[1];
      }

      const decl = esm.data.estree.body[0] as ImportDeclaration;

      const newPath = (decl.source.value as string).replace(
        "@version",
        `@site/content/${version}`,
      );

      esm.value = `import ${esm.data.estree.body[0].specifiers[0].local.name} from '${newPath}'`;
      decl.source = {
        type: "Literal",
        value: newPath,
        raw: `"${newPath}"`,
      };

      return SKIP;
    });
  };
}
