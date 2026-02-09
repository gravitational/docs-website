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
import { useDocTemplate } from "@site/src/hooks/useDocTemplate";
import { PositionProvider } from "/src/components/PositionProvider";
import ExclusivityBanner from "@site/src/components/ExclusivityBanner";
import ExclusivityContext from "@site/src/components/ExclusivityBanner/context";
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
  const removed =
    (frontMatter as ExtendedFrontMatter).remove_table_of_contents ||
    removeTOCSidebar;
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

function usePageExclusivityBanner() {
  const { frontMatter } = useDoc();

  const exclusiveFeature = (frontMatter as any).enterprise;

  return { exclusiveFeature };
}

export default function DocItemLayout({ children }: Props): JSX.Element {
  const {
    hideTitleSection,
    removeTOCSidebar,
    fullWidth,
    isLandingPage,
    isRFDPage,
  } = useDocTemplate();
  const docTOC = useDocTOC(removeTOCSidebar);
  const { exclusiveFeature } = usePageExclusivityBanner();
  const {
    metadata: { unlisted },
  } = useDoc();

  // Add template-full-width class to main element when fullWidth template is used
  React.useEffect(() => {
    if (!fullWidth) return;

    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.classList.add("template-full-width");
    }

    return () => {
      const mainElement = document.querySelector("main");
      if (mainElement) {
        mainElement.classList.remove("template-full-width");
      }
    };
  }, [fullWidth]);

  return (
    <ExclusivityContext.Provider value={{ exclusiveFeature }}>
      {exclusiveFeature && !isLandingPage && <ExclusivityBanner />}
      <div className="row">
        <div
          className={clsx(
            "col",
            !docTOC.hidden && !docTOC.removed && styles.docItemCol,
            fullWidth && styles.largeColumnPadding,
          )}
        >
          {unlisted && <Unlisted />}
          <DocVersionBanner />
          <div className={styles.docItemContainer}>
            <article className={styles.alternateBreadcrumbs}>
              {!hideTitleSection && <DocBreadcrumbs />}
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
        {!docTOC.removed && !isRFDPage && (
          <div className="col col--3">
            <div className={styles.stickySidebar}>
              <div className={styles.tocWithFeedback}>
                <div className={styles.tocWrapper}>{docTOC.desktop}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ExclusivityContext.Provider>
  );
}
