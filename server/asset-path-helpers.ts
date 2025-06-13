import type { Parent, Image, Link, Definition } from "mdast";
import type { Node } from "unist";
import type { VFile } from "vfile";
import { resolve, relative, dirname } from "path";
import { getCurrentVersion, getLatestVersion } from "./config-site";
import { isLocalAssetFile } from "../src/utils/url";

const current = getCurrentVersion();
const latest = getLatestVersion();

// The directory path pattern for versioned content transformed by the migration
// script
const REGEXP_POST_PREPARE_VERSION = /^\/versioned_docs\/version-([^\/]+)\//;
// The directory path pattern for versioned content not yet transformed by the
// migration script
const REGEXP_PRE_PREPARE_VERSION = /^\/?content\/([^\/]+)\//;
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

const getProjectPath = (vfile: VFile) => vfile.path.replace(process.cwd(), "");

const isCurrent = (vfile: VFile) => getProjectPath(vfile).startsWith("/docs/");

// getVersionFromVFile extracts the docs version of a post-migration docs page
// so we can find the appropriate pre-migration version. If the docs page is
// already in the pre-migration directory, return the version number of that
// directory.
export const getVersionFromVFile = (vfile: VFile): string => {
  if (isCurrent(vfile)) {
    return current;
  }
  const projectPath = getProjectPath(vfile);

  const postPrepVersion = REGEXP_POST_PREPARE_VERSION.exec(projectPath);
  if (!!postPrepVersion) {
    return postPrepVersion[1];
  }

  const prePrepVersion = REGEXP_PRE_PREPARE_VERSION.exec(projectPath);
  if (!!prePrepVersion) {
    return prePrepVersion[1];
  }

  throw new Error(`unable to extract a version from filepath ${projectPath}`);
};

export const getRootDir = (vfile: VFile): string => {
  return resolve("content", getVersionFromVFile(vfile));
};

const getCurrentDir = (vfile: VFile) => {
  // The page is in the pre-migration directory, i.e., we're linting it
  if (vfile.path.startsWith("content")) {
    return resolve(`content/${getVersionFromVFile(vfile)}/docs/pages`);
  }
  return isCurrent(vfile)
    ? resolve("docs")
    : resolve(`versioned_docs/version-${getVersionFromVFile(vfile)}`);
};

const getOriginalPath = (vfile: VFile) =>
  vfile.path.replace(
    getCurrentDir(vfile),
    resolve(getRootDir(vfile), "docs/pages"),
  );

const extBlackList = ["md", "mdx"];

export const updateAssetPath = (href: string, { vfile }: { vfile: VFile }) => {
  if (isLocalAssetFile(href, { extBlackList })) {
    const assetPath = resolve(dirname(getOriginalPath(vfile)), href);

    return relative(dirname(vfile.path), assetPath);
  }

  if (href.includes("#")) {
    return href.toLowerCase();
  }

  return href;
};

// updatePathsInIncludes edits URLs in image and link references within a
// partials so that, when a page includes the partial, the references are still
// correct.
// The logic is:
// - Find the absolute path of the asset in the link reference (i.e., an image or
//   another page)
// - Find the absolute path of the including page within the content directory
//   (not the Docusaurus build directory).
// - Replace the original ink reference with a relative path between the
//   absolute path of the including page and teh absolute path of the asset.
export const updatePathsInIncludes = ({
  node,
  versionRootDir,
  includePath,
  vfile,
}: {
  node: Node;
  versionRootDir: string;
  includePath: string;
  vfile: VFile;
}) => {
  if (
    node.type === "image" ||
    node.type === "link" ||
    node.type === "definition"
  ) {
    const href = (node as Link | Image | Definition).url;

    const projectPath = vfile.path.replace(process.cwd(), "");
    const isCurrent = projectPath.startsWith("/docs/");

    let version;
    if (isCurrent) {
      version = current;
    }

    const postPrepVersion = REGEXP_POST_PREPARE_VERSION.exec(projectPath);
    if (!!postPrepVersion) {
      version = postPrepVersion[1];
    }

    const prePrepVersion = REGEXP_PRE_PREPARE_VERSION.exec(projectPath);
    if (!!prePrepVersion) {
      version = prePrepVersion[1];
    }

    // TODO: not sure what this refers to. It's from inlining getCurrentDir
    let currentDir: string;
    // The page is in the pre-migration directory, i.e., we're linting it
    if (vfile.path.startsWith("content")) {
      currentDir = resolve(`content/${version}/docs/pages`);
    }
    currentDir = isCurrent
      ? resolve("docs")
      : resolve(`versioned_docs/version-${version}`);

    // Ignore non-strings, absolute paths, web URLs, and links consisting only
    // of anchors (these will end up pointing to the containing page).
    if (
      typeof href !== "string" ||
      href[0] === "/" ||
      /^http/.test(href) ||
      href[0] === "#"
    ) {
      return href;
    }

    if (node.type === "link") {
      // We find the relative link from the directory containing the partial to
      // the path of the link target.
      const absMdxPath = dirname(vfile.path);

      // Find the absolute path of the target asset in the pre-migration docs content
      // directory.
      const absTargetPath = resolve(
        versionRootDir,
        dirname(includePath),
        href,
      ).replace(resolve(resolve("content", version), "docs/pages"), currentDir);

      (node as Link | Image | Definition).url = relative(
        absMdxPath,
        absTargetPath,
      );
    } else {
      const absMdxPath = resolve(
        vfile.path.replace(
          currentDir,
          resolve(getRootDir(vfile), "docs/pages"),
        ),
      );

      const absTargetPath = resolve(versionRootDir, dirname(includePath), href);

      (node as Link | Image | Definition).url = relative(
        dirname(absMdxPath),
        absTargetPath,
      );
    }
  }

  if ("children" in node) {
    (node as Parent).children?.forEach?.((child) =>
      updatePathsInIncludes({
        node: child,
        versionRootDir,
        includePath,
        vfile,
      }),
    );
  }
};
