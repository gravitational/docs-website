import cn from "classnames";
import { useRef, useState, useCallback, ReactNode } from "react";
import Icon from "/src/components/Icon";
import HeadlessButton from "/src/components/HeadlessButton";
import { toCopyContent } from "/utils/general";
import styles from "./Pre.module.css";
import codeBlockStyles from "./CodeBlock.module.css";

const TIMEOUT = 1000;

interface CodeProps {
  children: ReactNode;
  className?: string;
}

const Pre = ({ children, className }: CodeProps) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const codeRef = useRef<HTMLDivElement>();
  const buttonRef = useRef<HTMLButtonElement>();

  const handleCopy = useCallback(() => {
    if (!navigator.clipboard) {
      return;
    }

    if (codeRef.current) {
      const copyText = codeRef.current.cloneNode(true) as HTMLElement;
      const descriptions = copyText.querySelectorAll("[data-type]");

      if (descriptions.length) {
        for (let i = 0; i < descriptions.length; i++) {
          descriptions[i].remove();
        }
      }

      // Assemble an array of class names of elements within copyText to copy
      // when a user clicks the copy button.
      let classesToCopy = [
        // Class name added by rehype-highlight to a `code` element when
        // highlighting syntax in code snippets
        ".hljs",
      ];

      document.body.appendChild(copyText);
      const processedInnerText = toCopyContent(copyText, classesToCopy);

      navigator.clipboard.writeText(processedInnerText);
      document.body.removeChild(copyText);
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
        buttonRef.current?.blur();
      }, TIMEOUT);
    }
  }, []);

  return (
    <div className={cn(styles.wrapper, className)}>
      <HeadlessButton
        onClick={handleCopy}
        ref={buttonRef}
        className={styles.button}
        data-testid="copy-button-all"
      >
        <Icon name="copy" />
        {isCopied && <div className={styles.copied}>Copied!</div>}
      </HeadlessButton>
      <div ref={codeRef}>
        <pre className={cn(codeBlockStyles.wrapper, styles.code)}>{children}</pre>
      </div>
    </div>
  );
};

export default Pre;
