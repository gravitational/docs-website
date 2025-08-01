import React from "react";
import styles from "./Integrations.module.css";
import cn from "classnames";

interface Integration {
  title: string;
  href?: string;
  iconColor?: string;
  iconComponent: any;
}

interface IntegrationsProps {
  id?: string;
  title: string;
  className?: string;
  integrations: Integration[];
}

const IntegrationCard: React.FC<Integration> = ({
  title,
  href,
  iconColor,
  iconComponent,
}) => {
  const Icon = iconComponent;
  const cardContent = (
    <>
      <div
        className={cn(styles.integrationIcon, {
          [styles.defaultIcon]: !iconColor,
        })}
        style={{ backgroundColor: iconColor }}
      >
        <Icon className={styles.iconSvg} />
      </div>
      <h3 className={styles.integrationTitle}>{title}</h3>
    </>
  );

  return href ? (
    <a href={href} className={cn(styles.integrationItem, { [styles.defaultIcon]: !iconColor })}>
      {cardContent}
    </a>
  ) : (
    <div className={cn(styles.integrationItem, { [styles.defaultIcon]: !iconColor })}>
      {cardContent}
    </div>
  );
};

const Integrations: React.FC<IntegrationsProps> = ({
  title = "Integrations",
  id,
  className = "",
  integrations,
}) => {
  return (
    <section className={`${styles.integrations} ${className || ""}`}>
      <div className={styles.integrationsContainer}>
        <h2
          className={styles.integrationsTitle}
          id={id || title.toLowerCase().replaceAll(" ", "-")}
        >
          {title}
        </h2>
        <div className={styles.integrationGrid}>
          {integrations.map((integration, i) => (
            <IntegrationCard
              key={i}
              title={integration.title}
              href={integration.href}
              iconColor={integration.iconColor}
              iconComponent={integration.iconComponent}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Integrations;
