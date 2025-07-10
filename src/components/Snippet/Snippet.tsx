import Pre from "/src/theme/MDXComponents/Pre";
import styles from "./Snippet.module.css";

export interface SnippetProps {
  children: React.ReactNode;
  gtag?: (command: string, name: string, params: any) => {};
}

export default function Snippet({ children, gtag }: SnippetProps) {
  return (
    <Pre className={styles.wrapper} gtag={gtag}>
      <div className={styles.scroll}>{children}</div>
    </Pre>
  );
}
