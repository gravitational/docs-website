import Pre from "/src/theme/MDXComponents/Pre";
import styles from "./Snippet.module.css";

export interface SnippetProps {
  children: React.ReactNode;
  emitEvent?: (command: string, name: string, params: any) => {};
}

export default function Snippet({ children, emitEvent }: SnippetProps) {
  return (
    <Pre className={styles.wrapper} emitEvent={emitEvent}>
      <div className={styles.scroll}>{children}</div>
    </Pre>
  );
}
