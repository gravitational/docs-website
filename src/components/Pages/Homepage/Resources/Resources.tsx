import React from "react";
import cn from "classnames";
import styles from "./Resources.module.css";
import Link from "@docusaurus/Link";
import { Tag } from "../../Landing/UseCasesList/UseCasesList";
import Icon from "@site/src/components/Icon";
import ArrowRightSvg from "@site/src/components/Icon/teleport-svg/arrow-circle-right.svg";

interface Resource {
  title: string;
  description: string;
  iconComponent: any;
  href?: string;
  variant?: "homepage" | "doc";
  tags?: Tag[];
  editionTag?: string;
  links?: Array<{ title: string; href: string }>;
  descriptionsFontSize?: "lg" | "xl";
  iconsSize?: "small" | "large";
}

interface AdditionalLinks {
  title: string;
  links: Array<{ title: string; href: string }>;
}

interface ResourcesProps {
  className?: string;
  title?: string;
  secondaryTitle?: string;
  description?: string;
  variant?: "homepage" | "doc";
  desktopColumnsCount?: number;
  resources: Resource[];
  narrowBottomPadding?: boolean;
  descriptionsFontSize?: "lg" | "xl";
  iconsSize?: "small" | "large";
  additionalLinks?: AdditionalLinks;
}

const ResourceCard: React.FC<Resource> = ({
  title,
  description,
  href,
  iconComponent,
  variant,
  tags,
  editionTag,
  links,
  descriptionsFontSize,
  iconsSize,
}) => {
  const IconComponent = iconComponent;
  const cardContent = (
    <>
      {editionTag && <div className={styles.editionTag}>{editionTag}</div>}
      <IconComponent
        className={cn(styles.iconSvg, {
          [styles.docVariant]: variant === "doc",
          [styles[iconsSize]]: iconsSize,
        })}
      />
      <h4
        className={cn(styles.resourceTitle, {
          [styles.smallSize]: variant === "doc" && !description,
        })}
      >
        {tags?.length > 0 || links?.length > 0 ? (
          <Link to={href}>{title}</Link>
        ) : (
          title
        )}
      </h4>
      {description && (
        <div
          className={cn(styles.resourceDescription, {
            [styles.docVariant]: variant === "doc",
            [styles.smallFontSize]: descriptionsFontSize === "lg",
          })}
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}
      {links?.length > 0 && (
        <ul className={styles.resourceLinks}>
          {links.map((link, linkIndex) => (
            <li key={linkIndex}>
              <Link to={link.href} className={styles.resourceLink}>
                <span />
                {link.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {tags?.length > 0 && (
        <ul className={styles.tags}>
          {tags.map((tag, tagIndex) => (
            <li key={tagIndex}>
              {tag.href ? (
                // @ts-ignore
                <Link className={styles.tag} to={tag.href}>
                  {tag.icon && (
                    <Icon
                      name={tag.icon}
                      size="md"
                      className={styles.tagIcon}
                    />
                  )}
                  {tag.name}
                  {tag.arrow && (
                    // @ts-ignore
                    <ArrowRightSvg className={styles.tagArrow} />
                  )}
                </Link>
              ) : (
                <span className={styles.tag}>
                  {tag.icon && (
                    <Icon
                      name={tag.icon}
                      size="md"
                      className={styles.tagIcon}
                    />
                  )}
                  {tag.name}
                  {tag.arrow && (
                    // @ts-ignore
                    <ArrowRightSvg className={styles.tagArrow} />
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
  return href &&
    (!tags || tags.length === 0) &&
    (!links || links.length === 0) ? (
    // @ts-ignore
    <Link to={href} className={styles.resourceItem}>
      {cardContent}
    </Link>
  ) : (
    <div className={styles.resourceItem}>{cardContent}</div>
  );
};

const Resources: React.FC<ResourcesProps> = ({
  className = "",
  title = "Enroll resources",
  secondaryTitle,
  description,
  variant = "homepage",
  desktopColumnsCount = 4,
  resources,
  narrowBottomPadding = false,
  descriptionsFontSize = "lg",
  iconsSize = "medium",
  additionalLinks,
}) => {
  const Heading = variant === "doc" ? "h3" : "h2";
  return (
    <section
      className={cn(styles.resources, className, {
        [styles.docVariant]: variant === "doc",
        [styles.narrowBottomPadding]: narrowBottomPadding,
      })}
    >
      <div className={styles.resourcesContainer}>
        <div
          className={cn(styles.header, {
            [styles.hasTitle]: !!title,
            [styles.docVariant]: variant === "doc",
          })}
        >
          {title && (
            <Heading
              className={cn(styles.resourcesTitle, {
                [styles.docVariant]: variant === "doc",
                [styles.hasSecondaryTitle]: !!secondaryTitle,
              })}
            >
              {title}
            </Heading>
          )}
          {secondaryTitle && (
            <h3 className={styles.secondaryTitle}>{secondaryTitle}</h3>
          )}
          {description && <p className={styles.description}>{description}</p>}
        </div>
        <div
          className={styles.resourcesGrid}
          style={
            {
              "--desktop-column-count": desktopColumnsCount,
            } as React.CSSProperties
          }
        >
          {resources.map((resource, i) => (
            <ResourceCard
              key={i}
              title={resource.title}
              description={resource.description}
              href={resource.href}
              variant={variant}
              iconComponent={resource.iconComponent}
              tags={resource.tags}
              editionTag={resource.editionTag}
              links={resource.links}
              descriptionsFontSize={descriptionsFontSize}
              iconsSize={iconsSize}
            />
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

export default Resources;
