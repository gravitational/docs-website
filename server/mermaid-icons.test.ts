import { describe, expect, test } from "@jest/globals";

import {
  createIconSubset,
  extractIconNames,
  getIconPackPrefixes,
  type IconifyJSON,
} from "./mermaid-icons";

const prefixes = ["logos", "carbon"];

// Wrap diagram sources in the mermaid fence to reduce boilerplate
const diagram = (body: string) => "```mermaid\n" + body + "\n```\n";

// Calls extractIconNames with the common packs by default, and converts each
// Set of names into a sorted array so that expectations can be written as
// plain arrays, e.g. `{ logos: ["kubernetes"] }`.
const extractIcons = (markdown: string, packs: string[] = prefixes) => {
  const used = extractIconNames(markdown, packs);
  return Object.fromEntries(
    Object.entries(used).map(([prefix, names]) => [prefix, [...names].sort()]),
  );
};

describe("extractIconNames", () => {
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

  test("ignores non-existing icons", () => {
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
      extractIcons(md, ["material-symbols", "material-symbols-light"]),
    ).toEqual({
      "material-symbols-light": ["home"],
      "material-symbols": ["home"],
    });
  });

  test("matches pack prefixes literally", () => {
    // "." must not act as a regex wildcard.
    const md = diagram(
      ["service a(my.pack-home)[A]", "service b(myXpack-user)[B]"].join("\n"),
    );

    expect(extractIcons(md, ["my.pack"])).toEqual({ "my.pack": ["home"] });
  });
});

describe("getIconPackPrefixes", () => {
  test("returns the packs declared in dependencies", () => {
    expect(
      getIconPackPrefixes({
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
    expect(getIconPackPrefixes({})).toEqual([]);
    expect(getIconPackPrefixes({ dependencies: { react: "^19.0.0" } })).toEqual(
      [],
    );
  });
});

describe("createIconSubset", () => {
  const iconSet: IconifyJSON = {
    prefix: "test",
    width: 32,
    height: 32,
    icons: {
      flash: { body: "<path d='M1'/>" },
      user: { body: "<path d='M2'/>" },
      unused: { body: "<path d='M3'/>" },
    },
    aliases: {
      "cloud-lightning": { parent: "flash" },
      "cloud-storm": { parent: "cloud-lightning" },
    },
  };

  test("copies only the requested icons and the set's dimensions", () => {
    const { subset, notFound } = createIconSubset(iconSet, ["user"]);

    expect(subset.prefix).toBe("test");
    expect(subset.width).toBe(32);
    expect(subset.height).toBe(32);
    expect(Object.keys(subset.icons)).toEqual(["user"]);
    expect(subset.aliases).toBeUndefined();
    expect(notFound).toEqual([]);
  });

  test("copies an alias together with the icon it points to", () => {
    const { subset, notFound } = createIconSubset(iconSet, ["cloud-lightning"]);

    expect(Object.keys(subset.icons)).toEqual(["flash"]);
    expect(subset.aliases).toEqual({
      "cloud-lightning": { parent: "flash" },
    });
    expect(notFound).toEqual([]);
  });

  test("follows aliases that point to other aliases", () => {
    const { subset } = createIconSubset(iconSet, ["cloud-storm"]);

    expect(Object.keys(subset.icons)).toEqual(["flash"]);
    expect(subset.aliases).toEqual({
      "cloud-lightning": { parent: "flash" },
      "cloud-storm": { parent: "cloud-lightning" },
    });
  });

  test("reports names that are not in the icon set", () => {
    const { subset, notFound } = createIconSubset(iconSet, ["user", "missing"]);

    expect(Object.keys(subset.icons)).toEqual(["user"]);
    expect(notFound).toEqual(["missing"]);
    expect(subset).not.toHaveProperty("not_found");
  });

  test("returns an empty subset when no icons are used", () => {
    const { subset, notFound } = createIconSubset(iconSet, []);

    expect(subset.prefix).toBe("test");
    expect(subset.icons).toEqual({});
    expect(notFound).toEqual([]);
  });
});
