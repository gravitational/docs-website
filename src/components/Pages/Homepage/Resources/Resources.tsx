import React from "react";
import cn from "classnames";
import styles from "./Resources.module.css";
import Link from "@docusaurus/Link";

interface Resource {
  title: string;
  description: string;
  iconComponent: any;
  href?: string;
  variant?: "homepage" | "doc";
}

interface ResourcesProps {
  className?: string;
  title?: string;
  variant?: "homepage" | "doc";
  desktopColumnsCount?: number;
  resources: Resource[];
}

const ResourceCard: React.FC<Resource> = ({
  title,
  description,
  href,
  iconComponent,
  variant,
}) => {
  const IconComponent = iconComponent;
  const cardContent = (
    <>
      <IconComponent
        className={cn(styles.iconSvg, {
          [styles.docVariant]: variant === "doc",
        })}
      />
      <h4 className={styles.resourceTitle}>{title}</h4>
      <p
        className={cn(styles.resourceDescription, {
          [styles.docVariant]: variant === "doc",
        })}
      >
        {description}
      </p>
    </>
  );
  return href ? (
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
}) => {
  const Heading = variant === "doc" ? "h3" : "h2";
  return (
    <section
      className={cn(styles.resources, className, {
        [styles.docVariant]: variant === "doc",
      })}
    >
      <div className={styles.resourcesContainer}>
        <Heading
          className={cn(styles.resourcesTitle, {
            [styles.docVariant]: variant === "doc",
          })}
        >
          {title}
        </Heading>
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
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Resources;
