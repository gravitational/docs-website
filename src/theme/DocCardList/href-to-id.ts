// categoryHrefoToDocID returns the Docusaurus page ID that corresponds to the
// given href, which points to a category index page. Category pages do not have
// IDs in the items prop, so we generate a page ID based on the assumption that
// category page slugs are the same as their containing directory names.
export function categoryHrefToDocID(href: string): string {
  // Remove initial path segments that are not involved in generating the page
  // ID, such as "/docs/" and "/ver/15.x/".
  let idPrefix = href.replace(new RegExp(`^/(docs/)?(ver/[0-9]+\\.x/)?`), "");
  // Ensure that trailing slashes are trimmed so we can uniformly add the slug
  // segment.
  idPrefix = idPrefix.replace(new RegExp(`/$`), "");
  const slugRE = new RegExp(`/([^/]+)/?$`);
  const slug = slugRE.exec(href);
  if (!slug || slug.length < 2) {
    throw new Error(`could not identify a category page ID for href ${href}`);
  }
  return idPrefix + "/" + slug[1];
}
