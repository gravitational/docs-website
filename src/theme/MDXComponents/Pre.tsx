import cn from "classnames";
import { useRef, useState, useCallback, ReactNode } from "react";
import Icon from "/src/components/Icon";
import HeadlessButton from "/src/components/HeadlessButton";
import { toCopyContent } from "/utils/general";
import styles from "./Pre.module.css";
import commandStyles from "/src/components/Command/Command.module.css";
import codeBlockStyles from "./CodeBlock.module.css";
import { Children, useContext } from "react";
import { trackEvent } from "/src/utils/analytics";
import {
  PositionContext,
  PositionProvider,
} from "/src/components/PositionProvider";
import { nanoid } from "nanoid";

const preKey = "pre";
const TIMEOUT = 1000;

interface CodeProps {
  children: ReactNode;
  className?: string;
  emitEvent?: (command: string, name: string, params: any) => {};
}

const Pre = ({ children, className, emitEvent }: CodeProps) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const codeRef = useRef<HTMLDivElement>();
  const buttonRef = useRef<HTMLButtonElement>();
  const posProvider = useContext(PositionContext);
  const thisID = useRef(nanoid());
  let pos: undefined | number;
  if (posProvider) {
    pos = posProvider.registerPosition(preKey, thisID.current);
  }

  // Get the code snippet label for the inner code element.
  let langLabel = "";
  Children.forEach(children, (child, index) => {
    // A Pre with a first-level div child indicates a custom "code"-labeled
    // Snippet component, which doesn't contain the element structured created
    // by hljs.
    if (child.type && child.type === "div") {
      langLabel = "code";
      return;
    }

    if (
      child.props &&
      child.props.className &&
      child.props.className.includes("hljs")
    ) {
      const lang = child.props.className
        .split(" ")
        .find((c) => c.startsWith("language-"));

      if (!lang) {
        return;
      }

      langLabel = lang.slice("language-".length);
    }
  });

  const countPres = (): number => {
    if (posProvider) {
      return posProvider.getItemCount(preKey);
    } else {
      return undefined;
    }
  };

  const handleCopy = useCallback(() => {
    trackEvent({
      event_name: "code_copy_button",
      custom_parameters: {
        scope: "snippet",
        label: langLabel,
        code_snippet_index_on_page: pos,
        code_snippet_count_on_page: countPres(),
      },
      emitEvent: emitEvent,
    });

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
        <PositionProvider containerPosition={pos} getContainerCount={countPres}>
          <pre className={cn(codeBlockStyles.wrapper, styles.code)}>
            {children}
          </pre>
        </PositionProvider>
      </div>
    </div>
  );
};

export default Pre;
