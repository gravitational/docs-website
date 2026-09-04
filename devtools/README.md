# devtools — a faster, quieter dev server for docs-website

A drop-in replacement for `yarn dev` (`scripts/start-dev.sh`) that fixes the
three things that make the stock workflow painful:

| Symptom (old `yarn dev`) | Cause | Fixed here by |
| --- | --- | --- |
| Browser tab jumps to a new port, stealing focus | Server restarted on every include edit; the orphaned old `node` kept port 3000, so the new one grabbed 3001 and opened a new tab | **One persistent server**, started with `--no-open`, that is **never restarted** during a session |
| Slow, and slower after every include edit | `yarn clear` nuked the Docusaurus cache on each restart → cold recompile | No restarts, no cache clears — include edits recompile only the affected pages via HMR |
| Leftover `watchexec`/`node` processes pile up; port conflicts | Teardown killed only direct shell children, orphaning the `node` grandchild | Server runs in **its own process group**; the whole group is killed on exit, and a preflight step reaps orphans |
| Every save triggers a full rsync of ~2,100 files | One watcher re-`rsync`ed all versions on any change | **Incremental single-file** copies |
| The `node` server balloons to multiple GB | The dev server compiles **all** doc versions, keeps the debug plugin's full content graph resident, and builds source maps | **By default builds only the edge version, drops the debug plugin, and skips source maps** — see [Memory](#memory) |

This tooling is intentionally **external and additive**: it lives under
`devtools/`, which is ignored via `.git/info/exclude` (not the tracked
`.gitignore`), so it never appears in `git status` and never modifies a tracked
file. It is maintained out-of-band from the repo.

## Requirements

- macOS (uses FSEvents-backed recursive `fs.watch`) and Node ≥ 22 — both already
  required by the repo. **No new dependencies.**

## Install

Clone or copy this gist into `devtools/` within the `docs-website` directory.

## Usage

```bash
./devtools/dev                 # prepare-files once, then start a persistent server on :3000
./devtools/dev --open          # …and open a browser tab once, after first compile
./devtools/dev --port 3001     # use a different port
./devtools/dev --no-prepare    # skip the initial prepare-files (reuse existing docs/ output)
./devtools/dev --host 0.0.0.0  # bind all interfaces (Docker)
./devtools/dev --verbose       # log every file event

./devtools/dev reap            # kill ALL stray docs dev processes (incl. legacy start-dev.sh) + free ports
./devtools/dev stop            # stop the session this tool started
./devtools/dev selftest        # read-only: validate the content→docs mapping + include graph
```

Suggested shell shortcut (fish), since `package.json` is intentionally left
untouched:

```fish
abbr -a dev './devtools/dev'
```

Ctrl-C stops cleanly: no orphaned processes, no leaked ports.

If you ever hit a stale port or find leftover processes from a previous
`yarn dev`, run `./devtools/dev reap` to clean everything up.

## Memory

A stock `docusaurus start` for this site compiles **all three** doc versions
(17.x, 18.x, edge), keeps `@docusaurus/plugin-debug`'s full content/route graph
resident, and generates source maps — so the long-running `node` process can
sit at several GB. Most of that is wasted while you're editing one version.

By **default** this tool trims the dev server to the low-risk essentials:

- **only the edge version is compiled** (`onlyIncludeVersions: ['current']`),
  served at `/`. This is the biggest lever — it removes ~2/3 of the MDX/route
  module graph from memory.
