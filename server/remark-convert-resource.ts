import type { Code as MdastCode, Root } from "mdast";
import type { Transformer } from "unified";
import { visit, SKIP } from "unist-util-visit";
import { VFile } from "vfile";
import type { Node, Parent } from "unist";
import { spawnSync } from "child_process";
import { join } from "path";
import type { MdxJsxAttribute, MdxAnyElement } from "./types-unist";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";

// isTeleportResource indicates whether the node is a code fence with the
// "teleport-resource" label.
const isTeleportResource = (node: Node): node is MdastCode =>
  node.type === "code" && (node as MdastCode).lang === "teleport-resource";

// RemarkConvertResourceOptions contains options for the remarkConvertResource
// plugin.
interface RemarkConvertResourceOptions {
  // The path to the conversion binary relative to rootDir. The binary must take
  // a tctl resource in stdin and use the "-format" flag to determine whether
  // to output an HCL configuration or Kubernetes manifest, which it prints to
  // stdout. An error code of 2 indicates that the resource is not supported
  // for a given infrastructure as code tool.
  binaryPath: string;
  // spawner is an implementation of spawnSync. By default, we use the one from
  // the child_process stdlib package.
  spawner?: typeof spawnSync;
  // rootDir is the directory in which to find binaryPath. This can be a
  // function to, for example, extract the rootDir from the version of a docs
  // page.
  rootDir?: string | ((vfile: VFile) => string);
}

// CodeTabConfig is the information we need to construct a TabItem from a code
// fence.
interface CodeTabConfig {
  // label is the label to apply to the rendered code snippet, e.g., "hcl" or
  // "yaml"
  label: string;
  // code is the AST representation of the code snippet to render
  code: MdastCode;
}

// tabsForCodeBlocks returns an AST representation of a Tabs component in which
// each TabItem contains a Teleport resource as configured for a specific
// infrastructure as code tool.
function tabsForCodeBlocks(blocks: CodeTabConfig[]): Node {
  const tabs = {
    type: "mdxJsxFlowElement",
    name: "Tabs",
    attributes: [],
    children: [] as MdxJsxFlowElement[],
  };

  blocks.forEach((b: CodeTabConfig) => {
    tabs.children.push({
      name: "TabItem",
      type: "mdxJsxFlowElement",
      attributes: [
        {
          type: "mdxJsxAttribute",
          name: "label",
          value: b.label,
        },
      ],
      children: [b.code],
    });
  });

  return tabs;
}

// remarkConvertResource is a plugin that finds code snippets with the
// "teleport-resource" label and replaces them with Tabs components that contain
// one TabItem for each variation of that resource supported by an
// infrastructure as code tool. If only tctl supports a resource, the plugin
// replaces the "teleport-resource" label with a "yaml" label.
export default function remarkConvertResource({
  binaryPath,
  spawner = spawnSync,
  rootDir = "",
}: RemarkConvertResourceOptions): Transformer<Root> {
  return (root: Node, vfile: VFile) => {
    const resolvedRoot = typeof rootDir == "string" ? rootDir : rootDir(vfile);

    visit(
      root,
      isTeleportResource,
      (node: MdastCode, index, parent: Parent) => {
        const fullPath = join(resolvedRoot, binaryPath);
        const hclResult = spawner(fullPath, [`-format=hcl`], {
          input: node.value,
        });

        if ((hclResult.error as NodeJS.ErrnoException)?.code === "ENOENT") {
          throw new Error(
            `convert-resource binary not found at ${fullPath}. Navigate to ${resolvedRoot} and run "go build .".`,
          );
        }

        if (hclResult.status === 1) {
          throw new Error(`problem converting to HCL: ${hclResult.stderr}`);
        }

        const kubeResult = spawner(fullPath, [`-format=kube`], {
          input: node.value,
        });
        if (kubeResult.status === 1) {
          throw new Error(
            `problem converting to Kubernetes YAML: ${kubeResult.stderr}`,
          );
        }

        // It is not possible to convert this YAML tctl resource, so treat it as
        // a regular YAML code snippet.
        if (hclResult.status === 2 && kubeResult.status === 2) {
          (parent.children[index] as MdastCode).lang = "yaml";
          return;
        }

        const tabs: CodeTabConfig[] = [];
        tabs.push({
          label: "tctl",
          code: {
            type: "code",
            lang: "yaml",
            value: node.value,
          },
        });
        if (hclResult.status === 0) {
          tabs.push({
            label: "Terraform provider",
            code: {
              type: "code",
              lang: "hcl",
              value: hclResult.stdout.toString(),
            },
          });
        }
        if (kubeResult.status === 0) {
          tabs.push({
            label: "Kubernetes operator",
            code: {
              type: "code",
              lang: "yaml",
              value: kubeResult.stdout.toString(),
            },
          });
        }
        parent.children[index] = tabsForCodeBlocks(tabs);
        return [SKIP, index + 1];
      },
    );
  };
}
