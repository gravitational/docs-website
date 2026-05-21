import React, { type ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import isInternalUrl from "@docusaurus/isInternalUrl";
import IconExternalLink from "@theme/Icon/ExternalLink";
import type { Props } from "@theme/Footer/LinkItem";
import styles from "../Footer.module.css";

interface LinkItemProps extends Props {
  tag?: string;
}

export default function FooterLinkItem({ item }: LinkItemProps): ReactNode {
  const { to, href, label, prependBaseUrlToHref, tag, className, ...props } =
    item;
  const toUrl = useBaseUrl(to);
  const normalizedHref = useBaseUrl(href, { forcePrependBaseUrl: true });

  return (
    <Link
      className={clsx("footer__link-item", styles.footerLinkItem, className, {
        [styles.footerLinkItemTag]: tag,
      })}
      {...(href
        ? {
            href: prependBaseUrlToHref ? normalizedHref : href,
          }
        : {
            to: toUrl,
          })}
      style={{ "--tag-content": `"${tag}"` } as React.CSSProperties}
      {...props}
    >
      {label}
    </Link>
  );
}
