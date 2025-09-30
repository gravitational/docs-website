import { useState } from "react";
import styles from "./DocsNavigation.module.css";
import ListSvg from "@site/src/components/Icon/svg/list-more-lines.svg";
import cn from "classnames";
import { DocsNavigationItem } from "./DocsNavigation";
import Icon from "../Icon";
import Link from "@docusaurus/Link";

interface DocsNavListProps {
  leftItems: Array<DocsNavigationItem>;
  rightItems?: Array<DocsNavigationItem>;
  location: {
    pathname: string;
  };
}

function includesPath(
  path: string | undefined,
  comparedPath: string | undefined
): boolean {
  const normalizePath = (path: string | undefined) => {
    if (!path) return path;
    return path.endsWith("/") ? path.toLowerCase() : `${path}/`.toLowerCase();
  };

  if (comparedPath === "/")
    return normalizePath(comparedPath) === normalizePath(path);

  return path.includes(normalizePath(comparedPath));
}

const DocNavItem: React.FC<DocsNavigationItem> = ({
  label,
  href,
  items,
  location,
}) => {
  if (items?.length > 0) {
    return (
      <li className={cn(styles.navItem, styles.navItemDropdown)}>
        {href ? (
          <Link
            to={href}
            className={cn(styles.navLink, {
              [styles.active]:
                includesPath(location.pathname, href) ||
                items.some((item) =>
                  includesPath(location.pathname, item.href)
                ),
            })}
          >
            {label}
          </Link>
        ) : (
          <span
            className={cn(styles.navLink, {
              [styles.active]: items.some((item) =>
                includesPath(location.pathname, item.href)
              ),
            })}
          >
            {label}
          </span>
        )}
        <div className={styles.iconWrapper}>
          <Icon name="arrowRight" className={styles.icon} size="sm" />
        </div>
        <ul className={styles.subNavList}>
          {items.map((item, index) => (
            <li key={index} className={styles.subNavItem}>
              <Link
                to={item.href}
                className={cn(styles.subNavLink, {
                  [styles.active]: includesPath(location.pathname, item.href),
                })}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </li>
    );
  }
  return (
    <li className={styles.navItem}>
      <Link
        to={href}
        className={cn(styles.navLink, {
          [styles.active]: includesPath(location.pathname, href),
        })}
      >
        {label}
      </Link>
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
          <DocNavItem key={index} {...item} location={location} />
        ))}
      </ul>
      {rightItems?.length > 0 && (
        <ul
          className={cn(styles.navList, styles.navListRight, {
            [styles.open]: navOpen,
          })}
        >
          {rightItems.map((item, index) => (
            <DocNavItem key={index} {...item} location={location} />
          ))}
        </ul>
      )}
    </>
  );
};

export default DocsNavList;
