import React, { type ReactNode } from "react";
import Details from "@theme-original/MDXComponents/Details";
import type DetailsType from "@theme/MDXComponents/Details";
import type { WrapperProps } from "@docusaurus/types";
import styles from "./Details.module.css";

type Props = WrapperProps<typeof DetailsType>;

export default function DetailsWrapper(props: Props): ReactNode {
  return (
    <>
      <Details {...props} className={styles.details} />
    </>
  );
}
