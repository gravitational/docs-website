import { ReactNode } from "react";
import Icon from "../Icon";
import styles from "./EnterpriseFeatureCallout.module.css";

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
          <a href="https://goteleport.com/signup/">Start a free trial</a>.
        </div>
      </div>
    </div>
  );
};

export default EnterpriseFeatureCallout;
