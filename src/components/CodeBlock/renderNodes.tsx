import type { ReactNode } from "react";
import { Var } from "/src/components/Variables";
import type { HighlightedNode } from "/src/utils/hljs";

// Renders text, <Var /> tags and highlighted spans.
export const renderNodes = (nodes: HighlightedNode[]): ReactNode =>
  nodes.map((node, index) => {
    switch (node.type) {
      case "text":
        return node.value;
      case "var": {
        const { type: _type, ...props } = node;
        return <Var key={index} {...props} />;
      }
      case "span":
        return (
          <span key={index} className={node.className?.join(" ")}>
            {renderNodes(node.children)}
          </span>
        );
    }
  });
