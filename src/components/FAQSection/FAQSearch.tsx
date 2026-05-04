import { useRef } from "react";
import cn from "clsx";
import { useFAQTemplate } from "./FAQSectionsContext";
import styles from "./FAQSearch.module.css";
import Icon from "../Icon";

const FAQSearch: React.FC = () => {
  const { searchQuery, setSearchQuery } = useFAQTemplate();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.wrapper}>
      <Icon
        name="magnify"
        size="sm"
        className={styles.icon}
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        className={cn(styles.input, { [styles.active]: searchQuery })}
        placeholder="Search for a question across FAQ"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="Search for a question across FAQ"
      />
      {searchQuery && (
        <button
          className={styles.clear}
          onClick={() => {
            setSearchQuery("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default FAQSearch;
