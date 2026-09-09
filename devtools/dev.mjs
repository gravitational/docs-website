#!/usr/bin/env node
// Fast, reliable dev server for the Teleport docs-website.
//
// Design goals (vs. the old scripts/start-dev.sh):
//   • ONE persistent `docusaurus start` that is never restarted mid-session, so
//     it never steals focus with a new browser tab or fights over the port.
//   • Incremental, single-file content sync (not a full rsync of ~2,100 files).
//   • Include edits reflected WITHOUT a restart or cache clear, via a
//     precomputed include-dependency graph (see lib/includes-graph.mjs).
//   • Bulletproof teardown: the server runs in its own process group and the
//     whole group is killed on exit; a preflight step reaps orphans.
//
// This tool is intentionally external/additive: it lives under devtools/ (which
// is git-ignored via .git/info/exclude) and never edits tracked repo files.
//
// Usage:
//   devtools/dev [--port N] [--host H] [--open] [--no-prepare] [--verbose]
//   devtools/dev reap        # kill ALL stray docs dev processes + free ports
//   devtools/dev stop        # stop the session started by this tool
//   devtools/dev selftest    # validate mapping + include graph, then exit

import { existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, spawn } from "node:child_process";

import { log, setVerbose, paint } from "./lib/log.mjs";
import { loadVersions } from "./lib/config.mjs";
import { IncludeGraph } from "./lib/includes-graph.mjs";
import { watchPaths } from "./lib/watcher.mjs";
import { applyBatch } from "./lib/apply.mjs";
import {
  reapOwn,
  reapAll,
  spawnServer,
  killServer,
  writePidfile,
  removePidfile,
  freePort,
  pidsOnPort,
} from "./lib/process.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
process.chdir(ROOT);
const rel = (p) => (p ? relative(ROOT, p) : p);

// ---- arg parsing --------------------------------------------------------
function parseArgs(argv) {
  const opts = {
    port: Number(process.env.DEV_PORT) || 3000,
    host: undefined,
    open: false,
    prepare: true,
    verbose: false,
    cmd: "start",
    // Memory profile (see the wrapper config, devtools/docusaurus.dev.config.ts).
    // Default: compile only the edge version, drop the debug plugin, and skip
    // source maps — the low-risk trims that cut the dev server's footprint most.
    versions: "current", // "current" | "all" | comma list like "current,18.x"
    debug: false, // keep @docusaurus/plugin-debug
    sourcemaps: false, // keep webpack source maps
    full: false, // shorthand: behave exactly like plain `docusaurus start`
    heap: undefined, // NODE_OPTIONS --max-old-space-size (MB), optional cap
  };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "reap" || a === "stop" || a === "selftest" || a === "help") opts.cmd = a;
    else if (a === "--port") opts.port = Number(argv[++i]);
    else if (a === "--host") opts.host = argv[++i];
    else if (a === "--open") opts.open = true;
    else if (a === "--no-prepare") opts.prepare = false;
    else if (a === "--verbose" || a === "-v") opts.verbose = true;
    else if (a === "--versions") opts.versions = argv[++i];
    else if (a === "--all-versions") opts.versions = "all";
    else if (a === "--debug") opts.debug = true;
    else if (a === "--sourcemaps") opts.sourcemaps = true;
    else if (a === "--full") opts.full = true;
    else if (a === "--heap") opts.heap = Number(argv[++i]);
    else if (a === "--help" || a === "-h") opts.cmd = "help";
    else rest.push(a);
  }
  return opts;
}

// Resolve a user version selector into Docusaurus version names ("current" for
// the edge version, "NN.x" otherwise). Accepts the edge version's real name
// (e.g. "19.x") as an alias for "current". Returns { keep, all } or throws.
function resolveVersions(sel, versions) {
  if (!sel || sel.toLowerCase() === "all") return { all: true, keep: [] };
  const nameFor = (v) => (v.isCurrent ? "current" : v.name);
  const known = new Map(); // accepted token -> canonical docusaurus name
  for (const v of versions) {
    known.set(nameFor(v), nameFor(v));
    known.set(v.name, nameFor(v)); // allow "19.x" as alias for "current"
  }
  const keep = [];
  for (const tok of sel.split(",").map((s) => s.trim()).filter(Boolean)) {
    const canon = known.get(tok);
    if (!canon) {
      const opts = [...new Set(known.keys())].join(", ");
      throw new Error(`unknown version "${tok}" (known: ${opts}, or "all")`);
    }
    if (!keep.includes(canon)) keep.push(canon);
  }
  return { all: false, keep };
}

