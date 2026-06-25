import { importDirectorySync } from '@iconify/tools';
import {  writeFileSync, copyFileSync, rmSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join, resolve, dirname } from "path";
import { glob } from "glob";
import { fromMarkdown } from "mdast-util-from-markdown";
import { visit, EXIT, SKIP } from "unist-util-visit";
import type { Text } from "mdast";
import { toHast } from "mdast-util-to-hast";
import { toHtml } from "hast-util-to-html";
import {
  getCurrentVersion,
  getLatestVersion,
  getVersionNames,
  getDocusaurusVersions,
} from "../server/config-site";

const DOCS_CURRENT_ROOT = "docs"
const DOCS_PAGES_ROOT = "versioned_docs";
const SIDEBAR_FILENAME = "sidebars.json";
const VERSION_FILENAME = "versions.json";
const SKILLS_FILENAME = "data/skills.json";
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

if (existsSync(DOCS_CURRENT_ROOT)) {
  rmSync(DOCS_CURRENT_ROOT, { recursive: true });
}
if (existsSync(DOCS_PAGES_ROOT)) {
  rmSync(DOCS_PAGES_ROOT, { recursive: true });
}

mkdirSync(DOCS_PAGES_ROOT, { recursive: true });

versions.forEach((version) => {
  const isCurrentVersion = version === currentVersion;
  const source = resolve("content", version, "docs/pages");
  const destination = isCurrentVersion
    ? resolve(DOCS_CURRENT_ROOT)
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
      ? resolve(DOCS_CURRENT_ROOT, "upcoming-releases.mdx")
      : resolve(DOCS_PAGES_ROOT, `version-${version}`, "upcoming-releases.mdx");

  copyFileSync(defaultUpcomingReleases, destination);
});

// Allow the Docusaurus MermaidJS plugin to import custom icons from a local
// directory. It writes a JSON file to the data directory, which is not checked
// into source control.
//
// It is up to a Docusaurus client module to load the icons. Loading the icon
// JSON relies on server-side code, so we cannot do this in a Docusaurus client
// module.
const iconPath  = resolve(__dirname, join("../data", "teleport-icons.json"));

// Following the example at:
// https://iconify.design/docs/libraries/tools/import/directory.html
const iconSet = importDirectorySync(join("src", "mermaid-icons"),
    {
	prefix: "teleport",
    },
);
writeFileSync(iconPath, JSON.stringify(iconSet.export()));


/*
 * ------------------------------------------------------------------------------
 * Populate Teleport skills data to data/skills.json based on the skills folder
 * found in the content directory. The data is used by related components
 * throughout the docs to display skills information and provide installation
 * commands.
 * ------------------------------------------------------------------------------
 */
export type SkillInfo = {
  name: string;
  readableName: string;
  description: string;
  installCommand: string;
  rawSourceUrl: string;
};

const skills: SkillInfo[] = [];
const source = resolve("content", currentVersion, "skills");

const skillPaths = glob.sync(resolve(source, "**/SKILL.md"));

// read each SKILL.md file, extract the relevant information, and write it to skills.json.
skillPaths.forEach((path: string) => {
  const skillContent = readFileSync(path);

  const tree = fromMarkdown(skillContent);

  // The name of the skill is the name of the folder containing the SKILL.md file.
  const name: SkillInfo["name"] = path.replace("/SKILL.md", "").split("/").pop() ?? "";
  let readableName: SkillInfo["readableName"] | null = null;
  let description: SkillInfo["description"] | null = null;

  // The first heading in the SKILL.md file is the readable name of the skill, and
  // the first paragraph after that heading is the description. Traverse the markdown
  // AST to find these elements and extract the relevant information.
  let prevNodeWasH1: boolean = false;
  visit(tree, undefined, (node) => {
    if (node.type === "heading" && node.depth === 1) {
      const textNode = node.children.find((child) => child.type === "text") as
        | Text
        | undefined;
      if (textNode) {
        readableName = textNode.value;
        prevNodeWasH1 = true;
        return SKIP;
      }
    }

    if (node.type === "paragraph" && prevNodeWasH1) {
      const hast = toHast(node as any);
      if (hast) {
        description = toHtml(hast);
        return EXIT; // Stop traversing after finding the description, since that's the only thing we need after the heading.
      }
    }
  });
    skills.push({
      name,
      readableName: readableName ?? name,
      description: description ?? "",
      installCommand: `npx skills add https://github.com/gravitational/teleport/tree/master/skills/${name}`,
      rawSourceUrl: `https://github.com/gravitational/teleport/tree/master/skills/${name}/SKILL.md`,
    });
});

// Add an entry for installing all skills.
skills.push({
  name: "all-skills",
  readableName: "all skills",
  description:
    "Install all available skills. This will install all skills found in the Teleport repository.",
  installCommand: `npx skills add https://github.com/gravitational/teleport`,
  rawSourceUrl: `https://github.com/gravitational/teleport/tree/master/skills/README.md`,
})

writeFileSync(SKILLS_FILENAME, JSON.stringify(skills, null, 2), "utf8");

/*
 *------------------------------------------------------------------------------
 */