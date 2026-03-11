import { Root, Element } from "hast";
import { Plugin } from "unified";
import { visitParents } from "unist-util-visit-parents";

// Moves the first h1 in the content to the top of the markdown file, in order for the output to have a proper title
const rehypeRepositionH1: Plugin<[], Root, Root> = function () {
  return (tree: Root) => {
    let h1: Element | null = null;
    let headerParent: Element | Root | null = null;
    let headerElement: Element | null = null;

    // Find the first h1 on the page and its containing header element
    visitParents(tree, "element", (node, ancestors) => {
      if (h1) return;
      const element = node as Element;
      if (element.tagName !== "h1") return;
      h1 = element;
      // look for the nearest <header> ancestor (defined in /src/theme/DocItem/Content/index.tsx)
      for (let i = ancestors.length - 1; i >= 0; i--) {
        const ancestor = ancestors[i] as Element;
        if (ancestor.type === "element" && ancestor.tagName === "header") {
          headerElement = ancestor;
          headerParent = ancestors[i - 1] as Element | Root;
          break;
        }
      }
      // If the h1 is not inside a <header>, treat its direct parent as the container
      if (!headerElement) {
        headerParent = ancestors[ancestors.length - 1] as Element | Root;
      }
    });

    if (!h1 || !headerParent) return;

    // Remove the entire <header> element (or just the h1's direct parent if no header)
    const nodeToRemove = headerElement ?? h1;
    headerParent.children = headerParent.children.filter(
      (child) => child !== nodeToRemove,
    );

    // Prepend the h1 to the root of the extracted content
    headerParent.children.unshift(h1);

    // Remove any duplicate h1 elements in the tree
    visitParents(tree, "element", (node, ancestors) => {
      const element = node as Element;
      if (element.tagName !== "h1" || element === h1) return;
      const parent = ancestors[ancestors.length - 1] as Element | Root;
      parent.children = parent.children.filter((child) => child !== element);
    });
  };
};

export default rehypeRepositionH1;
