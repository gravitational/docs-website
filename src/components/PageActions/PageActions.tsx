import { getReportIssueURL } from "@site/src/utils/github-issue";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import styles from "./PageActions.module.css";
import Icon from "../Icon";
import ThumbsFeedback from "../ThumbsFeedback";
import {
  copyPageContentAsMarkdown,
  normalizeMarkdownPathname,
} from "@site/src/utils/markdown";
import { Fragment, useContext, useState } from "react";
import { trackEvent } from "@site/src/utils/analytics";
import Dropdown, { DrodownItemProps as DropdownItem } from "./Dropdown";
import { SkillInfo } from "@site/scripts/prepare-files.mjs";
import Pre from "@site/src/theme/MDXComponents/Pre";
import ExclusivityContext from "../ExclusivityBanner/context";

type PageActionsProps = {
  pathname: string;
  emitEvent?: (name: string, params: any) => void;
};

const PageActions: React.FC<PageActionsProps> = ({ pathname, emitEvent }) => {
  const { frontMatter } = useDoc();
  const [copiedMessage, setCopiedMessage] = useState<string>("Copy for LLM");
  const exclusivity = useContext(ExclusivityContext);
  const skillsForPage: SkillInfo[] = exclusivity?.skillsForPage ?? [];

  const dropdownItems: DropdownItem[] = [
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

  if (skillsForPage.length > 0) {
    dropdownItems.unshift({
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
          {skillsForPage.map((skill: SkillInfo) => (
            <Fragment key={skill.name}>
              <h3>Install {skill.readableName}</h3>
              <div style={{ marginBottom: "1.5rem" }}>
                <div
                  dangerouslySetInnerHTML={{
                    __html: skill.description,
                  }}
                />
                <Pre className={styles.installCommand}>
                  <div className="hljs">{skill.installCommand}</div>
                </Pre>
              </div>
            </Fragment>
          ))}
        </>
      ),
    });
  }

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
