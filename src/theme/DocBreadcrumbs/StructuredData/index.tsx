import Head from "@docusaurus/Head";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import type { ReactNode } from "react";
import {
  type BreadcrumbInput,
  buildBreadcrumbListNode,
  serializeJsonLd,
  toJsonLdDocument,
} from "@site/src/utils/structuredData";

interface Props {
  readonly breadcrumbs: BreadcrumbInput[];
}

export default function DocBreadcrumbsStructuredData({
  breadcrumbs,
}: Props): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const structuredData = toJsonLdDocument([
    buildBreadcrumbListNode({
      siteUrl: siteConfig.url,
      rootUrl: `${siteConfig.url}${siteConfig.baseUrl}`,
      breadcrumbs,
      trailingSlash: siteConfig.trailingSlash,
    }),
  ]);

  return (
    <Head>
      <script type="application/ld+json">
        {serializeJsonLd(structuredData)}
      </script>
    </Head>
  );
}
