import { unified, Transformer } from "unified";
import type { VFile } from "vfile";
import rehypeHighlight, {
  Options as RehypeHighlightOptions,
} from "rehype-highlight";
import type { Node as UnistNode, Parent as UnistParent } from "unist";
import { visit, CONTINUE, SKIP } from "unist-util-visit";
import { v4 as uuid } from "uuid";
import remarkParse from "remark-parse";
import type { Text, Element, Node, Parent } from "hast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import remarkMDX from "remark-mdx";
import { common, createLowlight } from "lowlight";
import { toText } from "hast-util-to-text";

const makePlaceholder = (): string => {
  // UUID for uniqueness, but remove hyphens since these are often parsed
  // as operators or other non-identifier tokens. Make sure the placeholder
  // begins with a letter so it gets parsed as an identifier.
  return "var" + uuid().replaceAll("-", "");
};

const placeholderPattern = "var[a-z0-9]{32}";

// We only visit text nodes inside code snippets that include either the
// <Var tag or (if we have already swapped out Vars with placeholders) a
// placeholder.
const isPossibleVarContainer = (node: UnistParent) => {
  let textValue;
  if (
    node.type === "text" ||
    (node.type === "element" &&
      node.children.length === 1 &&
      node.children[0].type === "text")
  ) {
    return true;
  } else {
    return false;
  }
};

export const rehypeHLJS = (options?: RehypeHighlightOptions): Transformer => {
  return (root: UnistNode, file: VFile) => {
    const settings = options || {};
    // Highlight common languages in addition to any additional configured ones.
    settings.languages = { ...settings.languages, ...common };

    // Configure the highlighter to treat unlabeled code snippets as having the
    // "text" language by enabling detection and making "text" the only
    // possible language.
    settings.detect = true;
    settings.subset = ["text"];

    const aliases = settings.aliases;

    const detect = settings.detect || false;
    const plainText = settings.plainText;
    const prefix = settings.prefix;
    let name = "hljs";
    const lowlight = createLowlight(settings.languages);

    if (aliases) {
      lowlight.registerAlias(aliases);
    }

    if (prefix) {
      const pos = prefix.indexOf("-");
      name = pos === -1 ? prefix : prefix.slice(0, pos);
    }

    let placeholdersToVars: Record<string, Node> = {};

    // In a code snippet, Var elements are parsed as text. Replace these with
    // UUID strings to ensure that the parser won't split these up and make
    // them unrecoverable.
    visit(
      root,
      isPossibleVarContainer,
      (node: UnistNode, index: number, parent: Parent) => {
        const varPattern = new RegExp("<Var [^>]+/>", "g");
        const unknownText = node as unknown;
        let txt: Text;
        if (node.type == "text") {
          txt = unknownText as Text;
        } else {
          // isPossibleVarContainer enforces having a single child text node
          txt = (unknownText as Parent).children[0] as Text;
        }

        const newVal = txt.value.replace(varPattern, (match) => {
          const placeholder = makePlaceholder();
          // Since the Var element was originally text, parse it so we can recover
          // its properties. The result should be a small HTML AST with a root
          // node and one child, the Var node.
          const varElement = unified()
            // Converting to "any" since, for some reason, the type of
            // remarkParse doesn't match the signature of "use" despite this
            // being a common use case in the unified documentation.
            .use(remarkParse as any)
            .use(remarkMDX)
            .parse(match);

          placeholdersToVars[placeholder] = (varElement as Parent).children[0];
          return placeholder;
        });

        txt.value = newVal;
      },
    );

    console.log("ABOUT TO HIGHLIGHT:", JSON.stringify(file, null, 2));
    // Apply syntax highlighting
    visit(root, "element", function (node, _, parent) {
      if (
        node.tagName !== "code" ||
        !parent ||
        parent.type !== "element" ||
        parent.tagName !== "pre"
      ) {
        return;
      }

      const lang = ((node) => {
        const list = node.properties.className;
        let index = -1;

        if (!Array.isArray(list)) {
          return;
        }

        /** @type {string | undefined} */
        let name;

        while (++index < list.length) {
          const value = String(list[index]);

          if (value === "no-highlight" || value === "nohighlight") {
            return false;
          }

          if (!name && value.slice(0, 5) === "lang-") {
            name = value.slice(5);
          }

          if (!name && value.slice(0, 9) === "language-") {
            name = value.slice(9);
          }
        }

        return name;
      })(node);

      if (
        lang === false ||
        (!lang && !detect) ||
        (lang && plainText && plainText.includes(lang))
      ) {
        return;
      }

      if (!Array.isArray(node.properties.className)) {
        node.properties.className = [];
      }

      if (!node.properties.className.includes(name)) {
        node.properties.className.unshift(name);
      }

      const text = toText(node, { whitespace: "pre" });
      /** @type {Root} */
      let result;

      try {
        result = lang
          ? lowlight.highlight(lang, text, { prefix })
          : lowlight.highlightAuto(text, { prefix, subset });
      } catch (error) {
        const cause = /** @type {Error} */ error;

        if (lang && /Unknown language/.test(cause.message)) {
          file.message(
            "Cannot highlight as `" + lang + "`, it’s not registered",
            {
              ancestors: [parent, node],
              cause,
              place: node.position,
              ruleId: "missing-language",
              source: "rehype-highlight",
            },
          );

          /* c8 ignore next 5 -- throw arbitrary hljs errors */
          return;
        }

        throw cause;
      }

      if (!lang && result.data && result.data.language) {
        node.properties.className.push("language-" + result.data.language);
      }

      if (result.children.length > 0) {
        node.children = /** @type {Array<ElementContent>} */ result.children;
      }
    });

    // After syntax highlighting, the content of the code snippet will be a
    // series of span elements with different "hljs-*" classes. Find the
    // placeholder UUIDs and replace them with their original Var elements,
    // inserting these as HTML AST nodes.
    visit(
      root,
      isPossibleVarContainer,
      (node: Node, index: number, parent: Parent) => {
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
          hljsSpanValue.matchAll(new RegExp(placeholderPattern, "g")),
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
          ...newChildren,
        );
        return [SKIP, index + newChildren.length];
      },
    );
  };
};
