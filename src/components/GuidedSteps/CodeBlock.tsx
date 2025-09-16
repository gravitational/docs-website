import { useImperativeHandle, useRef, forwardRef, useContext } from "react";
import styles from "./File.module.css";
import { CodeBlockProps, CodeBlockHandle } from "./types";
import { GuidedStepsContext } from "./context";

const CodeBlock = forwardRef<
  CodeBlockHandle,
  Pick<CodeBlockProps, "children" | "fileName">
>(({ fileName, children }, ref) => {
  const { activeFileName, setActiveFileName } = useContext(GuidedStepsContext);
  const stepRef = useRef<HTMLSpanElement | null>(null);

  useImperativeHandle(
    ref,
    (): CodeBlockHandle => ({
      activate: (): void => {
        if (activeFileName !== fileName) setActiveFileName(fileName);
        stepRef.current?.classList.add(styles.activeLines);
        stepRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center",  });
      },
      deactivate: (): void =>
        stepRef.current?.classList.remove(styles.activeLines),
    })
  );

  return (
    <span className={styles.codeBlock} ref={stepRef}>
      {children}
    </span>
  );
});

CodeBlock.displayName = "CodeBlock";

export default CodeBlock;
