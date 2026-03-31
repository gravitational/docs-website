import fs from "fs";
import yaml from "js-yaml";
import path from "path";

export type Section = {
  id: string;
  name: string;
  description: string;
  routes: { route: string }[];
  position: number;
};

// Map each section ID to the MDX file
const sectionDescriptionSources: Record<string, string> = {
  "get-started": "docs/get-started/get-started.mdx",
  "core-concepts": "docs/core-concepts.mdx",
  "agentic-identity-framework": "docs/agentic-identity-framework.mdx",
  installation: "docs/installation/installation.mdx",
  "connect-your-client": "docs/connect-your-client/connect-your-client.mdx",
  "zero-trust-access": "docs/zero-trust-access/zero-trust-access.mdx",
  "machine-workload-identity":
    "docs/machine-workload-identity/machine-workload-identity.mdx",
  "identity-governance": "docs/identity-governance/identity-governance.mdx",
  "identity-security": "docs/identity-security/identity-security.mdx",
  "enroll-resources": "docs/enroll-resources/enroll-resources.mdx",
  "reference-guides": "docs/reference/reference.mdx",
};

// the descriptions in this array are fallback defaults that will be overwritten if the corresponding MDX file has a description in its frontmatter.
export const defaultSections: Section[] = [
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

function readFrontmatterDescription(filePath: string): string | undefined {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    // Match the frontmatter data
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return undefined;
    // match[1] is the captured YAML frontmatter string. Cast to a known shape to safely access named fields
    const frontmatter = yaml.load(match[1]) as Record<string, unknown>;
    // extract and return the description field if it exists and is a string
    const description = frontmatter?.description;
    return typeof description === "string" ? description : undefined;
  } catch {
    // fail silently and return undefined if file can't be read or parsed for any reason (e.g., file doesn't exist, no frontmatter, invalid YAML, description field missing, etc.)
    return undefined;
  }
}

// Reads descriptions from MDX frontmatter and returns sections with updated descriptions if available.
export function buildSections(): Section[] {
  return defaultSections.map((section) => {
    const source = sectionDescriptionSources[section.id];
    if (!source) return section;
    const filePath = path.resolve(process.cwd(), source);
    const description = readFrontmatterDescription(filePath);
    return description ? { ...section, description } : section;
  });
}
