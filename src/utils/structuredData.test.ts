import { describe, expect, test } from "@jest/globals";
import {
  applyTrailingSlash,
  DOCS_WEBSITE_ID,
  ORGANIZATION_ID,
  SOFTWARE_ID,
  buildBreadcrumbListNode,
  buildDocArticleNode,
  buildDocsWebSiteNode,
  getDocArticleType,
  serializeJsonLd,
  toIsoDate,
  toJsonLdDocument,
} from "./structuredData";

describe("getDocArticleType", () => {
  test.each([
    ["how-to", "HowTo"],
    ["conceptual", "TechArticle"],
    ["reference", "TechArticle"],
    [undefined, "TechArticle"],
  ])("%s -> %s", (pageType, expected) => {
    expect(getDocArticleType(pageType)).toBe(expected);
  });
});

describe("buildDocArticleNode", () => {
  test("references shared entities by @id", () => {
    expect(
      buildDocArticleNode({
        type: "HowTo",
        url: "https://goteleport.com/docs/a/",
        headline: "A",
        description: "Does A.",
        datePublished: "2020-01-01T00:00:00.000Z",
        dateModified: "2024-01-01T00:00:00.000Z",
      }),
    ).toEqual({
      "@type": "HowTo",
      "@id": "https://goteleport.com/docs/a/#article",
      headline: "A",
      description: "Does A.",
      url: "https://goteleport.com/docs/a/",
      mainEntityOfPage: "https://goteleport.com/docs/a/",
      inLanguage: "en",
      datePublished: "2020-01-01T00:00:00.000Z",
      dateModified: "2024-01-01T00:00:00.000Z",
      author: { "@id": ORGANIZATION_ID },
      publisher: { "@id": ORGANIZATION_ID },
      about: { "@id": SOFTWARE_ID },
      isPartOf: { "@id": DOCS_WEBSITE_ID },
    });
  });

  test("omits unknown optional fields", () => {
    const node = buildDocArticleNode({
      type: "TechArticle",
      url: "https://goteleport.com/docs/a/",
      headline: "A",
      description: "",
    });
    expect(node).not.toHaveProperty("description");
    expect(node).not.toHaveProperty("datePublished");
    expect(node).not.toHaveProperty("dateModified");
  });
});

describe("buildDocsWebSiteNode", () => {
  test("has a stable @id and references the organization", () => {
    const node = buildDocsWebSiteNode();
    expect(node["@id"]).toBe(DOCS_WEBSITE_ID);
    expect(node.publisher).toEqual({ "@id": ORGANIZATION_ID });
  });
});

describe("buildBreadcrumbListNode", () => {
  const siteUrl = "https://goteleport.com";
  const rootUrl = "https://goteleport.com/docs/";

  test("adds the site root as the first item", () => {
    const node = buildBreadcrumbListNode({
      siteUrl,
      rootUrl,
      breadcrumbs: [
        { label: "Category", href: "/docs/cat/" },
        { label: "No link" },
        { label: "Page", href: "/docs/cat/page/" },
      ],
    });
    expect(node.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Teleport Docs",
        item: rootUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Category",
        item: "https://goteleport.com/docs/cat/",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Page",
        item: "https://goteleport.com/docs/cat/page/",
      },
    ]);
  });

  test("applies the trailing slash setting", () => {
    const node = buildBreadcrumbListNode({
      siteUrl,
      rootUrl,
      breadcrumbs: [{ label: "Page", href: "/docs/page" }],
      trailingSlash: true,
    });
    expect((node.itemListElement as { item: string }[])[1].item).toBe(
      "https://goteleport.com/docs/page/",
    );
  });

  test("does not duplicate the root", () => {
    const node = buildBreadcrumbListNode({
      siteUrl,
      rootUrl,
      breadcrumbs: [{ label: "Home", href: "/docs/" }],
    });
    expect(node.itemListElement).toHaveLength(1);
  });
});

describe("toJsonLdDocument", () => {
  test("uses @graph for multiple nodes", () => {
    expect(toJsonLdDocument([{ "@type": "A" }, { "@type": "B" }])).toEqual({
      "@context": "https://schema.org",
      "@graph": [{ "@type": "A" }, { "@type": "B" }],
    });
  });
});

describe("serializeJsonLd", () => {
  test("escapes script-closing sequences", () => {
    const out = serializeJsonLd({ headline: "</script><b>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out)).toEqual({ headline: "</script><b>" });
  });
});

describe("toIsoDate", () => {
  test.each([
    ["2024-01-02", "2024-01-02T00:00:00.000Z"],
    [1704153600000, "2024-01-02T00:00:00.000Z"],
    ["not a date", undefined],
    [undefined, undefined],
    [{}, undefined],
  ])("%p", (input, expected) => {
    expect(toIsoDate(input)).toBe(expected);
  });
});

describe("applyTrailingSlash", () => {
  test.each([
    ["/docs/a", "/docs/a/"],
    ["/docs/a/", "/docs/a/"],
    ["/docs/a#b", "/docs/a/#b"],
    ["/docs/a/", "/docs/a"],
    ["/", "/"],
    ["/docs/a", "/docs/a"],
  ])("%s (%p) -> %s", (path, expected) => {
    expect(applyTrailingSlash(path)).toBe(expected);
  });
});
