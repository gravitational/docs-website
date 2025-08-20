import { useDocById } from "@docusaurus/plugin-content-docs/lib/client/docsUtils.js";
import styles from "./DocsNavigation.module.css";
import DocsNavList from "./DocsNavList";
import { useLocation } from "@docusaurus/router";
import { useDocsVersion } from "@docusaurus/plugin-content-docs/client";
import { getVersionedUrl } from "@site/utils/general";

type DocsNavigationProps = {
  items: Array<{
    label: string;
    href: string;
  }>;
};

const DocsNavigation: React.FC<DocsNavigationProps> = ({ items }) => {
  const location = useLocation();
  const version = useDocsVersion();

  const checkIfDocExists = (docId: string): boolean => {
    try {
      const doc = useDocById(docId);
      return !!doc;
    } catch (error) {
      return false;
    }
  };

  // utilize useDocById to make sure that only existing documents are displayed
  const availableItems = items
    .filter((item) => {
      const docId =
        item.href === "/" ? "index" : item.href.split("/").slice(1).join("/");
      const docIdLeaf = item.href.split("/").pop();

      // First check the document without inner paths
      if (checkIfDocExists(docId)) {
        return true;
      }

      // Then check if the document has inner paths
      return checkIfDocExists(`${docId}/${docIdLeaf}`);
    })
    .map((item) => ({ ...item, href: getVersionedUrl(item.href, version) }));

  return (
    <nav id="docs-navigation" className={styles.docsNavigation}>
      <DocsNavList items={availableItems} location={location} />
    </nav>
  );
};

export default DocsNavigation;
