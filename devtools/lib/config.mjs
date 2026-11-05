// Reads config.json and derives the content -> Docusaurus file mapping.
//
// This mirrors, byte-for-byte, the mapping that scripts/prepare-files.mts and
// server/config-site.ts produce, so the incremental watcher writes to exactly
// the same destinations as a full `yarn prepare-files`:
//
//   - "current" version (the LAST non-deprecated entry in config.json, i.e. the
//     edge/highest version) is copied into   docs/
//   - every other non-deprecated version    into   versioned_docs/version-<name>/
//
//   - current sidebar ->                     sidebars.json
//   - other sidebars ->                      versioned_sidebars/version-<name>-sidebars.json
//
// If the upstream mapping logic ever changes, update this to match.

import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";

/**
 * @param {string} root Absolute path to the docs-website repo root.
 * @returns {Array<{
 *   name: string, isCurrent: boolean, root: string, source: string,
 *   dest: string, sidebarSource: string, sidebarDest: string, configSource: string,
 * }>}
 */
export function loadVersions(root) {
  const cfg = JSON.parse(readFileSync(join(root, "config.json"), "utf8"));
  const supported = (cfg.versions ?? []).filter((v) => !v.deprecated);
  if (supported.length === 0) {
    throw new Error("config.json has no non-deprecated versions");
  }

  // getCurrentVersion(): last entry in config order among supported versions.
  const currentName = supported[supported.length - 1].name;

  return supported.map((v) => {
    const isCurrent = v.name === currentName;
    const versionRoot = resolve(root, "content", v.name);
    return {
      name: v.name,
      isCurrent,
      // content/<name> — the rootDir remark-includes resolves (!...!) against.
      root: versionRoot,
      // content/<name>/docs/pages — where authored pages + includes live.
      source: join(versionRoot, "docs", "pages"),
      // Docusaurus docs dir this version's pages are copied into.
      dest: isCurrent
        ? resolve(root, "docs")
        : resolve(root, "versioned_docs", `version-${v.name}`),
      sidebarSource: join(versionRoot, "docs", "sidebar.json"),
      sidebarDest: isCurrent
        ? resolve(root, "sidebars.json")
        : resolve(root, "versioned_sidebars", `version-${v.name}-sidebars.json`),
      configSource: join(versionRoot, "docs", "config.json"),
    };
  });
}
