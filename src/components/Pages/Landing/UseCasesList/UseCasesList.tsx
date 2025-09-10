import React from "react";
import styles from "./UseCasesList.module.css";
import cn from "classnames";
import Link from "@docusaurus/Link";

interface UseCasesListProps {
  className?: string;
  title?: string;
  useCases: Array<{
    title: string;
    description: string;
    href?: string;
  }>;
}

const UseCasesList: React.FC<UseCasesListProps> = ({
  className = "",
  title = `Use Cases`,
  useCases = [],
}) => {
  return (
    <section className={cn(styles.useCasesList, className)}>
      <div className={styles.container}>
        <h2 className={styles.title}>{title}</h2>
        <ul className={styles.items}>
          {useCases.map((caseItem, index) => (
            <li key={index}>
              {caseItem.href ? (
                // @ts-ignore
                <Link className={styles.item} to={caseItem.href}>
                  <h3>{caseItem.title}</h3>
                  <p className={styles.description}>{caseItem.description}</p>
                </Link>
              ) : (
                <div className={styles.item}>
                  <h3>{caseItem.title}</h3>
                  <p className={styles.description}>{caseItem.description}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default UseCasesList;
