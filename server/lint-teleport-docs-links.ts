import type { Node } from "unist";
import type { Transformer } from "unified";
import type { Root, Link as MdastLink } from "mdast";
import type { EsmNode, MdxAnyElement } from "./types-unist";

import { visit } from "unist-util-visit";
import { isExternalLink, isHash, isPage } from "../utils/url";

interface ObjectHref {
  src: string;
}

type Href = string | ObjectHref;

const mdxNodeTypes = new Set(["mdxJsxFlowElement", "mdxJsxTextElement"]);

const isMdxComponentWithHref = (node: Node): node is MdxAnyElement => {
  return (
    mdxNodeTypes.has(node.type) &&
    (node as MdxAnyElement).attributes.some(
      ({ name, value }) => name === "href"
    )
  );
};

const isAnAbsoluteDocsLink = (href: string): boolean => {
  return (
    href.startsWith("/docs") || href.startsWith("https://goteleport.com/docs")
  );
};

export function remarkLintTeleportDocsLinks(): Transformer {
  return (root: Root, vfile) => {
    visit(root, (node: Node) => {
      if (
        node.type == "link" &&
        isAnAbsoluteDocsLink((node as MdastLink).url)
      ) {
        vfile.message(
          `Link reference ${
            (node as MdastLink).url
          } must be a relative link to an *.mdx page`,
          node.position
        );
        return;
      }

      if (isMdxComponentWithHref(node)) {
        const hrefAttribute = node.attributes.find(
          ({ name }) => name === "href"
        );

        if (isAnAbsoluteDocsLink(hrefAttribute.value as string)) {
          vfile.message(
            `Component href ${hrefAttribute.value} must be a relative link to an *.mdx page`,
            node.position
          );
        }
      }
    });
  };
}
