import React from "react";
import styles from "./Integrations.module.css";
import cn from "classnames";
import ArrowRightSvg from "@site/src/components/Icon/teleport-svg/arrow-circle-right.svg";
import Link from "@docusaurus/Link";

interface Integration {
  title: string;
  description?: string;
  href?: string;
  iconColor?: string;
  iconComponent: any;
  layout: Pick<IntegrationsProps, "layout">;
}

interface AdditionalLinks {
  title: string;
  links: Array<{ title: string; href: string }>;
}

interface IntegrationsProps {
  title?: string;
  secondaryTitle?: string;
  layout: "row" | "column" | "row-condensed";
  className?: string;
  integrations: Integration[];
  mainLink?: { title: string; href: string };
  additionalLinks?: AdditionalLinks;
  desktopColumnsCount?: number;
  noBackgroundColor?: boolean;
  narrowPadding?: boolean;
}

const IntegrationCard: React.FC<Integration> = ({
  title,
  description,
  href,
  iconColor,
  iconComponent,
  layout = "column",
}) => {
  const Icon = iconComponent;
  const isRowLayout = (layout as string).includes("row");
  const cardContent = (
    <>
      <div
        className={cn(styles.integrationIcon, {
          [styles.defaultIcon]: !iconColor && !isRowLayout,
          [styles.iconRow]: isRowLayout,
          [styles.iconRowCondensed]: layout === "row-condensed",
          [styles.bgColor]: iconColor,
        })}
        style={{ backgroundColor: iconColor }}
      >
        <Icon className={styles.iconSvg} />
      </div>
      <div
        className={cn(styles.integrationItemContent, {
          [styles.hasDescription]: description,
          [styles.rowLayout]: isRowLayout,
          [styles.iconRowCondensed]: layout === "row-condensed",
        })}
      >
        <h3 className={styles.integrationTitle}>{title}</h3>
        {description && (
          <p className={styles.integrationDescription}>{description}</p>
        )}
      </div>
    </>
  );

  return href ? (
    <Link
      to={href}
      className={cn(styles.integrationItem, {
        [styles.defaultIcon]: !iconColor && !isRowLayout,
        [styles.rowLayout]: isRowLayout,
        [styles.iconRowCondensed]: layout === "row-condensed",
      })}
      style={
        {
          "--layout": (layout as string).replace("-condensed", ""),
        } as React.CSSProperties
      }
    >
      {cardContent}
    </Link>
  ) : (
    <div
      className={cn(styles.integrationItem, styles.integrationItemNoLink, {
        [styles.defaultIcon]: !iconColor && !isRowLayout,
        [styles.rowLayout]: isRowLayout,
        [styles.iconRowCondensed]: layout === "row-condensed",
      })}
      style={
        {
          "--layout": (layout as string).replace("-condensed", ""),
        } as React.CSSProperties
      }
    >
      {cardContent}
    </div>
  );
};

const Integrations: React.FC<IntegrationsProps> = ({
  title = "Integrations",
  secondaryTitle,
  className = "",
  integrations,
  layout = "column",
  mainLink,
  additionalLinks,
  desktopColumnsCount = 5,
  noBackgroundColor = false,
  narrowPadding = false,
}) => {
  return (
    <section
      className={cn(styles.integrations, className, {
        [styles.noBackgroundColor]: noBackgroundColor,
        [styles.narrowPadding]: narrowPadding,
      })}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            {title && <h2 className={styles.title}>{title}</h2>}
            {secondaryTitle && (
              <h3 className={styles.secondaryTitle}>{secondaryTitle}</h3>
            )}
          </div>
          {mainLink && (
            <Link to={mainLink.href} className={styles.mainLink}>
              {mainLink.title}
            </Link>
          )}
        </div>
        <div
          className={styles.grid}
          style={
            {
              "--desktop-column-count": desktopColumnsCount,
            } as React.CSSProperties
          }
        >
          {integrations.map((integration, i) => (
            <IntegrationCard key={i} layout={layout} {...integration} />
          ))}
        </div>
        {additionalLinks && (
          <div className={styles.additionalLinks}>
            {additionalLinks.title && (
              <p className={styles.additionalLinksTitle}>
                {additionalLinks.title}
              </p>
            )}
            <ul className={styles.additionalLinksList}>
              {additionalLinks?.links?.map((link, i) => (
                <li key={i}>
                  <Link to={link.href}>
                    <ArrowRightSvg /> {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default Integrations;
