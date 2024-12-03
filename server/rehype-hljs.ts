import { unified, Transformer } from "unified";
import type { VFile } from "vfile";
import rehypeHighlight, {
  Options as RehypeHighlightOptions,
} from "rehype-highlight";
import { common } from "lowlight";
import { visit, CONTINUE, SKIP } from "unist-util-visit";
import { v4 as uuid } from "uuid";
import remarkParse from "remark-parse";
import type { Text, Element, Node, Parent } from "hast";
import remarkMDX from "remark-mdx";

const makePlaceholder = (): string => {
  // UUID for uniqueness, but remove hyphens since these are often parsed
  // as operators or other non-identifier tokens. Make sure the placeholder
  // begins with a letter so it gets parsed as an identifier.
  return "var" + uuid().replaceAll("-", "");
};

const placeholderPattern = "var[a-z0-9]{32}";

export const rehypeHLJS = (options?: RehypeHighlightOptions): Transformer => {
  return (root: Parent, file: VFile) => {
    // We only visit text nodes inside code snippets that include either the
    // <Var tag or (if we have already swapped out Vars with placeholders) a
    // placeholder.
    const isVarContainer = (node: Node) => {
      let textValue;
      if (node.type === "text") {
        textValue = node.value;
      } else if (
        node.type === "element" &&
        node.children.length === 1 &&
        node.children[0].type === "text"
      ) {
        textValue = node.children[0].value;
      } else {
        return false;
      }

      const placeHolderRE = new RegExp(placeholderPattern);

      return textValue.includes("<Var") || placeHolderRE.test(textValue);
    };

    // Highlight common languages in addition to any additional configured ones.
    options.languages = { ...options.languages, ...common };

    // Configure the highlighter to treat unlabeled code snippets as having the
    // "text" language by enabling detection and making "text" the only
    // possible language.
    options.detect = true;
    options.subset = ["text"];

    const highlighter = rehypeHighlight(options);
    let placeholdersToVars: Record<string, Node> = {};

    // In a code snippet, Var elements are parsed as text. Replace these with
    // UUID strings to ensure that the parser won't split these up and make
    // them unrecoverable.
    visit(root, isVarContainer, (node: Node, index: number, parent: Parent) => {
      const varPattern = new RegExp("<Var [^>]+/>", "g");
      let txt: Text;
      if (node.type == "text") {
        txt = node;
      } else {
        // isVarContainer enforces having a single child text node
        txt = node.children[0];
      }

      const newVal = txt.value.replace(varPattern, (match) => {
        const placeholder = makePlaceholder();
        // Since the Var element was originally text, parse it so we can recover
        // its properties. The result should be a small HTML AST with a root
        // node and one child, the Var node.
        const varElement = unified()
          .use(remarkParse)
          .use(remarkMDX)
          .parse(match);

        placeholdersToVars[placeholder] = varElement.children[0];
        return placeholder;
      });
      if (node.type == "text") {
        node.value = newVal;
      } else {
        node.children[0].value = newVal;
      }
    });

    // Apply syntax highlighting
    (highlighter as Function)(root, file);

    // After syntax highlighting, the content of the code snippet will be a
    // series of span elements with different "hljs-*" classes. Find the
    // placeholder UUIDs and replace them with their original Var elements,
    // inserting these as HTML AST nodes.
    visit(root, isVarContainer, (node: Node, index: number, parent: Parent) => {
      const el = node as Element | Text;
      let hljsSpanValue = "";
      if (el.type === "text") {
        hljsSpanValue = el.value;
      } else {
        hljsSpanValue = (el.children[0] as Text).value;
      }

      // This is either a text node or an hljs span with only the placeholder as
      // its child. We don't need the node, so replace it with the original
      // Var.
      if (placeholdersToVars[hljsSpanValue]) {
        (parent as any).children[index] = placeholdersToVars[hljsSpanValue];
        return [CONTINUE];
      }

      const placeholders = Array.from(
        hljsSpanValue.matchAll(new RegExp(placeholderPattern, "g"))
      );

      // No placeholders to recover, so there's nothing more to do.
      if (placeholders.length == 0) {
        return [CONTINUE];
      }

      // The element's text includes one or more Vars among other content, so we
      // need to replace the span (or text node) with a series of spans (or
      // text nodes) separated by Vars.
      let newChildren: Array<Text | Element> = [];

      // Assemble a map of indexes to their corresponding placeholders so we
      // can tell whether a given index falls within a placeholder.
      const placeholderIndices = new Map();
      placeholders.forEach((p) => {
        placeholderIndices.set(p.index, p[0]);
      });

      let valueIdx = 0;
      while (valueIdx < hljsSpanValue.length) {
        // The current index is in a placeholder, so add the original Var
        // component to newChildren.
        if (placeholderIndices.has(valueIdx)) {
          const placeholder = placeholderIndices.get(valueIdx);
          valueIdx += placeholder.length;
          newChildren.push(placeholdersToVars[placeholder] as Element);
          continue;
        }
        // The current index is outside a placeholder, so assemble a text or
        // span node and push that to newChildren.
        let textVal = "";
        while (
          !placeholderIndices.has(valueIdx) &&
          valueIdx < hljsSpanValue.length
        ) {
          textVal += hljsSpanValue[valueIdx];
          valueIdx++;
        }
        if (el.type === "text") {
          newChildren.push({
            type: "text",
            value: textVal,
          });
        } else {
          newChildren.push({
            tagName: "span",
            type: "element",
            properties: el.properties,
            children: [
              {
                type: "text",
                value: textVal,
              },
            ],
          });
        }
      }

      // Delete the current span and replace it with the new children.
      (parent.children as Array<Text | Element>).splice(
        index,
        1,
        ...newChildren
      );
      return [SKIP, index + newChildren.length];
    });
  };
};
