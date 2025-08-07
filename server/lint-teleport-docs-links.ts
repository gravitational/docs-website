import { lintRule } from "unified-lint-rule";
import { visit } from "unist-util-visit";
import type { Link } from "mdast";
import type { EsmNode, MdxAnyElement, MdxastNode } from "./types-unist";
import type { Node } from "unist";

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
      ({ name, value }) => name === "href",
    )
  );
};

const isAnAbsoluteDocsLink = (href: string): boolean => {
  // The href is not a string value, and is likely an AST node object. Skip
  // the absolute link check.
  if (typeof href != "string") {
    return false;
  }
  return (
    href.startsWith("/docs") || href.startsWith("https://goteleport.com/docs")
  );
};

export const remarkLintTeleportDocsLinks = lintRule(
  "remark-lint:absolute-docs-links",
  (root: Node, vfile) => {
    visit(root, undefined, (node: Node) => {
      if (node.type == "link" && isAnAbsoluteDocsLink((node as Link).url)) {
        vfile.message(
          `Link reference ${
            (node as Link).url
          } must be a relative link to an *.mdx page`,
          node.position,
        );
        return;
      }

      if (isMdxComponentWithHref(node)) {
        const hrefAttribute = node.attributes.find(
          ({ name }) => name === "href",
        );

        if (isAnAbsoluteDocsLink(hrefAttribute.value as string)) {
          vfile.message(
            `Component href ${hrefAttribute.value} must be a relative link to an *.mdx page`,
            node.position,
          );
        }
      }
    });
  },
);
