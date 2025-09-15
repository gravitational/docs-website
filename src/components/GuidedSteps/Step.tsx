import { useCallback, useContext, useEffect, useState } from "react";
import { GuidedStepsContext } from "./context";
import { CodeBlockHandle, FileProps, StepProps } from "./types";
import styles from "./Step.module.css";
import cn from "classnames";
import Icon from "../Icon";

const Step: React.FC<StepProps> = ({ id, children }) => {
  const { files, codeBlockRefs, activeStepId, setActiveStepId } =
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
    codeBlockRefs.current.forEach((step) => step.deactivate());
    relatedCodeBlock?.activate();
  }, [codeBlockRefs, relatedCodeBlock]);

  return (
    <div
      className={cn(styles.step, { [styles.active]: activeStepId === id })}
      role="button"
      onClick={activateStep}
    >
      <div>{children}</div>
      <div className={styles.fileLabel}>
        <Icon name={relatedFile.icon || "file"} className={styles.fileIcon} />
        {relatedFile.name}
      </div>
    </div>
  );
};

export default Step;
