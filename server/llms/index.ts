import type { Options as PluginOptions } from "@signalwire/docusaurus-plugin-llms-txt";
import rehypeRemoveAnchorLinks from "./rehype-remove-heading-anchor-links";
import rehypeRemoveIrrelevantComponents from "./rehype-remove-irrelevant-components";
import rehypeRepositionH1 from "./rehype-reposition-h1";
import rehypeProcessCustomComponentsForMarkdown from "./rehype-process-custom-components";

// Define the sections for the llms.txt index file, including their routes and descriptions
const sections = [
  {
    id: "get-started",
    name: "Get Started",
    description:
      "Learn how to deploy a cluster, connect infrastructure, set up access controls, and review audit logs.",
    routes: [{ route: "/docs/get-started/**" }],
    position: 0,
  },
  {
    id: "core-concepts",
    name: "Core Concepts",
    description: "Learn the key components that make up Teleport.",
    routes: [{ route: "/docs/core-concepts/**" }],
    position: 1,
  },
  {
    id: "agentic-identity-framework",
    name: "Agentic Identity Framework",
    description:
      "Design and reference implementation for the secure deployment of agents on infrastructure.",
    routes: [{ route: "/docs/agentic-identity-framework/**" }],
    position: 2,
  },
  {
    id: "installation",
    name: "Installation",
    description:
      "How to install Teleport and Teleport's client tools on your platform, including binaries and instructions for Docker and Helm.",
    routes: [{ route: "/docs/installation/**" }],
    position: 3,
  },
  {
    id: "connect-your-client",
    name: "Teleport User Guides",
    description:
      "Provides instructions to help users connect to infrastructure resources with Teleport.",
    routes: [{ route: "/docs/connect-your-client/**" }],
    position: 4,
  },
  {
    id: "zero-trust-access",
    name: "Teleport Zero Trust Access",
    description:
      "Easy access to all your infrastructure, on a foundation of cryptographic identity and zero trust.",
    routes: [{ route: "/docs/zero-trust-access/**" }],
    position: 5,
  },
  {
    id: "machine-workload-identity",
    name: "Machine & Workload Identity",
    description:
      "Use Teleport to replace long-lived secrets with identity-based authentication for your machines and workloads.",
    routes: [{ route: "/docs/machine-workload-identity/**" }],
    position: 6,
  },
  {
    id: "identity-governance",
    name: "Identity Governance",
    description:
      "Manage on-demand access, privileges, and compliance for all your infrastructure.",
    routes: [{ route: "/docs/identity-governance/**" }],
    position: 7,
  },
  {
    id: "identity-security",
    name: "Teleport Identity Security",
    description:
      "Teleport Identity Security centralizes access policy across your infrastructure, consolidates disparate identity audit logs, discovers shadow access, and alerts on access anomalies.",
    routes: [{ route: "/docs/identity-security/**" }],
    position: 8,
  },
  {
    id: "enroll-resources",
    name: "Enroll Resources",
    description:
      "Teleport protects infrastructure resources such as servers, databases, and Kubernetes clusters by enforcing strong access controls and auditability.",
    routes: [{ route: "/docs/enroll-resources/**" }],
    position: 9,
  },
  {
    id: "reference-guides",
    name: "Teleport Reference Guides",
    description:
      "Provides comprehensive information on configuration fields, Teleport commands, and other ways of interacting with Teleport.",
    routes: [{ route: "/docs/reference/**" }],
    position: 10,
  },
];

export const llmsTxtPluginOptions: PluginOptions = {
  // Top-level runtime options
  logLevel: 1,
  onRouteError: "throw",
  onSectionError: "throw",
  runOnPostBuild: true,

  // Markdown file generation options
  markdown: {
    relativePaths: false, // Whether to use relative paths or absolute path URLs in the generated markdown files
    beforeDefaultRehypePlugins: [
      rehypeRemoveAnchorLinks,
      rehypeRemoveIrrelevantComponents,
      rehypeRepositionH1,
      rehypeProcessCustomComponentsForMarkdown,
    ], // Custom rehype plugins to clean up and reposition content for cleaner markdown output
    remarkStringify: {
      bullet: "-",
      rule: "-",
      ruleRepetition: 3,
    },
  },

  // llms.txt index file options
  llmsTxt: {
    sections,
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
