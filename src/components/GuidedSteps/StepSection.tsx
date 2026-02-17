/**
 * StepSection - A numbered section wrapper for grouping related steps.
 * 
 * This component provides a way to organize multiple steps into logical sections
 * within the GuidedSteps instructions. Each section is automatically numbered
 * (index is added by the sanitizeLeftColumnChildren utility).
 * 
 * Usage:
 * ```tsx
 * <GuidedSteps>
 *   <StepSection>Installation</StepSection>
 *     <Step id="step1">...</Step>
 *     <Step id="step2">...</Step>
 *   <File name="package.json">
 *     <CodeBlock stepId="step1">...</CodeBlock>
 *     <CodeBlock stepId="step2">...</CodeBlock>
 *   </File>
 * </GuidedSteps>
 * ```
 */

import styles from "./Step.module.css";

/**
 * StepSection component that displays a numbered section for grouping steps.
 * 
 * @param index - The section number (auto-populated by parent)
 * @param children - Step components and other content to display in this section
 */
const StepSection: React.FC<{ index?: number; children: React.ReactNode }> = ({
  index,
  children,
}) => (
  <div className={styles.stepSection}>
    <div className={styles.index}>{index}</div>
    {children}
  </div>
);

StepSection.displayName = "StepSection";

export default StepSection;
