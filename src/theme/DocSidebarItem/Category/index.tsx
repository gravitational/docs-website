import React, { type ReactNode } from "react";
import Category from "@theme-original/DocSidebarItem/Category";
import type CategoryType from "@theme/DocSidebarItem/Category";
import type { WrapperProps } from "@docusaurus/types";
import styles from "../Link/tag.module.css";

type Props = WrapperProps<typeof CategoryType>;

export default function CategoryWrapper(props: Props): ReactNode {
  const tag = props.item?.customProps?.tag as string | undefined;

  if (tag) {
    return (
      <div
        className={styles.tag}
        style={{ "--tag-content": `"${tag}"` } as React.CSSProperties}
      >
        <Category {...props} />
      </div>
    );
  }

  return (
    <>
      <Category {...props} />
    </>
  );
}
