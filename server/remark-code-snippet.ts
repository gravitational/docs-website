/*
 * This plugin will transform code snippets like this:
 *
 * ```code
 * # Copy and Paste the below and run on the Teleport Auth server.
 * $ cat > api-role.yaml <<ENDOFMESSAGE
 * kind: role
 * metadata:
 *   name: api-role
 * spec:
 *   allow:
 *     rules:
 *       - resources: ['role']
 *         verbs: ['read']
 *   deny:
 *     node_labels:
 *       '*': '*'
 * version: v3
 * ```
 *
 * To the widget in which every command can be copied separately.
 *
 * See fixtures/includes and tests for more examples.
 */

import type { Transformer } from "unified";
import type { Code as MdastCode, Text } from "mdast";
import type { Node } from "unist";
import type { MdxJsxFlowElement, MdxAnyElement } from "./types-unist";
import { visit } from "unist-util-visit";
import {
  parseCodeSnippet,
  type InlinePart,
  type SnippetNode,
} from "../src/utils/codeSnippet";

const RULE_ID = "code-snippet";

const isCode =
  (langs: string[]) =>
  (node: Node): node is MdastCode =>
    node.type === "code" && langs.includes((node as MdastCode).lang ?? "");

const getTextChildren = (contentValue: string): Text => ({
  type: "text",
  value: contentValue,
});

const getVariableNode = (
  value: string,
  isGlobal: boolean,
  description: string,
): MdxJsxFlowElement => ({
  type: "mdxJsxFlowElement",
  name: "Var",
  attributes: [
    { type: "mdxJsxAttribute", name: "name", value },
    {
      type: "mdxJsxAttribute",
      name: "isGlobal",
      value: isGlobal.toString(),
    },
    {
      type: "mdxJsxAttribute",
      name: "description",
      value: description,
    },
  ],
  children: [],
});

const getChildrenNode = (
  parts: InlinePart[],
): Array<Text | MdxJsxFlowElement> =>
  parts.map((part) =>
    part.type === "text"
      ? getTextChildren(part.value)
      : getVariableNode(part.name, part.isGlobal, part.description),
  );

const getSnippetChild = (node: SnippetNode) => {
  switch (node.type) {
    case "command":
      return {
        type: "mdxJsxFlowElement",
        name: "command",
        attributes: [],
        children: node.lines.map((line, index) => ({
          type: "mdxJsxFlowElement",
          name: "commandline",
          attributes:
            index === 0
              ? [
                  {
                    type: "mdxJsxAttribute",
                    name: "data-content",
                    value: node.prefix,
                  },
                ]
              : [],
          children: getChildrenNode(line),
        })),
      };
    case "comment":
      return {
        type: "mdxJsxFlowElement",
        name: "commandcomment",
        attributes: node.description
          ? [{ type: "mdxJsxAttribute", name: "data-type", value: "descr" }]
          : [],
        children: [{ type: "text", value: node.value }],
      };
    case "codeline":
      return {
        type: "mdxJsxFlowElement",
        name: "codeline",
        attributes: [],
        children: getChildrenNode(node.parts),
      };
    case "br":
      return { type: "mdxJsxFlowElement", name: "br", attributes: [] };
  }
};

export interface RemarkCodeSnippetOptions {
  langs: string[];
  lint?: boolean;
  resolve?: boolean;
}

export default function remarkCodeSnippet({
  langs = ["code"],
  lint = false,
}: RemarkCodeSnippetOptions): Transformer {
  return (root: Node, vfile) => {
    visit(
      root,
      isCode(langs),
      (node: MdastCode, index, parent: MdxAnyElement) => {
        const { nodes, diagnostics } = parseCodeSnippet(node.value);

        for (const { severity, message } of diagnostics) {
          if (lint) {
            vfile.fail(message, node, RULE_ID);
          } else if (severity === "error") {
            console.error(`ERROR: ${message} in the file ${vfile.path}`);
          }
        }

        parent.children[index!] = {
          type: "mdxJsxFlowElement",
          name: "snippet",
          attributes: [],
          children: nodes.map(getSnippetChild),
        } as MdxJsxFlowElement;
      },
    );
  };
}
