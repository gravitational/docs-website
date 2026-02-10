import React, { type ReactNode } from "react";
import Details from "@theme-original/MDXComponents/Details";
import type DetailsType from "@theme/MDXComponents/Details";
import type { WrapperProps } from "@docusaurus/types";
import cn from "classnames";
import styles from "./Details.module.css";

type Props = WrapperProps<typeof DetailsType>;

export default function DetailsWrapper(props: Props): ReactNode {
  return (
    <>
      <Details
        {...props}
        className={cn(styles.details, { [styles.neutral]: !!props?.neutral })}
      />
    </>
  );
}
