/**
 * GuidedSteps - A two-column documentation component for step-by-step instructions.
 * 
 * This is the main component that provides an interactive documentation experience
 * with synchronized instruction steps on the left and corresponding code files on
 * the right. Features include:
 * - Automatic step highlighting as users scroll
 * - Click-to-navigate between steps
 * - Multi-file code display with tabs
 * - Copy/download code functionality
 * - Synchronized scrolling between steps and code blocks
 * 
 * Usage:
 * ```tsx
 * <GuidedSteps>
 *   <StepSection>Setup</StepSection>
 *   <Step id="step1">Install the package</Step>
 *   <Step id="step2">Configure your app</Step>
 *   <File name="config.yaml">
 *     <CodeBlock stepId="step1">{...}</CodeBlock>
 *     <CodeBlock stepId="step2">{...}</CodeBlock>
 *   </File>
 * </GuidedSteps>
 * ```
 */

import { useContext, useState } from "react";
import cn from "classnames";
import { sanitizeLeftColumnChildren } from "./utils";
import styles from "./GuidedSteps.module.css";
import GuidedStepsContextProvider, { GuidedStepsContext } from "./context";
import { GuidedStepsProps } from "./types";
import File, { FileTabs } from "./File";
import Icon from "../Icon";
import { useGuidedSteps } from "./hooks";

/**
 * Internal GuidedSteps component that consumes context.
 * 
 * This component sets up the two-column layout and handles the copy code
 * functionality. It's separated from the main component to allow context
 * consumption.
 */
const GuidedStepsComponent: React.FC<GuidedStepsProps> = (props) => {
  const {
    activeStepId,
    activeFileName,
    codeBlockRefs,
    fileRefs,
    showCopyButton,
    fileNameHasType,
    setShowCopyButton,
  } = useContext(GuidedStepsContext);
  const [copiedIndicator, setCopiedIndicator] = useState<boolean>(false);

  // Initialize intersection observer for step highlighting
  useGuidedSteps();

  /**
   * Copies the active code to clipboard.
   * 
   * For files without extensions, copies the specific code block.
   * For files with extensions, copies the entire file content.
   */
  const handleCopyCode = () => {
    const noFileType = activeFileName?.split(".").length === 1;
    const codeText = noFileType
      ? codeBlockRefs.current.get(activeStepId).innerText
      : fileRefs.current.get(activeFileName)?.innerText;
    navigator.clipboard.writeText(codeText);
    setCopiedIndicator(true);
    setTimeout(() => {
      setCopiedIndicator(false);
    }, 1500);
  };

  return (
    <div className={styles.guidedSteps}>
      {/* Left column: Step instructions and other content */}
      <div className={styles.instructions}>
        {sanitizeLeftColumnChildren(props.children)}
      </div>

      {/* Right column: Code files with tabs */}
      <div
        className={cn(styles.codePanel, {
          [styles.copyButtonActive]: showCopyButton && fileNameHasType,
        })}
        onMouseEnter={() => setShowCopyButton(true)}
        onMouseLeave={() => setShowCopyButton(false)}
      >
        <div className={styles.codeContainer}>
          <FileTabs />
          <File />
        </div>
        {showCopyButton && (
          <button className={styles.copyButton} onClick={handleCopyCode}>
            <Icon name={copiedIndicator ? "check2" : "copy2"} size="sm" />
            <span>{copiedIndicator ? "Copied!" : "Copy Code"}</span>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Main GuidedSteps component that wraps everything in a context provider.
 * 
 * This is the component users import and use in their documentation.
 * It provides all the state management via context to child components.
 * 
 * @param props - GuidedStepsProps containing Step and File children
 */
const GuidedSteps: React.FC<GuidedStepsProps> = (props) => {
  return (
    <GuidedStepsContextProvider>
      <GuidedStepsComponent {...props} />
    </GuidedStepsContextProvider>
  );
};

export default GuidedSteps;