const opts = parseArgs(process.argv.slice(2));
setVerbose(opts.verbose);

// ---- subcommands --------------------------------------------------------
if (opts.cmd === "help") {
  log.plain(`
${paint("bold", "devtools/dev")} — incremental dev server for docs-website

  devtools/dev [options]      start the dev server (default)
  devtools/dev reap           kill ALL stray docs dev processes and free ports
  devtools/dev stop           stop the session started by this tool
  devtools/dev selftest       validate content mapping + include graph

Options:
  --port N        port to serve on (default 3000, or $DEV_PORT)
  --host H        bind host (e.g. 0.0.0.0 for Docker)
  --open          open a browser tab once, after first successful compile
  --no-prepare    skip the initial "yarn prepare-files" (reuse existing output)
  --verbose, -v   log every file event

Memory (dev server footprint — defaults trade little for a lot):
  --versions LIST compile only these versions (default "current"; the edge
                  version. Comma list ok, e.g. "current,18.x"; "all" for every
                  version — the stock Docusaurus behavior)
  --all-versions  alias for --versions all
  --debug         keep @docusaurus/plugin-debug (off by default; it pins all
                  content in memory to serve /__docusaurus/)
  --sourcemaps    keep webpack source maps (off by default)
  --full          behave exactly like plain "docusaurus start": all versions,
                  debug plugin on, source maps on (no dev wrapper config)
  --heap MB       cap V8 old-space at MB (adds --max-old-space-size); forces
                  earlier GC. A safety cap, not a reducer — omit unless needed.
`);
  process.exit(0);
}

if (opts.cmd === "reap") {
  const n = reapAll(ROOT);
  log.info(`reaped ${n} process(es)/port(s)`);
  process.exit(0);
}

if (opts.cmd === "stop") {
  const n = freePort(opts.port);
  log.info(n ? `stopped server on :${opts.port}` : `nothing running on :${opts.port}`);
  removePidfile(ROOT);
  process.exit(0);
}

if (opts.cmd === "selftest") {
  const { runSelftest } = await import("./selftest.mjs");
  process.exit(runSelftest(ROOT) ? 0 : 1);
}

// ---- start --------------------------------------------------------------
if (!existsSync(join(ROOT, "config.json"))) {
  log.error(`config.json not found in ${ROOT} — is this the docs-website root?`);
  process.exit(1);
}

const versions = loadVersions(ROOT);
log.step(
  `versions: ${versions
    .map((v) => `${v.name}${v.isCurrent ? paint("gray", "(current→docs/)") : ""}`)
    .join(", ")}`,
);

// Preflight: reap our own previous session and free the target port.
reapOwn(ROOT, opts.port);
if (pidsOnPort(opts.port).length) {
  log.error(`port ${opts.port} is still in use after cleanup; try: devtools/dev reap`);
  process.exit(1);
}

