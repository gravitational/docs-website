/**
 * CodeBlock - Individual code snippet component.
 * 
 * This component represents a single code block within a File, linked to a
 * specific Step via the stepId.
 * 
 * Features:
 * - Imperative activation/deactivation for highlighting
 * - Automatic scrolling into view when activated
 * - Exposes text content for copying
 * - Visual feedback when copy button is active
 */

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

/**
 * CodeBlock component with imperative handle for external control.
 * 
 * @param fileName - Name of the file this code block belongs to
 * @param copyButtonActive - Whether the copy button is currently visible
 * @param children - The actual code content (typically from a code fence)
 * @param ref - Forwarded ref for imperative control
 */
const CodeBlock = forwardRef<
  CodeBlockHandle,
  Pick<CodeBlockProps, "children" | "fileName" | "copyButtonActive">
>(({ fileName, copyButtonActive, children }, ref) => {
  const { activeFileName, setActiveFileName } = useContext(GuidedStepsContext);
  const stepRef = useRef<HTMLSpanElement | null>(null);

  const [activeLines, setActiveLines] = useState<boolean>(false);

  /**
   * Expose imperative methods via the forwarded ref.
   * 
   * These methods allow parent components (like Step) to control the
   * visual state of the code block without re-rendering the entire tree.
   */
  useImperativeHandle(
    ref,
    (): CodeBlockHandle => ({
      /**
       * Activates (highlights) this code block.
       * 
       * - Switches to the file containing this code block if needed
       * - Highlights the code block
       * - Scrolls it into view within the code panel
       */
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
      /**
       * Deactivates (removes highlight from) this code block.
       */
      deactivate: (): void => setActiveLines(false),
      /**
       * Gets the text content of this code block.
       * Used for copying to clipboard.
       */
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
