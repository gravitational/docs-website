import type { Options as PluginOptions } from "@signalwire/docusaurus-plugin-llms-txt";
import fs from "fs";
import rehypePrepareHTML from "./rehype-prepare-html";
import {
  defaultSections,
  Section,
  TEMP_SECTIONS_PATH,
} from "./plugin-section-descriptions";

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
    get sections() {
      // Read updated sections written by sectionDescriptionsPlugin during the allContentLoaded lifecycle method.
      // Falls back to the static defaultSections array if the file does not exist (e.g., in non-build environments).
      try {
        return JSON.parse(
          fs.readFileSync(TEMP_SECTIONS_PATH, "utf8"),
        ) as Section[];
      } catch (err) {
        console.log(err.message);
        return defaultSections;
      }
    },
    autoSectionPosition: 11,
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
