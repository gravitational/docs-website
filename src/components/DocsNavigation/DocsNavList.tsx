import { useState } from "react";
import styles from "./DocsNavigation.module.css";
import ListSvg from "@site/src/components/Icon/svg/list-more-lines.svg";
import cn from "classnames";

interface DocsNavListProps {
  items: Array<{
    label: string;
    href: string;
  }>;
  location: {
    pathname: string;
  };
}

const DocsNavList: React.FC<DocsNavListProps> = ({ items, location }) => {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <>
      <button
        className={styles.mobileNavToggle}
        onClick={() => setNavOpen(!navOpen)}
      >
        <ListSvg />
      </button>
      <p
        className={cn(styles.mobileActiveLabel, {
          [styles.hidden]: navOpen,
        })}
      >
        {items.find((item) => location.pathname === item.href)?.label}
      </p>
      <ul className={cn(styles.navList, { [styles.open]: navOpen })}>
        {items.map((item, index) => {
          // Make sure that only items with a link are rendered
          if ("href" in item && typeof item.href === "string") {
            return (
              <li key={index} className={styles.navItem}>
                <a
                  href={item.href}
                  className={cn(styles.navLink, {
                    [styles.active]: location.pathname === item.href,
                  })}
                >
                  {item.label}
                </a>
              </li>
            );
          }
          return null;
        })}
      </ul>
    </>
  );
};

export default DocsNavList;
