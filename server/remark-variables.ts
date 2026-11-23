/*
 * This plugin will resolve (=variable=) syntax and include veriables value into the page.
 * We wrote separate plugin instead of using {variable} syntax because we need to use them inside
 * code blocks and includes and we can't do it with {}.
 *
 * Source of variables is "content/X.X/docs/config.json" file.
 *
 * This plugin can also work as a linter plugin for remark-lint.
 *
 * See tests and fixtures for more examples.
 */

import type { Transformer } from "unified";
import type { Literal as MdastLiteral, Link as MdastLink } from "mdast";
import type { VFile } from "vfile";
import type { MdxJsxElement } from "./types-unist";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";
import updateMessages from "./update-vfile-messages";
import { isMdxNode } from "./mdx-helpers";
import type { Node } from "unist";

type NameMap = Record<string, string>;

const generateNameMap = (
  variables: Record<string, unknown>,
  prefix?: string,
) => {
  let result: NameMap = {};

  Object.entries(variables).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object") {
      result = {
        ...result,
        ...generateNameMap(value as Record<string, unknown>, path),
      };
    } else {
      result[path] = value as string;
    }
  });

  return result;
};

const variableRegExp = /\(=\s?(.+?)\s?=\)/g;

const replaceVars = (value: string, names: NameMap) =>
  value.replace(
    variableRegExp,
    (base: string, name: string) => names[name] || base,
  );

// MDX compiles expressions from node.data.estree, not node.value.
// Apply the same replacement to string literals and template literal parts.
const replaceVarsInEstree = (tree: unknown, names: NameMap): void => {
  if (Array.isArray(tree)) {
    tree.forEach((child) => replaceVarsInEstree(child, names));
    return;
  }
  if (!tree || typeof tree !== "object") return;

  const estree = tree as {
    type?: string;
    value?: unknown;
    raw?: string;
    cooked?: string;
  };

  if (estree.type === "Literal" && typeof estree.value === "string") {
    estree.value = replaceVars(estree.value, names);
    if (estree.raw) estree.raw = replaceVars(estree.raw, names);
  }
  if (estree.type === "TemplateElement") {
    const element = estree as unknown as {
      value: { raw: string; cooked: string };
    };
    element.value.raw = replaceVars(element.value.raw, names);
    element.value.cooked = replaceVars(element.value.cooked, names);
  }

  Object.values(tree).forEach((child) => replaceVarsInEstree(child, names));
};

const lintVars = (
  vfile: VFile,
  node: MdastLiteral | MdastLink | MdxJsxElement,
  value: string,
  variables: string[],
) => {
  Array.from(value.matchAll(variableRegExp)).forEach((result) => {
    const match = result[0];
    const name = result[1];

    if (!variables.includes(name)) {
      vfile.message(`Non existing varaible name ${match}`, node);
    }
  });
};

const nodeHasValue = (node: Node): node is MdastLiteral =>
  typeof (node as MdastLiteral).value === "string";
const nodeIsLink = (node: Node): node is MdastLink => node.type === "link";

type Variables = Record<string, unknown>;

export interface RemarkVariablesOptions {
  variables?: Variables | ((vfile: VFile) => Variables);
  resolve?: boolean;
  lint?: boolean;
}

export default function remarkVariables({
  resolve = true,
  lint,
  variables = {} as Variables,
}: RemarkVariablesOptions = {}): Transformer<Root> {
  return (root: Root, vfile) => {
    let resolvedVariables: Variables;

    if (typeof variables === "function") {
      resolvedVariables = variables(vfile);
    } else {
      resolvedVariables = variables;
    }

    const lastErrorIndex = vfile.messages.length;

    const nameMap = generateNameMap(resolvedVariables);
    const names = Object.keys(nameMap);

    visit(root, (node: Node) => {
      if (nodeHasValue(node)) {
        if (resolve) {
          node.value = replaceVars(node.value, nameMap);
          const estree = (node as { data?: { estree?: unknown } }).data?.estree;
          if (estree) replaceVarsInEstree(estree, nameMap);
        }

        if (lint) {
          lintVars(vfile, node, node.value as string, names);
        }
      } else if (nodeIsLink(node)) {
        if (node.url) {
          if (resolve) {
            node.url = replaceVars(node.url, nameMap);
          }

          if (lint) {
            lintVars(vfile, node, node.url, names);
          }
        }
      } else if (isMdxNode(node)) {
        if (node.attributes) {
          Object.values(node.attributes as { value: string }[]).forEach(
            (attribute) => {
              if (typeof attribute.value === "string") {
                if (resolve) {
                  attribute.value = replaceVars(attribute.value, nameMap);
                }

                if (lint) {
                  lintVars(vfile, node, attribute.value, names);
                }
              }
            },
          );
        }
      }
    });

    updateMessages({
      vfile,
      startIndex: lastErrorIndex,
      ruleId: "variables",
      source: "remark-lint",
    });
  };
}
