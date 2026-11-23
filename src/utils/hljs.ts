// Runtime syntax highlighting for code that is only known when a page renders,
// such as the text of a CodeBlock built from the props of a partial.
//
// It reproduces what the rehypeHLJS plugin (server/rehype-hljs.ts) does for a
// fenced code block at build time: the same languages and aliases, the same
// classes on the code element and the same treatment of <Var /> tags, so a
// CodeBlock looks the same as the equivalent fence.
import { definer as hcl } from "highlightjs-terraform";
import { common, createLowlight } from "lowlight";
import type { ElementContent } from "hast";
import { parseInline, type TextPart, type VarPart } from "./codeSnippet";

// The languages and aliases rehypeHLJS highlights fenced code blocks with (see
// docusaurus.config.ts). rehypeHLJS adds lowlight's common languages to these.
export const HLJS_LANGUAGES = { hcl };
export const HLJS_ALIASES = {
  bash: ["bsh", "systemd", "code", "powershell"],
  yaml: ["conf", "toml"],
};

const lowlight = createLowlight({ ...HLJS_LANGUAGES, ...common });
lowlight.registerAlias(HLJS_ALIASES);

export interface HighlightedSpan {
  type: "span";
  className?: string[];
  children: HighlightedNode[];
}

export type HighlightedNode = TextPart | VarPart | HighlightedSpan;

export interface HighlightedCode {
  // The class of the code element, such as "hljs language-yaml".
  className: string;
  children: HighlightedNode[];
}

// Var tags are replaced with identifiers before highlighting so the
// highlighter can't split them up. The identifiers are numbered instead of
// random so the server and the browser render the same output.
const PLACEHOLDER = /var[0-9a-f]{32}/g;
const makePlaceholder = (index: number) =>
  "var" + index.toString(16).padStart(32, "0");

const hasPlaceholder = (value: string) => new RegExp(PLACEHOLDER).test(value);

// Splits a text value around placeholders and replaces the placeholders with
// their Var tags. makeText wraps the text between them.
const splitAtVars = (
  value: string,
  vars: VarPart[],
  makeText: (text: string) => HighlightedNode,
): HighlightedNode[] => {
  const nodes: HighlightedNode[] = [];
  let end = 0;
  for (const match of value.matchAll(PLACEHOLDER)) {
    if (match.index > end) {
      nodes.push(makeText(value.slice(end, match.index)));
    }
    nodes.push(vars[parseInt(match[0].slice(3), 16)]);
    end = match.index + match[0].length;
  }
  if (end < value.length) {
    nodes.push(makeText(value.slice(end)));
  }
  return nodes;
};

// Like rehypeHLJS, an element whose only child is text with Vars is replaced
// by one span per piece of text, with the Vars between them. Returns undefined
// for other elements.
const splitOnlyText = (
  children: ElementContent[],
  vars: VarPart[],
  className?: string[],
): HighlightedNode[] | undefined => {
  const [only] = children;
  if (
    children.length !== 1 ||
    only.type !== "text" ||
    !hasPlaceholder(only.value)
  ) {
    return undefined;
  }
  return splitAtVars(only.value, vars, (value) => ({
    type: "span",
    className,
    children: [{ type: "text", value }],
  }));
};

// Replaces the placeholders in highlighted text with their Var tags.
const restoreVars = (
  children: ElementContent[],
  vars: VarPart[],
): HighlightedNode[] =>
  children.flatMap((child): HighlightedNode[] => {
    if (child.type === "text") {
      return splitAtVars(child.value, vars, (value) => ({
        type: "text",
        value,
      }));
    }
    if (child.type !== "element") {
      return [];
    }
    const className = child.properties.className as string[] | undefined;
    return (
      splitOnlyText(child.children, vars, className) ?? [
        {
          type: "span",
          className,
          children: restoreVars(child.children, vars),
        },
      ]
    );
  });

// Highlights text the way rehypeHLJS highlights a fenced code block with the
// given language.
export const highlightCode = (
  source: string,
  language: string,
): HighlightedCode => {
  const vars: VarPart[] = [];
  const text =
    parseInline(source)
      .map((part) => {
        if (part.type === "text") {
          return part.value;
        }
        vars.push(part);
        return makePlaceholder(vars.length - 1);
      })
      .join("") +
    // A fence ends its text with a line break, unless the text is empty.
    (source ? "\n" : "");

  let children: ElementContent[] = [{ type: "text", value: text }];
  try {
    const result = lowlight.highlight(language, text);
    if (result.children.length > 0) {
      children = result.children as ElementContent[];
    }
  } catch (error) {
    // Like rehypeHLJS, leave the text as it is if the language is unknown.
    if (!/Unknown language/.test((error as Error).message)) {
      throw error;
    }
  }

  return {
    className: `hljs language-${language}`,
    // The code element's single text child is split into plain spans.
    children: splitOnlyText(children, vars) ?? restoreVars(children, vars),
  };
};
