import { loadConfig as loadDocsConfig } from "./config-docs";
import { getVersionNames } from "./config-site";

const versions = getVersionNames();

// Gather all redirects from all versions and convert them in the Docusaurus format.

export interface CustomRedirect {
  source: string;
  destination: string;
  permanent: boolean;
}

const isIndexPage = (urlpath: string): boolean => {
  const parts = urlpath.split("/").filter((p) => p !== "");
  return (
    parts.length >= 2 && parts[parts.length - 1] == parts[parts.length - 2]
  );
};

export const validateRedirects = (redirects: Array<CustomRedirect>) => {
  const sources = new Map();
  redirects.forEach((r) => {
    if (!sources.has(r.source)) {
      sources.set(r.source, true);
    } else {
      throw new Error(
        `there are multiple redirects with the same source: ${r.source}`,
      );
    }
    validateRedirect(r);
  });
};

const validateRedirect = (redirect: CustomRedirect) => {
  ["source", "destination"].forEach((p) => {
    if (isIndexPage(redirect[p])) {
      throw new Error(
        `redirect ${p} includes an incorrect category index page path - remove the final path segment: ${redirect[p]}`,
      );
    }
    if (!redirect[p].startsWith("/")) {
      throw new Error(
        `redirect ${p} must start with a trailing slash: ${redirect[p]}`,
      );
    }
  });

  return;
};

export const getRedirects = () => {
  const result = versions.flatMap((version) => {
    const config = loadDocsConfig(version, ".");

    return config.redirects || [];
  });

  validateRedirects(result as Array<CustomRedirect>);
  return result.map((r) => {
    return {
      from: r.source,
      to: r.destination,
    };
  });
};
