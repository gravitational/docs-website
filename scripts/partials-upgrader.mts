#!/usr/bin/env node
import { readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const contentRootArgument = process.argv[2];
if (!contentRootArgument || path.isAbsolute(contentRootArgument)) {
  fail(
    "Usage: partials-upgrader.sh <content-root-relative-path> (selected paths on stdin)",
  );
}

const contentRoot = path.resolve(process.cwd(), contentRootArgument);
const pagesRoot = path.join(contentRoot, "docs", "pages");

try {
  if (
    !(await stat(contentRoot)).isDirectory() ||
    !(await stat(pagesRoot)).isDirectory()
  ) {
    fail(`Content root must contain docs/pages: ${contentRootArgument}`);
  }
} catch {
  fail(`Content root must contain docs/pages: ${contentRootArgument}`);
}

let input = "";
for await (const chunk of process.stdin) input += chunk;
const selectedPaths = new Set(
  input
    .trim()
    // Accepts comma-separated (from the shell classifier) or newline-separated paths.
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^\/(?=(?:docs|examples)\/)/, ""))
    .map((item) => path.posix.normalize(item.replaceAll("\\", "/"))),
);

for (const selected of selectedPaths) {
  if (
    selected.startsWith("../") ||
    selected === ".." ||
    path.posix.isAbsolute(selected)
  ) {
    fail(`Selected path must stay inside the content root: ${selected}`);
  }
}
if (selectedPaths.size === 0) process.exit(0);

const files: string[] = [];
async function walk(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(fullPath);
    else if (entry.isFile()) files.push(fullPath);
  }
}
await walk(pagesRoot);

