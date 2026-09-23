// Maps a changed file under content/<version>/ to the correct action against the
// Docusaurus-visible tree (docs/, versioned_docs/, sidebars). All writes go to
// generated (git-ignored) output, never back into content/, so there is no
// feedback loop with the watcher.

import {
  copyFileSync,
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { resolve, relative, dirname, join, sep } from "node:path";

const isMdx = (p) => p.endsWith(".mdx") || p.endsWith(".md");
const isInclude = (p) => p.includes(`${sep}includes${sep}`);

// Find the version whose source tree contains `abs`, plus the matching dest.
function locate(abs, versions) {
  for (const v of versions) {
    if (abs === v.source || abs.startsWith(v.source + sep)) return v;
  }
  return null;
}

// Absolute destination file for a page source path.
export function destForPage(abs, versions) {
  const v = locate(abs, versions);
  if (!v) return null;
  const rel = relative(v.source, abs);
  return join(v.dest, rel);
}

const ensureDir = (file) => {
  const dir = dirname(file);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
};

// Copy a page verbatim (matches prepare-files' copyFileSync fidelity).
export function emitPage(abs, versions) {
  const dest = destForPage(abs, versions);
  if (!dest || !existsSync(abs)) return null;
  ensureDir(dest);
  copyFileSync(abs, dest);
  return dest;
}

// Re-emit a page in a way that is GUARANTEED to change the destination bytes,
// even when the source content is byte-identical (the case when only an included
// partial changed). We toggle the number of trailing newlines, which is inert in
// Markdown/MDX, so rspack's mtime+hash watcher always sees a real change and
// recompiles — re-reading the fresh include.
export function bumpPage(abs, versions) {
  const dest = destForPage(abs, versions);
  if (!dest || !existsSync(abs)) return null;
  ensureDir(dest);
  let out = readFileSync(abs, "utf8");
  try {
    if (readFileSync(dest, "utf8") === out) out += "\n";
  } catch {
    // dest missing — verbatim copy already differs from "nothing".
  }
  writeFileSync(dest, out);
  return dest;
}

export function deletePage(abs, versions) {
  const dest = destForPage(abs, versions);
  if (!dest) return null;
  rmSync(dest, { force: true });
  return dest;
}

export function emitSidebar(abs, versions) {
  const v = versions.find((v) => resolve(v.sidebarSource) === resolve(abs));
  if (!v || !existsSync(abs)) return null;
  ensureDir(v.sidebarDest);
  copyFileSync(abs, v.sidebarDest);
  return v.sidebarDest;
}

// Classify a changed absolute path into an action descriptor.
//   { kind: "page"|"include", version, abs, exists }
//   { kind: "sidebar", abs }
//   { kind: "config", version, abs }
//   { kind: "target", abs }        // possible non-mdx include target (examples/, CHANGELOG.md, ...)
//   null                            // ignore
export function classify(abs, versions) {
  for (const v of versions) {
    if (resolve(v.sidebarSource) === abs) return { kind: "sidebar", abs, version: v };
    if (resolve(v.configSource) === abs) return { kind: "config", abs, version: v };
  }
  const v = locate(abs, versions);
  if (v && isMdx(abs)) {
    return {
      kind: isInclude(abs) ? "include" : "page",
      version: v,
      abs,
      exists: existsSync(abs),
    };
  }
  // Anything else under a version root might be a non-mdx include target
  // (a code snippet, CHANGELOG.md, ...). The caller checks the reverse graph.
  for (const ver of versions) {
    if (abs.startsWith(ver.root + sep)) return { kind: "target", abs, version: ver };
  }
  return null;
}

// Copy the repo-root tags.yml into every dest dir (prepare-files does this too).
export function copyTags(root, versions) {
  const src = join(root, "tags.yml");
  if (!existsSync(src)) return [];
  const written = [];
  for (const v of versions) {
    const dest = join(v.dest, "tags.yml");
    ensureDir(dest);
    copyFileSync(src, dest);
    written.push(dest);
  }
  return written;
}
