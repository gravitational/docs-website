import { getReportIssueURL } from "@site/src/utils/github-issue";
import styles from "./PageActions.module.css";
import Icon from "../Icon";
import { useInkeepSearch } from "@site/src/hooks/useInkeepSearch";
import BrowserOnly from "@docusaurus/BrowserOnly";
import ThumbsFeedback from "../ThumbsFeedback";

const PageActions: React.FC<{ pathname: string }> = ({ pathname }) => {
  const { setIsOpen, ModalSearchAndChat, inkeepModalProps } = useInkeepSearch({
    enableAIChat: true,
  });
  return (
    <div className={styles.pageActions}>
      <button className={styles.askAIButton} onClick={() => setIsOpen(true)}>
        <Icon size="md" name="wand2" />
        <span>Search using Ask AI</span>
      </button>
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
