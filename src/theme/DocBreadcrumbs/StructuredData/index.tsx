import React, { type ReactNode } from "react";
import StructuredData from "@theme-original/DocBreadcrumbs/StructuredData";
import type StructuredDataType from "@theme/DocBreadcrumbs/StructuredData";
import type { WrapperProps } from "@docusaurus/types";
import useBaseUrl from "@docusaurus/useBaseUrl";

type Props = WrapperProps<typeof StructuredDataType>;

export default function StructuredDataWrapper(props: Props): ReactNode {
  const docsRoot = useBaseUrl("/");

  let breadcrumbs = props.breadcrumbs;

  // Landing pages do not have an item pointing to /docs by default.
  if (!breadcrumbs.some((item: any) => item.href === docsRoot)) {
    breadcrumbs = [{ label: "Documentation", href: docsRoot }, ...breadcrumbs];
  } else {
    // rename's "Introduction" to "Documentation" in the BreadcrumbList.
    breadcrumbs[0] = { ...breadcrumbs[0], label: "Documentation" };
  }

  // Add the top-level path (goteleport.com/). as the first item of the
  // BreadcrumbList
  breadcrumbs = [{ label: "Home", href: "/" }, ...breadcrumbs];

  return (
    <>
      <StructuredData {...props} breadcrumbs={breadcrumbs} />
    </>
  );
}
