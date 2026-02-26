import React, { type ReactNode, useRef, useCallback, useEffect } from "react";
import clsx from "clsx";
import type { Props } from "@theme/Details";
import { prefersReducedMotion } from "@docusaurus/theme-common";

import styles from "./styles.module.css";

const InfimaClasses = "alert alert--info";

// https://github.com/facebook/docusaurus/blob/d5509e329d090ca3ab1da94d41834ddd51f11937/packages/docusaurus-theme-common/src/components/Collapsible/index.tsx#L74-L82
function getAutoHeightDuration(height: number) {
  if (prefersReducedMotion()) {
    return 1;
  }
  const constant = height / 36;
  return Math.round((4 + 15 * constant ** 0.25 + constant / 5) * 10);
}

export default function Details({ summary, ...props }: Props): ReactNode {
  const summaryElement = React.isValidElement(summary) ? (
    summary
  ) : (
    <summary>{summary ?? "Details"}</summary>
  );

  const detailsRef = useRef<HTMLDetailsElement>(null);

  const applyTransitionVars = useCallback((el: HTMLDetailsElement) => {
    let contentHeight = 0;
    for (const child of Array.from(el.children)) {
      if ((child as HTMLElement).tagName.toLowerCase() !== "summary") {
        contentHeight += (child as HTMLElement).scrollHeight;
      }
    }
    const durationMs = getAutoHeightDuration(contentHeight);
    const durationS = durationMs / 1000;
    const delayS = Math.max(0, (durationMs - 20) / 1000);
    el.style.setProperty("--details-transition-duration", `${durationS}s`);
    el.style.setProperty("--details-transition-delay", `${delayS}s`);
  }, []);

  // Apply the variables on mount so that elements with `open` by default are covered.
  useEffect(() => {
    if (detailsRef.current) {
      applyTransitionVars(detailsRef.current);
    }
  }, [applyTransitionVars]);

  const handleToggle = useCallback(
    (e: React.SyntheticEvent<HTMLDetailsElement>) => {
      applyTransitionVars(e.currentTarget);
    },
    [applyTransitionVars],
  );

  return (
    <details
      {...props}
      ref={detailsRef}
      onToggle={handleToggle}
      className={clsx(styles.details, InfimaClasses, props.className)}
    >
      {summaryElement}
      {props.children}
    </details>
  );
}
