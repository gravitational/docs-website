import { resolve } from "path";
import remarkVariables from "./.remark-build/server/remark-variables.mjs";
import remarkIncludes from "./.remark-build/server/remark-includes.mjs";
import { remarkLintTeleportDocsLinks } from "./.remark-build/server/lint-teleport-docs-links.mjs";
import {
  getVersion,
  getVersionRootPath,
} from "./.remark-build/server/docs-helpers.mjs";
import { loadConfig } from "./.remark-build/server/config-docs.mjs";
import { updatePathsInIncludes } from "./.remark-build/server/asset-path-helpers.mjs";

const configFix = {
  settings: {
    bullet: "-",
    ruleRepetition: 3,
    fences: true,
    incrementListMarker: true,
    checkBlanks: true,
    resourceLink: true,
    emphasis: "*",
    tablePipeAlign: false,
    tableCellPadding: true,
    listItemIndent: 1,
  },
  plugins: ["frontmatter", "mdx"],
};

const configLint = {
  plugins: [
    "frontmatter",
    "mdx",
    "preset-lint-markdown-style-guide",
    ["lint-emphasis-marker", false],
    ["lint-unordered-list-marker-style", false],
    ["lint-table-pipe-alignment", false],
    ["lint-table-cell-padding", false],
    ["lint-maximum-line-length", false],
    ["lint-no-consecutive-blank-lines", false],
    ["lint-no-emphasis-as-heading", false],
    ["lint-fenced-code-flag", { allowEmpty: true }],
    ["lint-file-extension", false],
    ["lint-no-duplicate-headings", false],
    ["lint-list-item-spacing", { checkBlanks: true }],
    ["lint-no-shell-dollars", false],
    ["lint-list-item-indent", "space"],
    ["lint-ordered-list-marker-value", false],
    ["lint-maximum-heading-length", false],
    ["lint-no-shortcut-reference-link", false],
    ["lint-no-file-name-irregular-characters", false],
    [
      remarkIncludes, // Lints (!include.ext!) syntax
      {
        lint: true,
        rootDir: (vfile) => getVersionRootPath(vfile.path),
        updatePaths: updatePathsInIncludes,
      },
    ],
    [
      remarkVariables, // Lints (=variable=) syntax
      {
        lint: true,
        variables: (vfile) => {
          return loadConfig(getVersion(vfile.path), ".").variables || {};
        },
      },
    ],
    // validate-links must be run after remarkVariables since some links
    // include variables in their references, e.g.,
    // [CM-08 Information System Component Inventory]((=fedramp.control_url=)CM-8)
    ["validate-links", { repository: false }],
    [remarkLintTeleportDocsLinks],
    // Disabling the remarkLintFrontmatter check until we fix
    // gravitational/docs#80
    // [remarkLintFrontmatter, ["error"]],
  ],
};

export default process.env.FIX ? configFix : configLint;
