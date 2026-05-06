import { useDoc } from "@docusaurus/plugin-content-docs/client";
import { ThemeClassNames } from "@docusaurus/theme-common";
import { useLocation } from "@docusaurus/router";
import PageActions from "@site/src/components/PageActions";
import ThumbsFeedback from "@site/src/components/ThumbsFeedback";
import VideoBar, { VideoBarProps } from "@site/src/components/VideoBar";
import { useDocTemplate } from "@site/src/hooks/useDocTemplate";
import type { Props } from "@theme/DocItem/Content";
import Heading from "@theme/Heading";
import MDXContent from "@theme/MDXContent";
import clsx from "clsx";
import { JSX, type ReactNode } from "react";

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
export function useSyntheticTitle(): string | null {
  const { metadata, frontMatter, contentTitle } = useDoc();
  const shouldRender =
    !frontMatter.hide_title && typeof contentTitle === "undefined";
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}

export function DocHeader({ className }: { className?: string }): JSX.Element {
  const syntheticTitle = useSyntheticTitle();
  const { hideTitleSection, showDescription } = useDocTemplate();
  const { frontMatter } = useDoc();
  const { pathname } = useLocation();

  const { videoBanner } = frontMatter as DocFrontMatter;

  return (
    <header
      className={clsx({"hide-title-section": hideTitleSection}, className)}
    >
      <Heading as="h1" className="docItemTitle">
        {syntheticTitle}
      </Heading>
      {frontMatter.description && showDescription && (
        <p className="docItemDescription">{frontMatter.description}</p>
      )}
      <PageActions pathname={pathname} />
      {videoBanner && <VideoBar {...videoBanner} />}
    </header>
  )
}
  

export default function DocItemContent({ children }: Props): ReactNode {
  const syntheticTitle = useSyntheticTitle();
  const { hideTitleSection, faqSections } = useDocTemplate();

  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, "markdown")}>
        {syntheticTitle && !faqSections && <DocHeader />}
        <MDXContent>{children}</MDXContent>
        {syntheticTitle && !hideTitleSection && (
          <ThumbsFeedback
            feedbackLabel="Was this page helpful?"
            pagePosition="bottom"
          />
        )}
    </div>
  );
}
