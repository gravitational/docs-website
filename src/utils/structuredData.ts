export type JsonLdNode = Record<string, unknown>;

const omitUndefined = <T extends JsonLdNode>(node: T): T =>
  Object.fromEntries(
    Object.entries(node).filter(([, value]) => value !== undefined),
  ) as T;

/**
 * Wraps one or more nodes in a single JSON-LD document. A single node keeps
 * its own shape; multiple nodes are emitted as an @graph.
 */
export const toJsonLdDocument = (nodes: JsonLdNode[]): JsonLdNode =>
  nodes.length === 1
    ? { "@context": "https://schema.org", ...nodes[0] }
    : { "@context": "https://schema.org", "@graph": nodes };

/**
 * Serializes JSON-LD for inlining in a <script> element. Escaping "<" keeps
 * author-controlled strings (titles, descriptions) from closing the script
 * element early, while remaining valid JSON.
 */
export const serializeJsonLd = (document: JsonLdNode): string =>
  JSON.stringify(document).replace(/</g, "\\u003c");

/** Returns an ISO 8601 string for a date-like value, or undefined if invalid. */
export const toIsoDate = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (
    !(value instanceof Date) &&
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

/**
 * Applies the site's `trailingSlash` setting to a URL path so structured data
 * URLs match the canonical URLs Docusaurus emits. Doc permalinks and sidebar
 * breadcrumb hrefs do not always include the trailing slash.
 */
export const applyTrailingSlash = (
  path: string,
): string => {
  const [pathname, suffix = ""] = path.split(/(?=[?#])/, 2);
  if (!pathname.endsWith("/")) {
    return `${pathname}/${suffix}`;
  }
  return path;
};

export const DOCS_WEBSITE_ID = "https://goteleport.com/docs/#website";
const DOCS_WEBSITE_NAME = "Teleport Docs";
export const ORGANIZATION_ID = "https://goteleport.com/#organization";

export const SOFTWARE_ID = "https://goteleport.com/#software";
/** The canonical docs WebSite node. Emit it on the docs home page only. */
export const buildDocsWebSiteNode = (): JsonLdNode => ({
  "@type": "WebSite",
  "@id": DOCS_WEBSITE_ID,
  name: DOCS_WEBSITE_NAME,
  url: "https://goteleport.com/docs/",
  inLanguage: "en",
  publisher: { "@id": ORGANIZATION_ID },
  isPartOf: { "@id": "https://goteleport.com/#website" },
});

export type DocArticleType = "TechArticle" | "HowTo";

/** Maps the `page_type` frontmatter field to a schema.org article type. */
export const getDocArticleType = (pageType: unknown): DocArticleType =>
  pageType === "how-to" ? "HowTo" : "TechArticle";

export interface DocArticleInput {
  type: DocArticleType;
  url: string;
  headline: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
}

export const buildDocArticleNode = ({
  type,
  url,
  headline,
  description,
  datePublished,
  dateModified,
}: DocArticleInput): JsonLdNode =>
  omitUndefined({
    "@type": type,
    "@id": `${url}#article`,
    headline,
    description: description || undefined,
    url,
    mainEntityOfPage: url,
    inLanguage: "en",
    datePublished,
    dateModified,
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    about: { "@id": SOFTWARE_ID },
    isPartOf: { "@id": DOCS_WEBSITE_ID },
  });

export interface BreadcrumbInput {
  label: string;
  href?: string;
}

export interface BreadcrumbListInput {
  // Origin used to absolutize breadcrumb hrefs, e.g. https://goteleport.com
  siteUrl: string;
  // Absolute URL of the docs site root, used as the first breadcrumb.
  rootUrl: string;
  breadcrumbs: BreadcrumbInput[];
  trailingSlash?: boolean;
}

export const buildBreadcrumbListNode = ({
  siteUrl,
  rootUrl,
  breadcrumbs,
}: BreadcrumbListInput): JsonLdNode => {
  const items = [
    { name: DOCS_WEBSITE_NAME, item: rootUrl },
    ...breadcrumbs
      // Breadcrumb items without links are not allowed in a BreadcrumbList.
      .filter((breadcrumb) => breadcrumb.href)
      .map((breadcrumb) => ({
        name: breadcrumb.label,
        item: `${siteUrl}${applyTrailingSlash(breadcrumb.href!)}`,
      })),
  ].filter(
    // Do not repeat the root if the sidebar already starts with it.
    (entry, index, all) => index === 0 || entry.item !== all[index - 1].item,
  );

  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      ...entry,
    })),
  };
};
