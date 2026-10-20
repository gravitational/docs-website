import { getIcons } from "@iconify/utils";

// The icon set type is not re-exported by @iconify/utils, so take it from
// getIcons() instead of depending on @iconify/types too.
export type IconifyJSON = Parameters<typeof getIcons>[0];

const MERMAID_BLOCK = /```mermaid[\s\S]*?```/g;

// Finds the Iconify icons referenced in the Mermaid diagrams of a Markdown
// document. Mermaid architecture diagrams reference icons by name, for example
// `service db(logos-kubernetes)[Kubernetes]`.
//
// Returns the icon names (without the pack prefix) used from each pack in
// `prefixes`, keyed by pack prefix. A pack with no references is absent from
// the result.
export function extractIconNames(
  markdown: string,
  prefixes: string[],
): Record<string, Set<string>> {
  const used: Record<string, Set<string>> = {};

  // Try to match longer prefixes first. E.g. icons packs "material-symbols" and
  // "material-symbols-light", the icon reference "material-symbols-light-home" should
  // match the longer prefix, not the shorter.
  const alternatives = [...prefixes]
    .sort((a, b) => b.length - a.length)
    .map((prefix) => prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  // Icon names always start with their set prefix, for example
  // "logos:kubernetes" or "logos-kubernetes". The lookbehind prevents matching
  // a prefix in the middle of a longer word, like "mylogos-kubernetes".
  const reference = new RegExp(
    `(?<![\\w-])(${alternatives})[:-]([a-z0-9][a-z0-9-]*)`,
    "g",
  );

  for (const block of markdown.match(MERMAID_BLOCK) ?? []) {
    for (const [, prefix, name] of block.matchAll(reference)) {
      if (used[prefix] === undefined) {
        used[prefix] = new Set();
      }
      used[prefix].add(name);
    }
  }
  return used;
}

const ICON_PACK_PACKAGE = /^@iconify-json\/(.+)$/;

// Returns the prefixes of the Iconify icon packs available to Mermaid
// diagrams. A pack is available when its @iconify-json/<prefix> package is
// declared in package.json, so adding a pack only requires installing the package
// as a dependecy.
export function getIconPackPrefixes(packageJson: {
  dependencies?: Record<string, string>;
}): string[] {
  const names = Object.keys({
    ...packageJson.dependencies,
  });
  return names
    .map((name) => name.match(ICON_PACK_PACKAGE)?.[1])
    .filter((prefix): prefix is string => prefix !== undefined)
    .sort();
}

// createIconSubset produces an icon subset by filtering icons from
// the given `iconSet` based on the `names` list.
export function createIconSubset(
  iconSet: IconifyJSON,
  names: string[],
): { subset: IconifyJSON; notFound: string[] } {
  const subset = getIcons(iconSet, names, true);
  if (subset === null) {
    throw new Error(`Could not create a subset of the ${iconSet.prefix} set`);
  }

  // not_found is only used for build-time warnings, so return it separately
  // instead of shipping it to the browser with the subset.
  const { not_found: notFound = [], ...rest } = subset;
  return { subset: rest, notFound };
}
