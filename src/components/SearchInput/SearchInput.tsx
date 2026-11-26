import { useEffect, useMemo, useRef, RefObject } from "react";
import cn from "clsx";
import { useWindowSize } from "@docusaurus/theme-common";
import Icon from "../Icon";
import styles from "./SearchInput.module.css";

export interface SearchInputProps {
  // The applied search query.
  query: string;
  // A callback which is called when a new query is entered after the debounce), on blur and when the query is cleared.
  onQueryChange: (query: string) => void;
  placeholder: string;
  label: string;
  // Accessible label.
  clearButtonLabel: string;
  // The submit button is only rendered below the xl breakpoint if the label is provided.
  submitButtonLabel?: string;
  // When true, the search is only applied on blur / when the submit button is pressed.
  deferOnMobile?: boolean;
  debounceMs?: number;
  // Optional external ref to allow other components to focus the input for example.
  passedRef?: RefObject<HTMLInputElement | null>;
  className?: string;
  inputClassName?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  query,
  onQueryChange,
  placeholder,
  label,
  clearButtonLabel,
  submitButtonLabel,
  deferOnMobile = false,
  debounceMs = 150,
  passedRef,
  className,
  inputClassName,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ref = passedRef ?? inputRef;
  const windowSize = useWindowSize();

  // Debounce query updates to avoid searching immediately on every keystroke.
  const debouncedQuery = useMemo(() => {
    let timer: ReturnType<typeof setTimeout>;
    const debounced = (value: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => onQueryChange(value), debounceMs);
    };
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
  }, [onQueryChange, debounceMs]);

  // Cancel any pending updates on unmount or when the debounced function changes
  useEffect(() => debouncedQuery.cancel, [debouncedQuery]);

  return (
    <div
      className={cn(styles.wrapper, className, {
        [styles.withSubmitButton]: submitButtonLabel,
      })}
    >
      <Icon
        name="magnify"
        size="sm"
        className={styles.icon}
        aria-hidden="true"
      />
      <input
        ref={ref}
        type="search"
        className={cn(styles.input, inputClassName, {
          [styles.active]: query,
        })}
        placeholder={placeholder}
        onChange={(e) => {
          if (deferOnMobile && windowSize === "mobile") return;
          debouncedQuery(e.target.value);
        }}
        onBlur={(e) => {
          debouncedQuery.cancel();
          onQueryChange(e.target.value);
        }}
        aria-label={label}
      />
      {query && (
        <button
          type="button"
          className={styles.clear}
          onClick={() => {
            debouncedQuery.cancel();
            onQueryChange("");
            if (ref.current) {
              ref.current.value = "";
              ref.current.blur();
            }
          }}
          aria-label={clearButtonLabel}
        >
          <Icon name="x" size="sm" />
        </button>
      )}
      {submitButtonLabel && (
        <button
          type="button"
          className={styles.submitButton}
          onClick={() => ref.current?.blur()}
          aria-label={submitButtonLabel}
        >
          <Icon
            name="magnify"
            size="md"
            className={styles.submitButtonIcon}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
