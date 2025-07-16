import React from "react";
import clsx from "clsx";
import { useWindowSize } from "@docusaurus/theme-common";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import DocItemPaginator from "@theme/DocItem/Paginator";
import DocVersionBanner from "@theme/DocVersionBanner";
import DocVersionBadge from "@theme/DocVersionBadge";
import DocItemFooter from "@theme/DocItem/Footer";
import DocItemTOCMobile from "@theme/DocItem/TOC/Mobile";
import DocItemTOCDesktop from "@theme/DocItem/TOC/Desktop";
import DocItemContent from "@theme/DocItem/Content";
import DocBreadcrumbs from "@theme/DocBreadcrumbs";
import Unlisted from "@theme/ContentVisibility/Unlisted";
import NavbarMobileSidebarToggle from "@theme/Navbar/MobileSidebar/Toggle";
import type { Props } from "@theme/DocItem/Layout";
import ThumbsFeedback from "@site/src/components/ThumbsFeedback";
import { PositionProvider } from "/src/components/PositionProvider";

import styles from "./styles.module.css";

/**
 * Decide if the toc should be rendered, on mobile or desktop viewports
 */
function useDocTOC() {
  const { frontMatter, toc } = useDoc();
  const windowSize = useWindowSize();

  const hidden = frontMatter.hide_table_of_contents;
  const canRender = !hidden && toc.length > 0;

  const mobile = canRender ? <DocItemTOCMobile /> : undefined;

  const desktop =
    canRender && (windowSize === "desktop" || windowSize === "ssr") ? (
      <DocItemTOCDesktop />
    ) : undefined;

  return {
    hidden,
    mobile,
    desktop,
  };
}

export default function DocItemLayout({ children }: Props): JSX.Element {
  const docTOC = useDocTOC();
  const {
    metadata: { unlisted },
  } = useDoc();
  return (
    <div className="row">
      <div className={clsx("col", !docTOC.hidden && styles.docItemCol)}>
        {unlisted && <Unlisted />}
        <DocVersionBanner />
        <div className={styles.docItemContainer}>
          <article>
            <DocBreadcrumbs />
            <div className={styles.sidebar}>
              <DocVersionBadge />
              <NavbarMobileSidebarToggle />
            </div>
            {docTOC.mobile}
            <DocItemContent>
              <PositionProvider>{children}</PositionProvider>
            </DocItemContent>
            <DocItemFooter />
          </article>
          <DocItemPaginator />
        </div>
      </div>
      <div className="col col--3">
        <div className={styles.stickySidebar}>
          <div className={styles.tocWithFeedback}>
            <div className={styles.tocWrapper}>{docTOC.desktop}</div>
            <div className={styles.feedbackWrapper}>
              <ThumbsFeedback />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
