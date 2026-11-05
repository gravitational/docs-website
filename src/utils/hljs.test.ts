import { describe, expect, test } from "@jest/globals";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { rehypeHLJS } from "../../server/rehype-hljs";
import {
  HLJS_ALIASES,
  HLJS_LANGUAGES,
  highlightCode,
  type HighlightedNode,
} from "./hljs";

// Serializes a hast node produced by rehypeHLJS. Var elements are
// mdxJsxFlowElement nodes at this point.
const serializeHast = (node: any): string => {
  if (node.type === "text") return node.value;
  if (node.type === "mdxJsxFlowElement") {
    const attributes = Object.fromEntries(
      node.attributes.map((a: any) => [a.name, a.value]),
    );
    return serializeVar({
      name: attributes.name,
      description: attributes.description ?? "",
      isGlobal: "isGlobal" in attributes && attributes.isGlobal !== "false",
      initial: attributes.initial,
    });
  }
  const className = node.properties?.className;
  const classAttribute = className ? ` class="${className.join(" ")}"` : "";
  return `<${node.tagName}${classAttribute}>${node.children
    .map(serializeHast)
    .join("")}</${node.tagName}>`;
};

const serializeVar = (v: {
  name: string;
  description: string;
  isGlobal: boolean;
  initial?: string;
}) =>
  `<Var name=${v.name} description=${v.description} global=${v.isGlobal} initial=${v.initial}/>`;

const serializeNode = (node: HighlightedNode): string => {
  if (node.type === "text") return node.value;
  if (node.type === "var") return serializeVar(node);
  const classAttribute = node.className
    ? ` class="${node.className.join(" ")}"`
    : "";
  return `<span${classAttribute}>${node.children
    .map(serializeNode)
    .join("")}</span>`;
};

// What the build produces for a fence: the code element after rehypeHLJS.
const fromFence = (language: string, source: string): string => {
  const processor = unified()
    .use(remarkParse as any)
    .use(remarkRehype as any)
    .use(rehypeHLJS as any, {
      aliases: HLJS_ALIASES,
      languages: HLJS_LANGUAGES,
    });
  const fence = "```" + language + "\n" + source + "\n```\n";
  const tree: any = processor.runSync(processor.parse(fence) as any);
  const code = tree.children[0].children[0];
  return serializeHast(code);
};

const fromRuntime = (language: string, source: string): string => {
  const { className, children } = highlightCode(source, language);
  return `<code class="${className}">${children
    .map(serializeNode)
    .join("")}</code>`;
};

const samples: Array<[string, string]> = [
  [
    "yaml",
    "kind: role\nmetadata:\n  name: example\nspec:\n  allow:\n    logins: ['root']",
  ],
  [
    "yaml",
    'name: <Var name="role-name" />\nlogins: ["<Var name="login" description="a login" />"]',
  ],
  [
    "yaml",
    '<Var name="a" /><Var name="b" />: x\ncomment: y # <Var name="c" isGlobal />',
  ],
  ["yaml", '# only a comment <Var name="c" />'],
  [
    "go",
    'package main\n\nfunc main() {\n\tfmt.Println("hello <Var name="who" />")\n}',
  ],
  [
    "hcl",
    'resource "teleport_role" "<Var name="role" />" {\n  version = "v7"\n}',
  ],
  ["toml", '[section]\nkey = "<Var name="value" initial="x" />"'],
  ["ini", '[a]\nb = <Var name="c" />'],
  ["bash", 'echo "<Var name="x" />" | grep -v foo\nexport A=1'],
  ["code", "$ tsh ls\n# comment"],
  ["json", '{"a": [1, 2, "<Var name="x" />"], "b": null}'],
  ["txt", "plain text"],
  ["text", 'plain <Var name="x" /> text'],
  ["unknown-lang", 'some <Var name="x" /> text\nmore'],
  ["yaml", ""],
  ["yaml", '<Var name="only" />'],
];

describe("highlightCode", () => {
  test.each(samples)("matches rehypeHLJS for %s: %j", (language, source) => {
    expect(fromRuntime(language, source)).toEqual(fromFence(language, source));
  });

  test("adds the hljs and language classes to the code element", () => {
    expect(highlightCode("a: b", "yaml").className).toBe("hljs language-yaml");
  });

  test("highlights with hljs classes", () => {
    const html = fromRuntime("yaml", "key: value");
    expect(html).toContain("hljs-attr");
  });

  test("is deterministic so server and browser output match", () => {
    const source = 'a: <Var name="x" />';
    expect(highlightCode(source, "yaml")).toEqual(
      highlightCode(source, "yaml"),
    );
  });
});
