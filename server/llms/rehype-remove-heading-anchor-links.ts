import { Root, Element } from "hast";
import { Plugin } from "unified";
import { visitParents } from "unist-util-visit-parents";

// Removes anchor links from page headings, which are not relevant for the markdown page output
const rehypeRemoveHeadingAnchorLinks: Plugin<[], Root, Root> = function () {
  return (tree: Root) => {
    visitParents(tree, "element", (node) => {
      const element = node as Element;
      if (!/^h[1-6]$/.test(element.tagName)) return;

      element.children = element.children.filter((child) => {
        if (child.type !== "element") return true;
        const childEl = child as Element;
        if (childEl.tagName !== "a") return true;
        const classes = childEl.properties?.className;
        const classArray = Array.isArray(classes) ? classes : [];
        return !classArray.includes("hash-link");
      });
    });
  };
};

export default rehypeRemoveHeadingAnchorLinks;
