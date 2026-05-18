import { lintRule } from "unified-lint-rule";
import { estimateTokenCount } from "tokenx";
import type { Node } from "unist";

export const WARNING_THRESHOLD = 20000; // if the token count is above this, we report a warning that the page is approaching the maximum token count limit
export const ERROR_THRESHOLD = 25000; // the maximum token count limit for a page.

// Reports a warning for pages with a token count between the warning and error
// thresholds. Register at severity 1 (warn) in the remark config.
export const remarkLintTokenCountWarn = lintRule(
  "remark-lint:token-count-warn",
  (root: Node, vfile) => {
    const tokens = estimateTokenCount(String(vfile));

    if (tokens >= WARNING_THRESHOLD && tokens <= ERROR_THRESHOLD) {
      vfile.message(
        `The token count (${tokens}) for this page is approaching the limit of ${ERROR_THRESHOLD} tokens.`,
      );
    }
  },
);

// Reports an error for pages exceeding the token count limit. Register at
// severity 2 (error) in the remark config using [remarkLintTokenCountError, ["error"]].
export const remarkLintTokenCountError = lintRule(
  "remark-lint:token-count-error",
  (root: Node, vfile) => {
    const tokens = estimateTokenCount(String(vfile));

    if (tokens > ERROR_THRESHOLD) {
      vfile.message(
        `Page token count (${tokens}) exceeds the limit of ${ERROR_THRESHOLD} tokens. Consider splitting this page into multiple shorter pages.`,
      );
    }
  },
);
