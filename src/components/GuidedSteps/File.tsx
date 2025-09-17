import { useContext } from "react";
import cn from "classnames";
import { GuidedStepsContext } from "./context";
import styles from "./File.module.css";
import { extractCodeBlocksFromFile } from "./utils";
import CodeBlock from "./CodeBlock";
import Icon from "../Icon";

export const FileTabs: React.FC = () => {
  const {
    files,
    fileRefs,
    activeFileName,
    fileNameHasType,
    setActiveFileName,
  } = useContext(GuidedStepsContext);

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
      {fileNameHasType && (
        <button
          className={styles.downloadButton}
          onClick={(e) => {
            e.stopPropagation();
            const activeFileContent = fileRefs.current.get(activeFileName);
            if (activeFileContent) {
              // Create a blob with the file content
              const blob = new Blob([activeFileContent.innerText], {
                type:
                  activeFileName?.split(".").pop() === "yaml"
                    ? "application/yaml"
                    : "text/plain",
              });

              // Create a download link and trigger it
              const downloadLink = document.createElement("a");
              downloadLink.href = URL.createObjectURL(blob);
              downloadLink.download = activeFileName;
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);

              // Clean up the URL object
              URL.revokeObjectURL(downloadLink.href);
            }
          }}
        >
          <Icon name="download2" size="sm" />
          Download
        </button>
      )}
    </ul>
  );
};

const FileComponent: React.FC = () => {
  const {
    files,
    activeFileName,
    showCopyButton,
    fileNameHasType,
    setCodeBlockRef,
    setFileRef,
  } = useContext(GuidedStepsContext);

  return (
    <div className={styles.files}>
      {files.map((file) => (
        <div
          key={file.name}
          className={cn(styles.file, {
            [styles.active]: activeFileName === file.name,
          })}
          ref={(el) => setFileRef(file.name, el)}
        >
          {extractCodeBlocksFromFile(file).map(({ stepId, children }, i) => (
            <CodeBlock
              key={i}
              ref={(el) => setCodeBlockRef(stepId, el)}
              copyButtonActive={showCopyButton && fileNameHasType}
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
