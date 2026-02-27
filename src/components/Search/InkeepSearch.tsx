import React, { useEffect } from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import { useInkeepSearch } from '@site/src/hooks/useInkeepSearch';
import styles from "./InkeepSearch.module.css";
import InkeepSearchIconSvg from "./inkeepIcon.svg";
import { useLocation } from "@docusaurus/router";

export function InkeepSearch() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQueryFromParams = searchParams.get('q');
  const {
    message,
    setMessage,
    isOpen,
    setIsOpen,
    ModalSearchAndChat,
    inkeepModalProps,
    handleChange,
  } = useInkeepSearch({
    enableAIChat: true,
    autoOpenOnInput: true,
    defaultQuery: searchQueryFromParams ?? undefined,
  });

  useEffect(() => {
    if (searchQueryFromParams) {
      setIsOpen(true);
    }
  }, [searchQueryFromParams]);

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
          return (
            ModalSearchAndChat && <ModalSearchAndChat {...inkeepModalProps} />
          );
        }}
      </BrowserOnly>
    </div>
  );
}
