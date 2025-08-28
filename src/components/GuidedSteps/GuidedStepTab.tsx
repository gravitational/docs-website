import {
  Children,
  cloneElement,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import cn from "classnames";
import styles from "./GuidedSteps.module.css";

const GuidedStepTab: React.FC = ({ children }) => {
      const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observerContainerRef = useRef<HTMLDivElement | null>(null);

  // refs for debouncing highlights
  const lastHighlightTime = useRef<number>(0);
  const pendingHighlight = useRef<string | undefined>(undefined);

  const instructionsRef = useRef<HTMLElement[]>([]);
  const stepsRef = useStepsRef();

  useLayoutEffect(() => {
    const instructionsHeight =
      observerContainerRef.current?.getBoundingClientRect().height;
    if (instructionsHeight) {
      observerContainerRef.current.parentElement.style.height = `calc(100vh + ${instructionsHeight}px)`;
    }
    const debounceDelay = 150;

    const debounceHighlightedStep = (step: any) => {
      const now = Date.now();
      pendingHighlight.current = step.id;
      setActiveStepId(step.id);

      if (now - lastHighlightTime.current > debounceDelay) {
        stepsRef.current.get(step.id)?.activate();
        lastHighlightTime.current = now;
        pendingHighlight.current = undefined;
      } else {
        setTimeout(() => {
          if (pendingHighlight.current === step.id) {
            stepsRef.current.get(step.id)?.activate();
            lastHighlightTime.current = Date.now();
            pendingHighlight.current = undefined;
          }
        }, debounceDelay);
      }
    };

    const options = {
      rootMargin: "117px 0px 80% 0px",
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const visibleEntries = entries.filter(
        (entry) => entry.isIntersecting && entry.intersectionRatio > 0.2
      );

      console.log(visibleEntries);

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

    stepsRef.current.get(instructions[0].id)?.activate();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  const highlightStep = (stepId: string) => {
    setActiveStepId(stepId);
    stepsRef.current.forEach((step) => step.deactivate());
    stepsRef.current.get(stepId)?.activate();
  };

  return (
    <>
      <div ref={observerContainerRef} className={styles.instructions}>
        {instructions.map((instruction, index) => (
          <div
            role="button"
            key={instruction.id}
            ref={(el) => (instructionsRef.current[index] = el)}
            id={instruction.id}
            className={cn(styles.instruction, {
              [styles.active]: instruction.id === activeStepId,
            })}
            onClick={() => highlightStep(instruction.id)}
          >
            <h3>{instruction.title}</h3>
            {instruction.description && <p>{instruction.description}</p>}
          </div>
        ))}
      </div>

      {/* Code panel */}
      <div className={styles.codePanel}>{childrenWithRefs}</div>
    </>
  );
};

export default GuidedStepTab;
