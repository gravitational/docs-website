import cn from "clsx";
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import Icon from "../Icon";
import YouTubeEmbed from "../YouTubeEmbed";
import styles from "./Checklist.module.css";

type ChecklistItemProps = {
  // Video timestamp in seconds that the item's play button jumps to.
  timestamp?: number;
  children: ReactNode;
};

type ChecklistStepProps = {
  title: string;
  videoId?: string;
  children: ReactNode;
};

type ChecklistProps = {
  // Unique per checklist, used as the localStorage key for saved progress.
  id: string;
  children: ReactNode;
};

type Step = Omit<ChecklistStepProps, "children"> & {
  items: ChecklistItemProps[];
};

// ChecklistStep and ChecklistItem only carry props. Checklist reads them and
// renders the whole list, so all state lives in one place.
export const ChecklistStep: React.FC<ChecklistStepProps> = () => null;
export const ChecklistItem: React.FC<ChecklistItemProps> = () => null;

const getChildProps = <T,>(children: ReactNode): T[] =>
  Children.toArray(children)
    .filter((child): child is ReactElement<T> => isValidElement(child))
    .map((child) => child.props);

const itemKey = (stepIndex: number, itemIndex: number) =>
  `${stepIndex}-${itemIndex}`;

const isStepComplete = (step: Step, stepIndex: number, checked: string[]) =>
  step.items.every((_, itemIndex) =>
    checked.includes(itemKey(stepIndex, itemIndex)),
  );

// Make sure the opened step is a valid index.
const getOpenStep = (steps: Step[], openIndex: number) => {
  if (typeof openIndex === "number" && steps[openIndex]) {
    return openIndex;
  }
  return null;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
};

