import React, { type ReactNode } from "react";
import Layout from "@theme-original/DocRoot/Layout";
import type { WrapperProps } from "@docusaurus/types";
import DocsNavigation from "@site/src/components/DocsNavigation";
import "./styles.module.css";

type Props = WrapperProps<any>;

export default function LayoutWrapper(props: Props): ReactNode {
  return (
    <>
      <DocsNavigation />
      <Layout {...props} />
    </>
  );
}