// 1) Full prepare-files once (also does the initial content copy).
if (opts.prepare) {
  log.step("running prepare-files (one-time full build of docs/ + sidebars)…");
  const t0 = Date.now();
  const viteNode = join(ROOT, "node_modules", ".bin", "vite-node");
  const r = existsSync(viteNode)
    ? spawnSync(viteNode, ["./scripts/prepare-files.mts"], { cwd: ROOT, stdio: "inherit" })
    : spawnSync("yarn", ["prepare-files"], { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) {
    log.error("prepare-files failed; aborting");
    process.exit(1);
  }
  log.info(`prepare-files done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
} else {
  log.warn("skipping prepare-files (--no-prepare); using existing docs/ output");
}

// 2) Resolve the memory profile and build the wrapper-config env.
//    --full opts out entirely (stock `docusaurus start`, all versions).
const stripDebug = !opts.full && !opts.debug;
const noSourcemaps = !opts.full && !opts.sourcemaps;
let sel;
try {
  sel = opts.full ? { all: true, keep: [] } : resolveVersions(opts.versions, versions);
} catch (e) {
  log.error(String(e.message || e));
  process.exit(1);
}

const useWrapper = !sel.all || stripDebug || noSourcemaps;
const devEnv = {};
if (useWrapper) {
  devEnv.DEV_ONLY_VERSIONS = sel.all ? "all" : sel.keep.join(",");
  devEnv.DEV_STRIP_DEBUG = stripDebug ? "1" : "0";
  devEnv.DEV_NO_SOURCEMAPS = noSourcemaps ? "1" : "0";
}
if (opts.heap) {
  devEnv.NODE_OPTIONS =
    `${process.env.NODE_OPTIONS || ""} --max-old-space-size=${opts.heap}`.trim();
}
const devConfig = useWrapper
  ? join(ROOT, "devtools", "docusaurus.dev.config.ts")
  : undefined;

const liveVersions = sel.all ? "all" : sel.keep.join(", ");
log.step(
  `memory profile: versions=${paint("bold", liveVersions)}` +
    ` debug=${stripDebug ? "off" : "on"}` +
    ` sourcemaps=${noSourcemaps ? "off" : "on"}` +
    (opts.heap ? ` heap=${opts.heap}MB` : "") +
    (opts.full ? paint("gray", "  (--full: stock docusaurus)") : ""),
);
if (!sel.all) {
  log.plain(
    paint(
      "gray",
      `  only ${liveVersions} is compiled; other versions still sync to disk but` +
        ` aren't served. Use --versions all (or --full) to build everything.`,
    ),
  );
}

// 3) Spawn the persistent Docusaurus server (starts its long initial compile).
const url = `http://localhost:${opts.port}/`;
let opened = false;
const server = spawnServer(ROOT, {
  port: opts.port,
  host: opts.host,
  devConfig,
  env: devEnv,
  onReady: () => {
    log.info(paint("green", `ready → ${url}`));
    if (opts.open && !opened) {
      opened = true;
      spawn("open", [url], { stdio: "ignore" }).unref();
    }
  },
});
writePidfile(ROOT, { serverPid: server.pid, port: opts.port });

server.on("exit", (code, signal) => {
  if (shuttingDown) return;
  log.error(`docusaurus server exited (code=${code} signal=${signal}) — shutting down`);
  shutdown(1);
});

// 4) Build the include-dependency graph (overlaps the server's initial compile).
log.step("building include-dependency graph…");
const graph = new IncludeGraph(versions);
const g = graph.build();
log.info(`graph: ${g.files} source files, ${g.edges} include targets (${g.ms}ms)`);

// 5) Watch content and react incrementally.
const specs = [];
for (const v of versions) {
  specs.push({ dir: join(v.root, "docs"), recursive: true });
  const ex = join(v.root, "examples");
  if (existsSync(ex)) specs.push({ dir: ex, recursive: true });
  specs.push({ dir: v.root, recursive: false }); // top-level targets (CHANGELOG.md, …)
}
specs.push({ dir: ROOT, recursive: false }); // tags.yml, root config.json

const ctx = { root: ROOT, versions, graph, rel };
const closeWatch = watchPaths(specs, (paths) => applyBatch(paths, ctx));
log.step(`watching content/ for changes — edit pages & includes freely`);
log.plain(
  paint(
    "gray",
    `  server: ${url}   (Ctrl-C to stop cleanly — no orphans, no port leaks)`,
  ),
);

// ---- teardown -----------------------------------------------------------
let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  log.step("shutting down…");
  try {
    closeWatch();
  } catch {}
  removePidfile(ROOT);

  // If the server is already gone, exit now.
  if (!server || server.exitCode !== null || server.signalCode) {
    return process.exit(code);
  }
  // Otherwise wait for the whole server process group to actually die before we
  // exit — so we never abandon the SIGKILL escalation and leave an orphan.
  server.once("exit", () => process.exit(code));
  killServer(server); // SIGTERM now, SIGKILL the group at +2s
  setTimeout(() => process.exit(code), 4000).unref?.(); // hard cap
}

for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => shutdown(0));
}
process.on("uncaughtException", (err) => {
  log.error(`uncaught: ${err?.stack || err}`);
  shutdown(1);
});
