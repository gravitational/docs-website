import React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import { useInkeepSearch } from '@site/src/hooks/useInkeepSearch';
import styles from "./InkeepSearch.module.css";
import InkeepSearchIconSvg from "./inkeepIcon.svg";

export function InkeepSearch() {
  const {
    isOpen,
    setIsOpen,
    ModalSearchAndChat,
    inkeepModalProps,
  } = useInkeepSearch({
    enableAIChat: true,
    autoOpenOnInput: true,
  });

  return (
    <div>
      <div className={styles.wrapper}>
        <InkeepSearchIconSvg className={styles.icon} />
        <input
          type="text"
          className={styles.input}
          onClick={() => setIsOpen(true)}
          placeholder="Search Docs"
        />
      </div>
      <BrowserOnly fallback={<div />}>
        {() => {
          return (
            ModalSearchAndChat && <ModalSearchAndChat {...inkeepModalProps} />
          );
        }}
      </BrowserOnly>
    </div>
  );
}
