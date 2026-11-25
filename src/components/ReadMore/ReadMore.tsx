import Link from "@docusaurus/Link";
import styles from "./ReadMore.module.css";
import cn from "clsx";
import Button from "../Button";
import Icon, { IconName } from "../Icon";
import { Children, isValidElement, ReactElement, ReactNode } from "react";
import ArrowRightSvg from "@site/src/components/Icon/teleport-svg/arrow-circle-right.svg";
import { getChildProps } from "../Checklist/Checklist";

type ReadMoreProps = {
  title: string;
  children: ReactNode;
};

const ReadMore: React.FC<ReadMoreProps> = ({ title, children }) => {
  const links = getChildProps<Pick<ReadMoreProps, "children">>(children)
    .map(({ children }) => getChildProps<HTMLLinkElement>(children))
    .flat();

  return (
    <div className={styles.readMore}>
      {title && <p className={styles.title}>{title}</p>}
      <ul className={styles.list}>
        {links.map(({ href, children }, i) => (
          <li key={i}>
            <Link to={href}>
              <ArrowRightSvg /> {children as ReactNode}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReadMore;
