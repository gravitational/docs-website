import React, { type ReactNode } from "react";
import Link from "@theme-original/DocSidebarItem/Link";
import type LinkType from "@theme/DocSidebarItem/Link";
import type { WrapperProps } from "@docusaurus/types";
import styles from "./tag.module.css";

type Props = WrapperProps<typeof LinkType>;

export default function LinkWrapper(props: Props): ReactNode {
  const tag = props.item?.customProps?.tag as string | undefined;

  if (tag) {
    return (
      <div
        className={styles.tag}
        style={{ "--tag-content": `"${tag}"` } as React.CSSProperties}
      >
        <Link {...props} />
      </div>
    );
  }

  return (
    <>
      <Link {...props} />
    </>
  );
}
