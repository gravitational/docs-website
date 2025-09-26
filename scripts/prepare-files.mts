import { copyFileSync, rmSync, existsSync, mkdirSync } from "fs";
import { join, resolve, dirname } from "path";
import { glob } from "glob";
import {
  getCurrentVersion,
  getLatestVersion,
  getVersionNames,
  getDocusaurusVersions,
} from "../server/config-site";
import { writeFileSync } from "fs";

const DOCS_PAGES_ROOT = "versioned_docs";
const SIDEBAR_FILENAME = "sidebars.json";
const VERSION_FILENAME = "versions.json";
const GET_VERSION_SIDEBAR_FILENAME = (version) =>
  `versioned_sidebars/version-${version}-sidebars.json`;

const docusaurusVersions = getDocusaurusVersions();
const currentVersion = getCurrentVersion();
const defaultVersion = getLatestVersion();
const versions = getVersionNames();
const tagFileYAML = "tags.yml";

const writeSidebar = (version: string) => {
  copyFileSync(
    join("content", version, "docs", "sidebar.json"),

    version === currentVersion
      ? SIDEBAR_FILENAME
      : GET_VERSION_SIDEBAR_FILENAME(version)
  );
};

const writeVersions = () =>
  writeFileSync(VERSION_FILENAME, JSON.stringify(docusaurusVersions), "utf8");

if (existsSync(DOCS_PAGES_ROOT)) {
  rmSync(DOCS_PAGES_ROOT, { recursive: true });
}

mkdirSync(DOCS_PAGES_ROOT, { recursive: true });

versions.forEach((version) => {
  const isCurrentVersion = version === currentVersion;
  const source = resolve("content", version, "docs/pages");
  const destination = isCurrentVersion
    ? resolve("docs")
    : resolve(DOCS_PAGES_ROOT, `version-${version}`);

  const paths = glob
    .sync(resolve(source, "**/*.mdx"))
    .filter((path: string) => !path.includes("/includes/")); // Files in `/includes/` folders are not actual pages

  paths.forEach((oldPath: string) => {
    const newPath = oldPath.replace(source, destination);
    const dir = dirname(newPath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    copyFileSync(oldPath, newPath);
  });

  // Copy the tags file to each content directory
  copyFileSync(tagFileYAML, join(destination, tagFileYAML))

  writeSidebar(version);
});

writeVersions();

// Make sure the upcoming releases page is the same on all 3 branches.
const versionsToOverride = getVersionNames().filter(
  (v) => v !== defaultVersion
);
const defaultUpcomingReleases = resolve(
  "content",
  defaultVersion,
  "docs/pages/upcoming-releases.mdx"
);
versionsToOverride.forEach((version) => {
  const destination =
    version === currentVersion
      ? resolve("docs", "upcoming-releases.mdx")
      : resolve(DOCS_PAGES_ROOT, `version-${version}`, "upcoming-releases.mdx");

  copyFileSync(defaultUpcomingReleases, destination);
});
