import { useDocById } from "@docusaurus/plugin-content-docs/lib/client/docsUtils.js";
import styles from "./DocsNavigation.module.css";
import DocsNavList from "./DocsNavList";
import { useLocation } from "@docusaurus/router";

type DocsNavigationProps = {
  items: Array<{
    label: string;
    href: string;
  }>;
};

const DocsNavigation: React.FC<DocsNavigationProps> = ({ items }) => {
  const location = useLocation();
  const checkIfDocExists = (docId: string): boolean => {
    try {
      const doc = useDocById(docId);
      return !!doc;
    } catch (error) {
      return false;
    }
  };

  const availableItems = items.filter((item) => {
    const docId = item.href === "/" ? "index" : item.href.split("/").slice(1).join("/");
    const docIdLeaf = item.href.split("/").pop();

    console.log(`${docId}/${docIdLeaf}`);

    // First check the document without inner paths
    if (checkIfDocExists(docId)) {
      return true;
    }
    
    // Then check if the document has inner paths
    return checkIfDocExists(`${docId}/${docIdLeaf}`);
  });

  return (
    <nav id="docs-navigation" className={styles.docsNavigation}>
      <DocsNavList items={availableItems} location={location} />
    </nav>
  );
};

export default DocsNavigation;
