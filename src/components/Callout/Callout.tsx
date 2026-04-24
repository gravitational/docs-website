import Link from "@docusaurus/Link";
import styles from "./Callout.module.css";
import cn from "clsx";
import Button from "../Button";
import Icon, { IconName } from "../Icon";
import { Link as LinkType } from "../Pages/Homepage/VersionHighlights/VersionHighlights";

type CalloutProps = {
  title: string;
  description?: string;
  variant?: "default" | "tip";
  icon?: IconName;
  link?: LinkType;
};

const Callout: React.FC<CalloutProps> = ({
  title,
  description,
  variant = "default",
  icon,
  link,
}) => {
  return (
    <div
      className={cn(styles.callout, {
        [styles.tip]: variant === "tip",
      })}
    >
      {icon && <Icon name={icon} size="xl" className={styles.icon} />}
      <div>
        <p className={styles.title}>{title}</p>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {link?.href && (
        <Button className={styles.link} as="link" href={link.href}>
          {link?.title || "Read more"}
        </Button>
      )}
    </div>
  );
};

export default Callout;
