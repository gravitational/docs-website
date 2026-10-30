import { describe, expect, it } from "@jest/globals";

import {
  MULTILINE_ERROR,
  normalizeSource,
  parseCodeSnippet,
  parseInline,
} from "./codeSnippet";

const text = (value: string) => ({ type: "text", value });

describe("parseInline", () => {
  it("returns a single text part when there is no Var tag", () => {
    expect(parseInline("tsh ls")).toEqual([text("tsh ls")]);
  });

  it("alternates between text and Var tags", () => {
    expect(parseInline('a <Var name="x" /> b <Var name="y"/>')).toEqual([
      text("a "),
      { type: "var", name: "x", isGlobal: false, description: "" },
      text(" b "),
      { type: "var", name: "y", isGlobal: false, description: "" },
      text(""),
    ]);
  });

  it("starts with an empty text part when the line starts with a Var tag", () => {
    expect(parseInline('<Var name="x" />')).toEqual([
      text(""),
      { type: "var", name: "x", isGlobal: false, description: "" },
      text(""),
    ]);
  });

  it("reads the Var attributes", () => {
    const [, variable] = parseInline(
      '<Var name="domain name" description="the domain" isGlobal initial=\'example.com\' />',
    );
    expect(variable).toEqual({
      type: "var",
      name: "domain name",
      description: "the domain",
      isGlobal: true,
      initial: "example.com",
    });
  });

  it('treats isGlobal={false} and isGlobal="false" as not global', () => {
    for (const attribute of ['isGlobal="false"', "isGlobal={false}"]) {
      const [, variable] = parseInline(`<Var name="x" ${attribute} />`);
      expect(variable).toMatchObject({ isGlobal: false });
    }
  });

  it("keeps text with a />  that is not a Var tag", () => {
    expect(parseInline('<img src="x" /> <Var name="a" />')).toEqual([
      text('<img src="x" /> '),
      { type: "var", name: "a", isGlobal: false, description: "" },
      text(""),
    ]);
  });

  it("reports a Var tag without a name and keeps it as text", () => {
    const diagnostics = [];
    expect(parseInline('a <Var description="x" /> b', diagnostics)).toEqual([
      text('a <Var description="x" /> b'),
    ]);
    expect(diagnostics).toHaveLength(1);
  });
});

describe("parseCodeSnippet", () => {
  it("parses commands, descriptions and output", () => {
    const { nodes, diagnostics } = parseCodeSnippet(
      ["# List nodes", "$ tsh ls", "Node Name", "## not a description"].join(
        "\n",
      ),
    );
    expect(diagnostics).toEqual([]);
    expect(nodes).toEqual([
      { type: "comment", value: "List nodes", description: true },
      { type: "command", prefix: "$ ", lines: [[text("tsh ls")]] },
      { type: "codeline", parts: [text("Node Name")] },
      { type: "comment", value: "# not a description", description: false },
    ]);
  });

  it("parses commands with a host prefix", () => {
    expect(parseCodeSnippet("> host $ tsh ls").nodes).toEqual([
      { type: "command", prefix: "host $ ", lines: [[text("tsh ls")]] },
    ]);
  });

  it("adds a break after an empty line", () => {
    expect(parseCodeSnippet("a\n\nb").nodes.map((node) => node.type)).toEqual([
      "codeline",
      "codeline",
      "br",
      "codeline",
    ]);
  });

  it("keeps the lines of a multiline command in one command", () => {
    const { nodes, diagnostics } = parseCodeSnippet(
      "$ curl \\\n  --cert a \\\n  https://x\n$ next",
    );
    expect(diagnostics).toEqual([]);
    expect(nodes).toEqual([
      {
        type: "command",
        prefix: "$ ",
        lines: [
          [text("curl \\")],
          [text("  --cert a \\")],
          [text("  https://x")],
        ],
      },
      { type: "command", prefix: "$ ", lines: [[text("next")]] },
    ]);
  });

  it("warns when a multiline command has no last line", () => {
    const { diagnostics } = parseCodeSnippet("$ curl \\");
    expect(diagnostics).toEqual([
      { severity: "warning", message: MULTILINE_ERROR },
    ]);
  });

  it("keeps the body of a heredoc in the command", () => {
    const { nodes, diagnostics } = parseCodeSnippet(
      "$ cat > a.yaml <<EOF\nkind: role\nEOF\n$ tctl create -f a.yaml",
    );
    expect(diagnostics).toEqual([]);
    expect(nodes).toEqual([
      {
        type: "command",
        prefix: "$ ",
        lines: [
          [text("cat > a.yaml <<EOF")],
          [text("kind: role")],
          [text("EOF")],
        ],
      },
      {
        type: "command",
        prefix: "$ ",
        lines: [[text("tctl create -f a.yaml")]],
      },
    ]);
  });

  it("reports a heredoc without a closing line", () => {
    const { diagnostics } = parseCodeSnippet("$ cat <<EOF\nkind: role");
    expect(diagnostics).toEqual([
      { severity: "error", message: "No closing line for heredoc format" },
    ]);
  });

  it("parses Var tags in commands and output", () => {
    const { nodes } = parseCodeSnippet(
      '$ a <Var name="x" />\nb <Var name="y" />',
    );
    expect(nodes[0]).toMatchObject({
      type: "command",
      lines: [[text("a "), { type: "var", name: "x" }, text("")]],
    });
    expect(nodes[1]).toMatchObject({
      type: "codeline",
      parts: [text("b "), { type: "var", name: "y" }, text("")],
    });
  });
});

describe("normalizeSource", () => {
  it("returns text without blank lines around it unchanged", () => {
    expect(normalizeSource("$ a\n  $ b")).toBe("$ a\n  $ b");
  });

  it("removes blank lines before and after the text", () => {
    expect(normalizeSource("\n\n  $ a\n    b\n  \n")).toBe("  $ a\n    b");
  });

  it("keeps blank lines between lines of text", () => {
    expect(normalizeSource("a\n\nb")).toBe("a\n\nb");
  });

  it("does not change the indentation of any line", () => {
    expect(normalizeSource("a:\n  b: 1\n  c: 2")).toBe("a:\n  b: 1\n  c: 2");
  });

  it("converts Windows line endings", () => {
    expect(normalizeSource("$ a\r\n  $ b")).toBe("$ a\n  $ b");
  });
});
