import React, { JSX, useRef, useState } from "react";
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
import type { Props } from "@theme/DocItem/Layout";
import { useDocTemplate } from "@site/src/hooks/useDocTemplate";
import { PositionProvider } from "/src/components/PositionProvider";
import ExclusivityBanner from "@site/src/components/ExclusivityBanner";
import ExclusivityContext from "@site/src/components/ExclusivityBanner/context";
import FAQSectionsContext, {
  type FAQSection,
} from "@site/src/components/FAQSection/FAQSectionsContext";
import {
  FAQSidebar,
  FAQSearch,
  FAQContentFilter,
} from "@site/src/components/FAQSection";
import styles from "./styles.module.css";
import { DocHeader, useSyntheticTitle } from "../Content";
import ThumbsFeedbackContext from "@site/src/components/ThumbsFeedback/context";
import { FeedbackType } from "@site/src/components/ThumbsFeedback/types";
import Icon from "@site/src/components/Icon";

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
    faqSections,
  } = useDocTemplate();
  const docTOC = useDocTOC(removeTOCSidebar);
  const syntheticTitle = useSyntheticTitle();
  const { exclusiveFeature } = usePageExclusivityBanner();
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const {
    metadata: { unlisted },
  } = useDoc();

  const faqSectionsRef = useRef<FAQSection[]>([]);
  faqSectionsRef.current = [];
  const [faqQuery, setFaqQuery] = useState("");
  const [hiddenSectionIds, setHiddenSectionIds] = useState<Set<string>>(
    new Set(),
  );
  const [faqMatchCount, setFaqMatchCount] = useState(0);

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
          {fullWidth && (
            <span className="template-full-width" hidden aria-hidden="true" />
          )}
          {unlisted && <Unlisted />}
          <DocVersionBanner />
          <ThumbsFeedbackContext.Provider
            value={{ feedback, isSubmitted, setFeedback, setIsSubmitted }}
          >
            {/* Alternative position for breadcrumbs and DocHeader on a FAQ template page */}
            {syntheticTitle && faqSections && (
              <div className={styles.alternateBreadcrumbs}>
                {!hideTitleSection && faqSections && <DocBreadcrumbs />}
                <DocHeader className={styles.faqHeader} />
              </div>
            )}
            <div
              className={clsx(styles.docItemContainer, {
                [styles.faqLayout]: faqSections,
              })}
            >
              <FAQSectionsContext.Provider
                value={{
                  registerSection: (s) => faqSectionsRef.current.push(s),
                  searchQuery: faqQuery,
                  setSearchQuery: setFaqQuery,
                  hiddenSectionIds,
                  setHiddenSectionIds,
                  matchCount: faqMatchCount,
                  setMatchCount: setFaqMatchCount,
                }}
              >
                {faqSections && <FAQSearch />}
                <div className={clsx({ [styles.faqContent]: faqSections })}>
                  <article
                    className={clsx({
                      [styles.alternateBreadcrumbs]: !faqSections,
                    })}
                  >
                    {!hideTitleSection && !faqSections && <DocBreadcrumbs />}
                    <div className={styles.sidebar}>
                      <DocVersionBadge />
                    </div>
                    {docTOC.mobile}
                    {faqSections ? (
                      <FAQContentFilter>
                        <DocItemContent>
                          {faqSections && faqQuery && (
                            <div className={styles.faqResultsHeader}>
                              <p className={styles.faqResultsTitle}>
                                Search results for &ldquo;{faqQuery}&rdquo;
                              </p>
                              {faqMatchCount > 0 ? (
                                <p className={styles.faqResultsCount}>
                                  {faqMatchCount}{" "}
                                  {faqMatchCount === 1 ? "result" : "results"}{" "}
                                  found
                                </p>
                              ) : (
                                <div className={styles.faqResultsEmpty}>
                                  <div className={styles.faqResultsIcon}>
                                    <Icon name="magnifyEllipsis" size="xl" />
                                  </div>
                                  <p>No results found</p>
                                  <p>
                                    Update your query, or browse a category that
                                    might cover this topic
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          <PositionProvider>{children}</PositionProvider>
                        </DocItemContent>
                      </FAQContentFilter>
                    ) : (
                      <DocItemContent>
                        <PositionProvider>{children}</PositionProvider>
                      </DocItemContent>
                    )}
                    <DocItemFooter />
                  </article>
                  <DocItemPaginator />
                </div>
                {faqSections && (
                  <div className={styles.faqSidebar}>
                    <FAQSidebar
                      sections={faqSectionsRef.current}
                      hiddenSectionIds={hiddenSectionIds}
                    />
                  </div>
                )}
              </FAQSectionsContext.Provider>
            </div>
          </ThumbsFeedbackContext.Provider>
        </div>
        {!docTOC.removed && (
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
