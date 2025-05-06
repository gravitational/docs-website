import styles from "./GitHubIssueLink.module.css";

export interface GitHubIssueLinkProps {
  pathname: string;
}

const getIssueTitle = function (pagePath: string) {
  return encodeURIComponent(`[docs] ${pagePath}: <DESCRIBE YOUR ISSUE>`);
};

const getIssueBody = function (pagePath: string) {
  return encodeURIComponent(`## Applies To

${pagePath}

## Details

<!-- Describe the documentation improvements you wish to see. -->

## How will we know this is resolved?

<!-- Briefly describe a test we can carry out. Scope this as narrowly as possible. -->

## Related Issues

<!-- Please make an effort to find related issues on GitHub and list them here. This makes a big difference in how we prioritize and schedule work. -->
`);
};

export const getReportIssueURL = function (pagePath: string): string {
  const mdxPath = "`" + pagePath + "`";
  return `https://github.com/gravitational/teleport/issues/new?template=documentation.md&labels=documentation&title=${getIssueTitle(mdxPath)}&body=${getIssueBody(mdxPath)}`;
};
export const GitHubIssueLink = function ({ pathname }: GitHubIssueLinkProps) {
  return (
    <p className={styles.githubLink}>
      <a href={getReportIssueURL(pathname)} target={"_blank"}>
        {"Report an issue with this page"}
      </a>
    </p>
  );
};
