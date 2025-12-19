import { ReactNode } from "react";
import Icon from "../Icon";
import styles from "./EnterpriseFeatureCallout.module.css";
import Link from "@docusaurus/Link";

const EnterpriseFeatureCallout: React.FC<{
  children?: ReactNode;
  title?: string;
}> = ({ children, title = "Enterprise feature" }) => {
  return (
    <div className={styles.enterpriseFeatureCallout}>
      <Icon size="md" name="rocketLaunch" />
      <div className={styles.textContent}>
        <strong className={styles.title}>{title}</strong>
        <div className={styles.content}>
          {children && <>{children}</>}{" "}
          <Link href="https://goteleport.com/signup/">Start a free trial</Link>.
        </div>
      </div>
    </div>
  );
};

export default EnterpriseFeatureCallout;
