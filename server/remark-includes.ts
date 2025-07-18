/*
 * This plugin will resolve (!filename!) syntax and include file's content
 * Inside the page. mdx and md files will also be parsed to AST and then used as normal
 * mdx content. Paths to includes are resolved form the version repo root.
 *
 * This plugin can also work as a linter plugin for remark-lint.
 *
 * See tests and fixtures for more examples.
 */

import type { Transformer } from "unified";
import type { Node, Parent } from "unist";
import type { Root, Code, Text } from "mdast";
import type { VFile } from "vfile";

import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { visitParents } from "unist-util-visit-parents";
import { visit, SKIP } from "unist-util-visit";
import type { Visitor } from "unist-util-visit";
import { fromMarkdown } from "mdast-util-from-markdown";

import { mdxjs } from "micromark-extension-mdxjs";
import { gfm } from "micromark-extension-gfm";
import { frontmatter } from "micromark-extension-frontmatter";

import { mdxFromMarkdown } from "mdast-util-mdx";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { frontmatterFromMarkdown } from "mdast-util-frontmatter";

import updateMessages from "./update-vfile-messages";

import type { MdxJsxTextElement, MdxJsxFlowElement } from "mdast-util-mdx-jsx";

const includeRegexpBase = "\\(!(.*)!\\)`?";
const includeRegexp = new RegExp(includeRegexpBase);
const exactIncludeRegexp = new RegExp(`^${includeRegexpBase}$`);
const globalIncludeRegexp = new RegExp(includeRegexpBase, "g");

interface ResolveIncludesProps {
  value: string;
  filePath: string;
  rootDir: string;
}

export interface ParameterAssignments {
  [index: string]: string;
}

// parseAssignments takes a string containing parameter assignments and parses
// them into a ParameterAssignments map, making it possible to use these
// assignments in various operations.
//
// It expects the input expression to have a format similar to the following:
//
// myvar="myval" myvar2="myval" myvar3="myval"
//
// Values must be wrapped in double quotes. Assignments must be separated by
// single spaces. An equals sign must separate each parameter and its value.
export function parseAssignments(
  assignmentSection: string,
): ParameterAssignments {
  // no parameter assignments to parse
  if (assignmentSection.length == 0) {
    return {};
  }

  if (assignmentSection[assignmentSection.length - 1] !== `"`) {
    return {};
  }

  let assignments: ParameterAssignments = {};

  // Since every assignment must end with a double quote and a space, split
  // assignments on spaces that follow a non-escaped double quote.
  const rawAssignments = assignmentSection.split(
    new RegExp('(?<=[^\\\\]") ', "g"),
  );

  // Matches an assignment within the assignmentSection string, e.g.:
  //
  // mykey="this is a value"
  //
  // Assumes equals signs separate assignment keys and values and that values
  // are surrounded by double quotes. Includes capturing groups for the key and
  // the value.
  const assignmentRegExp = new RegExp('([^ "]+)=(".*")', "g");

  rawAssignments.forEach((rawAssignment) => {
    const assignmentParts = Array.from(
      rawAssignment.matchAll(assignmentRegExp),
    )[0];
    // I.e., there's not a main match and two group matches
    if (assignmentParts.length !== 3) {
      throw new Error(
        `Could not parse expression ${rawAssignment} as a partial assignment. ` +
          `Partial assignments must be wrapped in double quotes and separated by spaces.`,
      );
    }

    assignments[assignmentParts[1]] = assignmentParts[2];
  });

  return assignments;
}

// parsePartialParams takes a partial inclusion expression and parses the
// parameter assignments that follow the filepath. For example, if the
// expression is:
//
// (!partial.mdx var1="val" var2="val"!)
//
// ...it returns a ParameterAssignments with keys for "var1" and "var2".
// This function is intended to separate different parameter assignments for
// processing downstream.
//
export function parsePartialParams(expr: string): ParameterAssignments {
  if (!expr) {
    return {};
  }

  if (!exactIncludeRegexp.test(expr)) {
    throw new Error("the expression does not include a partial");
  }

  // Extract everything after the filepath and before the "!)"
  const assignmentSection = expr
    .slice(expr.indexOf(" "), expr.length - 2)
    .trim();

  // Well-formed partial inclusion expression with no assignments
  if (assignmentSection === "") {
    return {};
  }

  const assignments = parseAssignments(assignmentSection);

  // Partial inclusion expression with malformed assignments
  if (Object.keys(assignments).length === 0) {
    throw new Error(
      "When including a partial, any parameter assignments must" +
        " be separated by single spaces with the values wrapped in double quotes" +
        ' e.g., (!mypartial.mdx var="val" var2="val"!)',
    );
  }
  return assignments;
}

