import { getReportIssueURL } from "@site/src/utils/github-issue";
import styles from "./PageActions.module.css";
import Icon from "../Icon";
import { useInkeepSearch } from "@site/src/hooks/useInkeepSearch";
import BrowserOnly from "@docusaurus/BrowserOnly";
import ThumbsFeedback from "../ThumbsFeedback";
import {
  copyPageContentAsMarkdown,
  normalizeMarkdownPathname,
} from "@site/src/utils/markdown";
import { useMemo, useRef, useState } from "react";
import { useWindowSize } from "@docusaurus/theme-common";

const PageActions: React.FC<{ pathname: string }> = ({ pathname }) => {
  const { setIsOpen, ModalSearchAndChat, inkeepModalProps } = useInkeepSearch({
    enableAIChat: true,
  });
  const windowSize = useWindowSize();
  const [copiedMessage, setCopiedMessage] = useState<string>("Copy for LLM");

  const copyButtonRef = useRef<HTMLButtonElement>(null);

  const copyButtonWidth = useMemo(
    () => copyButtonRef.current?.offsetWidth || 125,
    [],
  );

  return (
    <div className={styles.pageActions}>
      <a
        className={styles.githubLink}
        href={getReportIssueURL(pathname)}
        target={"_blank"}
      >
        <Icon size="md" name="githubLogo" />
        <span>Report an Issue</span>
      </a>
      <button
        className={styles.askAIButton}
        style={
          windowSize === "desktop" ? { minWidth: `${copyButtonWidth}px` } : {}
        }
        ref={copyButtonRef}
        onClick={() => {
          copyPageContentAsMarkdown(pathname);
          setCopiedMessage("Copied!");
          setTimeout(() => setCopiedMessage("Copy for LLM"), 3000);
        }}
      >
        <Icon size="md" name="clipboard" />
        <span>{copiedMessage}</span>
      </button>
      <a
        className={styles.askAIButton}
        href={normalizeMarkdownPathname(pathname)}
        target="_blank"
      >
        <Icon size="md" name="markdown" />
        <span>View as Markdown</span>
      </a>
      <ThumbsFeedback />
      <BrowserOnly fallback={<div />}>
        {() => {
          return (
            ModalSearchAndChat && <ModalSearchAndChat {...inkeepModalProps} />
          );
        }}
      </BrowserOnly>
    </div>
  );
};

export default PageActions;
