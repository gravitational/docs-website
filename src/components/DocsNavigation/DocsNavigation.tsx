import { useDocsSidebar } from "@docusaurus/plugin-content-docs/client";
import styles from "./DocsNavigation.module.css";
import cn from "classnames";
import { PropSidebarItem } from "@docusaurus/plugin-content-docs";
import { SidebarItemLink } from "@docusaurus/plugin-content-docs/src/sidebars/types.js";
import { useLocation } from "@docusaurus/router";

const DocsNavigation: React.FC = () => {
  const sidebar = useDocsSidebar();
  const location = useLocation();
  const items: Array<PropSidebarItem | SidebarItemLink> = sidebar ? sidebar.items : [];
  return (
    <nav id="docs-navigation" className={styles.docsNavigation}>
      <ul className={styles.navList}>
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
    </nav>
  );
};

export default DocsNavigation;
