import { importDirectorySync } from '@iconify/tools';
import {  writeFileSync, copyFileSync, rmSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join, resolve, dirname } from "path";
import { glob } from "glob";
import { parseSkillMarkdown } from "../server/parse-skill-md";
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

// Describes the shape of a individual skill entry in the skills.json file.
export type SkillInfo = {
  name: string; // The name of the skill in the format <skill-folder-name>.
  readableName: string; // The human-readable name of the skill.
  description: string; // The description of the skill. It is a HTML string.
  installCommand: string; // The command to install the skill.
  rawSourceUrl: string; // The URL to the raw source of the skill in GitHub.
};

// Populate Teleport skills data to data/skills.json based on the skills folder found in the content directory.
const skills: SkillInfo[] = [];
const source = resolve("content", currentVersion, "skills");

const skillPaths = glob.sync(resolve(source, "**/SKILL.md"));

// Populate the skills array with data from each SKILL.md file.
skillPaths.forEach((path: string) => {
  const skillContent = readFileSync(path);
  const name: SkillInfo["name"] = path.replace("/SKILL.md", "").split("/").pop() ?? "";
  // Parse the SKILL.md content to extract the readable name and description.
  const { readableName, description } = parseSkillMarkdown(skillContent);

    skills.push({
      name,
      readableName: readableName ?? name,
      description: description ?? "",
      installCommand: `npx skills add https://github.com/gravitational/teleport/tree/master/skills/${name}`,
      rawSourceUrl: `https://github.com/gravitational/teleport/tree/master/skills/${name}/SKILL.md`,
    });
});

// Add the entry for installing all skills.
skills.push({
  name: "all-skills",
  readableName: "all skills",
  description:
    "Install all available skills. This will install all skills found in the Teleport repository.",
  installCommand: `npx skills add https://github.com/gravitational/teleport`,
  rawSourceUrl: `https://github.com/gravitational/teleport/tree/master/skills/README.md`,
})

// Write the skills array to the skills.json file in the data directory.
writeFileSync(SKILLS_FILENAME, JSON.stringify(skills, null, 2), "utf8");