// Dev-only wrapper around the repo's tracked docusaurus.config.ts.
//
// Loaded via `docusaurus start --config devtools/docusaurus.dev.config.ts`
// (wired up by devtools/dev.mjs). It trims what the dev server compiles so the
// long-running `node` process uses far less memory. It NEVER edits the tracked
// config — it imports it and tweaks a copy, driven entirely by env vars that
// devtools/dev.mjs sets:
//
//   DEV_ONLY_VERSIONS  comma-separated version names to build, e.g.
//                      "current" or "current,18.x". Empty / "all" = no limit.
//                      Building 1 of 3 versions is the single biggest win:
//                      ~1/3 the MDX/route/module graph held in memory.
//   DEV_STRIP_DEBUG    "1" => drop @docusaurus/plugin-debug, which otherwise
//                      keeps every plugin's content + route data resident so it
//                      can render the /__docusaurus/ inspector.
//   DEV_NO_SOURCEMAPS  "1" => disable webpack source maps (a large share of dev
//                      heap + a chunk of rebuild time). Costs JS-level
//                      debuggability of the site's own React, which docs
//                      authoring never needs.
//
// Docusaurus loads config via jiti, so this .ts file importing the base .ts
// config Just Works — no build step, no new deps.

import type { Config, PluginConfig } from "@docusaurus/types";
import baseConfig from "../docusaurus.config";

const config: Config = baseConfig;
const plugins: PluginConfig[] = (config.plugins ?? []) as PluginConfig[];

// Original paths of versions we remap to "/" (e.g. "ver/19.x"). Their native
// routes disappear when moved to root, so we re-add them as redirect routes.
const remappedFromPaths: string[] = [];

// ---- 1) restrict which doc versions are compiled ------------------------
const only = (process.env.DEV_ONLY_VERSIONS || "").trim();
if (only && only.toLowerCase() !== "all") {
  const keep = only
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const docs = plugins.find(
    (p): p is [string, Record<string, any>] =>
      Array.isArray(p) && p[0] === "@docusaurus/plugin-content-docs",
  );

  if (docs && keep.length) {
    const opts = docs[1];
    opts.onlyIncludeVersions = keep;

    // Docusaurus requires lastVersion (if set) to be one of the built versions.
    if (!opts.lastVersion || !keep.includes(opts.lastVersion)) {
      opts.lastVersion = keep.includes("current") ? "current" : keep[0];
    }

    // Serve the "last" version at the site root so http://localhost:PORT/
    // resolves instead of 404ing (the edge version is normally at /ver/NN.x).
    opts.versions = opts.versions || {};
    const lv = (opts.versions[opts.lastVersion] ||= {});
    const origPath = typeof lv.path === "string" ? lv.path.replace(/^\/+/, "") : "";
    if (origPath) remappedFromPaths.push(origPath);
    lv.path = "";
    lv.noIndex = false;
  }
}

// ---- 1b) keep the old /ver/NN.x/... URLs working (dev redirect) ---------
// A version can only be mounted at one path, so once it's at "/", its previous
// /ver/NN.x/... routes are gone. client-redirects only runs at build time, so
// in dev we register a catch-all redirect route ourselves.
if (remappedFromPaths.length) {
  const redirectComponent = require.resolve("./dev-ver-redirect.js");
  config.plugins = [
    ...(config.plugins ?? []),
    function devtoolsVerRedirect() {
      return {
        name: "devtools-ver-redirect",
        contentLoaded({ actions }: { actions: any }) {
          for (const p of remappedFromPaths) {
            actions.addRoute({
              path: `/${p}`,
              component: redirectComponent,
              exact: false, // catch /ver/NN.x and everything under it
            });
          }
        },
      };
    },
  ];
}

// ---- 2) drop the debug plugin (dev-only, all-content-resident) ----------
// Filter the CURRENT plugin list (not the snapshot captured above) so any
// plugin added by an earlier step survives.
if (process.env.DEV_STRIP_DEBUG === "1") {
  config.plugins = (config.plugins ?? []).filter(
    (p) => p !== "@docusaurus/plugin-debug",
  );
}

// ---- 3) disable source maps -------------------------------------------
if (process.env.DEV_NO_SOURCEMAPS === "1") {
  config.plugins = [
    ...(config.plugins ?? []),
    function devtoolsNoSourcemaps() {
      return {
        name: "devtools-no-sourcemaps",
        configureWebpack() {
          return { devtool: false };
        },
      };
    },
  ];
}

export default config;
