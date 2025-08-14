import { useDocsSidebar } from "@docusaurus/plugin-content-docs/client";
import styles from "./DocsNavigation.module.css";
import { PropSidebarItem } from "@docusaurus/plugin-content-docs";
import { SidebarItemLink } from "@docusaurus/plugin-content-docs/src/sidebars/types.js";
import { useLocation } from "@docusaurus/router";
import DocsNavList from "./DocsNavList";

const DocsNavigation: React.FC = () => {
  const sidebar = useDocsSidebar();
  const location = useLocation();
  const items: Array<PropSidebarItem | SidebarItemLink> = sidebar ? sidebar.items : [];
  return (
    <nav id="docs-navigation" className={styles.docsNavigation}>
      <DocsNavList items={items} location={location} />
    </nav>
  );
};

export default DocsNavigation;
