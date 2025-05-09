import type {
  NormalizedSidebarItem,
  SidebarItemDoc,
  NormalizedSidebarItemCategory,
} from "@docusaurus/plugin-content-docs/src/sidebars/types.ts";

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

interface orderAttributes {
  title: string;
  isIntroduction: boolean;
  isGettingStarted: boolean;
  sideBarPosition?: number;
}

// getOrderAttributes extracts attributes of a NormalizedSidebarItem's title (or
// label, in the case of category pages) for sorting. Titles are lowercased.
// Also extracts the sidebar position.
const getOrderAttributes = (
  item: NormalizedSidebarItem,
  getter: (id: string) => docPage,
): orderAttributes => {
  let title: string;
  let sideBarPosition: number;
  switch (item.type) {
    case "doc":
      const page = getter((item as SidebarItemDoc).id);
      title = page.title;
      sideBarPosition = page.sideBarPosition;
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
    sideBarPosition: sideBarPosition,
  };
};

export const orderSidebarItems = (
  items: Array<NormalizedSidebarItem>,
  getter: (id: string) => docPage,
): Array<NormalizedSidebarItem> => {
  const newItems = new Array(items.length);
  const unsortedItems = [];

  items.forEach((item) => {
    // Start by recursively descending into items and sorting their children.
    let newItem = Object.assign({}, item);
    const cat = newItem as NormalizedSidebarItemCategory;
    if (cat.items) {
      cat.items = orderSidebarItems(cat.items, getter);
    }

    // If the item has a sidebar position, add it to the final array. We'll sort
    // the remaining items automatically before adding them to the empty slots
    // in the final array.
    const { sideBarPosition } = getOrderAttributes(newItem, getter);
    if (sideBarPosition > 0) {
      newItems[sideBarPosition - 1] = newItem;
      return;
    }
    unsortedItems.push(newItem);
  });

  unsortedItems.sort((a, b) => {
    const attrsA = getOrderAttributes(a, getter);
    const attrsB = getOrderAttributes(b, getter);

    // We can't sort by title, so don't compare.
    if (attrsA == undefined || attrsB == undefined) {
      return 0;
    }

    // Sort pages first if they include "introduction" (case-insensitive) in
    // the title.
    if (attrsA.isIntroduction && !attrsB.isIntroduction) {
      return -1;
    }
    if (attrsB.isIntroduction && !attrsA.isIntroduction) {
      return 1;
    }

    // Sort pages earlier if they are getting started guides.
    if (attrsA.isGettingStarted && !attrsB.isGettingStarted) {
      return -1;
    }
    if (attrsB.isGettingStarted && !attrsA.isGettingStarted) {
      return 1;
    }

    // If there's nothing special about one title relative to the other,
    // sort them alphabetically.
    if (attrsA.title >= attrsB.title) {
      return 1;
    } else {
      return -1;
    }
  });

  // Add the sorted items to slots in the array not already occupied by items
  // with a sidebar_position.
  for (let i = 0; i < newItems.length; i++) {
    if (!newItems[i]) {
      newItems[i] = unsortedItems.shift();
    }
  }

  return newItems;
};

// removeRedundantItems removes top-level category index pages from the sidebar,
// since we expect these to be defined as links within each top-level category.
export const removeRedundantItems = (
  items: Array<NormalizedSidebarItem>,
  dirname: string,
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
