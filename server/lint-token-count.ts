import { lintRule } from "unified-lint-rule";
import { toMarkdown } from "mdast-util-to-markdown";
import { mdxToMarkdown } from "mdast-util-mdx";
import { frontmatterToMarkdown } from "mdast-util-frontmatter";
import { gfmToMarkdown } from "mdast-util-gfm";
import { estimateTokenCount } from "tokenx";
import type { Node, Parent } from "unist";

const tokenLimit = 30000;
const messageSuffix = `Disable this warning by adding {/* lint ignore token-count remark-lint */} in the end of the file.`;

export const remarkLintTokenCount = lintRule(
  "remark-lint:token-count",
  (root: Node, vfile) => {
    const children = (root as Parent).children;
    const last = children[children.length - 1];

    const pageMarkdownContent = toMarkdown(root as any, {
      extensions: [
        mdxToMarkdown(),
        frontmatterToMarkdown(["yaml"]),
        gfmToMarkdown(),
      ],
    });
    const tokenEstimation = estimateTokenCount(pageMarkdownContent);
    if (tokenEstimation > tokenLimit) {
      vfile.message(
        `This page has an estimated token count of ${tokenEstimation}, which exceeds the limit of ${tokenLimit}. Consider splitting the page into smaller sections. ${messageSuffix}`,
        last.position,
      );
    }
  },
);
