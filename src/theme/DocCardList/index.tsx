import React from "react";
import clsx from "clsx";
import {
  useCurrentSidebarCategory,
  filterDocCardListItems,
  useDocById,
} from "@docusaurus/plugin-content-docs/client";
import DocCard from "@theme/DocCard";
import type { Props } from "@theme/DocCardList";

function DocCardListForCurrentSidebarCategory({ className }: Props) {
  const category = useCurrentSidebarCategory();
  return <DocCardList items={category.items} className={className} />;
}

// categoryHrefoToDocID returns the Docusaurus page ID that corresponds to the
// given href. Category pages do not have IDs in the items prop, so we generate
// a page ID based on the assumption that category page slugs are the same as
// their containing directory names.
function categoryHrefToDocID(href: string): string {
  if (!href) {
    return href;
  }
  const idPrefix = href.replace(new RegExp(`^/ver/[0-9]+\\.x/`), "");
  const slugRE = new RegExp(`/([^/]+)/$`);
  const slug = slugRE.exec(href);
  if (!slug || slug.length != 2) {
    return "";
  }
  return idPrefix + slug[1];
}

export default function DocCardList(props: Props): JSX.Element {
  const { items, className } = props;
  if (!items) {
    return <DocCardListForCurrentSidebarCategory {...props} />;
  }
  const filteredItems = filterDocCardListItems(items).map((item) => {
    const doc = useDocById(item.docId ?? undefined);

    if (item.type == "link") {
      return {
        href: item.href,
        label: item.label,
        description: doc?.description,
      };
    }
    if (item.type == "category") {
      const indexPage = useDocById(categoryHrefToDocID(item.href) ?? undefined);

      return {
        href: item.href,
        label: item.label + " (section)",
        description: indexPage?.description,
      };
    }
  });

  return (
    <ul className={clsx("row", className)}>
      {filteredItems.map((item, index) => (
        <li key={index}>
          <a href={item.href}>{item.label}</a>: {item.description}
        </li>
      ))}
    </ul>
  );
}
