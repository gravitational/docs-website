import { useEffect, useId, useRef, useState } from "react";
import cn from "clsx";
import Icon from "@site/src/components/Icon";
import styles from "./FilterDropdown.module.css";

export interface FilterDropdownOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  options: FilterDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  // accessible label of the dropown to announce with the selected option
  label: string;
  className?: string;
  triggerClassName?: string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  value,
  onChange,
  label,
  className,
  triggerClassName,
}) => {
  const id = useId();
  const labelId = `${id}-label`;
  const buttonId = `${id}-button`;
  const listboxId = `${id}-listbox`;
  const optionId = (index: number) => `${id}-option-${index}`;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const lastIndex = options.length - 1;

  const open = () => {
    setActiveIndex(selectedIndex);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const select = (index: number) => {
    onChange(options[index].value);
    close();
  };

  // Move focus to the listbox when it opens, so it receives keyboard events
  useEffect(() => {
    if (isOpen) listboxRef.current?.focus();
  }, [isOpen]);

  // Keep the active option visible when navigating a scrollable list
  useEffect(() => {
    if (!isOpen) return;
    const option = listboxRef.current?.children[activeIndex] as
      | HTMLElement
      | undefined;
    option?.scrollIntoView?.({ block: "nearest" });
  }, [isOpen, activeIndex]);

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    // Enter and Space are handled by the native button click
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      open();
    }
  };

  const handleListboxKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, lastIndex));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(lastIndex);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        select(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={cn(styles.dropdown, className, { [styles.open]: isOpen })}
    >
      <span id={labelId} className={styles.visuallyHidden}>
        {label}
      </span>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        className={cn(styles.trigger, triggerClassName)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-labelledby={`${labelId} ${buttonId}`}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleButtonKeyDown}
      >
        <span className={styles.triggerLabel}>
          {options[selectedIndex]?.label}
        </span>
        <Icon name="caretUp" size="sm" className={styles.caret} />
      </button>
      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          aria-activedescendant={optionId(activeIndex)}
          className={styles.menu}
          onKeyDown={handleListboxKeyDown}
          onBlur={(e) => {
            // Close when focus moves outside the dropdown, e.g. on an outside click
            if (!wrapperRef.current?.contains(e.relatedTarget as Node | null)) {
              setIsOpen(false);
            }
          }}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={index === selectedIndex}
              className={cn(styles.option, {
                [styles.active]: index === activeIndex,
                [styles.selected]: index === selectedIndex,
              })}
              onMouseMove={() => setActiveIndex(index)}
              onClick={() => select(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FilterDropdown;