const importIdentifier = (source: string, used: Set<string>): string => {
  let identifier = source
    .replace(/\.[^.\/]+$/, "")
    .split(/[\/._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("")
    .replace(/[^A-Za-z0-9_$]/g, "");
  if (!identifier || /^[0-9]/.test(identifier))
    identifier = `Partial${identifier}`;
  let candidate = identifier;
  let suffix = 2;
  while (used.has(candidate)) candidate = `${identifier}${suffix++}`;
  used.add(candidate);
  return candidate;
};

function parseAssignments(
  expression: string,
  context: string,
): Record<string, string> {
  const assignments: Record<string, string> = {};
  let offset = 0;
  while (offset < expression.length) {
    while (expression[offset] === " ") offset++;
    if (offset === expression.length) break;
    // Tolerate a leading quote that some older include blocks emit before the first key.
    if (
      expression[offset] === '"' &&
      /[A-Za-z_$][\w$-]*=/.test(expression.slice(offset + 1))
    ) {
      offset++;
    }
    const keyMatch = expression.slice(offset).match(/^([A-Za-z_$][\w$-]*)="/);
    if (!keyMatch)
      fail(`Malformed parameter assignment in ${context}: ${expression}`);
    const key = toCamelCase(keyMatch![1]);
    offset += keyMatch![0].length;

    const valueStart = offset;
    let braceDepth = 0;
    let escaped = false;
    let closed = false;
    for (; offset < expression.length; offset++) {
      const character = expression[offset];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === "\\") {
        escaped = true;
        continue;
      }
      if (character === "{") braceDepth++;
      else if (character === "}" && braceDepth > 0) braceDepth--;
      else if (character === '"' && braceDepth === 0) {
        closed = true;
        break;
      }
    }
    if (!closed)
      fail(`Malformed parameter assignment in ${context}: ${expression}`);
    assignments[key] = expression
      .slice(valueStart, offset)
      .replaceAll('\\"', '"');
    offset++;
    if (offset < expression.length && expression[offset] !== " ") {
      fail(`Malformed parameter assignment in ${context}: ${expression}`);
    }
  }
  return assignments;
}

function toCamelCase(name: string): string {
  return name.replace(/-([a-zA-Z0-9])/g, (_match, character) =>
    character.toUpperCase(),
  );
}

function formatJsxAttribute(value: string): string {
  if (!value.includes("{")) return JSON.stringify(value);
  if (/^\{[\s\S]*\}$/.test(value)) return value;
  const parts = [];
  let textStart = 0;
  let index = 0;
  while (index < value.length) {
    if (value[index] !== "{") {
      index++;
      continue;
    }
    if (index > textStart)
      parts.push(JSON.stringify(value.slice(textStart, index)));
    let depth = 1;
    const expressionStart = ++index;
    while (index < value.length && depth > 0) {
      if (value[index] === "{") depth++;
      else if (value[index] === "}") depth--;
      index++;
    }
    if (depth !== 0) return JSON.stringify(value);
    parts.push(`(${value.slice(expressionStart, index - 1)})`);
    textStart = index;
  }
  if (textStart < value.length)
    parts.push(JSON.stringify(value.slice(textStart)));
  return `{${parts.join(" + ")}}`;
}

function rewritePartial(source: string, file: string): string {
  let defaults: Record<string, string> = {};
  source = source.replace(
    /(?:^|\r?\n)[ \t]*\{\{\s*(.*?)\s*\}\}[ \t]*(?:\r?\n|$)/gm,
    (match, expression) => {
      if (!/^[A-Za-z_$][\w$-]*="/.test(expression)) return match;
      Object.assign(defaults, parseAssignments(expression, file));
      return "";
    },
  );
  const parameterPattern = /\{\{\s*([A-Za-z_$][\w$-]*)\s*\}\}/g;
  source = replaceFencedBlocks(
    source,
    (fence, indent, fenceToken, _info, body) => {
      if (!parameterPattern.test(body)) return fence;
      parameterPattern.lastIndex = 0; // reset: .test() above advanced lastIndex on a global regex
      // Strip the fence's leading indentation so the template literal body is left-aligned.
      const code = body
        .replace(/\r?\n$/, "")
        .split(/\r?\n/)
        .map((line) =>
          line.startsWith(indent) ? line.slice(indent.length) : line,
        )
        .join("\n");
      let template = "";
      let previousEnd = 0;
      for (const match of code.matchAll(parameterPattern)) {
        const rawName = match[1];
        const name = toCamelCase(rawName);
        const expression =
          name in defaults
            ? ` props.${name} ?? ${JSON.stringify(defaults[name])} `
            : ` props.${name} `;
        template += escapeTemplateLiteral(code.slice(previousEnd, match.index));
        template += `\${${expression}}`;
        previousEnd = match.index + match[0].length;
      }
      template += escapeTemplateLiteral(code.slice(previousEnd));
      const templateLines = template.split("\n");
      const templateExpression = `\`${templateLines
        .map((line) => line)
        .join(`\n${indent}  `)}\``;
      return `${indent}<CodeBlock>\n${indent}{${templateExpression}}\n${indent}</CodeBlock>`;
    },
  );
  source = source.replace(
    /\{\{\s*([A-Za-z_$][\w$-]*)\s*\}\}/g,
    (_match, rawName) => {
      const name = toCamelCase(rawName);
      if (!(name in defaults)) return `{props.${name}}`;
      return `{props.${name} ?? ${JSON.stringify(defaults[name])}}`;
    },
  );
  source = source.replace(
    /\{\s*props\.([A-Za-z_$][\w$]*)\s*\}/g,
    (match, name) => {
      if (!(name in defaults)) return match;
      return `{ props.${name} ?? ${JSON.stringify(defaults[name])} }`;
    },
  );
  return source.replace(/<Var\b[^<>]*>/g, (tag) => {
    let normalized = tag.replace(
      /\b([\w:-]+)="(\{[^{}\r\n]*\})"/g,
      (match, attribute, expression) => {
        if (!/\bprops\./.test(expression)) return match;
        return `${attribute}=${expression}`;
      },
    );
    if (normalized !== tag) normalized = normalized.replace(/\s*\/>$/, " />");
    return normalized;
  });
}

function escapeTemplateLiteral(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replaceAll("${", "\\${");
}

function replaceFencedBlocks(
  source: string,
  transform: (
    fence: string,
    indent: string,
    fenceToken: string,
    info: string,
    body: string,
  ) => string,
): string {
  const lines = (source.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g) ?? []).filter(
    Boolean,
  );
  const output = [];
  for (let index = 0; index < lines.length; ) {
    const openingText = lines[index].replace(/(?:\r\n|\n|\r)$/, "");
    const opening = openingText.match(/^([ \t]*)(`{3,}|~{3,})([^\r\n]*)$/);
    if (!opening) {
      output.push(lines[index++]);
      continue;
    }

    const [, indent, token, info] = opening;
    let closingIndex = index + 1;
    for (; closingIndex < lines.length; closingIndex++) {
      const closingText = lines[closingIndex].replace(/(?:\r\n|\n|\r)$/, "");
      const closing = closingText.match(/^([ \t]*)(`+|~+)[ \t]*$/);
      if (
        closing &&
        closing[1] === indent &&
        closing[2][0] === token[0] &&
        closing[2].length >= token.length
      ) {
        break;
      }
    }

    // No closing fence found — treat the opening line as plain text (unclosed fence is valid MDX).
    if (closingIndex === lines.length) {
      output.push(lines[index++]);
      continue;
    }

    // fence excludes the closing line's newline; push it separately to preserve the original line ending.
    const fence = lines
      .slice(index, closingIndex + 1)
      .join("")
      .replace(/(?:\r\n|\n|\r)$/, "");
    const body = lines.slice(index + 1, closingIndex).join("");
    output.push(transform(fence, indent, token, info, body));
    output.push(lines[closingIndex].match(/(?:\r\n|\n|\r)$/)?.[0] ?? "");
    index = closingIndex + 1;
  }
  return output.join("");
}

const selectedFiles = new Map<string, string>();
for (const selected of selectedPaths) {
  const partialPath = path.resolve(contentRoot, selected);
  if (!partialPath.startsWith(`${contentRoot}${path.sep}`)) {
    fail(`Selected path escapes content root: ${selected}`);
  }
  try {
    if (!(await stat(partialPath)).isFile())
      fail(`Selected partial not found: ${selected}`);
    selectedFiles.set(selected, partialPath);
  } catch {
    fail(`Selected partial not found: ${selected}`);
  }
}

const fileUpdates = new Map<string, string>();
const selectedPartialFiles = new Set<string>();
for (const [selected, partialPath] of selectedFiles) {
  // examples/ files are raw text, not MDX components — skip the React component rewrite.
  if (selected.startsWith("examples/") || !/\.mdx?$/i.test(partialPath))
    continue;
  selectedPartialFiles.add(partialPath);
  const original = await readFile(partialPath, "utf8");
  fileUpdates.set(partialPath, rewritePartial(original, selected));
}

const includePathKey = (includePath: string): string => {
  const normalized = path.posix.normalize(
    includePath
      .replaceAll("\\", "/")
      .replace(/^\/(?=(?:docs|examples|includes)\/)/, ""),
  );
  return normalized.startsWith("includes/")
    ? `docs/pages/${normalized}`
    : normalized;
};
const includePattern = /\(!([^!]+)!\)/g;
for (const file of files) {
  if (!/\.mdx?$/i.test(file)) continue;
  // start from the pass-1 rewrite if this is a selected partial, so both passes compose.
  let source = fileUpdates.has(file)
    ? fileUpdates.get(file)!
    : await readFile(file, "utf8");
  // always the on-disk content, used at the end to detect net changes.
  const original = await readFile(file, "utf8");
  const usedNames = new Set<string>();
  const imports: string[] = [];
  const bindingByTarget = new Map<string, string>();
  const getBinding = (target: string, loader: boolean): string => {
    // Keyed by loader flag + path: the same file may be imported as both a component and a raw string.
    const importKey = `${loader}:${target}`;
    if (!bindingByTarget.has(importKey)) {
      const binding = importIdentifier(target, usedNames);
      const importPath = loader
        ? `!!raw-loader!@version/${target}`
        : `@version/${target}`;
      imports.push(`import ${binding} from ${JSON.stringify(importPath)};`);
      bindingByTarget.set(importKey, binding);
    }
    return bindingByTarget.get(importKey)!;
  };

  source = replaceFencedBlocks(
    source,
    (fence, indent, fenceToken, info, body) => {
      if (!includePattern.test(body)) return fence;
      includePattern.lastIndex = 0;
      let language: string | null = info.trim().split(/\s+/)[0] || null;
      const transformedBody = body.replace(
        includePattern,
        (_match, expression) => {
          const [rawTarget, ...rest] = expression.trim().split(/\s+/);
          const target = rawTarget.replace(/^\.\//, "");
          const includeKey = includePathKey(target);
          // Upgrade this include only if its target is selected, or if the whole containing file is being rewritten.
          if (!selectedPartialFiles.has(file) && !selectedPaths.has(includeKey))
            return _match;
          const binding = getBinding(includeKey, true);
          return `\n${indent}  {${binding}}\n${indent}`;
        },
      );
      includePattern.lastIndex = 0;
      if (transformedBody === body) return fence;
      const inner = transformedBody.replace(/\n$/, "");
      if (!language)
        return `${indent}<CodeBlock>\n${inner}\n${indent}</CodeBlock>`;
      return `${indent}<CodeBlock language=${JSON.stringify(language)}>\n${inner}\n${indent}</CodeBlock>`;
    },
  );

  source = source.replace(includePattern, (match, expression) => {
    const [rawTarget, ...rest] = expression.trim().split(/\s+/);
    const target = rawTarget.replace(/^\.\//, "");
    const includeKey = includePathKey(target);
    if (!selectedPartialFiles.has(path.join(contentRoot, includeKey)))
      return match;
    const params = parseAssignments(rest.join(" ").trim(), file);
    const binding = getBinding(includeKey, false);
    const props = Object.entries(params)
      .map(([key, value]) => `${key}=${formatJsxAttribute(value)}`)
      .join(" ");
    return `<${binding}${props ? ` ${props}` : ""} />`;
  });
  includePattern.lastIndex = 0;

  if (imports.length) {
    const importBlock = `${imports.join("\n")}\n\n`;
    const frontmatter = source.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
    const prefix = frontmatter?.[0] ?? "";
    const rest = source.slice(prefix.length);
    const existingImports = rest.match(/^(?:import[^\n]*\n)+\s*/);
    if (existingImports) {
      source = `${prefix}${existingImports[0]}${importBlock}${rest.slice(existingImports[0].length)}`;
    } else {
      source = `${prefix}${importBlock}${rest}`;
    }
  }
  if (source !== original) fileUpdates.set(file, source);
}

for (const [file, content] of fileUpdates) {
  const temporary = `${file}.partials-upgrader.tmp`;
  // Write to a temp file then rename for an atomic replace — original survives a mid-write crash.
  await writeFile(temporary, content);
  await rename(temporary, file);
}
