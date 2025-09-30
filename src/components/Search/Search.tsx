import React from "react";

import styles from "./Search.module.css";
import { InlineSearch } from "@site/src/components/Pages/Homepage/DocsHeader/InlineSearch";

export default function Search() {
  return (
    <div className={styles.searchBar}>
      <InlineSearch
        className={styles.inlineSearch}
        mobilePlaceholder="Search"
      />
    </div>
  );
}
