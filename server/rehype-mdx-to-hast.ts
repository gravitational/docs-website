/*
 * rehype-mdx-to-hast converts a subset of MDX nodes to HAST. The legacy
 * NextJS-based engine (the gravitational/docs repo) used this to convert docs
 * pages to JSON-serializable objects to be returned by Vercel. The current
 * Docusaurus-based engine only uses this to ensure that legacy tests pass.
 */

import type { Transformer } from "unified";
import type { Parent } from "unist";
import type {
  MdxJsxFlowElement,
  MdxJsxTextElement,
  MdxJsxAttribute,
  MdxJsxAttributeValueExpression,
} from "mdast-util-mdx-jsx";
import type { MdxjsEsm } from "mdast-util-mdxjs-esm";
import type {
  MdxFlowExpression,
  MdxTextExpression,
} from "mdast-util-mdx-expression";

import { visit } from "unist-util-visit";

// All the types of node that can be inside MDX file
type MdxNode =
  | MdxJsxFlowElement // https://github.com/syntax-tree/mdast-util-mdx-jsx/blob/main/lib/complex-types.d.ts
  | MdxJsxTextElement // https://github.com/syntax-tree/mdast-util-mdx-jsx/blob/main/lib/complex-types.d.ts
  | MdxjsEsm // https://github.com/syntax-tree/mdast-util-mdxjs-esm/blob/main/complex-types.d.ts
  | MdxFlowExpression // https://github.com/syntax-tree/mdast-util-mdx-expression/blob/main/complex-types.d.ts
  | MdxTextExpression; // https://github.com/syntax-tree/mdast-util-mdx-expression/blob/main/complex-types.d.ts

// transformToHast transforms the MDX AST node, including its parent, into an
// HTML AST. This is a separate function to enable calling in multiple
// transformers.
export const transformToHast = (node: any, index: number, parent: Parent) => {
      // TextElement in an inline tag and FlowElement is a block tag. e want ot convert them.
      if (
        node.type === "mdxJsxTextElement" ||
        node.type === "mdxJsxFlowElement"
      ) {
        const newNode = {
          type: "element",
          tagName: node.name.toLowerCase(),
          properties: (node.attributes as MdxJsxAttribute[]).reduce(
            (result, prop) => {
              // If the prop in markdown was a js-expression like disabled={true}
              // it will be parsed as an object with original value as a string
              // and as a estree. For now we just use the string value.
              if (typeof prop.value === "object" && prop.value !== null) {
                // By default just return value as is. E. g. field={something}
                // will get value "{something}"" as is with curly braces.
                return {
                  ...result,
                  [prop.name]: (prop.value as MdxJsxAttributeValueExpression)
                    .value,
                };
              }

              // for non-js nodes just return value
              return {
                ...result,
                [prop.name]: prop.value === null ? true : prop.value,
              };
            },
            {}
          ),
          children: node.children,
        };

        parent.children[index] = newNode;
        // This is a pure JS nodes, like {1 + 1} or imports/exports.
        // Just removing them for now for simplicity.
      } else if (
        ["mdxFlowExpression", "mdxTextExpression", "mdxjsEsm"].includes(
          node.type
        )
      ) {
        parent.children.splice(index, 1);
      }
    }

export default function rehypeMdxToHast(): Transformer {
  return (root: Parent) => {
    visit(root, transformToHast);
  };
}
