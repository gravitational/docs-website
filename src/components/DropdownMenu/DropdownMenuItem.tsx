import { clsx } from "clsx";

import Link from "../Link";
import New from "./assets/new-badge.svg";
import NewChip from "./assets/new-chip.svg";
import Arrow from "../Icon/svg/arrow-right-2.svg";

import styles from "./DropdownMenuItem.module.css";
import cn from "classnames";
import type { NavSectionItem } from "@site/server/strapi-types";

const DropdownMenuItem = ({
  itemType,
  title,
  link = "",
  description,
  customImage,
  imageTitle,
  itemAmount,
  highlightBadge = false,
  newSubmenuItem = false,
  first,
  ...props
}: NavSectionItem & {
  first: boolean;
  itemAmount?: number;
  newSubmenuItem?: boolean;
}) => {
  return itemType !== "image" ? (
    <Link
      className={clsx(
        styles.styledLink,
        (!description || !newSubmenuItem) && styles.center,
        newSubmenuItem && styles.newSubmenuLink,
        newSubmenuItem && first && styles.firstLink,
      )}
      href={link}
    >
      {((newSubmenuItem && first) || !newSubmenuItem) && (
        <div
          className={clsx(
            styles.iconWrapper,
            newSubmenuItem && styles.newSubmenuIcon,
          )}
        >
          <img
            src={customImage.image.url || ""}
            width={35}
            height={35}
            alt=""
          />
          {highlightBadge && (newSubmenuItem ? <NewChip /> : <New />)}
        </div>
      )}
      <div
        className={clsx(styles.item, newSubmenuItem && styles.newSubmenuItem)}
      >
        <p
          className={clsx(
            styles.itemTitle,
            newSubmenuItem && first && styles.firstNewSubmenuItemTitle,
            newSubmenuItem && !first && styles.newSubmenuTitle,
          )}
        >
          {title.replace(/\\n/, "\n")}
        </p>
        {description && (
          <p
            className={clsx(
              styles.description,
              newSubmenuItem && styles.newSubmenuDescription,
            )}
          >
            {description}
          </p>
        )}
        {newSubmenuItem && first && (
          <p className={styles.buttonWrapper}>
            <button className={styles.learnButton}>
              Learn more <Arrow />
            </button>
          </p>
        )}
      </div>
    </Link>
  ) : (
    <div className={styles.wrapper}>
      {imageTitle && <h3 className={styles.imageTitle}>{imageTitle}</h3>}
      <Link className={styles.styledLink} href={link}>
        <div className={styles.imageItem}>
          <div className={styles.imageBox}>
            <img
              src={customImage?.image.url || ""}
              width={180}
              height={100}
              sizes="180px"
              alt=""
            />
          </div>
          <div className={cn(styles.item, styles.imageItemText)} {...props}>
            <p className={styles.imageItemTitle}>{customImage?.itemTitle}</p>
            {customImage?.imageDateText && (
              <p className={styles.dateText}>{customImage?.imageDateText}</p>
            )}
            <p className={styles.paragraph}>{customImage?.imageCTA}</p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default DropdownMenuItem;
