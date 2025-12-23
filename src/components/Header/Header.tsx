import { useCallback, useEffect, useRef, useState } from "react";

import { BannerData, EventBanner } from "../EventBanner";

import DocsLogo from "@site/static/logo.svg";
import type { HeaderNavigation } from "../../../server/strapi-types";
import HeadlessButton from "../HeadlessButton";
import Icon from "../Icon";

import styles from "./Header.module.css";
import HeaderCTA from "./HeaderCTA";

import Link from "@docusaurus/Link";
import { useNavbarMobileSidebar } from "@docusaurus/theme-common/internal";
import { translate } from "@docusaurus/Translate";
import { useInkeepSearch } from "@site/src/hooks/useInkeepSearch";
import eventData from "../../../data/events.json";
import data from "../../../data/navbar.json";
import { InlineSearch } from "../Pages/Homepage/DocsHeader/InlineSearch";

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
  const version = "17.x"; /* useDocsVersion(); */

  const { menuItems, rightSide } = data as unknown as HeaderNavigation;
  const mobileBtn = rightSide?.mobileButton;
  const event = eventData ? (eventData as unknown as BannerData) : null;

  useEffect(() => {
    const handleResize = () => {
      if (event) {
        document.documentElement.style.setProperty(
          "--ifm-navbar-height",
          headerRef.current
            ? `${headerRef.current.getBoundingClientRect().height + document.getElementById("docs-navigation")?.getBoundingClientRect().height}px`
            : "147px"
        );
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!shown) {
      setIsNavigationVisible(false);
    }
  }, [shown]);

  return (
    <div className={styles.header} ref={headerRef}>
      {event && <EventBanner initialEvent={event} />}
      <header className={`${styles.wrapper} ${event ? styles.margin : " "}`}>
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
                  }
            )}
          >
            <Icon
              name={isNavigationVisible ? "closeLarger" : "hamburger2"}
              size="lg"
            />
          </HeadlessButton>
          <Link
            to="/" /* {getVersionedUrl(version, "/")} */
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
          {rightSide && <HeaderCTA rightSide={rightSide} />}
        </div>
      </header>
    </div>
  );
};

export default Header;
