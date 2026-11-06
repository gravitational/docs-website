#!/usr/bin/env node
import { readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

// Upgrades selected legacy partials to MDX-native syntax in two passes:
// - Pass 1 rewrites each selected .md/.mdx partial in memory so that it reads
//   its parameters from props (see rewritePartial).
// - Pass 2 scans every .md/.mdx file under docs/pages, including partials, and
//   rewrites (!path params!) references to selected files into imports: JSX
//   elements outside code fences, raw-loader text inside them.
// A parse error aborts before any file is written; files are then replaced
// one at a time.

const fail = (message) => {
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

const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(fullPath);
    else if (entry.isFile()) files.push(fullPath);
  }
}
await walk(pagesRoot);

// Derives a unique PascalCase import name from a path, e.g.
// docs/pages/includes/nested/demo.mdx -> DocsPagesIncludesNestedDemo.
// A name already in use gets a numeric suffix (Demo2, Demo3, ...).
const importIdentifier = (source, used) => {
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

// Parses key="value" key2="value2" from a legacy include or defaults header
// into { camelCaseKey: value }. A value ends at the first " outside {...}, so
// db="{props.x ?? "y"}" is one value. Escaped quotes (\") are unescaped.
function parseAssignments(expression, context) {
  const assignments = {};
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
    const key = toCamelCase(keyMatch[1]);
    offset += keyMatch[0].length;

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

function toCamelCase(name) {
  return name.replace(/-([a-zA-Z0-9])/g, (_match, character) =>
    character.toUpperCase(),
  );
}

// Converts a legacy attribute value to a JSX attribute value:
// - plain text -> "text"
// - a single {expr} -> {expr}, unchanged
// - text mixed with {expr} -> string concatenation, e.g.
//   {"--db-user=" + (props.dbUser ?? "alice")}
// Unbalanced braces fall back to a plain string.
function formatJsxAttribute(value) {
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

// Converts a partial's legacy parameter syntax to props:
// 1. Removes the defaults header and keeps its values as ?? fallbacks.
// 2. Turns code fences that use {{ param }} into <CodeBlock> template literals.
// 3. Replaces the remaining {{ param }} with {props.param}.
// 4. Adds defaults to the partial's existing {props.x} references.
// 5. Unquotes {props.*} attributes on <Var>.
// Includes inside the partial are left to pass 2.
function rewritePartial(source, file) {
  // Remove the defaults header line ({{ a="x" b="y" }}) and collect its values
  // as fallbacks for props.*.
  let defaults = {};
  source = source.replace(
    /(?:^|\r?\n)[ \t]*\{\{\s*(.*?)\s*\}\}[ \t]*(?:\r?\n|$)/gm,
    (match, expression) => {
      if (!/^[A-Za-z_$][\w$-]*="/.test(expression)) return match;
      Object.assign(defaults, parseAssignments(expression, file));
      return "";
    },
  );
  // MDX doesn't interpolate inside code fences, so a fence that uses
  // {{ param }} becomes a <CodeBlock> with a template literal.
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
      const templateExpression = `\n${indent} \`${templateLines
        .map((line) => line)
        .join(`\n${indent}  `)}\`\n`;
      return `${indent}<CodeBlock>\n${indent}{${templateExpression}${indent}}\n${indent}</CodeBlock>`;
    },
  );
  // Replace the remaining {{ param }} with {props.param}, plus ?? default when
  // the partial declares one.
  source = source.replace(
    /\{\{\s*([A-Za-z_$][\w$-]*)\s*\}\}/g,
    (_match, rawName) => {
      const name = toCamelCase(rawName);
      if (!(name in defaults)) return `{props.${name}}`;
      return `{props.${name} ?? ${JSON.stringify(defaults[name])}}`;
    },
  );
  // Add defaults to {props.x} references the partial already had.
  source = source.replace(
    /\{\s*props\.([A-Za-z_$][\w$]*)\s*\}/g,
    (match, name) => {
      if (!(name in defaults)) return match;
      return `{ props.${name} ?? ${JSON.stringify(defaults[name])} }`;
    },
  );
  // Unquote {props.*} attributes on <Var>: a quoted value is passed as the
  // literal string "{props.x}" instead of being evaluated.
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

function escapeTemplateLiteral(value) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replaceAll("${", "\\${");
}

// Calls transform(fence, indent, token, info, body) for each fenced code block
// and replaces the block with its return value (return fence to keep it).
// A closing fence must use the same character, be at least as long as the
// opening one, and have the same indentation; the indentation rule is
// stricter than CommonMark.
function replaceFencedBlocks(source, transform) {
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

const selectedFiles = new Map();
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

// Pass 1: rewrite each selected .md/.mdx partial in memory (see rewritePartial).
// examples/ and non-Markdown files are only referenced, not rewritten.
const fileUpdates = new Map();
const selectedPartialFiles = new Set();
for (const [selected, partialPath] of selectedFiles) {
  // examples/ files are raw text, not MDX components — skip the React component rewrite.
  if (selected.startsWith("examples/") || !/\.mdx?$/i.test(partialPath))
    continue;
  selectedPartialFiles.add(partialPath);
  const original = await readFile(partialPath, "utf8");
  fileUpdates.set(partialPath, rewritePartial(original, selected));
}

// Normalizes a legacy include path to a content-root-relative key.
// includes/... is shorthand for docs/pages/includes/....
const includePathKey = (includePath) => {
  const normalized = path.posix.normalize(
    includePath
      .replaceAll("\\", "/")
      .replace(/^\/(?=(?:docs|examples|includes)\/)/, ""),
  );
  return normalized.startsWith("includes/")
    ? `docs/pages/${normalized}`
    : normalized;
};
// Legacy include syntax: (!path key="value" ...!)
const includePattern = /\(!([^!]+)!\)/g;

// Pass 2: rewrite references to selected files in every .md/.mdx file under
// docs/pages, starting from the pass-1 result for selected partials.
for (const file of files) {
  if (!/\.mdx?$/i.test(file)) continue;
  // start from the pass-1 rewrite if this is a selected partial, so both passes compose.
  let source = fileUpdates.has(file)
    ? fileUpdates.get(file)
    : await readFile(file, "utf8");
  // always the on-disk content, used at the end to detect net changes.
  const original = await readFile(file, "utf8");
  const usedNames = new Set();
  const imports = [];
  const bindingByTarget = new Map();
  const getBinding = (target, loader) => {
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
    return bindingByTarget.get(importKey);
  };

  // An include inside a code fence is imported with !!raw-loader! and shown as
  // text in a <CodeBlock>. It is matched against selectedPaths, not
  // selectedPartialFiles, because non-MDX files (.yaml, examples/) can only be
  // embedded this way.
  source = replaceFencedBlocks(
    source,
    (fence, indent, fenceToken, info, body) => {
      if (!includePattern.test(body)) return fence;
      includePattern.lastIndex = 0;
      let language = info.trim().split(/\s+/)[0] || null;
      // Split the body into text and upgraded includes. An include that is not
      // upgraded stays part of the surrounding text.
      const segments = [];
      let textStart = 0;
      let upgraded = false;
      for (const match of body.matchAll(includePattern)) {
        const [rawTarget] = match[1].trim().split(/\s+/);
        const includeKey = includePathKey(rawTarget.replace(/^\.\//, ""));
        // Upgrade this include only if its target is selected, or if the whole containing file is being rewritten.
        if (!selectedPartialFiles.has(file) && !selectedPaths.has(includeKey))
          continue;
        segments.push({ text: body.slice(textStart, match.index) });
        segments.push({ binding: getBinding(includeKey, true) });
        textStart = match.index + match[0].length;
        upgraded = true;
      }
      if (!upgraded) return fence;
      segments.push({ text: body.slice(textStart) });

      const transformedBody = segments
        .map(({ text, binding }) => {
          if (binding) return `\n${indent}  {${binding}}\n${indent}`;
          // Text in a code block (such as comments) is not valid MDX once the
          // fence is gone, so wrap it in a template literal expression.
          // Leading blank lines (lead) and trailing whitespace (trail) stay
          // outside the literal to keep the spacing around the include.
          const [, lead, core, trail] = text.match(
            /^((?:[ \t]*\r?\n)*)([\s\S]*?)(\s*)$/,
          );
          if (!core) return text;
          const lines = core
            .split(/\r?\n/)
            .map((line) =>
              line.startsWith(indent) ? line.slice(indent.length) : line,
            )
            .map((line) => `${indent}  ${escapeTemplateLiteral(line)}`);
          return `${lead}${indent}{\`\n${lines.join("\n")}\`\n${indent}}${trail}`;
        })
        .join("");
      const inner = transformedBody.replace(/\n$/, "");
      if (!language)
        return `${indent}<CodeBlock>\n${inner}\n${indent}</CodeBlock>`;
      return `${indent}<CodeBlock language=${JSON.stringify(language)}>\n${inner}\n${indent}</CodeBlock>`;
    },
  );

  // An include outside a code fence is imported as a component and rendered
  // as <Binding props />. Only selected .md/.mdx partials qualify.
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

  // MDX imports must come first: place new ones after the frontmatter and
  // after any existing imports.
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
  /// Write each file to a temporary sibling, then rename it over the original.
  // Writing directly would truncate the original first, so a crash mid-write
  // would leave a half-written file. rename() replaces the file in one step,
  // so the original stays intact until the new content is complete.
  await writeFile(temporary, content);
  await rename(temporary, file);
}

if (selectedPartialFiles.size > 0) {
  console.log(`Upgraded ${selectedPartialFiles.size} partial(s).`);
}
if (selectedFiles.size > 0) {
  const referencingFiles = [...fileUpdates.keys()].filter(
    (file) => !selectedPartialFiles.has(file),
  );
  console.log(
    `Updated partial references in ${referencingFiles.length} file(s).`,
  );
}