// parseParamDefaults parses the expression at the top of a partial that
// declares the partial's default parameter values, taking the partial's content
// as a string and returning a ParameterAssignments mapping each parameter to
// its default value.
//
// Here is an example of a default assignment expression:
//
// {{ myvar="myval" myvar2="myval" }}
//
// The default assignments expression must be on the first line of a partial.
// Values must be wrapped in double quotes and separated by single spaces.
export function parseParamDefaults(expr: string): ParameterAssignments {
  const defaultAssignmentRegexp = new RegExp("{{ (.*) }}", "g");

  // Callers should handle empty values before they get here.
  // parseParamDefaults has no idea whether this case is acceptable or not.
  if (expr === "") {
    throw new Error("unexpected empty string in parseParamDefaults");
  }

  if (expr.length < "{{ }}".length) {
    return {};
  }

  const firstLine = expr.split("\n", 1)[0];
  const matches = defaultAssignmentRegexp.exec(firstLine);

  if (!matches) {
    return {};
  }
  return parseAssignments(matches[1]);
}

// resolveParamValue takes the quoted value of a template variable within a
// partial and returns the unquoted value, resolving any escapes. Escaped
// quotations are resolved within double-quoted strings but not single-quoted
// strings.
//
// Throws an exception if the quotes are mismatched, the input is not wrapped
// in quotes, or the input is empty
export function resolveParamValue(val: string): string {
  if (val == "") {
    throw new Error("the value of a parameter in a partial cannot be empty");
  }
  if (val[0] !== `"`) {
    throw new Error(
      `parameter values in partials must be wrapped in double-quoted strings, but this value is not: ${val}`,
    );
  }
  if (val[0] !== val[val.length - 1]) {
    throw new Error(
      `parameter values in partials must be wrapped in matching quotes, but this value is not: ${val}`,
    );
  }
  let newVal = val.slice(1, val.length - 1);
  const escapedQuoteRegexp = new RegExp('\\\\"', "g");
  if (val[0] == '"') {
    newVal = newVal.replace(escapedQuoteRegexp, '"');
  }

  return newVal;
}

const resolveIncludes = ({
  value,
  filePath,
  rootDir,
}: ResolveIncludesProps) => {
  let error: string;

  // Assemble an object where keys are the variable keys and values are the var
  // values.
  let vars = {};

  const result = value.replace(includeRegexp, (fullInclude, includeExpr) => {
    const includePath = includeExpr.split(" ")[0];
    const fullImportPath = join(rootDir, includePath);

    if (existsSync(fullImportPath)) {
      let content = readFileSync(fullImportPath, "utf-8");
      let paramAssignments = parseParamDefaults(content);

      // The partial includes defaults, so remove the first line
      if (Object.keys(paramAssignments).length > 0) {
        const lines = content.split("\n");
        content = lines.slice(1, content.length).join("\n");
      }

      // Add user-provided parameter assignments, replacing any defaults
      const userAssignments = parsePartialParams(fullInclude);
      Object.keys(userAssignments).forEach((param) => {
        paramAssignments[param] = userAssignments[param];
      });

      // Replace variables in the partial with their values
      for (const param in paramAssignments) {
        const finalVal = resolveParamValue(paramAssignments[param]);
        const varRegexp = new RegExp(`{{ ?${param} ?}}`, "g");
        content = content.replace(varRegexp, finalVal);
      }

      return content;
    } else {
      error = `Wrong import path ${includePath} in file ${filePath}.`;

      return `(!${includePath}!)`;
    }
  });

  return { result, error };
};

const numIncludes = (value: string) => value.match(globalIncludeRegexp)?.length;

const isInclude = (node: Node) => {
  const valNode = node as Code | Text;
  return typeof valNode.value === "string" && includeRegexp.test(valNode.value);
};

type UpdatePathsOptions = {
  node: Node;
  versionRootDir: string;
  includePath: string;
  vfile: VFile;
};

export interface RemarkIncludesOptions {
  rootDir?: string | ((vfile: VFile) => string);
  lint?: boolean;
  resolve?: boolean;
  updatePaths?: (options: UpdatePathsOptions) => string;
}

