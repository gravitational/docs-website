import React from "react";
import styles from "./UseCasesList.module.css";
import cn from "classnames";
import Icon, { IconName } from "@site/src/components/Icon";
import Link from "@docusaurus/Link";
import ArrowRightSvg from "@site/src/components/Icon/teleport-svg/arrow-right.svg";

interface Tag {
  name: string;
  icon: IconName;
  href: string;
  arrow?: boolean;
}

interface UseCasesListProps {
  className?: string;
  title?: string;
  desktopColumnsCount?: number;
  useCases: Array<{
    title: string;
    description: string;
    href?: string;
    tags?: Tag[];
  }>;
}

const UseCasesList: React.FC<UseCasesListProps> = ({
  className = "",
  title = `Use Cases`,
  desktopColumnsCount = 3,
  useCases = [],
}) => {
  return (
    <section className={cn(styles.useCasesList, className)}>
      <div className={styles.container}>
        <h2 className={styles.title}>{title}</h2>
        <ul
          className={styles.items}
          style={
            {
              "--desktop-column-count": desktopColumnsCount,
            } as React.CSSProperties
          }
        >
          {useCases.map((caseItem, index) => (
            <li key={index}>
              {caseItem.href &&
              (!caseItem.tags || caseItem.tags.length === 0) ? (
                // @ts-ignore
                <Link className={styles.item} to={caseItem.href}>
                  <h3>{caseItem.title}</h3>
                  <p className={styles.description}>{caseItem.description}</p>
                </Link>
              ) : (
                <div
                  className={cn(styles.item, {
                    [styles.hasTags]: caseItem.tags?.length > 0,
                  })}
                >
                  {caseItem.href ? (
                    // @ts-ignore
                    <Link className={styles.linkTitle} to={caseItem.href}>
                      <h3>{caseItem.title}</h3>
                    </Link>
                  ) : (
                    <h3>{caseItem.title}</h3>
                  )}
                  <p
                    className={cn(styles.description, {
                      [styles.hasTags]: caseItem.tags?.length > 0,
                    })}
                  >
                    {caseItem.description}
                  </p>
                  {caseItem.tags?.length > 0 && (
                    <ul className={styles.tags}>
                      {caseItem.tags.map((tag, tagIndex) => (
                        <li key={tagIndex}>
                          {tag.href ? (
                            // @ts-ignore
                            <Link className={styles.tag} to={tag.href}>
                              {tag.icon && (
                                <Icon
                                  name={tag.icon}
                                  size="md"
                                  className={styles.tagIcon}
                                />
                              )}
                              {tag.name}
                              {tag.arrow && (
                                // @ts-ignore
                                <ArrowRightSvg className={styles.tagArrow} />
                              )}
                            </Link>
                          ) : (
                            <span className={styles.tag}>
                              {tag.icon && (
                                <Icon
                                  name={tag.icon}
                                  size="md"
                                  className={styles.tagIcon}
                                />
                              )}
                              {tag.name}
                              {tag.arrow && (
                                // @ts-ignore
                                <ArrowRightSvg className={styles.tagArrow} />
                              )}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
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
