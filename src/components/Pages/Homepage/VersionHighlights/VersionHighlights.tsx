import React from "react";
import styles from "./VersionHighlights.module.css";
import cn from "classnames";
import FIRST_WHATS_NEW_IMAGE from "../../../../../static/server-mcp-white-bg.png";
import SECOND_WHATS_NEW_IMAGE from "../../../../../static/database-mcp-white-bg.png";

interface VersionHighlight {
  title: string;
  description: string;
  href: string;
  tag: string;
}

interface Link {
  title: string;
  href: string;
}

interface VersionHighlightsProps {
  className?: string;
  title?: string;
  highlights: VersionHighlight[];
  mainLinks: Link[];
}

const VersionHighlights: React.FC<VersionHighlightsProps> = ({
  className = "",
  title = `What's New`,
  highlights,
  mainLinks = [
    {
      title: "View Changelog",
      href: "./changelog/",
    },
    {
      title: "Upcoming Releases",
      href: "./upcoming-releases/",
    },
  ],
}) => {
  return (
    <section className={cn(styles.versionHighlights, className)}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.links}>
            {mainLinks.map((link, index) => (
              <a key={index} href={link.href} className={styles.link}>
                {link.title}
              </a>
            ))}
          </div>
        </div>
        <ul className={styles.highlightsList}>
          {highlights.map((highlight, index) => (
            <li key={index}>
              <a href={highlight.href} className={styles.highlightItem}>
                <div className={styles.highlightImage}>
                <img
                  src={index === 0 ? FIRST_WHATS_NEW_IMAGE : SECOND_WHATS_NEW_IMAGE}
                  alt={highlight.title}
                  className={styles.image}
                  width={323}
                  height={182}
                />
                </div>
                <div className={styles.highlightContent}>
                  <p className={styles.highlightTag}>{highlight.tag}</p>
                  <h3 className={styles.highlightTitle}>{highlight.title}</h3>
                  <p className={styles.highlightDescription}>
                    {highlight.description}
                  </p>
                  <p className={styles.highlightLink}>Read more</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default VersionHighlights;
