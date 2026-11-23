// Read-only sanity checks for the dev tooling. Verifies that:
//   1) the content -> docs/ + versioned_docs/ mapping matches what a real
//      `yarn prepare-files` produced (compares a sample of emitted files), and
//   2) the include-dependency graph resolves real partials to real dependents.
//
// Run: devtools/dev selftest      (safe; starts no server, writes nothing)

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { relative, join, sep } from "node:path";
import { loadVersions } from "./lib/config.mjs";
import { IncludeGraph } from "./lib/includes-graph.mjs";
import { destForPage } from "./lib/sync.mjs";

// Dependency-free sampler: first `n` real page .mdx files under sourceDir.
function sampleMdxPages(sourceDir, n) {
  const out = [];
  const walk = (dir) => {
    if (out.length >= n) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (out.length >= n) return;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "includes") continue; // pages only
        walk(full);
      } else if (
        e.isFile() &&
        full.endsWith(".mdx") &&
        !full.includes(`${sep}includes${sep}`)
      ) {
        out.push(full);
      }
    }
  };
  walk(sourceDir);
  return out;
}

export function runSelftest(root) {
  let ok = true;
  const fail = (m) => {
    ok = false;
    console.log(`  ✗ ${m}`);
  };
  const pass = (m) => console.log(`  ✓ ${m}`);

  const versions = loadVersions(root);
  console.log(`versions: ${versions.map((v) => v.name).join(", ")}`);

  // 1) Mapping check: pick a few real source pages per version and verify the
  //    computed destination exists and is byte-identical (requires that
  //    prepare-files has been run at least once).
  for (const v of versions) {
    if (!existsSync(v.source)) {
      fail(`source missing for ${v.name}: ${relative(root, v.source)}`);
      continue;
    }
    const samples = sampleMdxPages(v.source, 5);
    if (samples.length === 0) {
      fail(`no pages found under ${relative(root, v.source)}`);
      continue;
    }
    let matched = 0;
    for (const abs of samples) {
      const dest = destForPage(abs, versions);
      if (
        dest &&
        existsSync(dest) &&
        readFileSync(dest).equals(readFileSync(abs))
      ) {
        matched++;
      }
    }
    if (matched === samples.length) {
      pass(
        `${v.name}: ${matched}/${samples.length} sample pages map correctly → ${relative(root, v.dest)}/`,
      );
    } else {
      fail(
        `${v.name}: only ${matched}/${samples.length} sample pages match dest (run "yarn prepare-files" first?)`,
      );
    }
    if (!existsSync(v.sidebarSource)) {
      fail(`sidebar source missing: ${relative(root, v.sidebarSource)}`);
    }
  }

  // 2) Include-graph check.
  const graph = new IncludeGraph(versions);
  const g = graph.build();
  console.log(
    `include graph: ${g.files} source files, ${g.edges} targets, ${g.ms}ms`,
  );
  if (g.files === 0) fail("graph found no source files");
  if (g.edges === 0) fail("graph found no include targets — is the (!...!) scan working?");

  // Confirm the reverse walk returns real page files for a few real partials.
  let probed = 0;
  for (const target of graph.reverse.keys()) {
    if (probed >= 3) break;
    if (!target.includes(`${sep}includes${sep}`)) continue;
    const pages = graph.dependentPages(target);
    if (pages.size > 0) {
      probed++;
      const ex = [...pages][0];
      pass(`${relative(root, target)} ← ${pages.size} page(s) (e.g. ${relative(root, ex)})`);
    }
  }
  if (probed === 0) fail("no include with resolvable dependent pages found");

  console.log(ok ? "\nselftest: PASS" : "\nselftest: FAIL");
  return ok;
}
