import type {
  NormalizedSidebarItem,
  SidebarItemDoc,
  NormalizedSidebarItemCategory,
} from "@docusaurus/plugin-content-docs/src/sidebars/types.ts";
import type { PropVersionDoc } from "@docusaurus/plugin-content-docs";

export interface docPage {
  title: string;
  id: string;
  frontmatter: {
    [index: string]: any;
  };
  source: string;
  sourceDirName: string;
  sideBarPosition?: number;
}

interface titleFeatures {
  title: string;
  isIntroduction: boolean;
  isGettingStarted: boolean;
}

// getTitleFeatures extracts attributes of a NormalizedSidebarItem's title (or
// label, in the case of category pages) for sorting. Titles are lowercased.
const getTitleFeatures = (
  item: NormalizedSidebarItem,
  getter: (id: string) => docPage
): titleFeatures => {
  let title: string;
  switch (item.type) {
    case "doc":
      title = getter((item as SidebarItemDoc).id).title;
      break;
    case "category":
      if (!(item as NormalizedSidebarItemCategory).label) {
        return undefined;
      }
      title = item.label;
      break;
    default:
      return undefined;
  }

  return {
    title: title.toLowerCase(),
    isIntroduction: title.toLowerCase().includes("introduction"),
    isGettingStarted: title.toLowerCase().match(/get(ting)? started/) !== null,
  };
};

export const orderSidebarItems = (
  items: Array<NormalizedSidebarItem>,
  getter: (id: string) => docPage
): Array<NormalizedSidebarItem> => {
  const newItems = [];

  // Start by recursively descending into items and sorting their children.
  items.forEach((item) => {
    let newItem = Object.assign({}, item);
    const cat = newItem as NormalizedSidebarItemCategory;
    if (cat.items) {
      cat.items = orderSidebarItems(cat.items, getter);
      newItems.push(cat);
      return;
    }
    newItems.push(item);
  });

  return newItems.sort((a, b) => {
    const aTitle = getTitleFeatures(a, getter);
    const bTitle = getTitleFeatures(b, getter);

    // We can't sort by title, so don't compare.
    if (aTitle == undefined || bTitle == undefined) {
      return 0;
    }

    // Sort pages first if they include "introduction" (case-insensitive) in
    // the title.
    if (aTitle.isIntroduction && !bTitle.isIntroduction) {
      return -1;
    }
    if (bTitle.isIntroduction && !aTitle.isIntroduction) {
      return 1;
    }

    // Sort pages earlier if they are getting started guides.
    if (aTitle.isGettingStarted && !bTitle.isGettingStarted) {
      return -1;
    }
    if (bTitle.isGettingStarted && !aTitle.isGettingStarted) {
      return 1;
    }

    // If there's nothing special about one title relative to the other,
    // sort them alphabetically.
    if (aTitle.title >= bTitle.title) {
      return 1;
    } else {
      return -1;
    }
  });
};

// removeRedundantItems removes top-level category index pages from the sidebar,
// since we expect these to be defined as links within each top-level category.
export const removeRedundantItems = (
  items: Array<NormalizedSidebarItem>,
  dirname: string
): Array<NormalizedSidebarItem> => {
  // Return all items except for the one with the ID of the index page to
  // remove from the body of the sidebar section. We expect the top-level category index
  // page to be in, and named after, the section's root directory, e.g.:
  //
  // - "reference/reference"
  // - "admin-guides/admin-guides"
  return items.filter((item) => {
    if (!item.hasOwnProperty("id")) {
      return true;
    }
    return (
      (item as { id: string; [propName: string]: unknown }).id !==
      dirname + "/" + dirname
    );
  });
};
