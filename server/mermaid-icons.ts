const MERMAID_BLOCK = /```mermaid[\s\S]*?```/g;

// Finds the Iconify icons referenced in the Mermaid diagrams of a Markdown
// document. Mermaid architecture diagrams reference icons by name, for example
// `service db(logos-kubernetes)[Kubernetes]`.
//
// Returns the icon names (without the pack prefix) used from each pack in
// `prefixes`, keyed by pack prefix. A pack with no references is absent from
// the result.
export function extractMermaidIconNames(
  markdown: string,
  prefixes: string[],
): Record<string, Set<string>> {
  const used: Record<string, Set<string>> = {};

  // Try longer prefixes first so that, for example, "material-symbols-light"
  // is not matched as "material-symbols" with an icon named "light-...".
  const alternatives = [...prefixes]
    .sort((a, b) => b.length - a.length)
    .map((prefix) => prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  // Icon names always start with their pack prefix, for example
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
// declared in package.json, so adding a pack only requires adding the package.
export function getMermaidIconPackPrefixes(packageJson: {
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
