import { describe, expect, test } from "@jest/globals";

import {
  extractMermaidIconNames,
  getMermaidIconPackPrefixes,
} from "./mermaid-icons";

const prefixes = ["logos", "carbon"];

const diagram = (body: string) => "```mermaid\n" + body + "\n```\n";

const extractIcons = (markdown: string) => {
  const used = extractMermaidIconNames(markdown, prefixes);
  return Object.fromEntries(
    Object.entries(used).map(([prefix, names]) => [prefix, [...names].sort()]),
  );
};

describe("extractMermaidIconNames", () => {
  test("extracts icons from an architecture diagram", () => {
    const md = diagram(
      [
        "architecture-beta",
        "    group priv(carbon-virtual-private-cloud)[Private Network]",
        "    service k8s(logos-kubernetes)[Kubernetes] in priv",
        "    service client(carbon-user)[SSH Client]",
        "    service db(carbon-db2-database)[Database]",
      ].join("\n"),
    );

    expect(extractIcons(md)).toEqual({
      carbon: ["db2-database", "user", "virtual-private-cloud"],
      logos: ["kubernetes"],
    });
  });

  test("supports both the colon and hyphen separators", () => {
    const md = diagram(
      [
        "architecture-beta",
        "    service a(logos:kubernetes)[A]",
        "    service b(logos-docker-icon)[B]",
      ].join("\n"),
    );

    expect(extractIcons(md)).toEqual({
      logos: ["docker-icon", "kubernetes"],
    });
  });

  test("deduplicates icons used several times", () => {
    const md = diagram(
      ["service a(logos-kubernetes)[A]", "service b(logos-kubernetes)[B]"].join(
        "\n",
      ),
    );

    expect(extractIcons(md)).toEqual({ logos: ["kubernetes"] });
  });

  test("collects icons from multiple diagrams in one page", () => {
    const md = [
      "Some intro text.",
      diagram("service a(logos-kubernetes)[A]"),
      "Text between diagrams.",
      diagram("service b(carbon-user)[B]"),
    ].join("\n");

    expect(extractIcons(md)).toEqual({
      carbon: ["user"],
      logos: ["kubernetes"],
    });
  });

  test("ignores non-registered icons", () => {
    // teleport-* icons are loaded from a local directory instead.
    const md = diagram(
      [
        "service a(teleport-logo-purple)[A]",
        "service b(other-thing)[B]",
        "service c(logos-kubernetes)[C]",
        "service d(my-logos-github)[D]",
      ].join("\n"),
    );

    expect(extractIcons(md)).toEqual({ logos: ["kubernetes"] });
  });

  test("ignores a pack prefix without an icon name", () => {
    const md = diagram(
      [
        "service a(logos)[A]",
        "service b(logos-)[B]",
        "service c(carbon:)[C]",
        "service d(logos--kubernetes)[D]",
      ].join("\n"),
    );

    expect(extractIcons(md)).toEqual({});
  });

  test("ignores icons outside of mermaid code blocks", () => {
    const md = [
      "Use the logos-kubernetes icon.",
      "```yaml",
      "icon: carbon-user",
      "```",
      "```js",
      "const icon = 'logos:docker-icon';",
      "```",
    ].join("\n");

    expect(extractIcons(md)).toEqual({});
  });

  test("returns nothing when there are no icons to find", () => {
    expect(extractIcons(diagram("flowchart LR\n    A --> B"))).toEqual({});
    expect(extractIcons("# Title\n\nJust text.\n")).toEqual({});
    expect(extractIcons("")).toEqual({});
  });

  test("matches icons in an indented mermaid block", () => {
    // Blocks inside lists or admonitions are indented, so the fence does not
    // start at the beginning of the line.
    const md = [
      "1. Step one:",
      "",
      "   ```mermaid",
      "   architecture-beta",
      "       service a(logos-kubernetes)[A]",
      "   ```",
    ].join("\n");

    expect(extractIcons(md)).toEqual({ logos: ["kubernetes"] });
  });

  test("prefers the longest matching pack prefix", () => {
    const md = diagram(
      [
        "service a(material-symbols-light-home)[A]",
        "service b(material-symbols-home)[B]",
      ].join("\n"),
    );

    expect(
      extractMermaidIconNames(md, [
        "material-symbols",
        "material-symbols-light",
      ]),
    ).toEqual({
      "material-symbols-light": new Set(["home"]),
      "material-symbols": new Set(["home"]),
    });
  });

  test("matches pack prefixes literally", () => {
    // "." must not act as a regex wildcard.
    const md = diagram(
      ["service a(my.pack-home)[A]", "service b(myXpack-user)[B]"].join("\n"),
    );

    expect(extractMermaidIconNames(md, ["my.pack"])).toEqual({
      "my.pack": new Set(["home"]),
    });
  });
});

describe("getMermaidIconPackPrefixes", () => {
  test("returns the packs declared in dependencies", () => {
    expect(
      getMermaidIconPackPrefixes({
        dependencies: {
          "@iconify-json/carbon": "^1.2.28",
          "@iconify-json/logos": "^1.2.14",
          "@iconify/tools": "^5.0.14",
          react: "^19.0.0",
        },
      }),
    ).toEqual(["carbon", "logos"]);
  });

  test("returns nothing when no packs are declared", () => {
    expect(getMermaidIconPackPrefixes({})).toEqual([]);
    expect(
      getMermaidIconPackPrefixes({ dependencies: { react: "^19.0.0" } }),
    ).toEqual([]);
  });
});
