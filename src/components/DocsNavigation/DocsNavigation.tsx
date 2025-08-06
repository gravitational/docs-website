import styles from "./DocsNavigation.module.css";
import cn from "classnames";

type DocsNavigationProps = {
  items: Array<{
    label: string;
    href: string;
  }>;
};

const DocsNavigation: React.FC<DocsNavigationProps> = ({ items }) => {
  return (
    <nav id="docs-navigation" className={styles.docsNavigation}>
      <ul className={styles.navList}>
        {items.map((item, index) => (
          <li key={index} className={styles.navItem}>
            <a
              href={item.href}
              className={cn(styles.navLink, {
                [styles.active]:
                  window.location.pathname === item.href,
              })}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default DocsNavigation;
