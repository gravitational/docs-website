/**
 * File components for displaying code files with tabs.
 * 
 * This module provides:
 * - FileTabs: Tab navigation for switching between multiple code files
 * - File: Container for displaying code blocks from the active file
 * 
 * Files in the GuidedSteps system can contain multiple CodeBlocks, each linked
 * to a specific Step. Users can switch between files using tabs, and download
 * files that have extensions.
 */

import { useContext } from "react";
import cn from "classnames";
import { GuidedStepsContext } from "./context";
import styles from "./File.module.css";
import { extractCodeBlocksFromFile } from "./utils";
import CodeBlock from "./CodeBlock";
import Icon from "../Icon";

/**
 * FileTabs - Tab navigation component for switching between code files.
 * 
 * Features:
 * - Displays all available files as clickable tabs
 * - Shows file icons
 * - Highlights the active file tab
 * - Auto-scrolls active tab into view for horizontal overflow
 * - Provides download button for files with extensions
 */
export const FileTabs: React.FC = () => {
  const {
    files,
    fileRefs,
    fileTabRefs,
    activeFileName,
    fileNameHasType,
    setActiveFileName,
    setFileTabRef,
  } = useContext(GuidedStepsContext);

  return (
    <ul className={styles.fileTabs}>
      {files.map(({ name, icon }) => {
        const isActive = name === activeFileName;
        // Auto-scroll active tab into view if it's outside the visible area
        if (isActive && fileTabRefs.current.has(name)) {
          setTimeout(() => {
            const tab = fileTabRefs.current.get(name);
            const parent = tab?.parentElement;
            if (tab && parent && parent.scrollWidth > parent.clientWidth) {
              tab.scrollIntoView({
                behavior: "smooth",
                container: "nearest",
                block: "nearest",
                inline: "center",
              } as ScrollIntoViewOptions & {
                container?: "nearest" | "all";
              });
            }
          }, 0);
        }
        return (
          <li
            key={name}
            ref={(el) => setFileTabRef(name, el)}
            className={cn(styles.fileTab, {
              [styles.active]: isActive,
            })}
            role="button"
            onClick={() => {
              setActiveFileName(name);
            }}
          >
            {icon && <Icon name={icon} className={styles.fileTabIcon} />}
            <span>{name}</span>
          </li>
        );
      })}
      {/* Download button for files with extensions (e.g., config.yaml) */}
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
/**
 * File - Container component for displaying code blocks from files.
 * 
 * This component:
 * - Renders all File components (with only the active one visible)
 * - Extracts and renders CodeBlock children from each file
 * - Registers file refs for copying/downloading content
 * - Passes along state about copy button visibility
 */
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
