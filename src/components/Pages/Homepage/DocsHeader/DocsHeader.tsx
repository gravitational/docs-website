import React from 'react';
import { InlineSearch } from './InlineSearch';
import styles from './DocsHeader.module.css';

interface DocsHeaderProps {
  title?: string;
  subtitle?: string;
  hideTitleSection?: boolean;
  quickActions?: Array<{
    label: string;
    href: string;
  }>;
}

const defaultQuickActions = [
  { label: "Enroll Kubernetes cluster", href: "/enroll-resources/kubernetes-access/getting-started/" },
  { label: "set up SSO with GitHub", href: "/admin-guides/access-controls/sso/github-sso/" },
  { label: "set up Slack Access Request Plugin", href: "/admin-guides/access-controls/access-request-plugins/slack/" }
];

function DocsHeader({ 
  title = "Teleport Documentation",
  hideTitleSection = false,
  quickActions = defaultQuickActions
}: DocsHeaderProps) {
  return (
    <section className={styles.docsHeader}>
      {/* Background container with overflow control */}
      <div className={styles.backgroundContainer}>
        <div className={styles.background} />
      </div>
      
      {/* Content container without overflow restrictions */}
      <div className={styles.contentContainer}>
        <div className={styles.content}>
          <div className={styles.textSection}>
            <div className={hideTitleSection ? 'visually-hidden' : styles.title}>{title}</div>
          </div>
          
          <div className={styles.searchSection}>
            <div className={styles.searchBar}>
              <div className={styles.searchContainer}>
                <InlineSearch />
              </div>
            </div>
          </div>
          
          <div className={styles.quickActions}>
            <span className={styles.exampleText}>Example</span>
            {quickActions.map((action, index) => (
              <a 
                key={index}
                href={action.href}
                className={styles.actionButton}
              >
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default DocsHeader;