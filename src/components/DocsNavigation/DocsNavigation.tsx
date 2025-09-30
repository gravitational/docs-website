import { useDocById } from "@docusaurus/plugin-content-docs/lib/client/docsUtils.js";
import styles from "./DocsNavigation.module.css";
import DocsNavList from "./DocsNavList";
import { useLocation } from "@docusaurus/router";

export type DocsNavigationItem = {
  label: string;
  href?: string;
  items?: Array<DocsNavigationItem>;
  location: {
    pathname: string;
  };
};

type DocsNavigationItemSplit = "split";

type DocsNavigationProps = {
  items: Array<DocsNavigationItem | DocsNavigationItemSplit>;
};

const DocsNavigation: React.FC<DocsNavigationProps> = ({ items }) => {
  const location = useLocation();

  let leftItems = items;
  let rightItems = [];

  const checkIfDocExists = (docId: string): boolean => {
    try {
      const doc = useDocById(docId);
      return !!doc;
    } catch (error) {
      return false;
    }
  };

  const filterBrokenLinks = (item: DocsNavigationItem) => {
    if (!item.href) return true;
    const docId =
      item.href === "/"
        ? "index"
        : item.href.split("/").slice(1).join("/").split("/")[0];
    const docIdLeaf = item.href.split("/")[1].split("/")[0];

    // First check the document without inner paths
    if (checkIfDocExists(docId)) {
      return true;
    }

    // Then check if the document has inner paths
    return checkIfDocExists(`${docId}/${docIdLeaf}`);
  };

  const filterNestedItems = (item: DocsNavigationItem): DocsNavigationItem => {
    if (item.items?.length > 0) {
      return {
        ...item,
        items: item.items.filter(filterBrokenLinks).map(filterNestedItems),
      };
    }
    return item;
  };

  const splitIndex = items.findIndex((item) => item === "split");

  if (splitIndex !== -1) {
    leftItems = items.slice(0, splitIndex);
    rightItems = items.slice(splitIndex + 1);
  }

  // utilize useDocById to make sure that only existing documents are displayed
  const availableLeftItems = (leftItems as Array<DocsNavigationItem>)
    .filter(filterBrokenLinks)
    .map((item) => filterNestedItems(item));

  const availableRightItems = (rightItems as Array<DocsNavigationItem>)
    .filter(filterBrokenLinks)
    .map((item) => filterNestedItems(item));

  return (
    <nav id="docs-navigation" className={styles.docsNavigation}>
      <DocsNavList
        leftItems={availableLeftItems}
        rightItems={availableRightItems}
        location={location}
      />
    </nav>
  );
};

export default DocsNavigation;
