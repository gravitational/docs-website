import fs from "fs";
import yaml from "js-yaml";
import path from "path";

// the Section format from the signalwire/docusaurus-plugin-llms-txt plugin, used to define sections in the generated llms.txt file
// reference: https://www.npmjs.com/package/@signalwire/docusaurus-plugin-llms-txt/v/2.0.0-alpha.7#sectiondefinition
type Section = {
  id: string;
  name: string;
  description?: string;
  routes: { route: string }[];
  position: number;
};

// Sidebar item types (for section extraction)
type SidebarDoc = {
  type: "doc";
  id: string;
  label?: string;
};

type SidebarCategory = {
  type: "category";
  label: string;
  link?: { type: string; id: string };
};

type SidebarItem = SidebarDoc | SidebarCategory | { type: string };

// Reads the frontmatter of a markdown file and extracts the title and description fields, if they exist.
function readFrontmatterData(filePath: string): {
  title?: string;
  description?: string;
} {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    // Match the frontmatter data
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    // match[1] is the captured YAML frontmatter string. Cast to a known shape to safely access named fields
    if (!match) return { title: undefined, description: undefined };
    const frontmatter = yaml.load(match[1]) as Record<string, unknown>;
    // extract and return the title and description fields (if they exist and are strings)
    const title = frontmatter?.title;
    const description = frontmatter?.description;
    return {
      title: typeof title === "string" ? title : undefined,
      description: typeof description === "string" ? description : undefined,
    };
  } catch {
    // fail silently and return undefined if file can't be read or parsed for any reason (e.g., file doesn't exist, no frontmatter, invalid YAML, description field missing, etc.)
    return { title: undefined, description: undefined };
  }
}

// Returns the doc ID for a top-level sidebar item, if it has one.
function getDocId(item: SidebarItem): string | undefined {
  if (item.type === "doc") return (item as SidebarDoc).id;
  if (item.type === "category") return (item as SidebarCategory).link?.id;
  return undefined;
}

// Builds llms.txt sections based on the top-level items in the sidebars.json file.
// Supports both single-sidebar format ({ sidebar: [...] }) and multi-sidebar format ({ sidebar1: [...], sidebar2: [...], ... })
// For multi-sidebar, the first item of each sidebar array is used as the section entry.
export function buildSections(): Section[] {
  try {
    const sidebarsPath = path.resolve(process.cwd(), "sidebars.json");
    const sidebars = JSON.parse(
      fs.readFileSync(sidebarsPath, "utf8")
    ) as Record<string, SidebarItem[]>;

    // Collect the sections: every top-level item for single-sidebar, the first item of each sidebar array for multi-sidebar.
    const isSingleSidebar = "docs" in sidebars && Array.isArray(sidebars.docs);
    const sectionCandidates: SidebarItem[] = isSingleSidebar
      ? sidebars.docs
      : Object.values(sidebars)
          .filter((v): v is SidebarItem[] => Array.isArray(v))
          .map((items) => items[0])
          .filter(Boolean);

    const sections: Section[] = [];
    for (const item of sectionCandidates) {
      const docId = getDocId(item);
      if (!docId) continue;

      const sectionDir = docId.includes("/") ? docId.split("/")[0] : docId;
      // Use the sidebar item label as a fallback name for the section
      const label =
        item.type === "category"
          ? (item as SidebarCategory).label
          : ((item as SidebarDoc).label ?? sectionDir);

      const mdxPath = path.resolve(process.cwd(), `docs/${docId}.mdx`);
      const { title, description } = readFrontmatterData(mdxPath);

      const section: Section = {
        id: sectionDir,
        name: title ?? label,
        routes: [{ route: `/docs/${sectionDir}/**` }],
        position: sections.length,
      };
      if (description) {
        section.description = description;
      }
      sections.push(section);
    }

    return sections;
  } catch (error) {
    // Avoid crashing the plugin if an error occurs
    console.warn("Failed building sections for llms.txt plugin.", error);
    return [];
  }
}
