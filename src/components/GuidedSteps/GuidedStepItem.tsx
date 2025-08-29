import { useImperativeHandle, useRef, forwardRef } from "react";
import styles from "./GuidedStepItem.module.css";
import { GuidedStepItemHandle, GuidedStepItemProps } from "./utils";

const GuidedStepItem = forwardRef<
  GuidedStepItemHandle,
  Pick<GuidedStepItemProps, "children">
>(({ children }, ref) => {
  const stepRef = useRef<HTMLSpanElement | null>(null);

  useImperativeHandle(
    ref,
    (): GuidedStepItemHandle => ({
      activate: (): void => stepRef.current?.classList.add(styles.activeLines),
      deactivate: (): void => stepRef.current?.classList.remove(styles.activeLines),
    })
  );

  return (
    <span className={styles.step} ref={stepRef}>
      {children}
    </span>
  );
});

GuidedStepItem.displayName = "GuidedStepItem";

export default GuidedStepItem;
