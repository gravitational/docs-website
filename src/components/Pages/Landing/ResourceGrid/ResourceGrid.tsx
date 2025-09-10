import React from "react";
import styles from "./ResourceGrid.module.css";
import Link from "@docusaurus/Link";

interface Resource {
  title: string;
  description: string;
  iconComponent: any;
  href?: string;
}

interface ResourceGridProps {
  className?: string;
  title?: string;
  resources: Resource[];
  children?: React.ReactNode;
}

const ResourceCard: React.FC<Resource> = ({
  title,
  description,
  href,
  iconComponent,
}) => {
  const IconComponent = iconComponent;
  const cardContent = (
    <>
      <IconComponent className={styles.iconSvg} />
      <h4 className={styles.resourceTitle}>{title}</h4>
      <p className={styles.resourceDescription}>{description}</p>
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

const ResourceGrid: React.FC<ResourceGridProps> = ({
  className = "",
  title = "Resources",
  resources,
  children,
}) => {
  return (
    <section className={`${styles.resourceGrid} ${className}`}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.text}>{children}</div>
        </div>
        <div className={styles.grid}>
          {resources.map((resource, i) => (
            <ResourceCard
              key={i}
              title={resource.title}
              description={resource.description}
              href={resource.href}
              iconComponent={resource.iconComponent}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResourceGrid;
