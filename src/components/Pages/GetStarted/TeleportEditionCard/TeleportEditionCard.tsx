import Link from "@docusaurus/Link";
import Icon, { type IconName } from "@site/src/components/Icon";
import styles from "./TeleportEditionCard.module.css";

interface TeleportEditionCardProps {
  title: string;
  iconName: IconName;
  href: string;
  subtitle?: string;
  className?: string;
  id?: string;
  children?: React.ReactNode;
}

const TeleportEditionCard: React.FC<TeleportEditionCardProps> = ({
  title,
  iconName,
  href,
  subtitle,
  className = "",
  id,
  children,
}) => {
  return (
    // @ts-ignore
    <Link
      to={href}
      className={`${styles.card} ${className}`}
      id={id}
    >
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <Icon name={iconName} size="md" />
        </div>
        <div className={styles.titleWrapper}>
          <h4 className={styles.title}>{title}</h4>
        </div>
      </div>

      {subtitle && (
        <p className={styles.subtitle}>{subtitle}</p>
      )}

      <div className={styles.content}>
        {children}
      </div>
    </Link>
  );
};

export default TeleportEditionCard;