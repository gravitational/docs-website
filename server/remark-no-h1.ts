import type { MdxjsEsm } from "mdast-util-mdxjs-esm";
import type { Heading, Root } from "mdast";
import type { VFile } from "vfile";
import type { Transformer } from "unified";
import type { Node, Parent } from "unist";
import { visit, CONTINUE, SKIP } from "unist-util-visit";

const versionedDocsPattern = `versioned_docs/version-([0-9]+\\.x)/`;

// remarkNoH1 removes H1 elements from a docs page. This is because the docs
// engine uses the page's frontmatter to populate an H1. When including pages
// that include a spearate H1, such as the changelog, we can ensure there are no
// redundant H1s.
export default function remarkNoH1(): Transformer {
  return (root: Root, vfile: VFile) => {
    const par = root as Parent;
    let i = 0;
    while (i < par.children.length) {
      const hed = par.children[i] as Heading;
      if (hed.type == "heading" && hed.depth == 1) {
        par.children.splice(i, 1);
        // Don't advance the index since the number of elements will have
        // shrunk.
        continue;
      }
      i++;
    }
  };
}
