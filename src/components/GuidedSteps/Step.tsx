/**
 * Step - Individual instruction step component.
 * 
 * This component represents a single step in the guided instructions (left column).
 * Each Step:
 * - Is linked to a CodeBlock via matching IDs
 * - Highlights when scrolled into view (via intersection observer)
 * - Can be clicked to jump to that step and highlight its code
 * - Displays which file it references
 * - Automatically scrolls its corresponding code into view when activated
 * 
 * The Step component works in conjunction with File and CodeBlock components
 * to provide synchronized navigation between instructions and code.
 */

import { useCallback, useContext, useEffect, useState } from "react";
import { GuidedStepsContext } from "./context";
import { CodeBlockHandle, FileProps, StepProps } from "./types";
import styles from "./Step.module.css";
import cn from "classnames";
import Icon from "../Icon";

/**
 * Step component that displays an instruction step with synchronized code highlighting.
 * 
 * @param id - Unique identifier that matches a CodeBlock's stepId
 * @param index - Sequential index for managing refs and scrolling
 * @param children - The instruction content to display
 */
const Step: React.FC<StepProps> = ({ id, index, children }) => {
  const { files, codeBlockRefs, stepRefs, activeStepId, setActiveStepId } =
    useContext(GuidedStepsContext);

  const [relatedCodeBlock, setRelatedCodeBlock] =
    useState<CodeBlockHandle | null>(null);

  // Find the file that contains the code block for this step
  const relatedFile: FileProps =
    files.find((file) => file.stepIds?.includes(id)) || ({} as FileProps);

  // Get reference to the related code block once it's registered
  useEffect(() => {
    if (codeBlockRefs.current?.has(id)) {
      const relatedCodeBlock = codeBlockRefs.current.get(id);
      setRelatedCodeBlock(relatedCodeBlock);
    }
  }, [codeBlockRefs]);

  /**
   * Activates this step when clicked.
   * 
   * This function:
   * 1. Sets this step as active in the context
   * 2. Scrolls the step into view if it's partially obscured
   * 3. Deactivates all other code blocks
   * 4. Activates the code block associated with this step
   */
  const activateStep = useCallback(() => {
    setActiveStepId?.(id);
    const stepRef = stepRefs.current[index];
    stepRef.scrollIntoView({ block: "start" });
    const stepRefRect = stepRef?.getBoundingClientRect();
    const navbarHeight =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--ifm-navbar-height",
        ),
      ) || 0;
    // Check if step is obscured by navbar or bottom of viewport
    if (
      stepRefRect &&
      (stepRefRect.top < navbarHeight ||
        stepRefRect.bottom > window.innerHeight - navbarHeight)
    )
      stepRef?.scrollIntoView({ behavior: "smooth", block: "start" });
    codeBlockRefs.current.forEach((step) => step.deactivate());
    if (activeStepId !== id) relatedCodeBlock?.activate();
  }, [codeBlockRefs, relatedCodeBlock]);

  return (
    <div
      className={cn(styles.step, { [styles.active]: activeStepId === id })}
      role="button"
      tabIndex={0}
      ref={(el) => {
        stepRefs.current[index] = el;
      }}
      onClick={activateStep}
      id={id}
    >
      <div>{children}</div>
      <div className={styles.fileLabel}>
        <Icon name={relatedFile.icon || "file"} className={styles.fileIcon} />
        <span>{relatedFile.name}</span>
      </div>
    </div>
  );
};

Step.displayName = "Step";

export default Step;
