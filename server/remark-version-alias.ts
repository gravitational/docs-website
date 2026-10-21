import type { MdxjsEsm } from "mdast-util-mdxjs-esm";
import type { Root, Paragraph, Literal, Link, Definition } from "mdast";
import type { VFile } from "vfile";
import type { Transformer } from "unified";
import type { Node } from "unist";
import { visit, CONTINUE, SKIP } from "unist-util-visit";
import path from "path";

const versionedDocsPattern = `versioned_docs/version-([0-9]+\\.x)/`;
// MDX-native partials are read directly from the content submodules and never
// copied into docs/ or versioned_docs/, so they need their own version detection.
const preMigrationContentPattern = `(?:^|/)content/([0-9]+\\.x)/`;

const urlProtocolPattern = /^[a-z][a-z0-9+.-]*:/i; // Matches URL protocols for example https:, mailto:, etc.
const markdownLinkPattern = /^([^?#]*)(\?[^#]*)?(#.*)?$/; // Matches the pathname, query, and hash components of a markdown link.
const markdownFileExtensionPattern = /\.mdx?$/i;

export interface RemarkVersionAlias {
  // The highest-numbered version (the "edge"/unreleased version, served from docs/).
  currentVersion: string;
  // The version served at the site root, with no /ver/<version>/ URL prefix.
  latestVersion: string;
}

// Resolves markdown links in partials to absolute doc routes, ensuring they work
// regardless of which page imports the partial. Also normalizes the path and strips
// the .mdx extension to avoid conflicts with Docusaurus's own resolveMarkdownLink plugin.
function resolvePartialMarkdownLink(
  url: string,
  filePath: string,
  version: string,
  latestVersion: string,
): string {
  if (urlProtocolPattern.test(url)) {
    return url;
  }

  // The pattern matches any single-line string.
  const [, pathname, search = "", hash = ""] = url.match(markdownLinkPattern)!;
  // Strip a trailing slash so that paths like ./getting-started.mdx/ are
  // treated the same as ./getting-started.mdx.
  const normalizedPathname = pathname.replace(/\/$/, "");
  if (!markdownFileExtensionPattern.test(normalizedPathname)) {
    return url;
  }

  const docsPagesPath = `/content/${version}/docs/pages/`;
  // Resolve the absolute filesystem path of the linked markdown file.
  const absoluteFsPath = path.posix.resolve(
    path.posix.dirname(filePath),
    normalizedPathname,
  );
  const markerIndex = absoluteFsPath.indexOf(docsPagesPath);
  if (markerIndex === -1) {
    // We can't confidently map this to a doc route: fall back to stripping the extension
    // rather than crashing the entire build.
    return `${pathname.replace(markdownFileExtensionPattern, "")}${search}${hash}`;
  }

  // Extract the doc path relative to the docs/pages directory.
  const docPath = absoluteFsPath
    .slice(markerIndex + docsPagesPath.length)
    .replace(markdownFileExtensionPattern, "");

  // Determine if the last segment of the doc path should be dropped: e.g. /my-path/my-path.mdx
  // becomes /my-path/ and /my-path/index.mdx becomes /my-path/.
  const segments = docPath.split("/");
  const base = segments[segments.length - 1];
  const parent = segments[segments.length - 2];
  if (
    /^(index|readme)$/i.test(base) ||
    (parent !== undefined && base.toLowerCase() === parent.toLowerCase())
  ) {
    segments.pop();
  }
  const docID = segments.join("/");

  const versionPrefix = version === latestVersion ? "" : `ver/${version}/`;

  // The docs home page (docs/pages/index.mdx) has an empty doc ID.
  const docRoute = docID ? `${docID}/` : "";

  return `/${versionPrefix}${docRoute}${search}${hash}`;
}

export default function remarkVersionAlias({
  currentVersion,
  latestVersion,
}: RemarkVersionAlias): Transformer<Root> {
  return (root: Root, vfile: VFile) => {
    // Set for MDX-native partials, which are read from content/<version>/.
    const partialVersion = vfile.path.match(preMigrationContentPattern)?.[1];
    const version =
      vfile.path.match(versionedDocsPattern)?.[1] ??
      partialVersion ??
      currentVersion;

    visit(root, (node: Node) => {
      if (
        partialVersion &&
        (node.type === "link" || node.type === "definition")
      ) {
        const link = node as Link | Definition;
        link.url = resolvePartialMarkdownLink(
          link.url,
          vfile.path,
          partialVersion,
          latestVersion,
        );
        return CONTINUE;
      }

      if (node.type != "mdxjsEsm") {
        return CONTINUE;
      }

      // Only process import statements that import an identifier from a default
      // export.
      const esm = node as unknown as MdxjsEsm;
      if (!esm.data || !esm.data.estree) {
        return CONTINUE;
      }

      let newVal: Array<string> = [];

      esm.data.estree.body.forEach((decl) => {
        if (
          decl["type"] != "ImportDeclaration" ||
          decl.specifiers.length !== 1 ||
          decl.specifiers[0].type != "ImportDefaultSpecifier"
        ) {
          return;
        }
        const newPath = (decl.source.value as string).replace(
          "@version",
          `@site/content/${version}`,
        );
        decl.source = {
          type: "Literal",
          value: newPath,
          raw: `"${newPath}"`,
        };

        newVal.push(
          `import ${decl.specifiers[0].local.name} from '${newPath}';`,
        );
      });

      esm.value = newVal.join("\n");

      return SKIP;
    });
  };
}
