import { lintRule } from "unified-lint-rule";
import { visit } from "unist-util-visit";
import { VFile } from "vfile";
import type { Node } from "unist";
import type { Heading, Parent, Code, Text } from "mdast";

const stepRE = new RegExp(/^Step [0-9]+\/[0-9]+/);

function emitUnfollowableMessage(
  current: Heading,
  headingText: string,
  vFile: VFile,
) {
  vFile.message(
    `In a how-to guide, each H2 beginning "Step " must include at least one command so CLI users and AI agents can follow it. ${headingText} has no command. Disable this warning by adding {/* lint ignore agent-followability remark-lint */} before this line.`,
  );
}

export const remarkLintAgentFollowability = lintRule(
  "remark-lint:agent-followability",
  (root: Node, vfile: VFile) => {
    let currentStepH2: Heading;
    let currentStepNum: string;
    let hasCode = false;

    (root as Parent).children.forEach((topLevel) => {
      if (
        topLevel.type == "heading" &&
        topLevel.depth === 2 &&
        topLevel.children.length > 0
      ) {
        // We've reached a new H2, so check whether there was a previous one
        // that was unfollowable.
        if (currentStepH2 && !hasCode) {
          emitUnfollowableMessage(currentStepH2, currentStepNum, vfile);
        }

        const val = topLevel.children[0];
        if (val.type != "text") {
          return;
        }

        const stepNum = stepRE.exec((val as Text).value);
        if (!stepNum) {
          return;
        }

        currentStepH2 = topLevel as Heading;
        currentStepNum = stepNum[0];
        hasCode = false;
        return;
      }

      visit(topLevel, "code", (code) => {
        if (code.lang !== "code") {
          return;
        }
        hasCode = true;
      });
    });

    // We're at the end of the document, so check the final H2.
    if (currentStepH2 && !hasCode) {
      emitUnfollowableMessage(currentStepH2, currentStepNum, vfile);
    }
  },
);
