import styles from "./DocsNavigation.module.css";
import DocsNavList from "./DocsNavList";

type DocsNavigationProps = {
  items: Array<{
    label: string;
    href: string;
  }>;
};

const DocsNavigation: React.FC<DocsNavigationProps> = ({ items }) => {
  return (
    <nav id="docs-navigation" className={styles.docsNavigation}>
      <DocsNavList items={items} location={location} />
    </nav>
  );
};

export default DocsNavigation;
