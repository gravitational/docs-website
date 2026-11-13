import React from "react";
import styles from "./VersionHighlights.module.css";
import cn from "classnames";
import FIRST_WHATS_NEW_IMAGE from "../../../../../static/server-mcp-white-bg.png";
import SECOND_WHATS_NEW_IMAGE from "../../../../../static/database-mcp-white-bg.png";
import Link from "@docusaurus/Link";
import YouTubeEmbed from "@site/src/components/YouTubeEmbed";

interface VersionHighlight {
  title: string;
  description: string;
  href: string;
  tag: string | string[];
  image?: string;
  videoId?: string;
  linkTitle?: string;
}

export interface Link {
  title: string;
  href: string;
}

interface VersionHighlightsProps {
  className?: string;
  title?: string;
  highlights: VersionHighlight[];
  mainLinks: Link[];
  layout?: "highlightFirst" | "default";
}

interface HighlightItemContentProps
  extends Pick<VersionHighlight, "title" | "description" | "tag" | "linkTitle">,
    Pick<VersionHighlightsProps, "layout"> {
  index: number;
}

const Tag: React.FC<Pick<VersionHighlight, "tag">> = ({ tag }) => {
  if (Array.isArray(tag))
    return (
      <div className={styles.tagList}>
        {tag.map((tag: string) => (
          <p className={styles.highlightTag}>{tag}</p>
        ))}
      </div>
    );
  return (
    <div className={styles.tagList}>
      <p className={styles.highlightTag}>{tag}</p>
    </div>
  );
};

const HighlightItemContent: React.FC<HighlightItemContentProps> = ({
  title,
  description,
  tag,
  linkTitle,
  layout,
  index,
}) => {
  return (
    <>
      {(layout !== "highlightFirst" || index !== 0) && <Tag tag={tag} />}
      <h3 className={styles.highlightTitle}>{title}</h3>
      <p className={styles.highlightDescription}>{description}</p>
      {layout === "highlightFirst" && index === 0 && <Tag tag={tag} />}
      {((layout === "highlightFirst" && index === 0) ||
        layout === "default") && (
        <p className={styles.highlightLink}>{linkTitle || "Read more"}</p>
      )}
    </>
  );
};

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
  layout = "default",
}) => {
  return (
    <section className={cn(styles.versionHighlights, className)}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.links}>
            {mainLinks.map((link, index) => (
              <Link key={index} to={link.href} className={styles.link}>
                {link.title}
              </Link>
            ))}
          </div>
        </div>
        <ul className={cn(styles.highlightsList, { [styles[layout]]: layout })}>
          {highlights.map((highlight, index) => (
            <li key={index}>
              {highlight?.videoId ? (
                <div
                  className={cn(styles.highlightItem, {
                    [styles.highlightFirst]:
                      layout === "highlightFirst" && index === 0,
                    [styles.bordered]: layout === "highlightFirst",
                  })}
                >
                  <div className={styles.video}>
                    <YouTubeEmbed
                      videoId={highlight.videoId}
                      title={title}
                      fetchPriority="high"
                      playButtonSize="md"
                    />
                  </div>
                  <Link to={highlight.href} className={styles.highlightContent}>
                    <HighlightItemContent
                      {...highlight}
                      index={index}
                      layout={layout}
                    />
                  </Link>
                </div>
              ) : (
                // TODO: replace hard-coded images with @site/ import paths in the source
                <Link
                  to={highlight.href}
                  className={cn(
                    styles.highlightItem,
                    styles.highlightItemLink,
                    {
                      [styles.bordered]: layout === "highlightFirst",
                    },
                  )}
                >
                  {(highlight.image || layout === "default") && (
                    <div className={styles.highlightImage}>
                      <img
                        src={
                          layout === "default"
                            ? index === 0
                              ? FIRST_WHATS_NEW_IMAGE
                              : SECOND_WHATS_NEW_IMAGE
                            : highlight.image
                        }
                        alt={highlight.title}
                        className={styles.image}
                        width={323}
                        height={182}
                      />
                    </div>
                  )}
                  <div
                    className={cn(styles.highlightContent, {
                      [styles.noImage]:
                        !highlight.image && layout !== "default",
                    })}
                  >
                    <HighlightItemContent
                      {...highlight}
                      index={index}
                      layout={layout}
                    />
                  </div>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default VersionHighlights;
