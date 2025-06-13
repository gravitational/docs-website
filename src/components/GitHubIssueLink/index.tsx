import styles from "./GitHubIssueLink.module.css";
import { getReportIssueURL } from "/src/utils/github-issue";

export interface GitHubIssueLinkProps {
  pathname: string;
}

export const GitHubIssueLink = function ({ pathname }: GitHubIssueLinkProps) {
  return (
    <p className={styles.githubLink}>
      <a href={getReportIssueURL(pathname)} target={"_blank"}>
        {"Report an issue with this page"}
      </a>
    </p>
  );
};
