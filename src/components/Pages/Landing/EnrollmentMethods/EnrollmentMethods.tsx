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
}

interface EnrollmentMethodsProps {
  title?: string;
  children?: React.ReactNode;
  variant?: "default" | "rows";
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
}) => {
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
              <Link to={href} className={styles.methodLink}>
                {title}
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
          })}
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === Method) {
              return React.cloneElement(child as React.ReactElement<any>, {
                innerMethod: true,
                variant,
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
  children,
  variant = "default",
}) => {
  return (
    <section className={styles.enrollmentMethods}>
      <div className={styles.container}>
        {title && (
          <h2
            className={cn(styles.title, {
              [styles.rowsVariant]: variant === "rows",
            })}
          >
            {title}
          </h2>
        )}
        <div
          className={cn(styles.methodsList, {
            [styles.rowsVariant]: variant === "rows",
          })}
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === Method) {
              return React.cloneElement(child as React.ReactElement<any>, {
                variant,
              });
            }
            return child;
          })}
        </div>
      </div>
    </section>
  );
};
export default EnrollmentMethods;
