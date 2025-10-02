import React from "react";
import styles from "./UseCasesList.module.css";
import cn from "classnames";
import Icon, { IconName } from "@site/src/components/Icon";
import Link from "@docusaurus/Link";
import ArrowRightSvg from "@site/src/components/Icon/teleport-svg/arrow-right.svg";

export interface Tag {
  name: string;
  icon: IconName;
  href: string;
  arrow?: boolean;
}

interface UseCasesListProps {
  className?: string;
  title?: string;
  description?: string;
  desktopColumnsCount?: number;
  variant?: "landing" | "doc";
  useCases: Array<{
    title: string;
    description: string;
    href?: string;
    tags?: Tag[];
  }>;
  narrowBottomPadding?: boolean;
}

const UseCasesList: React.FC<UseCasesListProps> = ({
  className = "",
  title = `Use Cases`,
  description,
  desktopColumnsCount = 3,
  useCases = [],
  variant = "landing",
  narrowBottomPadding = false,
}) => {
  const Heading = variant === "doc" ? "h3" : "h2";

  return (
    <section
      className={cn(styles.useCasesList, className, {
        [styles.narrowBottomPadding]: narrowBottomPadding,
      })}
    >
      <div className={styles.container}>
        <div className={cn(styles.header, { [styles.hasTitle]: !!title })}>
          {title && (
            <Heading
              className={cn(styles.title, {
                [styles.docVariant]: variant === "doc",
              })}
            >
              {title}
            </Heading>
          )}
          {description && <p className={styles.description}>{description}</p>}
        </div>
        <ul
          className={styles.items}
          style={
            {
              "--desktop-column-count": desktopColumnsCount,
            } as React.CSSProperties
          }
        >
          {useCases.map((caseItem, index) => {
            const UseCaseHeading = variant === "doc" && title ? "h4" : "h3";
            return (
              <li key={index}>
                {caseItem.href &&
                (!caseItem.tags || caseItem.tags.length === 0) ? (
                  // @ts-ignore
                  <Link className={styles.item} to={caseItem.href}>
                    <UseCaseHeading>{caseItem.title}</UseCaseHeading>
                    <p
                      className={cn(styles.description, {
                        [styles.docVariant]: variant === "doc",
                      })}
                    >
                      {caseItem.description}
                    </p>
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
                        <UseCaseHeading>{caseItem.title}</UseCaseHeading>
                      </Link>
                    ) : (
                      <UseCaseHeading>{caseItem.title}</UseCaseHeading>
                    )}
                    <p
                      className={cn(styles.description, {
                        [styles.hasTags]: caseItem.tags?.length > 0,
                        [styles.docVariant]: variant === "doc",
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
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default UseCasesList;
