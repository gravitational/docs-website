// Integration test for the watcher -> applyBatch -> docs/ pipeline.
// Drives the REAL fs.watch machinery (no server) using throwaway temp files
// under the current version, asserting each destination write. Cleans up after
// itself so the content submodule returns to its prior state.
//
// Run: node devtools/inttest.mjs      (writes a couple of transient temp files)

import {
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
  mkdirSync,
} from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { loadVersions } from "./lib/config.mjs";
import { IncludeGraph } from "./lib/includes-graph.mjs";
import { watchPaths } from "./lib/watcher.mjs";
import { applyBatch } from "./lib/apply.mjs";
import { destForPage } from "./lib/sync.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
process.chdir(ROOT);
const rel = (p) => relative(ROOT, p);

const versions = loadVersions(ROOT);
const cur = versions.find((v) => v.isCurrent);

const STAMP = "devtools-smoke";
const pageAbs = join(cur.source, `zz-${STAMP}.mdx`);
const inclDir = join(cur.source, "includes");
const inclAbs = join(inclDir, `zz-${STAMP}-partial.mdx`);
const pageDest = destForPage(pageAbs, versions);

let passed = 0;
let failed = 0;
const ok = (m) => {
  passed++;
  console.log(`  ✓ ${m}`);
};
const no = (m) => {
  failed++;
  console.log(`  ✗ ${m}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Poll until predicate true or timeout (fs.watch latency is variable).
async function until(pred, ms = 3000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (pred()) return true;
    await sleep(50);
  }
  return pred();
}

function cleanup() {
  for (const p of [pageAbs, inclAbs]) rmSync(p, { force: true });
  if (pageDest) rmSync(pageDest, { force: true });
}

async function main() {
  cleanup(); // start clean
  const graph = new IncludeGraph(versions);
  graph.build();
  const ctx = { root: ROOT, versions, graph, rel, quiet: true };
  const close = watchPaths(specs(), (paths) => applyBatch(paths, ctx));

  try {
    // 1) Create an include + a page that references it.
    if (!existsSync(inclDir)) mkdirSync(inclDir, { recursive: true });
    writeFileSync(inclAbs, "SMOKE_MARKER_V1\n");
    writeFileSync(
      pageAbs,
      `---\ntitle: Smoke\ndescription: smoke test\n---\n\n(!docs/pages/includes/zz-${STAMP}-partial.mdx!)\n`,
    );

    if (await until(() => existsSync(pageDest)))
      ok(`new page synced → ${rel(pageDest)}`);
    else no(`new page NOT synced to ${rel(pageDest)}`);

    if (await until(() => graph.forward.has(pageAbs)))
      ok(`graph learned new page's include edge`);
    else no(`graph did not learn include edge`);

    // 2) Edit the page body -> verbatim copy should reflect it.
    const edited = readFileSync(pageAbs, "utf8") + "\nEDITED_BODY\n";
    writeFileSync(pageAbs, edited);
    if (await until(() => existsSync(pageDest) && readFileSync(pageDest, "utf8").includes("EDITED_BODY")))
      ok(`page edit reflected in ${rel(pageDest)}`);
    else no(`page edit NOT reflected in dest`);

    // 3) Edit the INCLUDE -> dependent page must be re-emitted with different
    //    bytes (proving the no-restart include-reload path fires).
    const before = readFileSync(pageDest);
    writeFileSync(inclAbs, "SMOKE_MARKER_V2\n");
    if (await until(() => !readFileSync(pageDest).equals(before)))
      ok(`include edit bumped dependent page (bytes changed, no restart)`);
    else no(`include edit did NOT bump dependent page`);

    // 3b) The bump must be semantically inert (only trailing whitespace differs).
    const after = readFileSync(pageDest, "utf8");
    const norm = (s) => s.replace(/\s*$/, "");
    if (norm(after) === norm(readFileSync(pageAbs, "utf8")))
      ok(`bump changed only trailing whitespace (content preserved)`);
    else no(`bump altered page content unexpectedly`);

    // 4) Delete the page -> dest removed, graph forgets it.
    rmSync(pageAbs, { force: true });
    if (await until(() => !existsSync(pageDest)))
      ok(`page delete removed ${rel(pageDest)}`);
    else no(`page delete did NOT remove dest`);
  } finally {
    close();
    cleanup();
  }

  console.log(
    `\ninttest: ${failed === 0 ? "PASS" : "FAIL"} (${passed} passed, ${failed} failed)`,
  );
  process.exit(failed === 0 ? 0 : 1);
}

function specs() {
  const s = [];
  for (const v of versions) {
    s.push({ dir: join(v.root, "docs"), recursive: true });
    const ex = join(v.root, "examples");
    if (existsSync(ex)) s.push({ dir: ex, recursive: true });
    s.push({ dir: v.root, recursive: false });
  }
  s.push({ dir: ROOT, recursive: false });
  return s;
}

main();
