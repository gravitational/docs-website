import { Root, Element } from "hast";
import { Plugin } from "unified";
import { visitParents } from "unist-util-visit-parents";

// Remove interactive components which are not relevant for the markdown page output
const rehypeRemoveIrrelevantComponents: Plugin<[], Root, Root> = function () {
  const irrelevantClassPrefixes = ["thumbsFeedback", "checkpoint"]; // Add any other class prefixes for irrelevant components as needed
  return (tree: Root) => {
    const toRemove: Array<{ node: Element | import("hast").Comment; parent: Element | Root }> = [];

    visitParents(tree, "element", (node, ancestors) => {
      const element = node as Element;
      const classNames = element.properties?.className;
      const classNameArray = Array.isArray(classNames) ? classNames : [];
      if (
        !classNameArray.some((c) =>
          irrelevantClassPrefixes.some((prefix) =>
            String(c).startsWith(prefix),
          ),
        )
      )
        return;

      const parent = ancestors[ancestors.length - 1] as Element | Root;
      toRemove.push({ node: element, parent });
    });

    // Remove empty comments that are left in the html output (<!-- -->)
    visitParents(tree, "comment", (node, ancestors) => {
      if (node.value.trim() === "") {
        const parent = ancestors[ancestors.length - 1] as Element | Root;
        toRemove.push({ node, parent });
      }
    });

    for (const { node, parent } of toRemove) {
      parent.children = parent.children.filter((child) => child !== node);
    }
  };
};

export default rehypeRemoveIrrelevantComponents;
