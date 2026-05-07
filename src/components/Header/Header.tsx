import { useCallback, useEffect, useRef, useState } from "react";

import DocsLogo from "@site/static/logo.svg";
import HeadlessButton from "../HeadlessButton";
import Icon from "../Icon";

import styles from "./Header.module.css";

import Link from "@docusaurus/Link";
import { useNavbarMobileSidebar } from "@docusaurus/theme-common/internal";
import { translate } from "@docusaurus/Translate";
import { useInkeepSearch } from "@site/src/hooks/useInkeepSearch";
import { InlineSearch } from "../Pages/Homepage/DocsHeader/InlineSearch";
import { useActiveDocContext } from "@docusaurus/plugin-content-docs/client";
import { getVersionedUrl } from "@site/utils/general";
import Button from "../Button";

const Header = () => {
  const { toggle, shown } = useNavbarMobileSidebar();
  const headerRef = useRef<HTMLDivElement>(null);
  const [isNavigationVisible, setIsNavigationVisible] =
    useState<boolean>(false);
  const toggleNavigation = useCallback(() => {
    setIsNavigationVisible((value) => !value);
    toggle();
  }, [isNavigationVisible]);
  const { setIsOpen } = useInkeepSearch({
    enableAIChat: true,
  });
  const { activeVersion } = useActiveDocContext();

  useEffect(() => {
    if (!shown) {
      setIsNavigationVisible(false);
    }
  }, [shown]);

  return (
    <div className={styles.header} ref={headerRef}>
      <header className={styles.wrapper}>
        <div className={styles.leftSection}>
          <HeadlessButton
            onClick={toggleNavigation}
            className={styles.hamburger}
            data-testid="hamburger"
            aria-label={translate(
              isNavigationVisible
                ? {
                    id: "theme.docs.sidebar.closeSidebarButtonAriaLabel",
                    message: "Close navigation bar",
                    description:
                      "The ARIA label for close button of mobile sidebar",
                  }
                : {
                    id: "theme.docs.sidebar.toggleSidebarButtonAriaLabel",
                    message: "Toggle navigation bar",
                    description:
                      "The ARIA label for hamburger menu button of mobile navigation",
                  },
            )}
          >
            <Icon
              name={isNavigationVisible ? "closeLarger" : "hamburger2"}
              size="lg"
            />
          </HeadlessButton>
          <Link
            to={activeVersion ? getVersionedUrl(activeVersion, "/") : "/"}
            className={styles["logo-link"]}
          >
            <DocsLogo className={styles.logo} />
          </Link>
        </div>
        <div className={styles.centerSection}>
          <InlineSearch
            className={styles.inlineSearch}
            mobilePlaceholder="Search"
            displayAskAiButton
          />
        </div>
        <div className={styles.rightSection}>
          <Button
            as="link"
            className={styles.cta}
            href="https://goteleport.com/support/"
            variant="primary"
            shape="md"
          >
            Try for Free
          </Button>
          <Button
            as="link"
            className={styles.cta}
            href="https://goteleport.com/contact-sales/"
            variant="secondary"
            shape="md"
          >
            Contact Sales
          </Button>
        </div>
      </header>
    </div>
  );
};

export default Header;
