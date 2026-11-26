import { useFAQTemplate } from "./FAQPageContext";
import styles from "./FAQSearch.module.css";
import SearchInput from "../SearchInput";

const FAQSearch: React.FC = () => {
  const { searchQuery, setSearchQuery, searchInputRef } = useFAQTemplate();

  return (
    <SearchInput
      className={styles.wrapper}
      query={searchQuery}
      onQueryChange={setSearchQuery}
      passedRef={searchInputRef}
      placeholder="Search for a question across FAQs"
      label="Search for a question across FAQs"
      clearButtonLabel="Clear FAQs search"
      submitButtonLabel="Search FAQs"
      deferOnMobile
    />
  );
};

export default FAQSearch;
