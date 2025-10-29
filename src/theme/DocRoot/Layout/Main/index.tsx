// Manually swizzled to allow theming
// See https://docusaurus.io/docs/swizzling
// This is wrapped, not ejected
import React, { useEffect, type ReactNode } from "react";
import Main from "@theme-original/DocRoot/Layout/Main";
import type MainType from "@theme/DocRoot/Layout/Main";
import type { WrapperProps } from "@docusaurus/types";
import "./styles.module.css";
import { trackEvent } from "@site/src/utils/analytics";

type Props = WrapperProps<typeof MainType>;

export default function MainWrapper(props: Props): ReactNode {
  useEffect(() => {
    const inkeepLinkTracker = (clickEvent: MouseEvent) => {
      clickEvent.stopPropagation();

      const path = clickEvent.composedPath();

      if (!path) return;

      const link = path.find((el) => el instanceof HTMLAnchorElement) as
        | HTMLAnchorElement
        | undefined;

      const navbar = path.find(
        (el) =>
          el instanceof HTMLElement &&
          el.classList?.contains("theme-layout-navbar")
      ) as HTMLElement | undefined;

      const sidebar = path.find(
        (el) =>
          el instanceof HTMLElement &&
          el.classList?.contains("theme-doc-sidebar-menu")
      ) as HTMLElement | undefined;

      const mainContent = path.find(
        (el) =>
          el instanceof HTMLElement &&
          el.classList?.contains("theme-doc-markdown")
      ) as HTMLElement | undefined;

      const breadcumbs = path.find(
        (el) =>
          el instanceof HTMLElement &&
          el.classList?.contains("theme-doc-breadcrumbs")
      ) as HTMLElement | undefined;

      if (link && navbar) {
        trackEvent({
          event_name: "navbar_link_click",
          custom_parameters: {
            url: link.href,
          },
        });
      }

      if (link && sidebar) {
        trackEvent({
          event_name: "sidebar_link_click",
          custom_parameters: {
            url: link.href,
          },
        });
      }

      if (link && mainContent) {
        trackEvent({
          event_name: "active_page_link_click",
          custom_parameters: {
            url: link.href,
          },
        });
      }

      if (link && breadcumbs) {
        trackEvent({
          event_name: "breadcrumbs_link_click",
          custom_parameters: {
            url: link.href,
          },
        });
      }
    };

    window.addEventListener("click", inkeepLinkTracker);

    return () => window.removeEventListener("click", inkeepLinkTracker);
  }, []);

  return (
    <>
      <Main {...props} />
    </>
  );
}
