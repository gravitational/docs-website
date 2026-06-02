import React, { useEffect, useMemo } from "react";
import cn from "clsx";
import { useFAQTemplate } from "./FAQPageContext";
import styles from "./FAQSearch.module.css";
import Icon from "../Icon";
import { useWindowSize } from "@docusaurus/theme-common";

const FAQSearch: React.FC = () => {
  const { searchQuery, setSearchQuery, searchInputRef } = useFAQTemplate();
  const windowSize = useWindowSize();

  // Debounce search query updates to avoid excessive DOM manipulation on every keystroke
  const debouncedQuery = useMemo(() => {
    let timer: ReturnType<typeof setTimeout>;
    const debounced = (value: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => setSearchQuery(value), 150);
    };
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
  }, [setSearchQuery]);

  // Cancel any pending updates on unmount or when the search query changes
  useEffect(() => debouncedQuery.cancel, [debouncedQuery]);

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
        placeholder="Search for a question across FAQs"
        onChange={(e) =>
          windowSize !== "mobile" && debouncedQuery(e.target.value)
        }
        onBlur={(e) => {
          debouncedQuery.cancel();
          setSearchQuery(e.target.value);
        }}
        aria-label="Search for a question across FAQs"
      />
      {searchQuery && (
        <button
          className={styles.clear}
          onClick={() => {
            debouncedQuery.cancel();
            setSearchQuery("");
            searchInputRef.current!.value = "";
            searchInputRef.current?.blur();
          }}
          aria-label="Clear FAQs search"
        >
          <Icon name="x" size="sm" />
        </button>
      )}
      <button
        className={styles.searchButton}
        onClick={() => searchInputRef.current?.blur()}
        aria-label="Search FAQs"
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
