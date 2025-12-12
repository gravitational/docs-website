import cn from "classnames";
import { useContext, useState } from "react";
import Button from "../Button";
import Icon from "../Icon";
import styles from "./ExclusivityBanner.module.css";
import ExclusivityContext from "./context";

const ExclusivityBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState<boolean>(false);

  const { exclusiveFeature } = useContext(ExclusivityContext);

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
            {exclusiveFeature} is available only for Enterprise customers.
            <a href="https://goteleport.com/signup/">Start your free trial.</a>
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
