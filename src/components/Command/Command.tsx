import { useRef, useState, useCallback, useContext, ReactNode } from "react";
import { PositionContext } from "/src/components/PositionProvider";
import { nanoid } from "nanoid";
import Icon from "/src/components/Icon";
import HeadlessButton from "/src/components/HeadlessButton";
import { toCopyContent } from "/utils/general";
import styles from "./Command.module.css";
import { trackEvent } from "/src/utils/analytics";

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
  emitEvent?: (name: string, params: any) => {};
}

const commandKey = "command";

export default function Command({ children, emitEvent, ...props }: CommandProps) {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const codeRef = useRef<HTMLDivElement>();
  const posProvider = useContext(PositionContext);
  const thisID = useRef(nanoid());
  let pos: undefined | number;
  if (posProvider) {
    pos = posProvider.registerPosition(commandKey, thisID.current);
  }

  const handleCopy = useCallback(() => {
    let commandCount: undefined | number;
    let containerPosition: undefined | number;
    let containerCount: undefined | number;
    if (posProvider) {
      commandCount = posProvider.getItemCount(commandKey);
      containerPosition = posProvider.getContainerPosition();
      containerCount = posProvider.getContainerCount();
    }
    trackEvent({
      event_name: "code_copy_button",
      custom_parameters: {
        scope: "line",
        label: "code",
        code_snippet_index_on_page: containerPosition,
        code_snippet_count_on_page: containerCount,
        line_index_in_snippet: pos,
        line_count_in_snippet: commandCount,
      },
      emitEvent: emitEvent,
    });

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
