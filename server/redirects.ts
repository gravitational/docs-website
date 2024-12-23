import { loadConfig as loadDocsConfig } from "./config-docs";
import { getVersionNames } from "./config-site";

const versions = getVersionNames();

// Gather all redirects from all versions and convert them in the Docusaurus format.

export const getRedirects = () => {
  const result = versions.flatMap((version) => {
    const config = loadDocsConfig(version);

    return config.redirects || [];
  });

  return result.map((redirect) => {
    // If a page is an index page for a section, it has the same name as the
    // containing subdirectory. Handle this logic to accommodate redirects
    // from the previous docs site.
    const sourceSegs = redirect.source
      .replaceAll(new RegExp("/$", "g"), "")
      .split("/");

    const destSegs = redirect.destination
      .replaceAll(new RegExp("/$", "g"), "")
      .split("/");

    // The destination is an index page, since the slug matches the containing
    // path segment.
    const destIndex =
      destSegs.length >= 2 &&
      destSegs[destSegs.length - 1] == destSegs[destSegs.length - 2];

    if (!destIndex) {
      return {
        from: redirect.source,
        to: redirect.destination,
      };
    }

    const docusaurusDest =
      destSegs.slice(0, -1).join("/") + "/";

    // This redirect maps a Docusaurus-style index page to a previous-site index
    // page, so reverse the mapping.
    if (redirect.source == docusaurusDest) {
      const oldSource = redirect.source;
      redirect.source = redirect.destination;
      redirect.destination = oldSource;
      // This redirect has an old-style index page path as a destination, so
      // change it to a Docusaurus-style one.
    } else {
      redirect.destination = docusaurusDest;
    }

    return {
      from: redirect.source,
      to: redirect.destination,
    };
  });
};
