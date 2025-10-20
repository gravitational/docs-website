import React, { type ReactNode } from "react";
import Layout from "@theme-original/DocRoot/Layout";
import type { WrapperProps } from "@docusaurus/types";
import DocsNavigation from "@site/src/components/DocsNavigation";

type Props = WrapperProps<any>;

export default function LayoutWrapper(props: Props): ReactNode {
  return (
    <>
      <DocsNavigation
        items={[
          {
            label: "Get Started",
            href: "/get-started/",
          },
          {
            label: "Zero Trust Access",
            href: "/zero-trust-access/",
          },
          {
            label: "Machine & Workload Identity",
            href: "/machine-workload-identity/",
          },
          {
            label: "Identity Governance",
            href: "/identity-governance/",
          },
          {
            label: "Identity Security",
            href: "/identity-security/",
          },
          "split",
          {
            label: "References",
            href: "/reference/",
          },
          {
            label: "Help & Support",
            items: [
              {
                label: "FAQ",
                href: "/faq/",
              },
              {
                label: "Changelog",
                href: "/changelog/",
              },
              {
                label: "Upcoming Releases",
                href: "/upcoming-releases/",
              },
            ],
          },
        ]}
      />
      <Layout {...props} />
    </>
  );
}
