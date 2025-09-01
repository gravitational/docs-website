import { useCallback, useLayoutEffect, useRef, useState } from "react";
import cn from "classnames";
import {
  GuidedStepItemHandle,
  GuidedStepsProps,
  sanitizeGuidedStepsChildren,
  useGuidedSteps,
} from "./utils";
import styles from "./GuidedSteps.module.css";
import GuidedStepItem from "./GuidedStepItem";
import Icon from "../Icon";

const GuidedStepsComponent: React.FC<GuidedStepsProps> = (props) => {
  const items = useGuidedSteps(props);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observerContainerRef = useRef<HTMLDivElement | null>(null);

  const stepsRef = useRef<Map<string, GuidedStepItemHandle>>(new Map());

  const lastHighlightTime = useRef<number>(0);
  const pendingHighlight = useRef<string | undefined>(undefined);

  const ignoreIntersection = useRef<boolean>(false);

  const instructionsRef = useRef<HTMLElement[]>([]);

  useLayoutEffect(() => {
    const initializeObserver = () => {
      const instructionsHeight =
        observerContainerRef.current?.getBoundingClientRect().height;
      if (instructionsHeight) {
        observerContainerRef.current.parentElement.style.height = `calc(100px + ${instructionsHeight}px)`;
      }
      const debounceDelay = 200;

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

      const rootBottomMargin =
        document.body.getBoundingClientRect().height - 200;

      const options = {
        rootMargin: `-128px 0px -${rootBottomMargin}px 0px`,
        threshold: [0.3, 0.4, 0.5, 0.6, 0.7],
      };

      observerRef.current = new IntersectionObserver((entries) => {
        if (ignoreIntersection.current) return;

        const visibleEntries = entries.filter(
          (entry) => entry.isIntersecting && entry.intersectionRatio > 0.4
        );

        if (visibleEntries.length > 0) {
          const mostVisibleEntry = visibleEntries.reduce((max, entry) =>
            entry.intersectionRatio > max.intersectionRatio ? entry : max
          );

          debounceHighlightedStep(mostVisibleEntry.target.id);
        }
      }, options);

      instructionsRef.current.forEach((step) => {
        if (observerRef.current) {
          observerRef.current.observe(step);
        }
      });

      stepsRef.current.get(items[0].id)?.activate();
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
      console.log(stepId, activeStepId);
      if (stepId === activeStepId) return;
      setActiveStepId(stepId);
      stepsRef.current.forEach((step) => step.deactivate());
      stepsRef.current.get(stepId)?.activate();

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

  // Handle anchor links when the page loads
  useLayoutEffect(() => {
    const hash = window.location.hash.replace("#", "");

    if (hash) {
      const index = items.findIndex((item) => item.id === hash);

      if (index !== -1) {
        highlightStep(hash);

        instructionsRef.current[index]?.scrollIntoView({
          block: "start",
        });
      }
    } else if (items.length > 0) {
      highlightStep(items[0].id);
    }
  }, [items]);

  const copyLinkToClipboard = (id: string, event: React.MouseEvent) => {
    const link = `${window.location.origin}${window.location.pathname}#${id}`;
    window.history.pushState({}, "", `#${id}`);
    navigator.clipboard.writeText(link);

    setCopiedId(id);

    setTimeout(() => {
      setCopiedId(null);
    }, 1000);
  };

  return (
    <div className={styles.guidedSteps}>
      <div ref={observerContainerRef} className={styles.instructions}>
        {items.map(({ id, title, description }, index) => (
          <div
            role="button"
            key={id}
            ref={(el) => (instructionsRef.current[index] = el)}
            id={id}
            className={cn(styles.instruction, {
              [styles.active]: id === activeStepId,
            })}
            onClick={() => {
              highlightStep(id);
              instructionsRef.current[index]?.scrollIntoView({
                block: "start",
                behavior: "smooth",
              });
            }}
          >
            <h3>{title}</h3>
            {description && <p>{description}</p>}
            <button
              className={cn(styles.instructionLinkCopyButton, {
                [styles.active]: copiedId === id,
              })}
              onClick={(e) => copyLinkToClipboard(id, e)}
            >
              {copiedId === id ? (
                <span className={styles.copiedText}>Copied!</span>
              ) : (
                <Icon name="link" size="sm" />
              )}
            </button>
          </div>
        ))}
      </div>

      <div className={styles.codePanel}>
        {items.map(({ id, children }) => (
          <GuidedStepItem key={id} ref={(el) => stepsRef.current.set(id, el)}>
            {children}
          </GuidedStepItem>
        ))}
      </div>
    </div>
  );
};

const GuidedSteps: React.FC<GuidedStepsProps> = ({ children }) => {
  return (
    <GuidedStepsComponent>
      {sanitizeGuidedStepsChildren(children)}
    </GuidedStepsComponent>
  );
};

export default GuidedSteps;
