import React, { useState, type ReactNode } from "react";
import clsx from "clsx";
import { ThemeClassNames } from "@docusaurus/theme-common";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import Heading from "@theme/Heading";
import MDXContent from "@theme/MDXContent";
import type { Props } from "@theme/DocItem/Content";
import { useDocTemplate } from "@site/src/hooks/useDocTemplate";
import { useLocation } from "@docusaurus/router";
import PageActions from "@site/src/components/PageActions";
import VideoBar, { VideoBarProps } from "@site/src/components/VideoBar";
import ThumbsFeedback from "@site/src/components/ThumbsFeedback";
import ThumbsFeedbackContext from "@site/src/components/ThumbsFeedback/context";
import { FeedbackType } from "@site/src/components/ThumbsFeedback/types";

interface DocFrontMatter {
  videoBanner: VideoBarProps;
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
  const { hideTitleSection } = useDocTemplate();
  const { frontMatter } = useDoc();
  const location = useLocation();
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);

    const { videoBanner } = frontMatter as DocFrontMatter;

  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, "markdown")}>
      <ThumbsFeedbackContext.Provider value={{ feedback, setFeedback }}>
      {syntheticTitle && (
        <header className={hideTitleSection ? "hide-title-section" : undefined}>
          <Heading as="h1" className="docItemTitle">{syntheticTitle}</Heading>
          {frontMatter.description && <p className="docItemDescription">{frontMatter.description}</p>}
          <PageActions pathname={location.pathname} />
          {videoBanner && <VideoBar {...videoBanner} />}
        </header>
      )}
      <MDXContent>{children}</MDXContent>
      <ThumbsFeedback feedbackLabel="Was this page helpful?" pagePosition="bottom" />
      </ThumbsFeedbackContext.Provider>
    </div>
  );
}
