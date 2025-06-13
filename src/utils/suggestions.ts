export interface DocsVersion {
  name: string;
  label: string;
  isLast: boolean;
  path: string;
  mainDocId: string;
  docs: Array<DocPathInfo>;
}

export interface DocPathInfo {
  id: string;
  path: string;
  sidebar: string;
}

// possibleMovedPages returns an array of path information for pages with the
// same final path segment as slug.
export const possibleMovedPages = function (
  urlpath: string,
  nav: Array<DocsVersion>,
): Array<DocPathInfo> {
  // Assemble a map of final path segments to path info so we can perform a
  // lookup.
  const slugsToPathInfo = new Map();
  nav.forEach((v) => {
    if (!urlpath.startsWith(v.path)) {
      return;
    }
    v.docs.forEach((d) => {
      // Obtain the slug from the page ID. This is guaranteed to match the
      // expression since it comes from Docusaurus.
      const name = d.id.match(/[^\/]+$/)[0];
      if (!slugsToPathInfo.has(name)) {
        slugsToPathInfo.set(name, [d]);
        return;
      }
      const pathinfo = slugsToPathInfo.get(name);
      pathinfo.push(d);
      slugsToPathInfo.set(name, pathinfo);
    });
  });

  const slug = urlpath.match(/([^\/]+)\/?$/);
  if (!slug || !slug[1]) {
    return [];
  }

  return slugsToPathInfo.get(slug[1]);
};

// getPathDir takes a URL path with leading and trailing slashes and returns all
// but final path segment. getPathDir does not test for a well-formatted input
// since this comes from Docusaurus.
function getPathDir(path: string): string {
  if (path === "/") {
    return "/";
  }

  // Remove the leading and trailing slashes, then split into an array of path
  // segments.
  const segs = path.slice(1, -1).split("/");

  // Return the preceding path, which is either the root or the path leading
  // up to the final segment.
  if (segs.length == 1) {
    return "/";
  }
  segs.pop();
  return "/" + segs.join("/") + "/";
}

export const nearestAvailableCategoryIndex = function (
  urlpath: string,
  nav: Array<DocsVersion>,
): DocPathInfo {
  const sectionIndexMap = new Map();
  nav.forEach((v) => {
    if (!urlpath.startsWith(v.path)) {
      return;
    }

    // Add each section index page path to the map
    v.docs.forEach((d) => {
      const slug = d.path.match(/([^\/]+)\/?$/);
      if (!slug || !slug[1]) {
        return;
      }

      if (d.id.endsWith(slug[1] + "/" + slug[1])) {
        sectionIndexMap.set(d.path, d);
      }
    });
  });

  // Traverse the missing URL path backwards, one segment at a time, until we
  // find one in the map that corresponds to a category index page.
  for (let p = getPathDir(urlpath); p !== "/"; p = getPathDir(p)) {
    if (sectionIndexMap.has(p)) {
      return sectionIndexMap.get(p);
    }
  }
  return undefined;
};
