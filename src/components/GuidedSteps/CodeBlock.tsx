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

        // Scroll within the nearest scrollable ancestor only if the code block is not fully visible
        const el = stepRef.current;
        if (el) {
          const container = el.closest<HTMLElement>(`.${styles.files}`);
          if (container) {
            const elTop = el.offsetTop;
            const elBottom = elTop + el.offsetHeight;
            const containerTop = container.scrollTop;
            const containerBottom = containerTop + container.clientHeight;

            if (elTop < containerTop) {
              container.scrollTo({ top: elTop, behavior: "smooth" });
            } else if (elBottom > containerBottom) {
              container.scrollTo({
                top: elBottom - container.clientHeight,
                behavior: "smooth",
              });
            }
          }
        }
      },
      deactivate: (): void => setActiveLines(false),
      innerText: stepRef.current?.innerText || "",
    }),
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
