import { PropVersionMetadata } from "@docusaurus/plugin-content-docs";

/**
 * Handles command content to avoid newlines between dynamic
 * documentation variables while copying a command.
 * Includes both individual command and whole snippet copying handling.
 * There are newlines due to MDX rendering specifics
 * @param commandNode
 * @param copyWholeSnippit
 * @returns handled text with no extra new lines
 */
export const toCopyContent = (
  commandNode: HTMLElement,
  commandLineClasses: string[]
): string => {
  const lines = Array.from(
    commandNode.querySelectorAll(commandLineClasses.join(","))
  ).reduce((allLines, commandLine) => {
    allLines.push(commandLine.textContent);
    return allLines;
  }, []);
  return lines.join("\n");
};

/**
 * This function gets the name of the first level in the navigation tree.
 * For example, `getting-started/local-kubernetes/` => `getting-started`;
 * if a page comes with the path `/setup/operations/backup-restore/`, we get `setup`.
 * This function only gets the part of the path without the hostname
 * and documentation basePath (`goteleport.com/docs/`).
 * If it is not the current version, the path without hostname and documentation basePath
 * will contain `ver` and version number (`/ver/10.0/setup/operations/backup-restore/`).
 * So this function has an extra check to see if the path contains a version and avoid it.
 */
export const getFirstLvlNav = (locPath: string): string => {
  let firstLvlNav = locPath.split("/")[1];

  if (firstLvlNav === "ver") {
    firstLvlNav = locPath.split("/")[3];
  }

  return firstLvlNav;
};

/**
 * This function is a basic filter for XSS when form text is submitted.
 * Very simply, it just looks for the opening symbol of a script '<' tag.
 * If includes, then returns a blank string, otherwise returns the text.
 */
export const filterTextForXSS = (text: string): string => {
  if (text.includes("<")) {
    return "";
  }
  return text;
};

export const getFromSecretOrEnv = (name: string): string => {
  // https://docs.aws.amazon.com/amplify/latest/userguide/environment-secrets.html#access-environment-secrets
  const configVars = process.env.secrets
    ? JSON.parse(process.env.secrets)
    : process.env;
  return configVars[name];
};

/**
 * This function generates a versioned URL for a given href and version metadata.
 * @param href - The original URL.
 * @param version - The version metadata.
 * @returns The versioned URL.
 */
/**
 * This function generates a versioned URL for a given href and version metadata.
 * @param href - The original URL.
 * @param version - The version metadata.
 * @returns The versioned URL.
 */
export const getVersionedUrl = (
  version: PropVersionMetadata,
  href?: string
): string => {
  const { isLast, label } = version;
  const isProduction = process.env.NODE_ENV === "production";
  const basePath = isProduction ? "/docs" : "";

  if (!href) return href;

  // Ensure href starts with a forward slash
  const normalizedHref = href.startsWith("/") ? href : `/${href}`;

  if (isLast) {
    return `${basePath}${normalizedHref}`;
  }

  // Extract version number from label (e.g. "9.x current" -> "9.x")
  const versionNumber = label.split(" ")[0];

  // Build versioned URL
  return `${basePath}/ver/${versionNumber}${normalizedHref}`;
};
