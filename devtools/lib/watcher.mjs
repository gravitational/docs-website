// Thin wrapper over Node's native recursive fs.watch (FSEvents-backed on macOS).
// Coalesces the bursts of events editors emit (atomic saves, multi-file saves)
// into a single debounced batch of absolute paths handed to one callback.

import { watch, existsSync } from "node:fs";
import { join } from "node:path";
import { log } from "./log.mjs";

/**
 * @param {Array<{dir: string, recursive?: boolean}>} specs Directories to watch.
 * @param {(paths: string[]) => void} onBatch Called with a batch of absolute paths.
 * @param {{debounceMs?: number}} [opts]
 * @returns {() => void} close function
 */
export function watchPaths(specs, onBatch, { debounceMs = 80 } = {}) {
  const pending = new Set();
  let timer = null;
  const watchers = [];

  const flush = () => {
    timer = null;
    if (pending.size === 0) return;
    const batch = [...pending];
    pending.clear();
    try {
      onBatch(batch);
    } catch (err) {
      log.error(`watch handler error: ${err?.stack || err}`);
    }
  };

  const enqueue = (abs) => {
    pending.add(abs);
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, debounceMs);
  };

  for (const { dir, recursive = true } of specs) {
    if (!existsSync(dir)) continue;
    try {
      const w = watch(dir, { recursive }, (_eventType, filename) => {
        if (!filename) return;
        enqueue(join(dir, filename.toString()));
      });
      w.on("error", (err) => log.debug(`watch error on ${dir}: ${err}`));
      watchers.push(w);
    } catch (err) {
      log.warn(`could not watch ${dir}: ${err?.message || err}`);
    }
  }

  return () => {
    if (timer) clearTimeout(timer);
    for (const w of watchers) {
      try {
        w.close();
      } catch {}
    }
  };
}
