// Turns a debounced batch of changed absolute paths into the right set of
// destination writes. Shared by dev.mjs (live) and the integration test so both
// exercise identical logic.

import { join } from "node:path";
import { log, paint } from "./log.mjs";
import {
  classify,
  emitPage,
  bumpPage,
  deletePage,
  emitSidebar,
  copyTags,
} from "./sync.mjs";

/**
 * @param {string[]} paths absolute paths that changed
 * @param {{root:string, versions:any[], graph:import("./includes-graph.mjs").IncludeGraph, rel:(p:string)=>string, quiet?:boolean}} ctx
 * @returns {{pagesEmitted:string[], pagesDeleted:string[], bumped:string[], sidebars:string[], configChanged:boolean, versionConfigChanged:boolean}}
 */
export function applyBatch(paths, ctx) {
  const { root, versions, graph, rel } = ctx;
  const say = ctx.quiet ? () => {} : (m) => log.info(m);

  const TAGS = join(root, "tags.yml");
  const ROOT_CONFIG = join(root, "config.json");

  const result = {
    pagesEmitted: [],
    pagesDeleted: [],
    bumped: [],
    sidebars: [],
    configChanged: false,
    versionConfigChanged: false,
  };

  const emitted = new Set(); // page abs written verbatim this batch
  const toBump = new Set(); // page abs to force-recompile (include/snippet changes)

  for (const abs of paths) {
    log.debug(`event: ${rel(abs)}`);

    if (abs === TAGS) {
      copyTags(root, versions);
      say("tags.yml → copied into all versions");
      continue;
    }
    if (abs === ROOT_CONFIG) {
      result.versionConfigChanged = true;
      continue;
    }

    const c = classify(abs, versions);
    if (!c) continue;

    if (c.kind === "page") {
      if (c.exists) {
        const dest = emitPage(abs, versions);
        graph.update(abs);
        emitted.add(abs);
        if (dest) {
          result.pagesEmitted.push(dest);
          say(`page → ${rel(dest)}`);
        }
      } else {
        const dest = deletePage(abs, versions);
        graph.remove(abs);
        if (dest) {
          result.pagesDeleted.push(dest);
          say(`page removed → ${rel(dest)}`);
        }
      }
    } else if (c.kind === "include") {
      if (c.exists) graph.update(abs);
      else graph.remove(abs);
      const deps = graph.dependentPages(abs);
      for (const p of deps) toBump.add(p);
      say(`include ${rel(abs)} → ${deps.size} dependent page(s)`);
    } else if (c.kind === "target") {
      const deps = graph.dependentPages(abs);
      if (deps.size) {
        for (const p of deps) toBump.add(p);
        say(`snippet ${rel(abs)} → ${deps.size} dependent page(s)`);
      }
    } else if (c.kind === "sidebar") {
      const dest = emitSidebar(abs, versions);
      if (dest) {
        result.sidebars.push(dest);
        say(`sidebar → ${rel(dest)}`);
      }
    } else if (c.kind === "config") {
      result.configChanged = true;
    }
  }

  for (const p of toBump) {
    if (emitted.has(p)) continue; // verbatim write already forces a recompile
    const dest = bumpPage(p, versions);
    if (dest) result.bumped.push(dest);
  }
  if (result.bumped.length) {
    say(paint("green", `recompiled ${result.bumped.length} page(s) via HMR (no restart)`));
  }

  if (result.versionConfigChanged) {
    log.warn("config.json (version list) changed — stop & rerun devtools/dev to apply");
  }
  if (result.configChanged) {
    log.warn(
      "a version docs/config.json changed — variable/redirect changes need a restart (Ctrl-C, rerun)",
    );
  }

  return result;
}
