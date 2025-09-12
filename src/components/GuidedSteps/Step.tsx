import { useContext } from "react";
import { GuidedStepsContext } from "./context";
import { StepProps } from "./types";
import styles from "./Step.module.css";
import cn from "classnames";
import Icon from "../Icon";

const Step: React.FC<StepProps> = ({ id, file, children }) => {
  const { files, activeStepId, setActiveStepId } =
    useContext(GuidedStepsContext);
  return (
    <div
      className={cn(styles.step, { [styles.active]: activeStepId === id })}
      role="button"
      onClick={() => setActiveStepId?.(id)}
    >
      <div>{children}</div>
      <div className={styles.fileLabel}>
        <Icon name={activeFile.icon || "file"} className={styles.fileIcon} />
        {activeFile.name}
      </div>
    </div>
  );
};

export default Step;
