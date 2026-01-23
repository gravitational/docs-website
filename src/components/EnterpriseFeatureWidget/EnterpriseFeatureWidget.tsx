import { trackEvent } from "@site/src/utils/analytics";
import Button from "../Button";
import Icon from "../Icon";
import styles from "./EnterpriseFeatureWidget.module.css";

const EnterpriseFeatureWidget: React.FC<{
  title: string;
  children: React.ReactNode;
  emitEvent?: (name: string, params: any) => {};
}> = ({ title, emitEvent, children }) => {
  return (
    <div className={styles.enterpriseFeatureWidget}>
      <div className={styles.iconWrapper}>
        <Icon size="md" name="lightbulb" />
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.textWrapper}>
          <p className={styles.title}>{title}</p>
          <div className={styles.content}>{children}</div>
        </div>
        <div className={styles.ctaWrapper}>
          <Button
            as="link"
            href="https://goteleport.com/signup/"
            target="_blank"
            onClick={() =>
              trackEvent({ event_name: "docs_enterprise_link", emitEvent })
            }
          >
            Try for free
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseFeatureWidget;
