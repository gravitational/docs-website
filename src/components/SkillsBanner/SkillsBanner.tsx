import { useContext, useState } from "react";
import cn from "clsx";
import ExclusivityContext from "../ExclusivityBanner/context";
import Icon from "../Icon";
import styles from "./SkillsBanner.module.css";
import Button from "../Button";
import { Modal } from "../Modal";
import Pre from "@site/src/theme/MDXComponents/Pre";
import { trackEvent } from "@site/src/utils/analytics";

const SkillsBanner: React.FC<{
  emitEvent?: (name: string, params: any) => void;
}> = ({ emitEvent }) => {
  const [modalActive, setModalActive] = useState<string | null>(null);
  const exclusivityContext = useContext(ExclusivityContext);
  const skillsForPage = exclusivityContext?.skillsForPage ?? [];

  if (skillsForPage.length === 0) {
    return null;
  }

  return skillsForPage.map((skill) => (
    <div key={skill.name} className={styles.skillsBanner}>
      <span className={cn(styles.skillBadge, "skillBadge")}>
        <Icon name="lightbulb" size="sm" /> Skill Available
      </span>
      <div>
        <h2 className={styles.title}>{skill.readableName}</h2>
        {/*
        we use dangerouslySetInnerHTML here because the description may contain elements
        such as inline code that we want to render as HTML. We trust the source of this
        content, which is the SKILL.md files found in the /skills folder of the Teleport
        repository.      
      */}
        <div
          className={styles.description}
          dangerouslySetInnerHTML={{ __html: skill.description }}
        />
      </div>
      <div className={styles.actions}>
        <Button
          as="button"
          className={styles.button}
          variant="primary"
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
          Install Skill
        </Button>
        <Button
          as="link"
          className={styles.button}
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
          View Raw Skill <Icon name="arrowSquareOut" size="sm" />
        </Button>
        {modalActive === skill.name && (
          <Modal onClose={() => setModalActive(null)}>
            <h3>Install {skill.readableName}</h3>
            <div dangerouslySetInnerHTML={{ __html: skill.description }} />
            <Pre>
              <div className="hljs">{skill.installCommand}</div>
            </Pre>
          </Modal>
        )}
      </div>
    </div>
  ));
};

export default SkillsBanner;