// Anchor id of a step, e.g. "checklist-single-sign-on".
const getStepId = (title: string) =>
  `checklist-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

const Checklist: React.FC<ChecklistProps> = ({ id, children }) => {
  const storageKey = `checklist:${id}`;
  const baseId = useId();
  const steps: Step[] = getChildProps<ChecklistStepProps>(children).map(
    ({ children, ...step }) => ({
      ...step,
      items: getChildProps<ChecklistItemProps>(children),
    }),
  );

  const [checked, setChecked] = useState<string[]>(() => {
    try {
      const saved: { checked: string[]; open: number } = JSON.parse(
        localStorage.getItem(storageKey) || '{"checked": [], "open": 0}',
      );
      return saved.checked ?? [];
    } catch {
      return [];
    }
  });
  const [initialized, setInitialized] = useState<boolean>(false);
  const [animate, setAnimate] = useState<boolean>(false);
  const [openStep, setOpenStep] = useState<number | null>(() => {
    try {
      const saved: { checked: string[]; open: number } = JSON.parse(
        localStorage.getItem(storageKey) || '{"checked": [], "open": 0}',
      );
      return getOpenStep(steps, saved.open);
    } catch {
      return 0;
    }
  });
  // Steps whose video stays mounted, so it doesn't vanish mid-collapse and
  // thumbnails only load for steps the user has opened.
  const [openedSteps, setOpenedSteps] = useState<number[]>([0]);
  // Latest play button click in the open step. A new object on every click,
  // so the same timestamp can be replayed.
  const [seek, setSeek] = useState<{ time: number }>();

  const getBodyId = (stepIndex: number) => `${baseId}-step-${stepIndex}`;

  const toggleStep = (step: number | null, checkedItems?: string[]) => {
    setOpenStep(step);
    setSeek(undefined);
    if (step !== null && !openedSteps.includes(step)) {
      setOpenedSteps([...openedSteps, step]);
    }
    if (!checkedItems) {
      // Persist the open step in localStorage so it can be restored on page reload.
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ checked: checkedItems || checked, open: step }),
        );
      } catch {}
    }
  };

  useLayoutEffect(() => {
    try {
      let saved: { checked: string[]; open: number } = JSON.parse(
        localStorage.getItem(storageKey) || "{checked:[], open:0}",
      );
      // If the saved data is invalid, reset it to an empty checklist
      // instead of throwing an error and breaking the page.
      if (!saved.checked || !Array.isArray(saved.checked)) {
        saved = { checked: [], open: 0 };
      }
      setChecked(saved.checked);
      toggleStep(getOpenStep(steps, saved.open), saved.checked);
    } catch {}

    setInitialized(true);
  }, [storageKey]);

  // delay the animation until after the first render, so the open
  // step doesn't animate in on a page load
  useEffect(() => {
    if (initialized) setAnimate(true);
  }, [initialized]);

  const toggleItem = (key: string) => {
    const next = checked.includes(key)
      ? checked.filter((k) => k !== key)
      : [...checked, key];
    setChecked(next);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ checked: next, open: openStep }),
      );
    } catch {}
  };

  return (
    <section className={styles.checklist}>
      <ol className={cn(styles.steps, styles.container)}>
        {steps.map((step, stepIndex) => {
          const isOpen = openStep === stepIndex;
          const isComplete = isStepComplete(step, stepIndex, checked);
          const checkedCount = step.items.filter((_, itemIndex) =>
            checked.includes(itemKey(stepIndex, itemIndex)),
          ).length;
          const progress = step.items.length
            ? (checkedCount / step.items.length) * 100
            : 0;
          const bodyId = getBodyId(stepIndex);

          return (
            <li
              key={stepIndex}
              id={getStepId(step.title)}
              className={cn(styles.step, {
                [styles.open]: isOpen,
                [styles.animate]: animate,
              })}
            >
              <button
                type="button"
                className={styles.header}
                aria-expanded={isOpen}
                aria-controls={bodyId}
                onClick={() => toggleStep(isOpen ? null : stepIndex)}
              >
                <span className={styles.headerText}>
                  <span
                    className={cn(styles.title, { [styles.isOpen]: isOpen })}
                  >
                    {stepIndex + 1}. {step.title}
                    <span
                      className={cn(styles.completedMarker, {
                        [styles.completed]: isComplete,
                        [styles.visuallyHidden]: progress === 0,
                      })}
                    >
                      <Icon
                        name="checkWhite"
                        size="sm"
                        className={styles.checkIcon}
                      />
                      {isComplete && (
                        <span className={styles.visuallyHidden}>Completed</span>
                      )}
                    </span>
                  </span>
                </span>
                <span className={styles.chevron}>
                  <Icon name="caretUp" size="sm-md" />
                </span>
              </button>

              <div
                id={bodyId}
                className={cn(styles.body, {
                  [styles.collapsed]: !isOpen,
                  [styles.animate]: animate,
                })}
              >
                <div className={styles.bodyInner}>
                  <div className={styles.bodyContent}>
                    {step.videoId && openedSteps.includes(stepIndex) && (
                      <div className={styles.video}>
                        {/* Remounting on close resets the video to its thumbnail,
                      which stops playback. */}
                        <YouTubeEmbed
                          key={String(isOpen)}
                          videoId={step.videoId}
                          title={step.title}
                          seek={isOpen ? seek : undefined}
                        />
                      </div>
                    )}

                    <div className={styles.progress}>
                      <div
                        className={styles.progressTrack}
                        role="progressbar"
                        aria-label={`${step.title} progress`}
                        aria-valuemin={0}
                        aria-valuemax={step.items.length}
                        aria-valuenow={checkedCount}
                      >
                        <div
                          className={styles.progressFill}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className={styles.progressText}>
                        {checkedCount}/{step.items.length} completed
                      </span>
                    </div>

                    <ul className={styles.items}>
                      {step.items.map((item, itemIndex) => {
                        const key = itemKey(stepIndex, itemIndex);
                        const isChecked = checked.includes(key);
                        const playLabel =
                          item.timestamp !== undefined
                            ? `Play video from ${formatTime(item.timestamp)}`
                            : undefined;

                        return (
                          <li key={key} className={styles.item}>
                            <label className={styles.label}>
                              <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={isChecked}
                                onChange={() => toggleItem(key)}
                              />
                              <span>{item.children}</span>
                            </label>
                            {playLabel && step.videoId && (
                              <button
                                type="button"
                                className={styles.playButton}
                                aria-label={playLabel}
                                onClick={() =>
                                  setSeek({ time: item.timestamp as number })
                                }
                              >
                                <Icon name="play2" size="xs" />
                                {/* Visual only; aria-label already gives screen readers the same text. */}
                                <span
                                  className={styles.tooltip}
                                  aria-hidden="true"
                                >
                                  {playLabel}
                                </span>
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default Checklist;
