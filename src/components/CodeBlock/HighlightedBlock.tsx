import { useMemo } from "react";
import Code from "/src/theme/MDXComponents/Code";
import Pre from "/src/theme/MDXComponents/Pre";
import { highlightCode } from "/src/utils/hljs";
import { renderNodes } from "./renderNodes";

export interface HighlightedBlockProps {
  source: string;
  language: string;
}

// Renders the same elements as a fenced code block with a language: a pre
// element containing a code element with the highlighted text.
export default function HighlightedBlock({
  source,
  language,
}: HighlightedBlockProps) {
  const { className, children } = useMemo(
    () => highlightCode(source, language),
    [source, language],
  );

  return (
    <Pre>
      <Code className={className}>{renderNodes(children)}</Code>
    </Pre>
  );
}
