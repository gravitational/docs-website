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
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "@docusaurus/Link";

const PageActions: React.FC<{ pathname: string }> = ({ pathname }) => {
  const { setIsOpen, ModalSearchAndChat, inkeepModalProps } = useInkeepSearch({
    enableAIChat: true,
  });
  const [copiedMessage, setCopiedMessage] = useState<string>("Copy for LLM");

  const copyButtonRef = useRef<HTMLButtonElement>(null);

  const copyButtonWidth = useMemo(
    () => copyButtonRef.current?.offsetWidth || 125,
    [],
  );

  return (
    <div className={styles.pageActions}>
      <button
        className={styles.askAIButton}
        style={{ minWidth: `${copyButtonWidth}px` }}
        ref={copyButtonRef}
        onClick={() => {
          copyPageContentAsMarkdown(pathname);
          setCopiedMessage("Copied!");
          setTimeout(() => setCopiedMessage("Copy for LLM"), 4000);
        }}
      >
        <Icon size="md" name="copySimple" />
        <span>{copiedMessage}</span>
      </button>
      <a
        className={styles.askAIButton}
        href={normalizeMarkdownPathname(pathname)}
        target="_blank"
      >
        <Icon size="md" name="arrowSquareOut" />
        <span>View as markdown</span>
      </a>
      <a
        className={styles.githubLink}
        href={getReportIssueURL(pathname)}
        target={"_blank"}
      >
        <Icon size="md" name="clipboard" />
        <span>Report an Issue</span>
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