// elevateSummary finds the summary element in a details box, which Markdown
// parsing embeds within a paragraph element, and assigns it as a first-level
// child to the details box so Docusaurus can render the summary as expected.
const elevateSummary = (node: Node) => {
  const element = node as unknown as MdxJsxFlowElement;
  if (!element.name || element.name != "details") {
    return;
  }

  // Traverse the first-level children of the details box, since parsing a
  // partial often buries the summary within a paragraph. The summary can
  // either be the sole child of the paragraph, in which case we replace the
  // paragraph with its child, or one of several children, in which case we
  // preserve the other children while moving the summary to the first level.
  element.children.forEach((child) => {
    if (child.type !== "paragraph") {
      return;
    }
    const tr = child as Parent;
    if (!tr.children || tr.children.length == 0) {
      return;
    }

    if (
      tr.children.length == 1 &&
      (tr.children[0] as unknown as MdxJsxTextElement).name &&
      (tr.children[0] as unknown as MdxJsxTextElement).name == "summary"
    ) {
      Object.assign(child, tr.children[0]);
      return;
    }

    // The paragraph has multiple children, so see if one of them is a summary
    // and, if so, make it the first child element of the details box.
    tr.children.forEach((c, i) => {
      const child = c as unknown as MdxJsxTextElement;
      if (!child.name || child.name != "summary") {
        return;
      }
      element.children.unshift(child as any);
      tr.children.splice(i, 1);
    });
  });

  return SKIP;
};

export default function remarkIncludes({
  rootDir = "",
  lint,
  resolve = true,
  updatePaths,
}: RemarkIncludesOptions = {}): Transformer {
  return (root: Root, vfile: VFile) => {
    let resolvedRootDir: string;

    if (typeof rootDir === "function") {
      resolvedRootDir = rootDir(vfile);
    } else {
      resolvedRootDir = rootDir;
    }

    const lastErrorIndex = vfile.messages.length;

    visitParents(root, isInclude, (node: Node, ancestors: Parent[]) => {
      if (node.type === "code") {
        let code = node as Code;
        const noIncludes = numIncludes(code.value);
        for (let i = 0; i < noIncludes; i++) {
          const { result, error } = resolveIncludes({
            value: code.value,
            filePath: vfile.path,
            rootDir: resolvedRootDir,
          });

          if (resolve) {
            code.value = result;
          }

          if (lint && error) {
            vfile.message(error, node);
          }
        }
      } else if (node.type === "text") {
        const parent = ancestors[ancestors.length - 1];

        if (parent.type === "paragraph") {
          const txt = node as Text;
          if (parent.children && parent.children.length === 1) {
            if (exactIncludeRegexp.test(txt.value.trim())) {
              const { result, error } = resolveIncludes({
                value: txt.value,
                filePath: vfile.path,
                rootDir: resolvedRootDir,
              });

              const path = txt.value.match(exactIncludeRegexp)[1];

              // Parse the partial as a Markdown AST and insert it into the
              // parent AST.
              if (resolve) {
                if (path.split(" ")[0].match(/\.mdx?$/)) {
                  const tree = fromMarkdown(result, {
                    extensions: [mdxjs(), gfm(), frontmatter()],
                    mdastExtensions: [
                      mdxFromMarkdown(),
                      gfmFromMarkdown(),
                      frontmatterFromMarkdown(["yaml"]),
                    ],
                  });

                  // Parsing the include results in embedding the <summary> of
                  // a <details> box in a <p>, which prevents Docusaurus from
                  // rendering the summary correctly. Make the summary a
                  // first-level child of the <details>.
                  visit(tree as unknown as Node, elevateSummary as Visitor);

                  // Replace relative paths in the partial so they match the
                  // directory structure of the including page.
                  updatePaths({
                    node: tree as Root,
                    versionRootDir: resolvedRootDir,
                    includePath: path,
                    vfile,
                  });

                  const grandParent = ancestors[ancestors.length - 2] as Parent;
                  const parentIndex = grandParent.children.indexOf(parent);

                  grandParent.children.splice(
                    parentIndex,
                    1,
                    ...(tree as Root).children,
                  );
                } else {
                  txt.value = result;
                }
              }

              if (lint && error) {
                vfile.message(error, node);
              }
            } else if (lint) {
              vfile.message(
                "Includes only works if they are the only content on the line",
                node,
              );
            }
          } else if (lint) {
            vfile.message(
              "Includes only works if they are the only content on the line",
              node,
            );
          }
        }
      } else if (lint) {
        vfile.message("Includes only work in paragraphs and code blocks", node);
      }
    });

    updateMessages({
      vfile,
      startIndex: lastErrorIndex,
      ruleId: "includes",
      source: "remark-lint",
    });
  };
}
