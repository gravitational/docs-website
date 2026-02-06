import Link from "@docusaurus/Link";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import { useLocation } from "@docusaurus/router";
import { ThemeClassNames } from "@docusaurus/theme-common";
import Icon from "@site/src/components/Icon/Icon";
import PageActions from "@site/src/components/PageActions";
import ThumbsFeedback from "@site/src/components/ThumbsFeedback";
import ThumbsFeedbackContext from "@site/src/components/ThumbsFeedback/context";
import { FeedbackType } from "@site/src/components/ThumbsFeedback/types";
import VideoBar, { VideoBarProps } from "@site/src/components/VideoBar";
import { useDocTemplate } from "@site/src/hooks/useDocTemplate";
import type { Props } from "@theme/DocItem/Content";
import Heading from "@theme/Heading";
import MDXContent from "@theme/MDXContent";
import clsx from "clsx";
import { useState, type ReactNode } from "react";
import styles from "./styles.module.css"

interface DocFrontMatter {
  videoBanner: VideoBarProps;
  rfdUrl?: string;
}

/**
 Title can be declared inside md content or declared through
 front matter and added manually. To make both cases consistent,
 the added title is added under the same div.markdown block
 See https://github.com/facebook/docusaurus/pull/4882#issuecomment-853021120

 We render a "synthetic title" if:
 - user doesn't ask to hide it with front matter
 - the markdown content does not already contain a top-level h1 heading
*/
function useSyntheticTitle(): string | null {
  const { metadata, frontMatter, contentTitle } = useDoc();
  const shouldRender =
    !frontMatter.hide_title && typeof contentTitle === "undefined";
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}
  

export default function DocItemContent({ children }: Props): ReactNode {
  const syntheticTitle = useSyntheticTitle();
  const { hideTitleSection, showDescription, isRFDPage } = useDocTemplate();
  const { frontMatter } = useDoc();
  const location = useLocation();
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const { videoBanner, rfdUrl } = frontMatter as DocFrontMatter;

  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, "markdown")}>
      <ThumbsFeedbackContext.Provider
        value={{ feedback, isSubmitted, setFeedback, setIsSubmitted }}
      >
        {syntheticTitle && (
          <header
            className={hideTitleSection ? "hide-title-section" : undefined}
          >
            <Heading as="h1" className="docItemTitle">
              {syntheticTitle}
              {isRFDPage && < span className={styles.rfdBadge}>RFD Driven</span>}
            </Heading>
            {frontMatter.description && showDescription && (
              <p className="docItemDescription">{frontMatter.description}</p>
            )}
            <PageActions pathname={location.pathname} />
            {videoBanner && <VideoBar {...videoBanner} />}
          </header>
        )}
        <div className="row">
          {isRFDPage && (
            <div className={clsx(styles.rfdBanner)}>
              <div className={styles.content}>
                <div className={styles.iconWrapper}>
                  <Icon name="info" size="md"/>
                </div> 
                  This page is RFD-driven. See the RFD for full context and rationale.
              </div>
              <Link href={rfdUrl}>
                <span>View RFD</span>
              </Link>
            </div>
          )}
          <div className="col">
            <MDXContent>{children}</MDXContent>
          </div>
          {isRFDPage && (
            <div
              id="annotations"
              className={clsx(styles.annotations, "col", "col--4")}
            />
          )}
        </div>
        {syntheticTitle && !hideTitleSection && (
          <ThumbsFeedback
            feedbackLabel="Was this page helpful?"
            pagePosition="bottom"
          />
        )}
      </ThumbsFeedbackContext.Provider>
    </div>
  );
}
