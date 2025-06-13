import { useState, useRef } from "react";
import { useClickAway } from "react-use";

import { HeaderNavigation } from "../../../server/strapi-types";
import Button from "../Button";
import Link from "../Link";
import Icon from "../Icon";

import styles from "./HeaderCTA.module.css";

const HeaderCTA = ({
 rightSide
}: {
  rightSide: HeaderNavigation["rightSide"];
}) => {
  const { searchButton, ctas, bannerButtons } = rightSide || {}
  const ref = useRef(null);

  const [isSignInVisible, setIsSignInVisible] = useState<boolean>(false);

  useClickAway(ref, () => {
    if (isSignInVisible) {
      setIsSignInVisible(false);
    }
  });

  return (
    <div className={styles.wrapper}>
      {ctas && (
        <div className={styles.ctaWrapper}>
          {ctas.map((cta, i) => (
            <Button
              as="link"
              className={styles.cta}
              href={cta.href}
              key={`navCTA-${cta.href}-${i}`}
              variant={i !== 0 ? "secondary" : "primary"}
              id={cta?.elementId || ""}
              shape="md"
            >
              {cta.title}
            </Button>
          ))}
        </div>
      )}
      {bannerButtons && (
        <div className={styles.actionButtonFlex}>
          {bannerButtons.map((button) =>(
            <Link className={styles.styledLink} href={button?.link || ""}>
              <div className={styles.flex}>
                {button?.title}
                <Icon name="arrowRight" />
              </div>
            </Link>
          ))}
       
        </div>
      )}
    </div>
  );
};

export default HeaderCTA;
