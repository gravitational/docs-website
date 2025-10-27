import React from "react";
import cn from "classnames";
import styles from "./Resources.module.css";
import Link from "@docusaurus/Link";
import { Tag } from "../../Landing/UseCasesList/UseCasesList";
import Icon from "@site/src/components/Icon";

interface Resource {
  title: string;
  description: string;
  iconComponent: any;
  href?: string;
  variant?: "homepage" | "doc";
  tags?: Tag[];
}

interface ResourcesProps {
  className?: string;
  title?: string;
  variant?: "homepage" | "doc";
  desktopColumnsCount?: number;
  resources: Resource[];
  narrowBottomPadding?: boolean;
}

const ResourceCard: React.FC<Resource> = ({
  title,
  description,
  href,
  iconComponent,
  variant,
  tags,
}) => {
  const IconComponent = iconComponent;
  const cardContent = (
    <>
      <IconComponent
        className={cn(styles.iconSvg, {
          [styles.docVariant]: variant === "doc",
        })}
      />
      <h4
        className={cn(styles.resourceTitle, {
          [styles.smallSize]: variant === "doc" && !description,
        })}
      >
        {tags?.length > 0 ? <Link to={href}>{title}</Link> : title}
      </h4>
      {description && (
        <p
          className={cn(styles.resourceDescription, {
            [styles.docVariant]: variant === "doc",
          })}
        >
          {description}
        </p>
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
  return href && (!tags || tags.length === 0) ? (
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
  variant = "homepage",
  desktopColumnsCount = 4,
  resources,
  narrowBottomPadding = false,
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
        {title && (
          <Heading
            className={cn(styles.resourcesTitle, {
              [styles.docVariant]: variant === "doc",
            })}
          >
            {title}
          </Heading>
        )}
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
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Resources;
