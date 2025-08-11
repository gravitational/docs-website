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
import ThumbsFeedback from '@site/src/components/ThumbsFeedback';
import { useDocTemplate } from '@site/src/hooks/useDocTemplate';
import { PositionProvider } from "/src/components/PositionProvider";

import styles from "./styles.module.css";

interface ExtendedFrontMatter {
  remove_table_of_contents?: boolean;
}

/**
 * Decide if the toc should be rendered, on mobile or desktop viewports
 */
function useDocTOC(removeTOCSidebar: boolean) {
  const { frontMatter, toc } = useDoc();
  const windowSize = useWindowSize();

  const hidden = frontMatter.hide_table_of_contents;
  const removed = (frontMatter as ExtendedFrontMatter).remove_table_of_contents || removeTOCSidebar;
  const canRender = !hidden && !removed && toc.length > 0;

  const mobile = canRender ? <DocItemTOCMobile /> : undefined;

  const desktop =
    canRender && (windowSize === "desktop" || windowSize === "ssr") ? (
      <DocItemTOCDesktop />
    ) : undefined;

  return {
    hidden,
    removed,
    mobile,
    desktop,
  };
}

export default function DocItemLayout({ children }: Props): JSX.Element {
  const { hideTitleSection, removeTOCSidebar, fullWidth } = useDocTemplate();
  const docTOC = useDocTOC(removeTOCSidebar);
  const {
    metadata: { unlisted },
  } = useDoc();

  // Add template-full-width class to aside and main elements when fullWidth template is used
  React.useEffect(() => {
    if (!fullWidth) return;
    
    const mainElement = document.querySelector('main');
    const asideElement = document.querySelector('aside');
    const docsNavigationElement = document.getElementById('docs-navigation');
    if (mainElement) {
      mainElement.classList.add('template-full-width');
    }

    if (asideElement) {
      asideElement.classList.add('template-full-width');
    }

    if (docsNavigationElement) {
      docsNavigationElement.classList.add('template-full-width');
    }
    
    return () => {
      const mainElement = document.querySelector('main');
      const asideElement = document.querySelector('aside');
      const docsNavigationElement = document.getElementById('docs-navigation');
      if (mainElement) {
        mainElement.classList.remove('template-full-width');
      }
      if (asideElement) {
        asideElement.classList.remove('template-full-width');
      }
      if (docsNavigationElement) {
        docsNavigationElement.classList.remove('template-full-width');
      }
    };
  }, [fullWidth]);

  return (
    <div className="row">
      <div
        className={clsx(
          "col",
          !docTOC.hidden && !docTOC.removed && styles.docItemCol,
        )}
      >
        {unlisted && <Unlisted />}
        <DocVersionBanner />
        <div className={styles.docItemContainer}>
          <article>
            {!hideTitleSection && <DocBreadcrumbs />}
            {
              !fullWidth && 
              <div className={styles.sidebar}>
                <DocVersionBadge />
                <NavbarMobileSidebarToggle />
              </div>
            }
            {docTOC.mobile}
            <DocItemContent>
              <PositionProvider>{children}</PositionProvider>
            </DocItemContent>
            <DocItemFooter />
          </article>
          {!fullWidth && <DocItemPaginator />}
        </div>
      </div>
      {!docTOC.removed && (
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
      )}
    </div>
  );
}
