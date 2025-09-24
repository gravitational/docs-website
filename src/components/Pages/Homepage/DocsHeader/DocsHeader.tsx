import React from "react";
import { InlineSearch } from "./InlineSearch";
import styles from "./DocsHeader.module.css";
import Link from "@docusaurus/Link";

interface DocsHeaderProps {
  title?: string;
  subtitle?: string;
  hideTitleSection?: boolean;
  quickActions?: Array<{
    label: string;
    href: string;
  }>;
}

function DocsHeader({
  title = "Teleport Documentation",
  hideTitleSection = false,
  quickActions = [],
}: DocsHeaderProps) {
  return (
    <section className={styles.docsHeader}>
      <div className={styles.background} />

      <div className={styles.content}>
        <div className={hideTitleSection ? "visually-hidden" : styles.title}>
          {title}
        </div>
        <div className={styles.searchBar}>
          <InlineSearch />
        </div>

        {quickActions.length > 0 && (
          <div className={styles.quickActions}>
            <span className={styles.exampleText}>Example</span>
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className={styles.actionButton}
              >
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default DocsHeader;
