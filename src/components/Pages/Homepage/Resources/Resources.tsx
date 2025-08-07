import React from "react";
import styles from "./Resources.module.css";

interface Resource {
  title: string;
  description: string;
  iconComponent: any;
  href?: string;
}

interface ResourcesProps {
  className?: string;
  title?: string;
  resources: Resource[];
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
    <a href={href} className={styles.resourceItem}>
      {cardContent}
    </a>
  ) : (
    <div className={styles.resourceItem}>{cardContent}</div>
  );
};

const Resources: React.FC<ResourcesProps> = ({
  className = "",
  title = "Enroll Resources",
  resources,
}) => {
  return (
    <section className={`${styles.resources} ${className}`}>
      <div className={styles.resourcesContainer}>
        <h2 className={styles.resourcesTitle}>{title}</h2>
        <div className={styles.resourcesGrid}>
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

export default Resources;
