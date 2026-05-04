import React, { type ReactNode } from "react";
import Layout from "@theme-original/DocRoot/Layout";
import type { WrapperProps } from "@docusaurus/types";
import DocsNavigation from "@site/src/components/DocsNavigation";
import type { DocsNavigationItem } from "@site/src/components/DocsNavigation/DocsNavigation";
import docsNavItems from "@site/data/docs-navigation.json";

type Props = WrapperProps<any>;

export default function LayoutWrapper(props: Props): ReactNode {
  return (
    <>
      <DocsNavigation
        items={docsNavItems as Array<DocsNavigationItem | "split">}
      />
      <Layout {...props} />
    </>
  );
}
