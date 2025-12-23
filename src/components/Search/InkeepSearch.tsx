import React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import { useInkeepSearch } from "@site/src/hooks/useInkeepSearch";
import styles from "./InkeepSearch.module.css";
import InkeepSearchIconSvg from "./inkeepIcon.svg";

export function InkeepSearch() {
  const {
    message,
    setMessage,
    isOpen,
    setIsOpen,
    Modal,
    inkeepModalProps,
    handleChange,
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
          onChange={(e) => handleChange(e.target.value)}
          onClick={() => setIsOpen(true)}
          placeholder="Search Docs"
          value={message}
        />
      </div>
      <BrowserOnly fallback={<div />}>
        {() => {
          return Modal && <Modal {...inkeepModalProps} />;
        }}
      </BrowserOnly>
    </div>
  );
}
