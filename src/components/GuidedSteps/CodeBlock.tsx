import { useImperativeHandle, useRef, forwardRef } from "react";
import styles from "./File.module.css";
import { CodeBlockProps, CodeBlockHandle } from "./types";

const CodeBlock = forwardRef<CodeBlockHandle, Pick<CodeBlockProps, "children">>(
  ({ children }, ref) => {
    const stepRef = useRef<HTMLSpanElement | null>(null);

    useImperativeHandle(
      ref,
      (): CodeBlockHandle => ({
        activate: (): void =>
          stepRef.current?.classList.add(styles.activeLines),
        deactivate: (): void =>
          stepRef.current?.classList.remove(styles.activeLines),
      })
    );

    return (
      <span className={styles.codeBlock} ref={stepRef}>
        {children}
      </span>
    );
  }
);

CodeBlock.displayName = "CodeBlock";

export default CodeBlock;
