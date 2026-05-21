import React, { type ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import { ThemeClassNames } from "@docusaurus/theme-common";
import type { Props } from "@theme/Footer/Layout";
import styles from "../Footer.module.css";
import Button from "@site/src/components/Button/Button";

export default function FooterLayout({
  style,
  links,
  logo,
  copyright,
}: Props): ReactNode {
  return (
    <footer
      className={clsx(
        ThemeClassNames.layout.footer.container,
        styles.footer,
        "footer",
        {
          "footer--dark": style === "dark",
        },
      )}
    >
      <div className={styles.footerLayout}>
        <div className={styles.footerCta}>
          <div>
            <h2 className={styles.footerCtaTitle}>
              Stop wrangling SSH keys, VPNs, and bastion hosts.
            </h2>
            <p>
              Deploy a Teleport cluster, connect your servers, Kubernetes
              clusters, databases, and apps, and replace long-lived secrets with
              cryptographic identity and just-in-time access — all managed as
              code.
            </p>
          </div>
          <form className={styles.footerCtaForm}>
            <input type="email" placeholder="Work email" />
            <Button
              as="button"
              type="submit"
              className={styles.footerCtaButton}
            >
              Start your free Enterprise 14-day trial today!
            </Button>
          </form>
        </div>
        {logo && <div className={styles.footerLogo}>{logo}</div>}
        {links}
        <div className={styles.footerBottom}>
          {copyright && <div>{copyright}</div>}
          <div className={styles.footerLegalLinks}>
            <Link href="https://goteleport.com/legal/tos/">
              Terms of Service
            </Link>
            <Link href="https://goteleport.com/legal/wtou/">
              Website Terms of Use
            </Link>
            <Link href="https://goteleport.com/legal/privacy/">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
