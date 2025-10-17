import React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import clsx from "clsx";
import { useInkeepSearch } from "@site/src/hooks/useInkeepSearch";
import Icon from "../../../Icon";
import styles from "./InlineSearch.module.css";
import { useWindowSize } from "@docusaurus/theme-common";

type InlineSearchProps = {
  className?: string;
  version?: string;
  displayAskAiButton?: boolean;
  mobilePlaceholder?: string;
};

export function InlineSearch({
  className = "",
  version,
  displayAskAiButton = false,
  mobilePlaceholder,
}: InlineSearchProps) {
  const window = useWindowSize({ desktopBreakpoint: 1124 });
  const { message, setMessage, isOpen, setIsOpen, Modal, inkeepModalProps } =
    useInkeepSearch({
      version,
      enableKeyboardShortcut: true,
      keyboardShortcut: "k", // ⌘+K for inline search
    });

  function getPlaceholderByPlatform() {
    const isMac =
      /Mac|Macintosh|MacIntel|MacPPC|iPad|iPhone/.test(navigator.platform) ||
      /Mac|Macintosh|MacIntel|MacPPC/.test(navigator.userAgent);
    return isMac
      ? "Search Documentation (⌘ + K)"
      : "Search Documentation (Ctrl + K)";
  }

  function getKeyCombinationByPlatform() {
    const isMac =
      /Mac|Macintosh|MacIntel|MacPPC|iPad|iPhone/.test(navigator.platform) ||
      /Mac|Macintosh|MacIntel|MacPPC/.test(navigator.userAgent);
    return isMac ? "⌘ K" : "Ctrl K";
  }

  return (
    <>
      <div className={clsx(styles.wrapper, className)}>
        <Icon name="magnify" className={styles.searchIcon} inline />
        <BrowserOnly>
          {() => {
            return (
              <>
                <input
                  type="text"
                  placeholder={
                    window === "mobile" && mobilePlaceholder
                      ? mobilePlaceholder
                      : getPlaceholderByPlatform()
                  }
                  className={styles.searchInput}
                  onClick={() => setIsOpen(true)}
                  onFocus={() => setIsOpen(true)}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  readOnly
                />
                {Modal && <Modal {...inkeepModalProps} />}
              </>
            );
          }}
        </BrowserOnly>
      </div>
      {displayAskAiButton && (
        <button
          className={styles.askAIButton}
          onClick={() => setIsOpen(true, true)}
        >
          <Icon name="wand2" size="md" />
          <span>Ask AI</span>
        </button>
      )}
    </>
  );
}
