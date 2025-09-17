import {
  useImperativeHandle,
  useRef,
  forwardRef,
  useContext,
  useState,
} from "react";
import cn from "classnames";
import styles from "./File.module.css";
import { CodeBlockProps, CodeBlockHandle } from "./types";
import { GuidedStepsContext } from "./context";

const CodeBlock = forwardRef<
  CodeBlockHandle,
  Pick<CodeBlockProps, "children" | "fileName" | "copyButtonActive">
>(({ fileName, copyButtonActive, children }, ref) => {
  const { activeFileName, setActiveFileName } = useContext(GuidedStepsContext);
  const stepRef = useRef<HTMLSpanElement | null>(null);

  const [activeLines, setActiveLines] = useState<boolean>(false);

  useImperativeHandle(
    ref,
    (): CodeBlockHandle => ({
      activate: (): void => {
        if (activeFileName !== fileName) setActiveFileName(fileName);
        setActiveLines(true);
        stepRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "start",
        });
      },
      deactivate: (): void => setActiveLines(false),
      innerText: stepRef.current?.innerText || "",
    })
  );

  return (
    <span
      className={cn(styles.codeBlock, {
        [styles.activeLines]: activeLines,
        [styles.copyButtonActive]: copyButtonActive,
      })}
      ref={stepRef}
    >
      {children}
    </span>
  );
});

CodeBlock.displayName = "CodeBlock";

export default CodeBlock;
