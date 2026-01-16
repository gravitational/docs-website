import React from "react";
import Icon, { IconName } from "@site/src/components/Icon";
import styles from "./EnrollmentMethods.module.css";
import Link from "@docusaurus/Link";
import ArrowRightSvg from "@site/src/components/Icon/teleport-svg/arrow-right.svg";
import cn from "classnames";

interface Tag {
  name: string;
  icon?: IconName;
  href?: string;
  arrow?: boolean;
}

interface TagList {
  title?: string;
  tags: Tag[];
}

interface EnrollmentMethod {
  title: string;
  description?: string;
  icon: any;
  href?: string;
  tagLists: TagList[];
  children?: React.ReactNode;
  variant?: "default" | "rows";
  innerMethod?: boolean;
  progressStatus?: "Not started" | "Started" | "In-progress" | "Completed";
  linkColor?: "black" | "purple";
  fontSize?: "lg" | "xl";
}

interface EnrollmentMethodsProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  variant?: "default" | "rows";
  desktopColumnsCount?: 2;
  additionalNote?: any;
  additionalNoteIcon?: IconName;
  linkColor?: "black" | "purple";
  fontSize?: "lg" | "xl";
}

export const Method: React.FC<EnrollmentMethod> = ({
  title,
  description,
  href,
  tagLists = [],
  children,
  icon: IconComponent,
  variant,
  innerMethod = false,
  progressStatus,
  linkColor,
  fontSize,
}) => {
  const getBackgroundColor = (status: string) => {
    switch (status) {
      case "Not started":
        return "#0000001a";
      case "Started":
        return "#0073ba1a";
      case "In-progress":
        return "#ffab001a";
      default:
        return "#007d6b1a";
    }
  };

  const getColor = (status: string) => {
    switch (status) {
      case "Not started":
        return "#0000005c";
      case "Started":
        return "#0073ba";
      case "In-progress":
        return "#ffaa00";
      default:
        return "#007d6a";
    }
  };

  return (
    <div
      className={cn(styles.method, {
        [styles.rowsVariant]: variant === "rows",
        [styles.innerMethodRowsVariant]: innerMethod && variant === "rows",
      })}
    >
      <div
        className={cn(styles.methodHeader, {
          [styles.rowsVariant]: variant === "rows",
        })}
      >
        {progressStatus && (
          <div
            className={styles.progressStatus}
            style={{
              color: getColor(progressStatus),
              backgroundColor: getBackgroundColor(progressStatus),
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
            >
              <circle cx="4" cy="4" r="4" fill={getColor(progressStatus)} />
            </svg>
            {progressStatus}
          </div>
        )}
        {IconComponent && (
          <IconComponent
            className={cn(styles.methodIcon, {
              [styles.rowsVariant]: variant === "rows",
            })}
          />
        )}
        <div>
          <h3
            className={cn(styles.methodTitle, {
              [styles.innerMethodRowsVariant]:
                innerMethod && variant === "rows",
            })}
          >
            {href ? (
              // @ts-ignore
              <Link
                to={href}
                className={styles.methodLink}
                style={{
                  color: linkColor === "purple" ? "#512fc9" : "#000000",
                }}
              >
                {title}
                <span />
              </Link>
            ) : (
              title
            )}
          </h3>
          {description && (
            <div className={styles.methodSubtitle}>{description}</div>
          )}
        </div>
      </div>
      <div>
        <div
          className={cn(styles.methodContent, {
            [styles.rowsVariant]: variant === "rows" && !innerMethod,
            [styles.innerMethodRowsVariant]: innerMethod && variant === "rows",
            [styles.xlFontSize]: fontSize === "xl",
          })}
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === Method) {
              return React.cloneElement(child as React.ReactElement<any>, {
                innerMethod: true,
                variant,
                fontSize,
              });
            }
            return child;
          })}
        </div>
        {tagLists.length > 0 &&
          tagLists.map((tagList, index) => (
            <div key={index} className={styles.tagList}>
              {tagList.title && (
                <h4 className={styles.tagListTitle}>{tagList.title}</h4>
              )}
              <ul className={styles.tags}>
                {tagList.tags.map((tag, tagIndex) => (
                  <li key={tagIndex}>
                    {tag.href ? (
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
                          <ArrowRightSvg className={styles.tagArrow} />
                        )}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
};

const EnrollmentMethods: React.FC<EnrollmentMethodsProps> = ({
  title,
  description,
  children,
  variant = "default",
  desktopColumnsCount = 2,
  additionalNote,
  additionalNoteIcon,
  linkColor = "black",
  fontSize = "lg",
}) => {
  return (
    <section className={styles.enrollmentMethods}>
      <div className={styles.container}>
        {title && (
          <div className={styles.header}>
            <h2
              className={cn(styles.title, {
                [styles.rowsVariant]: variant === "rows",
                [styles.withDescription]: description,
              })}
            >
              {title}
            </h2>
            {description && <p className={styles.description}>{description}</p>}
          </div>
        )}
        <div
          className={cn(styles.methodsList, {
            [styles.rowsVariant]: variant === "rows",
          })}
          style={
            {
              "--desktop-column-count": desktopColumnsCount,
            } as React.CSSProperties
          }
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === Method) {
              return React.cloneElement(child as React.ReactElement<any>, {
                variant,
                linkColor,
                fontSize,
              });
            }
            return child;
          })}
        </div>
        {additionalNote && (
          <div className={styles.additionalNote}>
            <Icon name={additionalNoteIcon} size="md" />
            <div dangerouslySetInnerHTML={{ __html: additionalNote }} />
          </div>
        )}
      </div>
    </section>
  );
};
export default EnrollmentMethods;
