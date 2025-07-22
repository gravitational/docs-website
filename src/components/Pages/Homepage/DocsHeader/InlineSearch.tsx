import React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import clsx from 'clsx';
import { useInkeepSearch } from '@site/src/hooks/useInkeepSearch';
import Icon from "../../../Icon";
import styles from "./InlineSearch.module.css";

type InlineSearchProps = {
  className?: string;
  version?: string;
};

export function InlineSearch({ className = '', version }: InlineSearchProps) {
  const {
    message,
    setMessage,
    isOpen,
    setIsOpen,
    ModalSearchAndChat,
    inkeepModalProps,
  } = useInkeepSearch({
    version,
    enableKeyboardShortcut: true,
    keyboardShortcut: 'f', // ⌘+F for inline search
  });

  return (
    <div className={clsx(styles.wrapper, className)}>
      <Icon name="magnify" className={styles.searchIcon} inline />
      <input
        type="text"
        placeholder="Search Docs or Press ⌘ + F"
        className={styles.searchInput}
        onClick={() => setIsOpen(true)}
        onFocus={() => setIsOpen(true)}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        readOnly
      />
      
      <BrowserOnly>
        {() => {
          return (
            ModalSearchAndChat && <ModalSearchAndChat {...inkeepModalProps} />
          );
        }}
      </BrowserOnly>
    </div>
  );
}
