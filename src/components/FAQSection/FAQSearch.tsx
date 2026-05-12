import React from "react";
import cn from "clsx";
import { useFAQTemplate } from "./FAQSectionsContext";
import styles from "./FAQSearch.module.css";
import Icon from "../Icon";
import { useWindowSize } from "@docusaurus/theme-common";

const FAQSearch: React.FC = () => {
  const { searchQuery, setSearchQuery, searchInputRef } = useFAQTemplate();
  const windowSize = useWindowSize();

  return (
    <div className={styles.wrapper}>
      <Icon
        name="magnify"
        size="sm"
        className={styles.icon}
        aria-hidden="true"
      />
      <input
        ref={searchInputRef}
        type="search"
        className={cn(styles.input, { [styles.active]: searchQuery })}
        placeholder="Search for a question across FAQ"
        onChange={(e) =>
          windowSize !== "mobile" && setSearchQuery(e.target.value)
        }
        onBlur={(e) => setSearchQuery(e.target.value)}
        aria-label="Search for a question across FAQ"
      />
      {searchQuery && (
        <button
          className={styles.clear}
          onClick={() => {
            setSearchQuery("");
            searchInputRef.current!.value = "";
            searchInputRef.current?.blur();
          }}
          aria-label="Clear FAQ search"
        >
          <Icon name="x" size="sm" />
        </button>
      )}
      <button
        className={styles.searchButton}
        onClick={() => searchInputRef.current?.blur()}
        aria-label="Search"
      >
        <Icon
          name="magnify"
          size="md"
          className={styles.mobileSearchButtonIcon}
          aria-hidden="true"
        />
      </button>
    </div>
  );
};

export default FAQSearch;
