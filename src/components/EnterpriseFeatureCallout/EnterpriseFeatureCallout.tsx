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
      <div className={styles.content}>
        <strong className={styles.title}>{title}</strong>
        {children && <>{children}</>}
      </div>
    </div>
  );
};

export default EnterpriseFeatureCallout;
