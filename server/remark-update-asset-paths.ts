// Register MDX nodes in mdast:
/// <reference types="remark-mdx" />

import type { VFile } from "vfile";
import type { Transformer } from "unified";
import type { Node } from "unist";
import type { Root, Image, Definition, Link } from "mdast";
import type {
  MdxJsxFlowElement,
  MdxJsxTextElement,
  MdxJsxAttribute,
} from "mdast-util-mdx-jsx";

import { visit } from "unist-util-visit";

type UpdaterOptions = {
  vfile: VFile;
};

type Updater = (href: string, options: UpdaterOptions) => string;

const defaultUpdater: Updater = (href: string): string => href;
const defaultAttributes = ["poster", "src", "href", "value"];

const isNodeWithUrl = (node: unknown): node is Image | Link | Definition =>
  node.hasOwnProperty("type") &&
  ["image", "link", "definition"].includes(
    (node as Image | Link | Definition).type,
  );

const isMdxJsxElement = (node: unknown) =>
  node.hasOwnProperty("type") &&
  ["mdxJsxFlowElement", "mdxJsxTextElement"].includes(
    (node as MdxJsxFlowElement | MdxJsxTextElement).type,
  );

type PluginOptions = {
  attributes?: string[];
  updater?: Updater;
};

export default function remarkUpdateAssetPaths({
  attributes = defaultAttributes,
  updater = defaultUpdater,
}: PluginOptions): Transformer<Root> {
  return (root: Root, vfile) => {
    visit(root, (node: unknown) => {
      if (isNodeWithUrl(node)) {
        let urlNode = node as Image | Link | Definition;
        urlNode.url = updater(urlNode.url, { vfile });
      }

      if (isMdxJsxElement(node as MdxJsxFlowElement | MdxJsxTextElement)) {
        (node as MdxJsxFlowElement | MdxJsxTextElement).attributes.forEach(
          (attribute) => {
            if (
              attributes.includes((attribute as MdxJsxAttribute).name) &&
              typeof attribute.value === "string"
            ) {
              attribute.value = updater(attribute.value, { vfile });
            }
          },
        );
      }
    });
  };
}
