import { useRef, useState, useCallback, ReactNode } from "react";
import Icon from "/src/components/Icon";
import HeadlessButton from "/src/components/HeadlessButton";
import { toCopyContent } from "/utils/general";
import styles from "./Command.module.css";
import { makeCodeSnippetGtagEvent, logGtag } from "/src/utils/gtag";

const TIMEOUT = 1000;

export interface CommandLineProps {
  children: ReactNode;
}

export function CommandLine(props: CommandLineProps) {
  return <span className={styles.line} {...props} />;
}

export interface CommandCommentProps {
  children: ReactNode;
}

export function CommandComment(props: CommandCommentProps) {
  return <p className={styles.comment} {...props} />;
}

export interface CommandProps {
  children: ReactNode;
  gtag?: (command: string, name: string, params: any) => {};
}

export default function Command({ children, gtag, ...props }: CommandProps) {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const codeRef = useRef<HTMLDivElement>();

  const handleCopy = useCallback(() => {
    const { name, params } = makeCodeSnippetGtagEvent("line", "code");
    const gtagFn = gtag || window.gtag || logGtag;
    gtagFn("event", name, params);

    if (!navigator.clipboard) {
      return;
    }

    if (codeRef.current) {
      const procesedInnerText = toCopyContent(codeRef.current, [
        "." + styles.line,
      ]);

      navigator.clipboard.writeText(procesedInnerText);
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, TIMEOUT);
    }
  }, []);

  return (
    <div {...props} ref={codeRef} className={styles.command}>
      <HeadlessButton
        onClick={handleCopy}
        className={styles.button}
        data-testid="copy-button"
      >
        {isCopied ? (
          <Icon size="sm" name="check" />
        ) : (
          <Icon size="sm" name="copy" />
        )}
      </HeadlessButton>
      {children}
    </div>
  );
}
