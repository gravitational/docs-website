import React, { type ReactNode } from "react";
import clsx from "clsx";
import { ThemeClassNames } from "@docusaurus/theme-common";
import LinkItem from "@theme/Footer/LinkItem";
import type { Props } from "@theme/Footer/Links/MultiColumn";
import styles from "../../Footer.module.css";

type ColumnType = Props["columns"][number];
type ColumnItemType = ColumnType["items"][number];

function ColumnLinkItem({ item }: { item: ColumnItemType }) {
  return item.html ? (
    <li
      className={clsx("footer__item", item.className)}
      // Developer provided the HTML, so assume it's safe.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: item.html }}
    />
  ) : (
    <li key={item.href ?? item.to} className="footer__item">
      <LinkItem item={item} />
    </li>
  );
}

function Column({ column }: { column: ColumnType }) {
  return (
    <div className={clsx(styles.footerColumn, column.className)}>
      <div className={styles.footerColumnTitle}>{column.title}</div>
      <ul
        className={clsx(
          "footer__items",
          "clean-list",
          styles.footerColumnItems,
        )}
      >
        {column.items.map((item, i) => (
          <ColumnLinkItem key={i} item={item} />
        ))}
      </ul>
    </div>
  );
}

export default function FooterLinksMultiColumn({ columns }: Props): ReactNode {
  return (
    <div className={styles.footerLinksMultiColumn}>
      {columns.map((column, i) => (
        <Column key={i} column={column} />
      ))}
    </div>
  );
}
