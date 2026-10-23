// Parser for the "code" snippet format: commands prefixed with "$", comments
// prefixed with "#", multiline and heredoc commands, and inline <Var /> tags.

export interface TextPart {
  type: "text";
  value: string;
}

export interface VarPart {
  type: "var";
  name: string;
  isGlobal: boolean;
  description: string;
  initial?: string;
}

export type InlinePart = TextPart | VarPart;

// A command, such as "$ tsh ls". Heredoc and multiline commands span several
// lines. The prefix is the text shown before the first line ("$ " or
// "host $ "), which is not part of the copied command.
export interface CommandNode {
  type: "command";
  prefix: string;
  lines: InlinePart[][];
}

// A comment. Descriptions ("# comment") are not copied. Other comments
// ("## comment") are rendered as regular lines starting with "#".
export interface CommentNode {
  type: "comment";
  value: string;
  description: boolean;
}

// A line of example output or other plain code.
export interface CodeLineNode {
  type: "codeline";
  parts: InlinePart[];
}

// Follows an empty code line so it keeps its height.
export interface BreakNode {
  type: "br";
}

export type SnippetNode = CommandNode | CommentNode | CodeLineNode | BreakNode;

export interface SnippetDiagnostic {
  // "error" diagnostics are always reported. "warning" diagnostics are only
  // reported by linters.
  severity: "error" | "warning";
  message: string;
}

export interface ParsedSnippet {
  nodes: SnippetNode[];
  diagnostics: SnippetDiagnostic[];
}

// Matches a self-closing <Var ... /> tag, such as <Var name="variable" />.
const VAR_TAG = /<Var .+?\/>/g;
const VAR_ATTRIBUTE =
  /([A-Za-z_][\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}))?/g;

const parseVarTag = (tag: string): VarPart | undefined => {
  const attributes: Record<string, string | true> = {};
  const body = tag.slice("<Var".length, -"/>".length);
  for (const [, key, double, single, expression] of body.matchAll(
    VAR_ATTRIBUTE,
  )) {
    attributes[key] = double ?? single ?? expression ?? true;
  }

  const { name, description, initial, isGlobal } = attributes;
  if (typeof name !== "string") {
    return undefined;
  }

  const part: VarPart = {
    type: "var",
    name,
    // A bare attribute (<Var isGlobal />) enables the flag.
    isGlobal: isGlobal !== undefined && isGlobal !== "false",
    description: typeof description === "string" ? description : "",
  };
  if (typeof initial === "string") {
    part.initial = initial;
  }
  return part;
};

// Splits a line into text and <Var /> tags. The result alternates between
// text and tags, starting and ending with text, which may be empty.
export const parseInline = (
  content: string,
  diagnostics: SnippetDiagnostic[] = [],
): InlinePart[] => {
  const parts: InlinePart[] = [];
  let text = "";
  let end = 0;

  for (const match of content.matchAll(VAR_TAG)) {
    const part = parseVarTag(match[0]);
    if (!part) {
      diagnostics.push({
        severity: "error",
        message: `The tag ${match[0]} has no name attribute`,
      });
      continue;
    }
    text += content.slice(end, match.index);
    parts.push({ type: "text", value: text }, part);
    text = "";
    end = match.index + match[0].length;
  }

  parts.push({ type: "text", value: text + content.slice(end) });
  return parts;
};

export const MULTILINE_ERROR =
  "The last string in the multiline command has to be without symbol \\";

const getHeredocMark = (line: string): string => {
  let mark = line.match(/[^<<]*$/)![0].trim();

  if (mark.includes(">")) {
    mark = mark.split(">")[0].trim();
  }

  if (mark.includes("'")) {
    mark = mark.match(/'(.*?)'/)?.[1] ?? mark;
  }

  if (mark.indexOf("-") === 0) {
    mark = mark.slice(1);
  }

  return mark;
};

export const parseCodeSnippet = (content: string): ParsedSnippet => {
  const codeLines = content.split("\n");
  const nodes: SnippetNode[] = [];
  const diagnostics: SnippetDiagnostic[] = [];
  const inline = (line: string) => parseInline(line, diagnostics);

  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];
    const hasLeadingDollar = line[0] === "$";
    const hasHost = line[0] === ">" && line.includes("$");
    const hasGrate = line[0] === "#";
    const trimmedValue = line.slice(1).trim();

    if (hasLeadingDollar) {
      const command: CommandNode = {
        type: "command",
        prefix: "$ ",
        lines: [inline(trimmedValue)],
      };
      nodes.push(command);

      if (line.includes("<<")) {
        const heredocMark = getHeredocMark(line);

        while (codeLines[i] && codeLines[i] !== heredocMark) {
          command.lines.push(inline(codeLines[i + 1] ?? ""));
          i++;
        }

        if (codeLines.every((codeLine) => codeLine !== heredocMark)) {
          diagnostics.push({
            severity: "error",
            message: "No closing line for heredoc format",
          });
        }
      }

      let hasNextLine = codeLines[i]?.[codeLines[i]?.length - 1] === "\\";

      while (hasNextLine) {
        command.lines.push(inline(codeLines[i + 1] ?? ""));

        i++;
        hasNextLine = Boolean(codeLines[i]) && codeLines[i].endsWith("\\");

        if (!codeLines[i]) {
          diagnostics.push({ severity: "warning", message: MULTILINE_ERROR });
        }
      }
    } else if (hasHost) {
      const parts = line.split("$");
      const host = parts[0].slice(1).trim();

      nodes.push({
        type: "command",
        prefix: `${host} $ `,
        lines: [inline(parts[1].trim())],
      });
    } else if (hasGrate) {
      if (line[1] === "#") {
        nodes.push({
          type: "comment",
          value: line.slice(1),
          description: false,
        });
      } else {
        nodes.push({ type: "comment", value: trimmedValue, description: true });
      }
    } else {
      nodes.push({ type: "codeline", parts: inline(line) });
      // An empty code line renders as an empty element that has no height. A
      // line break after it keeps the line visible.
      if (line === "") {
        nodes.push({ type: "br" });
      }
    }
  }

  return { nodes, diagnostics };
};
