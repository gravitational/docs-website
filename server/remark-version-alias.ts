import type { MdxjsEsm } from "mdast-util-mdxjs-esm";
import type { Root, Paragraph, Literal } from "mdast";
import type { VFile } from "vfile";
import type { Transformer } from "unified";
import type { Node } from "unist";
import { visit, CONTINUE, SKIP } from "unist-util-visit";

const versionedDocsPattern = `versioned_docs/version-([0-9]+\\.x)/`;

export default function remarkVersionAlias(currentVersion: string): Transformer {
  return (root: Root, vfile: VFile) => {
    visit(root, (node: Node) => {
      if (node.type != "mdxjsEsm") {
        return CONTINUE;
      }

      // Only process import statements that import an identifier from a default
      // export.
      const esm = node as unknown as MdxjsEsm;
      if (!esm.data || !esm.data.estree) {
        return CONTINUE;
      }

      let version: string = currentVersion;
      let newVal: Array<string> = [];
      const versionedPathParts = vfile.path.match(versionedDocsPattern);
      if (versionedPathParts) {
        version = versionedPathParts[1];
      }

      esm.data.estree.body.forEach((decl) => {
        if (
          decl["type"] != "ImportDeclaration" ||
          decl.specifiers.length !== 1 ||
          decl.specifiers[0].type != "ImportDefaultSpecifier"
        ) {
          return;
        }
        const newPath = (decl.source.value as string).replace(
          "@version",
          `@site/content/${version}`,
        );
        decl.source = {
          type: "Literal",
          value: newPath,
          raw: `"${newPath}"`,
        };

        newVal.push(
          `import ${decl.specifiers[0].local.name} from '${newPath}';`,
        );
      });

      esm.value = newVal.join("\n");

      return SKIP;
    });
  };
}
