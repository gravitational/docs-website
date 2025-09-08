import Icon, { IconName } from "@site/src/components/Icon";
import styles from "./EnrollmentMethods.module.css";
import Link from "@docusaurus/Link";

interface Tag {
  name: string;
  icon?: IconName;
  href?: string;
}

interface TagList {
  title: string;
  tags: Tag[];
}

interface EnrollmentMethod {
  title: string;
  icon: any;
  href?: string;
  tagLists: TagList[];
  children?: React.ReactNode;
}

interface EnrollmentMethodsProps {
  title?: string;
  children?: React.ReactNode;
}

export const Method: React.FC<EnrollmentMethod> = ({
  title,
  href,
  tagLists = [],
  children,
  icon: IconComponent,
}) => {
  return (
    <li className={styles.method}>
      <h3 className={styles.methodTitle}>
        <IconComponent className={styles.methodIcon} />
        {href ? (
          // @ts-ignore
          <Link to={href} className={styles.methodLink}>
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>
      <div className={styles.methodDescription}>{children}</div>
      {tagLists.length > 0 &&
        tagLists.map((tagList, index) => (
          <div key={index} className={styles.tagList}>
            <h4 className={styles.tagListTitle}>{tagList.title}</h4>
            <ul className={styles.tags}>
              {tagList.tags.map((tag, tagIndex) => (
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
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </li>
  );
};

const EnrollmentMethods: React.FC<EnrollmentMethodsProps> = ({
  title,
  children,
}) => {
  return (
    <section className={styles.enrollmentMethods}>
      <div className={styles.container}>
        {title && <h2 className={styles.title}>{title}</h2>}
        <ul className={styles.methodsList}>{children}</ul>
      </div>
    </section>
  );
};
export default EnrollmentMethods;
