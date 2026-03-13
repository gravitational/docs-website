import { Root, Element } from "hast";
import { Plugin } from "unified";
import { visitParents } from "unist-util-visit-parents";

// Removes the thumbs feedback section at the bottom of the page, which is not relevant for the markdown page output
const rehypeRemoveBottomFeedback: Plugin<[], Root, Root> = function () {
  return (tree: Root) => {
    visitParents(tree, "element", (node, ancestors) => {
      const element = node as Element;
      const classNames = element.properties?.className;
      const classNameArray = Array.isArray(classNames) ? classNames : [];
      if (!classNameArray.some((c) => String(c).startsWith("thumbsFeedback")))
        return;
      const parent = ancestors[ancestors.length - 1] as Element | Root;
      parent.children = parent.children.filter((child) => child !== element);
    });
  };
};

export default rehypeRemoveBottomFeedback;
