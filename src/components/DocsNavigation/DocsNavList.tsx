import { useState } from "react";
import styles from "./DocsNavigation.module.css";
import ListSvg from "@site/src/components/Icon/svg/list-more-lines.svg";
import cn from "classnames";
import { DocsNavigationItem } from "./DocsNavigation";
import Icon from "../Icon";

interface DocsNavListProps {
  leftItems: Array<DocsNavigationItem>;
  rightItems?: Array<DocsNavigationItem>;
  location: {
    pathname: string;
  };
}

const DocNavItem: React.FC<DocsNavigationItem> = ({ label, href, items }) => {
  if (items?.length > 0) {
    return (
      <li className={cn(styles.navItem, styles.navItemDropdown)}>
        {href ? (
          <a href={href} className={styles.navLink}>
            {label}
          </a>
        ) : (
          <span className={styles.navLink}>{label}</span>
        )}
        <div className={styles.iconWrapper}>
          <Icon name="arrowRight" className={styles.icon} size="sm" />
        </div>
        <ul className={styles.subNavList}>
          {items.map((item, index) => (
            <li key={index} className={styles.subNavItem}>
              <a href={item.href} className={styles.subNavLink}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </li>
    );
  }
  return (
    <li className={styles.navItem}>
      <a href={href} className={styles.navLink}>
        {label}
      </a>
    </li>
  );
};

const DocsNavList: React.FC<DocsNavListProps> = ({
  leftItems,
  rightItems,
  location,
}) => {
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
        {leftItems.find((item) => location.pathname === item.href)?.label}
      </p>
      <ul className={cn(styles.navList, { [styles.open]: navOpen })}>
        {leftItems.map((item, index) => (
          <DocNavItem key={index} {...item} />
        ))}
      </ul>
      {rightItems?.length > 0 && (
        <ul
          className={cn(styles.navList, styles.navListRight, {
            [styles.open]: navOpen,
          })}
        >
          {rightItems.map((item, index) => (
            <DocNavItem key={index} {...item} />
          ))}
        </ul>
      )}
    </>
  );
};

export default DocsNavList;
