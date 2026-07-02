import skills from "@site/data/skills.json";
import cn from "clsx";
import { Modal } from "../Modal";
import React, { useState, Children, isValidElement, useMemo } from "react";
import styles from "./SkillsTable.module.css";
import Button from "../Button";
import Icon from "../Icon";
import Pre from "@site/src/theme/MDXComponents/Pre";
import { trackEvent } from "@site/src/utils/analytics";

/**
 * SkillsTable component renders a table of skills with their names, descriptions, and
 * actions (installing skills and viewing raw skill files).
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The children elements to be rendered inside
 * the component. Expected to be a single heading element (h1-h6) for the table title.
 * Used to pass Docusaurus's automatic hash link component to the heading. Otherwise the
 * children will be ignored.
 * @param {Function} [props.emitEvent] - Optional function to emit analytics events in testing.
 * @returns {JSX.Element} The rendered SkillsTable component.
 */
const SkillsTable: React.FC<{
  children: React.ReactNode;
  emitEvent?: (name: string, params: any) => void;
}> = ({ children, emitEvent }) => {
  const [modalActive, setModalActive] = useState<string | null>(null);
  const hTags = ["h1", "h2", "h3", "h4", "h5", "h6"];
  const childrenArray = Children.toArray(children);
  const isSingularHeading = (() => {
    if (childrenArray.length !== 1 || !isValidElement(childrenArray[0])) {
      return false;
    }
    const { type } = childrenArray[0];
    const tagName =
      typeof type === "string" ? type : (type as React.ComponentType).name;
    return hTags.includes(tagName);
  })();

  const activeSkill = useMemo(() => {
    if (!modalActive) return null;
    return skills.find((skill) => skill.name === modalActive) || null;
  }, [modalActive]);

  return (
    <div className={styles.skillsTableContainer}>
      <div className={styles.header}>
        {isSingularHeading ? children : null}
        <Button
          as="button"
          className={styles.installAllButton}
          onClick={(e) => {
            e.stopPropagation();
            setModalActive("all-skills");
            trackEvent({
              event_name: "skill_install_clicked",
              custom_parameters: {
                skill_name: "all-skills",
              },
              emitEvent: emitEvent,
            });
          }}
        >
          Install skills
        </Button>
      </div>
      <table className={styles.skillsTable}>
        <thead>
          <tr>
            <th style={{ textAlign: "start" }}>Skill Name</th>
            <th style={{ textAlign: "start" }}>Description</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {skills
            .filter((skill) => skill.name !== "all-skills")
            .map((skill) => (
              <tr key={skill.name}>
                <th scope="row" className={styles.skillNameCell}>
                  <code>{skill.name}</code>
                </th>
                <td dangerouslySetInnerHTML={{ __html: skill.description }} />
                <td className={styles.actionCell}>
                  <Button
                    as="button"
                    aria-label={`Install ${skill.readableName}`}
                    className={styles.button}
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalActive(skill.name);
                      trackEvent({
                        event_name: "skill_install_clicked",
                        custom_parameters: {
                          skill_name: skill.name,
                        },
                        emitEvent: emitEvent,
                      });
                    }}
                  >
                    Install
                  </Button>
                  <Button
                    as="link"
                    aria-label={`View Raw Skill for ${skill.readableName}`}
                    className={cn(styles.button, styles.rawSkillLink)}
                    variant="borderless"
                    href={skill.rawSourceUrl}
                    target="_blank"
                    onClick={() => {
                      trackEvent({
                        event_name: "view_raw_skill_clicked",
                        custom_parameters: {
                          skill_name: skill.name,
                        },
                        emitEvent: emitEvent,
                      });
                    }}
                  >
                    View Raw Skill <Icon name="arrowSquareOut" size="xs" />
                  </Button>
                </td>
              </tr>
            ))}
        </tbody>
        {activeSkill && (
          <Modal onClose={() => setModalActive(null)}>
            <h3>Install {activeSkill.readableName}</h3>
            <div
              // we use dangerouslySetInnerHTML here because the description may contain elements
              // such as inline code that we want to render as HTML. We trust the source of this
              // content, which is the SKILL.md files found in the /skills folder of the Teleport
              // repository.
              dangerouslySetInnerHTML={{ __html: activeSkill.description }}
            />
            <Pre>
              <div className="hljs">{activeSkill.installCommand}</div>
            </Pre>
          </Modal>
        )}
      </table>
    </div>
  );
};

export default SkillsTable;
