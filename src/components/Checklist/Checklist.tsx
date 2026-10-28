import cn from "clsx";
import {
  Children,
  isValidElement,
  useEffect,
  useId,
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
  description?: string;
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

// Opens the step after the last completed one. If the last step is the one
// completed, opens the first incomplete step instead, or none if all are done.
const getOpenStep = (steps: Step[], checked: string[]) => {
  const lastCompleted = steps.reduce(
    (last, step, i) => (isStepComplete(step, i, checked) ? i : last),
    -1,
  );
  if (lastCompleted + 1 < steps.length) return lastCompleted + 1;
  const firstIncomplete = steps.findIndex(
    (step, i) => !isStepComplete(step, i, checked),
  );
  return firstIncomplete === -1 ? null : firstIncomplete;
};

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const padCount = (count: number) => String(count).padStart(2, "0");

const Checklist: React.FC<ChecklistProps> = ({ id, children }) => {
  const storageKey = `checklist:${id}`;
  const baseId = useId();
  const steps: Step[] = getChildProps<ChecklistStepProps>(children).map(
    ({ children, ...step }) => ({
      ...step,
      items: getChildProps<ChecklistItemProps>(children),
    }),
  );

  const [checked, setChecked] = useState<string[]>([]);
  const [openStep, setOpenStep] = useState<number | null>(0);
  // Steps whose video stays mounted, so it doesn't vanish mid-collapse and
  // thumbnails only load for steps the user has opened.
  const [openedSteps, setOpenedSteps] = useState<number[]>([0]);
  // Latest play button click in the open step. A new object on every click,
  // so the same timestamp can be replayed.
  const [seek, setSeek] = useState<{ time: number }>();

  const toggleStep = (step: number | null) => {
    setOpenStep(step);
    setSeek(undefined);
    if (step !== null && !openedSteps.includes(step)) {
      setOpenedSteps([...openedSteps, step]);
    }
  };

  useEffect(() => {
    try {
      const saved: string[] = JSON.parse(
        localStorage.getItem(storageKey) || "[]",
      );
      setChecked(saved);
      toggleStep(getOpenStep(steps, saved));
    } catch {
      // Ignore unavailable or malformed storage and keep the defaults.
    }
    // Only restore progress on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const toggleItem = (key: string) => {
    const next = checked.includes(key)
      ? checked.filter((k) => k !== key)
      : [...checked, key];
    setChecked(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Progress just won't persist.
    }
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
          const bodyId = `${baseId}-step-${stepIndex}`;

          return (
            <li
              key={stepIndex}
              className={cn(styles.step, { [styles.open]: isOpen })}
            >
              <button
                type="button"
                className={styles.header}
                aria-expanded={isOpen}
                aria-controls={bodyId}
                onClick={() => toggleStep(isOpen ? null : stepIndex)}
              >
                <span className={styles.headerText}>
                  <span className={styles.title}>
                    {stepIndex + 1}. {step.title}
                    {isComplete && (
                      <span className={styles.completedIcon}>
                        <Icon name="checkCircle" size="md" />
                        <span className={styles.visuallyHidden}>Completed</span>
                      </span>
                    )}
                  </span>
                  {step.description && (
                    <span className={styles.description}>
                      {step.description}
                    </span>
                  )}
                </span>
                <span className={styles.chevron}>
                  <Icon name="caretUp" size="sm-md" />
                </span>
              </button>

              <div
                id={bodyId}
                className={cn(styles.body, { [styles.collapsed]: !isOpen })}
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
                        {padCount(checkedCount)}/{padCount(step.items.length)}{" "}
                        completed
                      </span>
                    </div>

                    <ul className={styles.items}>
                      {step.items.map((item, itemIndex) => {
                        const key = itemKey(stepIndex, itemIndex);
                        const isChecked = checked.includes(key);

                        return (
                          <li
                            key={key}
                            className={cn(styles.item, {
                              [styles.checked]: isChecked,
                            })}
                          >
                            <label className={styles.label}>
                              <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={isChecked}
                                onChange={() => toggleItem(key)}
                              />
                              <span>{item.children}</span>
                            </label>
                            {item.timestamp !== undefined && step.videoId && (
                              <button
                                type="button"
                                className={styles.playButton}
                                aria-label={`Play video from ${formatTime(item.timestamp)}`}
                                onClick={() =>
                                  setSeek({ time: item.timestamp as number })
                                }
                              >
                                <Icon name="play2" size="xs" />
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
