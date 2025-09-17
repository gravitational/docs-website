import {
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import cn from "classnames";
import { sanitizeLeftColumnChildren } from "./utils";
import styles from "./GuidedSteps.module.css";
import GuidedStepsContextProvider, { GuidedStepsContext } from "./context";
import { GuidedStepsProps } from "./types";
import File, { FileTabs } from "./File";
import Icon from "../Icon";

const GuidedStepsComponent: React.FC<GuidedStepsProps> = (props) => {
  const {
    steps,
    activeStepId,
    activeFileName,
    codeBlockRefs,
    stepRefs,
    fileRefs,
    showCopyButton,
    fileNameHasType,
    setActiveStepId,
    setShowCopyButton,
  } = useContext(GuidedStepsContext);
  const [copiedIndicator, setCopiedIndicator] = useState<boolean>(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastHighlightTime = useRef<number>(0);
  const pendingHighlight = useRef<string | undefined>(undefined);
  const ignoreIntersection = useRef<boolean>(false);

  useLayoutEffect(() => {
    const initializeObserver = () => {
      const debounceDelay = 10;

      const debounceHighlightedStep = (stepId: string) => {
        if (ignoreIntersection.current) return;

        const now = Date.now();
        pendingHighlight.current = stepId;

        if (now - lastHighlightTime.current > debounceDelay) {
          highlightStep(stepId, true);
          lastHighlightTime.current = now;
          pendingHighlight.current = undefined;
        } else {
          setTimeout(() => {
            if (pendingHighlight.current === stepId) {
              highlightStep(stepId, true);
              lastHighlightTime.current = Date.now();
              pendingHighlight.current = undefined;
            }
          }, debounceDelay);
        }
      };

      const navHeight =
        parseInt(
          document.documentElement.style.getPropertyValue("--ifm-navbar-height")
        ) || 117;

      const rootBottomMargin =
        document.body.getBoundingClientRect().height - navHeight * 2;

      const options = {
        rootMargin: `-${navHeight + 16}px 0px -${rootBottomMargin}px 0px`,
        threshold: Array.from({ length: 1000 }, (_, i) => i / 1000),
      };

      observerRef.current = new IntersectionObserver((entries) => {
        if (ignoreIntersection.current) return;

        const visibleEntries = entries.filter(
          (entry) => entry.isIntersecting && entry.intersectionRatio > 0.3
        );

        if (visibleEntries.length > 0) {
          const mostVisibleEntry = visibleEntries.reduce((max, entry) =>
            entry.intersectionRatio > max.intersectionRatio ? entry : max
          );

          debounceHighlightedStep(mostVisibleEntry.target.id);
        }
      }, options);

      stepRefs.current.forEach((step) => {
        if (observerRef.current) {
          observerRef.current.observe(step);
        }
      });
    };

    initializeObserver();

    window.removeEventListener("resize", initializeObserver);
    window.addEventListener("resize", initializeObserver);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      window.removeEventListener("resize", initializeObserver);
    };
  }, []);

  const highlightStep = useCallback(
    (stepId: string, fromObserver = false) => {
      if (stepId === activeStepId) return;
      setActiveStepId(stepId);
      codeBlockRefs.current.forEach((step) => step.deactivate());
      codeBlockRefs.current.get(stepId)?.activate();

      // Only set the ignore flag if this was triggered with a click
      if (!fromObserver) {
        ignoreIntersection.current = true;

        setTimeout(() => {
          ignoreIntersection.current = false;
        }, 1000);
      }
    },
    [activeStepId]
  );

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
        <FileTabs />
        <File />
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
