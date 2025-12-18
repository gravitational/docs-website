import { useContext, useState } from "react";
import cn from "classnames";
import { sanitizeLeftColumnChildren } from "./utils";
import styles from "./GuidedSteps.module.css";
import GuidedStepsContextProvider, { GuidedStepsContext } from "./context";
import { GuidedStepsProps } from "./types";
import File, { FileTabs } from "./File";
import Icon from "../Icon";
import { useGuidedSteps } from "./hooks";

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

  useGuidedSteps();

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
      <div className={styles.instructions}>
        {sanitizeLeftColumnChildren(props.children)}
      </div>

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

const GuidedSteps: React.FC<GuidedStepsProps> = (props) => {
  return (
    <GuidedStepsContextProvider>
      <GuidedStepsComponent {...props} />
    </GuidedStepsContextProvider>
  );
};

export default GuidedSteps;
