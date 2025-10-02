import { clsx } from "clsx";
import { useState, useCallback, useEffect, useRef } from "react";

import { BannerData, EventBanner } from "../EventBanner";

import type { HeaderNavigation } from "../../../server/strapi-types";
import Icon from "../Icon";
import DocsLogo from "@site/static/logo.svg";
import Button from "../Button";
import HeadlessButton from "../HeadlessButton";

import HeaderCTA from "./HeaderCTA";
import styles from "./Header.module.css";

import eventData from "../../../data/events.json";
import data from "../../../data/navbar.json";
import { InlineSearch } from "../Pages/Homepage/DocsHeader/InlineSearch";
import { useNavbarMobileSidebar } from "@docusaurus/theme-common/internal";
import { translate } from "@docusaurus/Translate";

const Header = () => {
  const { toggle, shown } = useNavbarMobileSidebar();
  const headerRef = useRef<HTMLDivElement>(null);
  const [isNavigationVisible, setIsNavigationVisible] =
    useState<boolean>(false);
  const toggleNavigation = useCallback(() => {
    setIsNavigationVisible((value) => !value);
    toggle();
  }, [isNavigationVisible]);

  const { menuItems, rightSide } = data as unknown as HeaderNavigation;
  const mobileBtn = rightSide?.mobileButton;
  const event = eventData ? (eventData as unknown as BannerData) : null;

  useEffect(() => {
    const handleResize = () => {
      if (event) {
        document.documentElement.style.setProperty(
          "--ifm-navbar-height",
          headerRef.current
            ? `${headerRef.current.getBoundingClientRect().height}px`
            : "122px"
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
              name={isNavigationVisible ? "closeLarger" : "hamburger"}
              size="lg"
            />
          </HeadlessButton>
          <a href="/" className={styles["logo-link"]}>
            <DocsLogo className={styles.logo} />
          </a>
        </div>
        <div className={styles.searchBar}>
          <InlineSearch
            className={styles.inlineSearch}
            mobilePlaceholder="Search"
          />
        </div>
        <div className={styles.content}>
          {rightSide && <HeaderCTA rightSide={rightSide} />}
        </div>
      </header>
    </div>
  );
};

export default Header;
