import { getReportIssueURL } from "@site/src/utils/github-issue";
import styles from "./PageActions.module.css";
import Icon from "../Icon";
import ThumbsFeedback from "../ThumbsFeedback";
import {
  copyPageContentAsMarkdown,
  normalizeMarkdownPathname,
} from "@site/src/utils/markdown";
import { useState } from "react";
import { trackEvent } from "@site/src/utils/analytics";
import Dropdown, { DrodownItemProps as DropdownItem } from "./Dropdown";
import Pre from "@site/src/theme/MDXComponents/Pre";
import skills from "@site/data/skills.json";

type PageActionsProps = {
  pathname: string;
  emitEvent?: (name: string, params: any) => void;
};

const PageActions: React.FC<PageActionsProps> = ({ pathname, emitEvent }) => {
  const [copiedMessage, setCopiedMessage] = useState<string>("Copy for LLM");

  const allSkills = skills.find((skill) => skill.name === "all-skills") || {
    name: "all-skills",
    readableName: "all skills",
    description:
      "Install all available skills. This will install all skills found in the Teleport repository.",
    installCommand: "npx skills add https://github.com/gravitational/teleport",
    rawSourceUrl:
      "https://github.com/gravitational/teleport/tree/master/skills/README.md",
  };

  const dropdownItems: DropdownItem[] = [
    {
      type: "modal",
      label: "Install Skills",
      icon: "lightbulb",
      onClick: () => {
        trackEvent({
          event_name: "skill_install_clicked",
          emitEvent: emitEvent,
        });
      },
      content: (
        <>
          <h3>Install {allSkills.readableName}</h3>
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              dangerouslySetInnerHTML={{
                __html: allSkills.description,
              }}
            />
            <Pre className={styles.installCommand}>
              <div className="hljs">{allSkills.installCommand}</div>
            </Pre>
          </div>
        </>
      ),
    },
    {
      type: "button",
      label: copiedMessage,
      icon: "clipboard",
      onClick: () => {
        trackEvent({
          event_name: `copy_page_as_markdown`,
          emitEvent: emitEvent,
        });
        copyPageContentAsMarkdown(pathname);
        setCopiedMessage("Copied!");
        setTimeout(() => setCopiedMessage("Copy for LLM"), 3000);
      },
    },
    {
      type: "link",
      label: "View as Markdown",
      icon: "codeBlock",
      href: normalizeMarkdownPathname(pathname),
      target: "_blank",
      onClick: () => {
        trackEvent({
          event_name: `view_page_as_markdown`,
          emitEvent: emitEvent,
        });
      },
    },
    /* TODO: Enable when we have a landing page for skills
{
      type: "link",
      label: "Learn more",
      icon: "note2",
      href: "https://goteleport.com/platform/ai-infrastructure/",
      target: "_blank",
    }, */
  ];

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
      <ThumbsFeedback />
      <Dropdown icon="wand2" text="Build with Agents" items={dropdownItems} />
    </div>
  );
};

export default PageActions;
