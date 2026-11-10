// Parser for the "code" snippet format: commands prefixed with "$", comments
// prefixed with "#", multiline and heredoc commands, and inline <Var /> tags.

export interface TextPart {
  type: "text";
  value: string;
}

// A <Var /> component within a line. The fields come from the component's attributes.
export interface VarPart {
  type: "var";
  name: string;
  isGlobal: boolean;
  description: string;
  initial?: string;
}

// One piece of a line: plain text or a variable.
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

// Any item the parser can produce from a snippet.
export type SnippetNode = CommandNode | CommentNode | CodeLineNode | BreakNode;

// A problem found while parsing, such as a heredoc with no closing line.
export interface SnippetDiagnostic {
  // "error" diagnostics are always reported. "warning" diagnostics are only
  // reported by linters.
  severity: "error" | "warning";
  message: string;
}

// The result of parsing a snippet: its items in order, plus any problems.
export interface ParsedSnippet {
  nodes: SnippetNode[];
  diagnostics: SnippetDiagnostic[];
}

// Matches a self-closing <Var ... /> tag, such as <Var name="variable" />.
const VAR_TAG = /<Var .+?\/>/g;

// Matches one attribute in a tag: its name, then optionally a value in double
// quotes, single quotes, or braces (name="x", name='x', name={x}).
const VAR_ATTRIBUTE =
  /([A-Za-z_][\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}))?/g;

// Reads a <Var /> tag into a VarPart. Returns undefined if the tag has no name attribute.
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

// Warning for a multiline command whose last line still ends with "\", so
// the command continues into an empty line or past the end of the snippet.
export const MULTILINE_ERROR =
  "The last string in the multiline command has to be without symbol \\";

// Returns the word that ends a heredoc, e.g. "EOF" in "$ cat <<EOF > file".
// The parser adds every line up to that word to the same command, so the
// whole heredoc is copied together. Also works with <<'EOF' and <<-EOF.
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

// Parses the raw text of a code snippet. It goes through the text one line
// at a time and decides what each line is from how it starts:
// - A line starting with "$" is a command. If the command opens a heredoc,
//   or a line ends with "\" to continue on the next line, the following
//   lines are added to the same command.
// - A line starting with "> host $" is a command run on that host.
// - A line starting with "#" is a description, which isn't copied. A line
//   starting with "##" is a comment shown as a regular line.
// - Any other line is plain code, such as example output. An empty line also
//   gets a line break after it so it stays visible.
//
// Returns the parsed items in order, along with any problems found, such as
// a heredoc that is never closed.
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
