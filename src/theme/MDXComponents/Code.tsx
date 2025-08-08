import cn from "classnames";
import { DetailedHTMLProps, HTMLAttributes } from "react";
import styles from "./Code.module.css";
import codeBlockStyles from "./CodeBlock.module.css";

export interface CodeLineProps {
  children: React.ReactNode;
}

export const CodeLine = (props: CodeLineProps) => {
  return <span className={codeBlockStyles.line} {...props} />;
};

const isHLJSNode = (className?: string) =>
  Boolean(className) && className.indexOf("hljs") !== -1;

export default function (
  props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>,
) {
  if (isHLJSNode(props.className)) {
    return <code {...props} />;
  }

  return <code {...props} className={cn(styles.wrapper, props.className)} />;
}
