import type { Parent, Image, Link, Definition } from "mdast";
import type { Node } from "unist";
import type { VFile } from "vfile";
import { resolve, relative, dirname, join } from "path";
import { getLatestVersion } from "./config-site";
import { isLocalAssetFile } from "../src/utils/url";

const latest = getLatestVersion();

// The directory path pattern for versioned content transformed by the migration
// script
const REGEXP_POST_PREPARE_VERSION = /\/(versioned_)?docs\/version-([^\/]+)\//;
// The directory path pattern for versioned content not yet transformed by the
// migration script
const REGEXP_PRE_PREPARE_VERSION = /(\/|^)content\/([^\/]+)\//;
const REGEXP_EXTENSION = /(\/index)?\.mdx$/;

export type DocsMeta = {
  isCurrent: boolean;
  isLatest: boolean;
  isIndex: boolean;
  slug: string;
  version: string;
  rootDir: string;
  assetsDir: string;
  currentDir: string;
  pagesDir: string;
  originalPath: string;
};

// getProjectPath converts an absolute path to a docs page to a relative path,
// removing the path of the gravitational/docs-website repo clone.
const getProjectPath = (path: string) => path.replace(process.cwd(), "");

const isLatest = (path: string) => getProjectPath(path).startsWith("/docs/");

// getVersionFromPath extracts the docs version of a post-migration docs page so
// we can find the appropriate pre-migration version. If the docs page is
// already in the pre-migration directory, return the version number of that
// directory.
// @param {string} path an absolute path to a docs page.
// @param {string} latestVersion the latest version of Teleport reflected on
// the docs site.
// @param {string} projectPath the absolute path to the current
// gravitational/docs-website repo clone.
export const getVersionFromPath = (
  path: string,
  latestVersion: string,
  projectPath: string
): string => {
  const relPath = path.replace(projectPath, "");
  if (isLatest(relPath)) {
    return latestVersion;
  }
  const postPrepVersion = REGEXP_POST_PREPARE_VERSION.exec(relPath);
  if (!!postPrepVersion) {
    return postPrepVersion[2];
  }

  const prePrepVersion = REGEXP_PRE_PREPARE_VERSION.exec(relPath);
  if (!!prePrepVersion) {
    return prePrepVersion[2];
  }

  throw new Error(`unable to extract a version from filepath ${path}`);
};

export const getRootDir = (vfile: VFile): string => {
  return resolve(
    "content",
    getVersionFromPath(vfile.path, latest, getProjectPath(vfile.path))
  );
};

// getPreMigrationPath returns the docs page path in the pre-migration content
// directory that corresponds with the given absolute path.  @param {string}
// path an absolute path to a docs page.  @param {string} latest the latest
// Teleport version supported on the docs site.
// @param {string} path an absolute path to a docs page.
// @param {string} latestVersion the latest version of Teleport reflected on
// the docs site.
// @param {string} projectPath the absolute path to the current
// gravitational/docs-website repo clone.
export const getPreMigrationPath = (
  path: string,
  latestVersion: string,
  projectPath: string
) => {
  const preMigrationRoot = join(
    projectPath,
    "content",
    getVersionFromPath(path, latestVersion, projectPath),
    "docs/pages"
  );
  const postMigrationRoot = isLatest(path.replace(projectPath, ""))
    ? join(projectPath, "docs")
    : join(
        projectPath,
        `versioned_docs/version-${getVersionFromPath(
          path,
          latestVersion,
          projectPath
        )}`
      );
  return path.replace(postMigrationRoot, preMigrationRoot);
};

const extBlackList = ["md", "mdx"];

export const updateAssetPath = (href: string, { vfile }: { vfile: VFile }) => {
  if (isLocalAssetFile(href, { extBlackList })) {
    const assetPath = resolve(
      dirname(
        getPreMigrationPath(vfile.path, latest, getProjectPath(vfile.path))
      ),
      href
    );

    return relative(dirname(vfile.path), assetPath);
  }

  if (href.includes("#")) {
    return href.toLowerCase();
  }

  return href;
};

// retargetHref adjusts a link reference path found in a partial file. Since
// a page can include a partial regardless of the page or the partial's location
// in a directory tree, we need to update link paths in partials so relative
// link references work as expected.
// @param {string} originalPath the link reference included in the partial
// @param {string} partialPath the absolute path of the partial
// @param {string} includerPath the absolute path of the including docs page
// @param {string} contentRootDir the absolute path of the
// gravitational/teleport clone that contains partialPath and includerPath
export const retargetHref = (
  originalPath: string,
  partialPath: string,
  includerPath: string,
  contentRootDir: string
): string => {
  // Construct an absolute path out of the root directory for all partials,
  // the directory containing the partial (within the root directory for all
  // partials) and the relative path to the target asset, e.g.,
  // "docs/pages/includes", "kubernetes", and
  // "../../target.png".
  const absTargetPath = resolve(
    contentRootDir,
    dirname(partialPath),
    originalPath
  );
  // Make the reference path relative to the place where the partial doc was
  // inserted.
  return relative(
    // relative() counts all path segments, even the file itself, when
    // comparing path segments between the "from" and "to" paths, so we
    // start from the directory containing the file that includes the partial.
    dirname(includerPath),
    absTargetPath
  );
};

/**
 * correct relative paths resolving in partial docs
 * i.e. start realtive paths from the partial file directory, not from place where it is being inserted
 * example:
 * main file: docs/page/1.mdx
 * partial:   docs/partials/headers/1.mdx
 *
 * With this utility path like that
 * ../image.jpg
 * in partial will be pointing to
 * docs/partials/image.jpg
 * and without:
 * docs/image.jpg
 */

export const updatePathsInIncludes = ({
  node,
  versionRootDir,
  includePath,
  vfile,
  latestVersion,
  projectPath,
}: {
  node: Node;
  versionRootDir: string;
  includePath: string;
  vfile: VFile;
  latestVersion: string;
  projectPath: string;
}) => {
  if (
    node.type === "image" ||
    node.type === "link" ||
    node.type === "definition"
  ) {
    const href = (node as Link | Image | Definition).url;

    // Ignore non-strings, absolute paths, web URLs, and links consisting only
    // of anchors (these will end up pointing to the containing page).
    if (
      typeof href !== "string" ||
      href[0] === "/" ||
      /^http/.test(href) ||
      href[0] === "#"
    ) {
      return;
    }

    let docPagePath = resolve(vfile.path);
    if (vfile.path.match(REGEXP_POST_PREPARE_VERSION)) {
      docPagePath = getPreMigrationPath(vfile.path, latestVersion, projectPath);
    }

    //    console.log("--updatePathsInIncludes--");
    //    console.log("includePath:", includePath);
    //    console.log("docPagePath:", docPagePath);
    //    console.log("versionRootDir:", versionRootDir);
    //    console.log("\n\n");

    const newHref = retargetHref(
      href,
      // In the (!include/path!) syntax, we don't include versionRootDir, so we
      // need to add that here.
      resolve(versionRootDir, includePath),
      docPagePath,
      resolve(versionRootDir)
    );

    (node as Link | Image | Definition).url = newHref;
  }

  if ("children" in node) {
    (node as Parent).children?.forEach?.((child) =>
      updatePathsInIncludes({
        node: child,
        versionRootDir,
        includePath,
        vfile,
        latestVersion,
        projectPath,
      })
    );
  }
};
