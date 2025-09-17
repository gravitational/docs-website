import { useContext } from "react";
import cn from "classnames";
import { GuidedStepsContext } from "./context";
import styles from "./File.module.css";
import { extractCodeBlocksFromFile } from "./utils";
import CodeBlock from "./CodeBlock";
import Icon from "../Icon";

export const FileTabs: React.FC = () => {
  const { files, activeFileName, setActiveFileName } =
    useContext(GuidedStepsContext);

  return (
    <ul className={styles.fileTabs}>
      {files.map(({ name, icon }) => (
        <li
          key={name}
          className={cn(styles.fileTab, {
            [styles.active]: name === activeFileName,
          })}
          role="button"
          onClick={() => {
            setActiveFileName(name);
          }}
        >
          {icon && <Icon name={icon} className={styles.fileTabIcon} />}
          <span>{name}</span>
        </li>
      ))}
    </ul>
  );
};

const FileComponent: React.FC = () => {
  const { files, activeFileName, setCodeBlockRef } =
    useContext(GuidedStepsContext);

  return (
    <div className={styles.files}>
      {files.map((file) => (
        <div
          key={file.name}
          className={cn(styles.file, {
            [styles.active]: activeFileName === file.name,
          })}
        >
          {extractCodeBlocksFromFile(file).map(({ stepId, children }, i) => (
            <CodeBlock
              key={i}
              ref={(el) => setCodeBlockRef(stepId, el)}
              fileName={file.name}
            >
              {children}
            </CodeBlock>
          ))}
        </div>
      ))}
    </div>
  );
};

FileComponent.displayName = "File";

export default FileComponent;
