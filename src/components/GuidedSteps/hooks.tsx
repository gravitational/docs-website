import {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { GuidedStepsProps } from "./types";
import { extractCodeBlocksFromFile, extractFiles, extractSteps } from "./utils";
import { GuidedStepsContext } from "./context";

// Custom hook to extract steps and files from GuidedSteps children.
export const useGuidedStepsData = (props: GuidedStepsProps) => {
  const { children } = props;
  return useMemo(() => {
    const steps = extractSteps(children);
    const files = extractFiles(children);

    const codeBlocks = files.flatMap(extractCodeBlocksFromFile);
    // Ensure that each step has a corresponding code block.
    steps.forEach((step) => {
      const matchingCodeBlock = codeBlocks.find(
        (codeBlock) => codeBlock.stepId === step.id
      );
      if (!matchingCodeBlock) {
        throw new Error(
          `GuidedSteps: No code block found for step with id "${step.id}". Please ensure that each step has a corresponding code block with a matching stepId.`
        );
      }
    });
    return { steps, files };
  }, [children]);
};

export const useGuidedSteps = () => {
  const { activeStepId, codeBlockRefs, stepRefs, setActiveStepId } =
    useContext(GuidedStepsContext);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastHighlightTime = useRef<number>(0);
  const pendingHighlight = useRef<string | undefined>(undefined);
  const ignoreIntersection = useRef<boolean>(false);

  useLayoutEffect(() => {
    const debounceDelay = 50;
    let resizeTimeout: NodeJS.Timeout;

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

    const initializeObserver = () => {
      // Disconnect existing observer before creating a new one
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

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

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      ignoreIntersection.current = true;
      
      resizeTimeout = setTimeout(() => {
        initializeObserver();
        ignoreIntersection.current = false;
      }, 150);
    };

    initializeObserver();

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(resizeTimeout);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
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
};
