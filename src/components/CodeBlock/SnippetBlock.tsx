import { useMemo } from "react";
import Command, { CommandComment, CommandLine } from "/src/components/Command";
import Snippet from "/src/components/Snippet";
import { CodeLine } from "/src/theme/MDXComponents/Code";
import { parseCodeSnippet } from "/src/utils/codeSnippet";
import { renderNodes } from "./renderNodes";

export interface SnippetBlockProps {
  source: string;
}

// Renders what the remark-code-snippet plugin renders for a ```code fence.
export default function SnippetBlock({ source }: SnippetBlockProps) {
  const { nodes } = useMemo(() => {
    const parsed = parseCodeSnippet(source);
    for (const { severity, message } of parsed.diagnostics) {
      if (severity === "error") {
        console.error(`ERROR: ${message} in a CodeBlock`);
      }
    }
    return parsed;
  }, [source]);

  return (
    <Snippet>
      {nodes.map((node, index) => {
        switch (node.type) {
          case "command":
            return (
              <Command key={index}>
                {node.lines.map((line, lineIndex) => (
                  <CommandLine
                    key={lineIndex}
                    data-content={lineIndex === 0 ? node.prefix : undefined}
                  >
                    {renderNodes(line)}
                  </CommandLine>
                ))}
              </Command>
            );
          case "comment":
            return (
              <CommandComment
                key={index}
                data-type={node.description ? "descr" : undefined}
              >
                {node.value}
              </CommandComment>
            );
          case "codeline":
            return <CodeLine key={index}>{renderNodes(node.parts)}</CodeLine>;
          case "br":
            return <br key={index} />;
        }
      })}
    </Snippet>
  );
}
