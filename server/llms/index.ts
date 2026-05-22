import type { Options as PluginOptions } from "@signalwire/docusaurus-plugin-llms-txt";
import rehypePrepareHTML from "./rehype-prepare-html";
import { buildSections } from "./build-sections";

// Generate the llms.txt top-level section definitions based on the sidebars configuration.
const sections = buildSections();

export const llmsTxtPluginOptions: PluginOptions = {
  // Top-level runtime options
  logLevel: 1,
  onRouteError: "throw",
  onSectionError: "throw",
  runOnPostBuild: true,

  // Markdown file generation options
  markdown: {
    relativePaths: false, // Whether to use relative paths or absolute path URLs in the generated markdown files
    beforeDefaultRehypePlugins: [rehypePrepareHTML], // Custom rehype plugins to clean up and reposition content for cleaner markdown output
    remarkStringify: {
      bullet: "-",
      rule: "-",
      ruleRepetition: 3,
    },
  },

  // llms.txt index file options
  llmsTxt: {
    sections,
    autoSectionPosition: sections.length + 1,
    includeDocs: true,
    includeBlog: false,
    includePages: false,
    excludeRoutes: ["/docs/tags/**"],
    enableDescriptions: true,
    siteTitle: "Teleport documentation",
    siteDescription:
      "Teleport is an identity-based access platform that secures servers, Kubernetes clusters, databases, internal applications, and desktops using short-lived certificates, detailed audit logging, and fine-grained role-based access controls tied to your SSO provider (e.g., Okta, GitHub, Google Workspace).",
  },
};
