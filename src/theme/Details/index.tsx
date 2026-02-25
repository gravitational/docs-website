import React, { type ReactNode } from "react";
import clsx from "clsx";
import type { Props } from "@theme/Details";

import styles from "./styles.module.css";

const InfimaClasses = "alert alert--info";

export default function Details({ summary, ...props }: Props): ReactNode {
  const summaryElement = React.isValidElement(summary) ? (
    summary
  ) : (
    <summary>{summary ?? "Details"}</summary>
  );

  return (
    <details
      {...props}
      className={clsx(styles.details, InfimaClasses, props.className)}
    >
      {summaryElement}
      {props.children}
    </details>
  );
}
