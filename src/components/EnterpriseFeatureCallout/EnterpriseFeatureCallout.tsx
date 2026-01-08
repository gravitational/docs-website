import { ReactNode } from "react";
import Icon from "../Icon";
import styles from "./EnterpriseFeatureCallout.module.css";
import { trackEvent } from "@site/src/utils/analytics";

const EnterpriseFeatureCallout: React.FC<{
  children?: ReactNode;
  title?: string;
  emitEvent?: (name: string, params: any) => {};
}> = ({ children, title = "Enterprise feature", emitEvent }) => {
  return (
    <div className={styles.enterpriseFeatureCallout}>
      <Icon size="md" name="rocketLaunch" />
      <div className={styles.textContent}>
        <strong className={styles.title}>{title}</strong>
        <div className={styles.content}>
          {children && <>{children}</>}{" "}
          <a
            href="https://goteleport.com/signup/"
            onClick={() =>
              trackEvent({ event_name: "docs_enterprise_link", emitEvent })
            }
          >
            Start a free trial
          </a>
          .
        </div>
      </div>
    </div>
  );
};

export default EnterpriseFeatureCallout;
