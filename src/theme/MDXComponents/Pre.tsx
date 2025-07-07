import cn from "classnames";
import { useRef, useState, useCallback, ReactNode } from "react";
import Icon from "/src/components/Icon";
import HeadlessButton from "/src/components/HeadlessButton";
import { toCopyContent } from "/utils/general";
import styles from "./Pre.module.css";
import commandStyles from "/src/components/Command/Command.module.css";
import codeBlockStyles from "./CodeBlock.module.css";
import { makeCodeSnippetGtagEvent, logGtag } from "/src/utils/gtag";
import { Children } from "react";

const TIMEOUT = 1000;

interface CodeProps {
  children: ReactNode;
  className?: string;
  gtag?: (command: string, name: string, params: any) => {};
}

const Pre = ({ children, className, gtag }: CodeProps) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const codeRef = useRef<HTMLDivElement>();
  const buttonRef = useRef<HTMLButtonElement>();

  // Get the code snippet label for the inner code element.
  let langLabel = "";
  Children.forEach(children, (child, index) => {
    if (!child.type || child.type != "code") {
      return;
    }

    if (
      !child.props ||
      !child.props.className ||
      !child.props.className.includes("hljs")
    ) {
      return;
    }

    langLabel = child.props.className
      .split(" ")
      .find((c) => c.startsWith("language-"))
      .slice("language-".length);
  });

  const handleCopy = useCallback(() => {
    const { name, params } = makeCodeSnippetGtagEvent("snippet", langLabel);
    const gtagFn = gtag || window.gtag || logGtag;
    gtagFn("event", name, params);

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

      // If copyText includes at least one CommandLine, the intention is for
      // users to copy commands and not example outputs (CodeLines). If there
      // are no CommandLines, it is fine to copy the CodeLines.
      if (copyText.getElementsByClassName(commandStyles.line).length > 0) {
        classesToCopy.push("." + commandStyles.line);
      } else {
        classesToCopy.push("." + codeBlockStyles.line);
      }

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
        <pre className={cn(codeBlockStyles.wrapper, styles.code)}>
          {children}
        </pre>
      </div>
    </div>
  );
};

export default Pre;
