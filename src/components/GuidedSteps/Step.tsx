import { useCallback, useContext, useEffect, useState } from "react";
import { GuidedStepsContext } from "./context";
import { CodeBlockHandle, FileProps, StepProps } from "./types";
import styles from "./Step.module.css";
import cn from "classnames";
import Icon from "../Icon";

const Step: React.FC<StepProps> = ({ id, index, children }) => {
  const { files, codeBlockRefs, stepRefs, activeStepId, setActiveStepId } =
    useContext(GuidedStepsContext);

  const [relatedCodeBlock, setRelatedCodeBlock] =
    useState<CodeBlockHandle | null>(null);

  const relatedFile: FileProps =
    files.find((file) => file.stepIds?.includes(id)) || ({} as FileProps);

  useEffect(() => {
    if (codeBlockRefs.current?.has(id)) {
      const relatedCodeBlock = codeBlockRefs.current.get(id);
      setRelatedCodeBlock(relatedCodeBlock);
    }
  }, [codeBlockRefs]);

  const activateStep = useCallback(() => {
    setActiveStepId?.(id);
    const stepRef = stepRefs.current[index];
    const stepRefRect = stepRef?.getBoundingClientRect();
    const navbarHeight =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--ifm-navbar-height"
        )
      ) || 0;
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
      ref={(el) => (stepRefs.current[index] = el)}
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
