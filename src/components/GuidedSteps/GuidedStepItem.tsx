import { useImperativeHandle, useRef, forwardRef } from "react";
import styles from "./Step.module.css";
import { GuidedStepItemHandle, GuidedStepItemProps } from "./utils";

const GuidedStepItem = forwardRef<GuidedStepItemHandle, GuidedStepItemProps>(({ children }, ref) => {
  const stepRef = useRef<HTMLSpanElement | null>(null);

  useImperativeHandle(ref, () => {
    const current = stepRef.current as HTMLSpanElement;
    return Object.assign(current, {
      activate: () => current?.classList.add(styles.activeLines),
      deactivate: () => current?.classList.remove(styles.activeLines),
    }) as GuidedStepItemHandle;
  });

  return (
    <span className={styles.step} ref={stepRef}>
      {children}
    </span>
  );
});

GuidedStepItem.displayName = "GuidedStepItem";

export default GuidedStepItem;
