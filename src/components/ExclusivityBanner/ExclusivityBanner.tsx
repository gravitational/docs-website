import cn from "classnames";
import { useContext, useEffect, useState } from "react";
import Button from "../Button";
import Icon from "../Icon";
import styles from "./ExclusivityBanner.module.css";
import ExclusivityContext from "./context";

const STORAGE_KEY = "exclusivity_banner_dismissed";

const ExclusivityBanner: React.FC = () => {
  const { exclusiveFeature } = useContext(ExclusivityContext);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    // Initialize from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "true";
    }
    return false;
  });

  // Save to localStorage whenever dismissed state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(dismissed));
    }
  }, [dismissed]);

  if (exclusiveFeature) {
    return (
      <div className={styles.exclusivityWrapper}>
        <div
          className={cn(styles.exclusivityBanner, {
            [styles.visible]: !dismissed,
          })}
        >
          <div className={styles.content}>
            <Icon size="sm-md" name="rocketLaunch" />
            <p>
              {exclusiveFeature} is available only for Enterprise customers.{" "}
              <a href="https://goteleport.com/signup/">
                Start your free trial.
              </a>
            </p>
          </div>
          <Button
            as="button"
            onClick={() => setDismissed(true)}
            className={styles.hideButton}
          >
            Hide
          </Button>
        </div>
        <div
          role="button"
          onClick={() => setDismissed(false)}
          className={cn(styles.exclusivityBadge, {
            [styles.visible]: dismissed,
          })}
        >
          <Icon size="sm-md" name="rocketLaunch" />
          Start your free trial
        </div>
      </div>
    );
  }
  return null;
};

export default ExclusivityBanner;
