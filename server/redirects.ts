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

export const validateRedirect = (redirect: CustomRedirect) => {
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

  result.forEach(validateRedirect);
  return result.map((r) => {
    return {
      from: r.source,
      to: r.destination,
    };
  });
};
