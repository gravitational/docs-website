import React, { type ReactNode } from "react";
import DocSidebarNavbarItem from "@theme-original/NavbarItem/DocSidebarNavbarItem";
import type DocSidebarNavbarItemType from "@theme/NavbarItem/DocSidebarNavbarItem";
import type { WrapperProps } from "@docusaurus/types";
import styles from "../DocSidebarItem/Link/tag.module.css";
import { getVersionedUrl } from "@site/utils/general";

type Props = WrapperProps<typeof DocSidebarNavbarItemType>;

export default function DocSidebarNavbarItemWrapper(props: Props): ReactNode {
  const tag = props?.customProps?.tag as string | undefined;

  // --- hack to fix issue where items in the mobile sidebar root don't link to the correct versioned url ---
  let versionedUrl = props.href;
  const versionMatch = location.pathname.match(/\/ver\/([^/]+)/);
  if (versionMatch) {
    versionedUrl = getVersionedUrl(
      {
        version: versionMatch[1],
        isLast: false,
        label: versionMatch[1],
      } as any,
      props.href,
    );
  }
  // --- end fix ---

  if (tag) {
    return (
      <div
        className={styles.tag}
        style={{ "--tag-content": `"${tag}"` } as React.CSSProperties}
      >
        <DocSidebarNavbarItem {...props} href={versionedUrl} />
      </div>
    );
  }

  return (
    <>
      <DocSidebarNavbarItem {...props} href={versionedUrl} />
    </>
  );
}
