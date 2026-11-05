// Renders code from a string, such as a template literal built from the props
// of an MDX partial, the same way the build renders the equivalent fenced code
// block. Without a language, or with "code", it renders a ```code snippet with
// copyable commands (see remark-code-snippet). With any other language, it
// renders highlighted code (see rehypeHLJS).
import type { ReactNode } from "react";
import HighlightedBlock from "./HighlightedBlock";
import SnippetBlock from "./SnippetBlock";
import { normalizeSource } from "../../utils/codeSnippet";

export interface CodeBlockProps {
  children: ReactNode;
  // The language of the code. Without a language, or with "code", the text is
  // rendered as a code snippet with copyable commands.
  language?: string;
}

const getSource = (children: ReactNode): string => {
  if (children === null || children === undefined || children === false) {
    return "";
  }
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    const parts = children.map(getSource);
    // Each expression is on its own line, such as a template literal followed
    // by an imported file, so keep them on separate lines.
    return parts
      .map((part, i) => (i < parts.length - 1 ? part.replace(/\n$/, "") : part))
      .join("\n");
  }
  throw new Error(
    "CodeBlock expects its children to be strings, such as a template literal: {`$ command`}",
  );
};

export default function CodeBlock({ children, language }: CodeBlockProps) {
  const source = normalizeSource(getSource(children));

  if (!language || language === "code") {
    return <SnippetBlock source={source} />;
  }

  return <HighlightedBlock source={source} language={language} />;
}
