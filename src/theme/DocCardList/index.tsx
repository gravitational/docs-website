import React from "react";
import {
  useCurrentSidebarCategory,
  filterDocCardListItems,
  useDocById,
} from "@docusaurus/plugin-content-docs/client";
import DocCard from "@theme/DocCard";
import type { Props } from "@theme/DocCardList";
import type {
  PropVersionDoc,
  PropSidebarItemCategory,
} from "@docusaurus/plugin-content-docs";
import { categoryHrefToDocID } from "./href-to-id";

function DocCardListForCurrentSidebarCategory({ className }: Props) {
  let category: PropSidebarItemCategory;
  // DocCardList only works if the current page has a sidebar entry, but the
  // error Docusaurus currently throws is difficult to understand. Throw an
  // error with a more explicit message.
  try {
    category = useCurrentSidebarCategory();
  } catch ({ message }) {
    if (!message.includes("Unexpected: cant find current sidebar in context")) {
      throw new Error(message);
    }
    throw new Error(
      "The current page does not have a corresponding sidebar entry, so it is not possible to use DocCardList. Make sure that the page is represented on the sidebar."
    );
  }
  return <DocCardList items={category.items} className={className} />;
}

export default function DocCardList(props: Props): JSX.Element {
  const { items, className } = props;
  if (!items) {
    return <DocCardListForCurrentSidebarCategory {...props} />;
  }
  const filteredItems = filterDocCardListItems(items).map((item) => {
    const doc = useDocById(item.docId);

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
    <ul className={className}>
      {filteredItems.map((item, index) => (
        <li key={index}>
          <a href={item.href}>{item.label}</a>: {item.description}
        </li>
      ))}
    </ul>
  );
}
