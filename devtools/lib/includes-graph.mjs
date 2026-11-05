// Builds and maintains a dependency graph of which pages (transitively) include
// which partials / snippet files, so that when an include changes we can
// re-emit ONLY the affected pages instead of restarting Docusaurus.
//
// Why this exists: server/remark-includes.ts resolves `(!path!)` directives at
// MDX-compile time by reading the target straight from `content/<version>/` via
// readFileSync. Those reads are NOT registered as webpack/rspack dependencies,
// so editing an include is invisible to Docusaurus HMR. The old start-dev.sh
// worked around that with a full `yarn clear && docusaurus start` restart. With
// this graph we instead touch the including pages, which Docusaurus DOES watch,
// so it recompiles them and re-reads the fresh include — no restart needed.
//
// Resolution mirrors remark-includes.ts: the include path is joined onto the
// version root (content/<version>), so `(!docs/pages/includes/x.mdx!)` resolves
// to content/<version>/docs/pages/includes/x.mdx. Targets may be non-.mdx too
// (code snippets under examples/, CHANGELOG.md, ...); those are captured as leaf
// targets in the reverse map.

import { readFileSync, readdirSync } from "node:fs";
import { resolve, join, sep } from "node:path";

// Matches an include directive and captures the target path (first token, no
// spaces, no `!`). Deliberately permissive: over-matching only causes a harmless
// extra recompile, whereas under-matching would miss a needed update.
const INCLUDE_RE = /\(!\s*([^\s!]+)[^!]*!\)/g;

const isMdx = (p) => p.endsWith(".mdx") || p.endsWith(".md");
const isInclude = (p) => p.includes(`${sep}includes${sep}`);

// Recursively collect .mdx/.md files under `dir`.
function walkMdx(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out; // dir may not exist for a given version
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      walkMdx(full, out);
    } else if (e.isFile() && isMdx(e.name)) {
      out.push(full);
    }
  }
  return out;
}

// Extract the set of absolute include-target paths referenced by one file.
function scanFile(absFile, versionRoot) {
  let text;
  try {
    text = readFileSync(absFile, "utf8");
  } catch {
    return new Set();
  }
  const targets = new Set();
  for (const m of text.matchAll(INCLUDE_RE)) {
    const token = m[1];
    if (!token || /^https?:/.test(token)) continue;
    // join() (not resolve()) so a leading "/" is treated as a path segment,
    // exactly like remark-includes' join(rootDir, includePath).
    targets.add(resolve(join(versionRoot, token)));
  }
  return targets;
}

export class IncludeGraph {
  constructor(versions) {
    this.versions = versions;
    // absFile -> Set<absTarget>
    this.forward = new Map();
    // absTarget -> Set<absFile that includes it>
    this.reverse = new Map();
    // absFile -> versionRoot (only for scanned source files)
    this._versionRootOf = new Map();
  }

  // Which version's source tree does this file belong to (by path prefix)?
  _versionRootForPath(absFile) {
    for (const v of this.versions) {
      if (absFile === v.source || absFile.startsWith(v.source + sep)) {
        return v.root;
      }
    }
    return null;
  }

  _removeEdges(absFile) {
    const old = this.forward.get(absFile);
    if (!old) return;
    for (const t of old) {
      const set = this.reverse.get(t);
      if (set) {
        set.delete(absFile);
        if (set.size === 0) this.reverse.delete(t);
      }
    }
    this.forward.delete(absFile);
  }

  _addEdges(absFile, versionRoot) {
    const targets = scanFile(absFile, versionRoot);
    this.forward.set(absFile, targets);
    this._versionRootOf.set(absFile, versionRoot);
    for (const t of targets) {
      let set = this.reverse.get(t);
      if (!set) this.reverse.set(t, (set = new Set()));
      set.add(absFile);
    }
  }

  // Full scan of every source .mdx across all versions.
  build() {
    const t0 = Date.now();
    let files = 0;
    for (const v of this.versions) {
      for (const f of walkMdx(v.source)) {
        this._addEdges(f, v.root);
        files++;
      }
    }
    return { files, edges: this.reverse.size, ms: Date.now() - t0 };
  }

  // Re-scan a single source file after it was created/edited.
  update(absFile) {
    const versionRoot = this._versionRootForPath(absFile);
    if (!versionRoot) return;
    this._removeEdges(absFile);
    this._addEdges(absFile, versionRoot);
  }

  // Drop a source file that was deleted.
  remove(absFile) {
    this._removeEdges(absFile);
    this._versionRootOf.delete(absFile);
  }

  // Given a changed target (an include or snippet file), return the set of
  // PAGE files that must be re-emitted. Walks the reverse graph so nested
  // includes (an include that includes the changed include) resolve correctly.
  dependentPages(absTarget) {
    const pages = new Set();
    const seen = new Set();
    const queue = [resolve(absTarget)];
    while (queue.length) {
      const node = queue.shift();
      if (seen.has(node)) continue;
      seen.add(node);
      const includers = this.reverse.get(node);
      if (!includers) continue;
      for (const f of includers) {
        // A real page (under docs/pages, not itself an include) is a leaf we
        // emit. Anything else is an intermediate include; keep walking up.
        if (isMdx(f) && !isInclude(f)) {
          pages.add(f);
        }
        // Continue walking regardless, to support pages-including-pages and
        // deeply nested include chains.
        queue.push(f);
      }
    }
    return pages;
  }
}
