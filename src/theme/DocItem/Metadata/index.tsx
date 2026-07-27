import Head from "@docusaurus/Head";
import { useLocation } from "@docusaurus/router";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { markdownAlternatePath } from "@site/src/utils/markdown";
import Metadata from "@theme-original/DocItem/Metadata";
import type { ReactNode } from "react";

/**
 * Wraps the default DocItem metadata to advertise the generated Markdown
 * variant of each docs page. Every docs page has a corresponding .md file
 * produced by the llms-txt plugin, so the tag renders on all doc routes
 * (and only on doc routes). The href is relative so it resolves against
 * whichever host serves the page (production, preview, or local).
 */
export default function MetadataWrapper(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const { pathname } = useLocation();

  return (
    <>
      <Metadata />
      <Head>
        <link
          rel="alternate"
          type="text/markdown"
          href={markdownAlternatePath(pathname, siteConfig.baseUrl)}
        />
      </Head>
    </>
  );
}