- **the debug plugin is dropped** (it exists only to serve `/__docusaurus/` and
  pins every plugin's content in memory).
- **source maps are disabled** (large dev-heap + rebuild-time cost; irrelevant
  to docs authoring).

None of this touches the tracked `docusaurus.config.ts`. It's applied by a
dev-only wrapper config, `devtools/docusaurus.dev.config.ts`, which imports the
real config and tweaks a copy in memory; the tool passes it via
`docusaurus start --config …` and a few `DEV_*` env vars.

Flags to dial it back when you need more:

```bash
./devtools/dev --versions all        # compile every version (stock scope)
./devtools/dev --versions 18.x       # compile only 18.x, served at /
./devtools/dev --versions current,18.x
./devtools/dev --debug               # keep the /__docusaurus/ debug plugin
./devtools/dev --sourcemaps          # keep webpack source maps
./devtools/dev --full                # opt out entirely: stock docusaurus start
./devtools/dev --heap 4096           # cap V8 old-space (safety valve, not a reducer)
```

The file watcher still syncs **all** versions to disk regardless — only the
Docusaurus *compile* is scoped — so switching `--versions` never leaves stale
generated output. Editing a non-compiled version syncs fine but won't render
until you include it.

### Keeping both `/` and `/ver/NN.x/` working

When a single non-root version is built (e.g. the edge version, normally at
`/ver/19.x/`), the wrapper mounts it at the site **root** so `/`, the navbar,
the footer, and the homepage all resolve. A version can only live at one path,
so its old `/ver/19.x/...` URLs would otherwise 404. `@docusaurus/plugin-client-redirects`
only runs at build time, so the wrapper instead registers a **dev-only
catch-all redirect route** (`devtools/dev-ver-redirect.js`) that client-redirects
`/ver/NN.x/...` → `/...`. Version-switcher links, old bookmarks, and hardcoded
`/ver/NN.x/...` links keep working (the URL normalizes to the root path). This
only activates when a version is remapped to root; `--versions current,18.x`
and `--versions all` leave every version at its native path.

## How it works

Docusaurus watches `docs/` and `versioned_docs/`, but authored content lives in
`content/<version>/docs/pages/`. Pages are **copied** into the Docusaurus dirs;
includes (`(!path!)`) are **not** — `server/remark-includes.ts` reads them
straight from `content/` at compile time and never registers them as bundler
dependencies. That's why editing an include is invisible to HMR and why the old
script resorted to a full restart.

This tool:

1. Runs `yarn prepare-files` once (full, correct initial build), then starts a
   single `docusaurus start --no-open` that stays up for the whole session.
2. Builds an **include-dependency graph** (`lib/includes-graph.mjs`) by scanning
   every `.mdx` under each version's `pages/` for `(!…!)` directives, resolving
   targets exactly like `remark-includes` (`join(content/<version>, path)`).
3. Watches `content/` and, per change:
   - **page** edited/created → copy that one file to its `docs/`/`versioned_docs/`
     target (HMR picks it up);
   - **page** deleted → remove the target;
   - **include / snippet** edited → look up every page that transitively includes
     it and re-emit those pages, toggling a trailing newline (inert in MDX) so the
     bytes always change and rspack recompiles them — re-reading the fresh
     include. **No restart, no cache clear.**
   - **sidebar.json** → copy to the matching sidebar target;
   - **tags.yml** → copy into every version dir.

The content→destination mapping mirrors `scripts/prepare-files.mts` /
`server/config-site.ts` byte-for-byte (verified by `selftest`).

## When a restart is still needed

A few changes affect server-global state that HMR can't hot-swap. The tool logs
a warning; stop (Ctrl-C) and rerun to apply:

- `content/<version>/docs/config.json` **redirects** (variables usually apply on
  recompile, but redirects are wired at server start).
- `config.json` (the top-level version list) — also needs a fresh
  `prepare-files`, which happens automatically on the next `./devtools/dev`.

## Files

```
devtools/
  dev                  # bash launcher (cd to repo root, exec node dev.mjs)
  dev.mjs              # orchestration: args, prepare-files, spawn server, watch, teardown
  docusaurus.dev.config.ts  # dev-only wrapper config: trims versions/debug/sourcemaps for memory
  selftest.mjs         # read-only mapping + graph validation
  inttest.mjs          # integration test of the watcher→apply→docs/ pipeline (writes temp files, cleans up)
  lib/
    config.mjs         # config.json → version source/dest mapping
    includes-graph.mjs # (!…!) dependency graph + transitive reverse lookup
    sync.mjs           # classify a changed path; emit/bump/delete/copy to docs/
    apply.mjs          # turn a debounced batch of paths into destination writes
    watcher.mjs        # native recursive fs.watch, debounced/batched
    process.mjs        # process-group spawn, port/orphan reaping, teardown
    log.mjs            # tiny timestamped logger
```

## Tests

```bash
./devtools/dev selftest     # fast, read-only, safe to run anytime
node devtools/inttest.mjs   # end-to-end watcher test (creates/removes temp files under the current version)
```

## Maintenance notes

- If the upstream mapping logic in `server/config-site.ts` or
  `scripts/prepare-files.mts` changes (e.g. how versions map to `docs/` vs
  `versioned_docs/`), update `lib/config.mjs` to match, then run
  `./devtools/dev selftest` to confirm.
