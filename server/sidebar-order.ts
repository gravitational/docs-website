import type {
  NormalizedSidebarItem,
  SidebarItemDoc,
  NormalizedSidebarItemCategory,
} from "@docusaurus/plugin-content-docs/src/sidebars/types.ts";

export interface docPage {
  title: string;
  id: string;
  frontMatter: {
    [index: string]: any;
  };
  source: string;
  sourceDirName: string;
  sidebarPosition?: number;
}

interface sidebarAttributes {
  normalizedLabel: string;
  label: string;
  isIntroduction: boolean;
  isGettingStarted: boolean;
  sidebarPosition?: number;
  id?: string;
}

// getSidebarAttributes extracts attributes of a NormalizedSidebarItem's title and
// sidebar position for sorting. Titles are lowercased. In the case of a
// category index page, we use the sidebar position of the page's link, if this
// is present. Otherwise, we sort by the category label.
const getSidebarAttributes = (
  item: NormalizedSidebarItem,
  getter: (id: string) => docPage,
): sidebarAttributes => {
  let title: string;
  let sidebarPosition: number;
  let id: string;
  switch (item.type) {
    case "doc":
      const page = getter((item as SidebarItemDoc).id);
      title = page.title;
      sidebarPosition = page.sidebarPosition;
      id = page.id;
      if (page.frontMatter && page.frontMatter.sidebar_label) {
        title = page.frontMatter.sidebar_label;
      }
      break;
    case "category":
      const cat = item as NormalizedSidebarItemCategory;
      if (cat.link && cat.link.type == "doc") {
        const page = getter(cat.link.id);
        sidebarPosition = page.sidebarPosition;
        id = page.id;
      }
      title = cat.label;
      break;
    default:
      return undefined;
  }

  return {
    normalizedLabel: title.toLowerCase(),
    label: title,
    isIntroduction: title.toLowerCase().includes("introduction"),
    isGettingStarted: title.toLowerCase().match(/get(ting)? started/) !== null,
    sidebarPosition: sidebarPosition,
    id: id,
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
    const { sidebarPosition, id } = getSidebarAttributes(newItem, getter);
    if (!sidebarPosition) {
      unsortedItems.push(newItem);
      return;
    }

    if (sidebarPosition > items.length) {
      throw new Error(
        `page with ID ${id} has a sidebar position (${sidebarPosition}) that exceeds the number of items in the sidebar section (${items.length})`,
      );
    }

    const sideBarIndex = sidebarPosition - 1;

    if (newItems[sideBarIndex]) {
      throw new Error(
        `page with ID ${id} has the same sidebar_position frontmatter value as the page with ID ${newItems[sideBarIndex].id} in the same sidebar section`,
      );
    }
    newItems[sideBarIndex] = newItem;
  });

  unsortedItems.sort((a, b) => {
    const attrsA = getSidebarAttributes(a, getter);
    const attrsB = getSidebarAttributes(b, getter);

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
    if (attrsA.normalizedLabel >= attrsB.normalizedLabel) {
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

const maxSidebarEntriesWithRepetition = 2;

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
const sortByLength = (a, b) => {
  return b.length - a.length;
};

export const repetitiveSidebarSections = (
  items: Array<NormalizedSidebarItem>,
  getter: (id: string) => docPage,
): Array<string> => {
  // Special case: repetition is impossible
  if (items.length <= 1) {
    return [];
  }

  // For each sidebar title, record each possible combination of words from the
  // beginning and from the end in a map. If there are repeats, use the map to increment a
  // counter. If there are any word combinations with the same number as
  // guides in the section, that is, if all guides in a section repeat the
  // same string, add a warning to the result.

  // Declare separate maps for substrings taken from the beginning and
  // substrings taken from the end. This disambiguates substrings found at
  // both the beginning and the end of some entries.
  const titleSubstringsFromBeginning = new Map();
  const titleSubstringsFromEnd = new Map();

  let result: Array<string> = [];
  items.forEach((item) => {
    const { label, id } = getSidebarAttributes(item, getter);
    const words = label.split(" ");
    for (let i = words.length - 1; i > 0; i--) {
      const beginning = words.slice(0, i).join(" ");
      const end = words.slice(words.length - i, words.length + 1).join(" ");

      const prefixSharers = titleSubstringsFromBeginning.get(beginning) || [];
      prefixSharers.push(id);
      titleSubstringsFromBeginning.set(beginning, prefixSharers);
      const suffixSharers = titleSubstringsFromEnd.get(end) || [];
      suffixSharers.push(id);
      titleSubstringsFromEnd.set(end, suffixSharers);
    }

    const cat = item as NormalizedSidebarItemCategory;
    if (cat.items) {
      result = result.concat(repetitiveSidebarSections(cat.items, getter));
    }
  });

  const sortedBeginningSubstrings = [
    ...titleSubstringsFromBeginning.keys(),
  ].sort(sortByLength);
  const sortedEndSubstrings = [...titleSubstringsFromEnd.keys()].sort(
    sortByLength,
  );

  // For a given section, return the longest violating substring.
  for (let i = 0; i < sortedBeginningSubstrings.length; i++) {
    const key = sortedBeginningSubstrings[i];
    const substringPages = titleSubstringsFromBeginning.get(key).map((p) => {
      return `- ${p}`;
    });
    if (substringPages.length > maxSidebarEntriesWithRepetition) {
      result.push(
        `The following pages in the same sidebar section have labels that repeat the string prefix "${key}". Use the sidebar_label frontmatter field to simplify their labels:
${substringPages.join("\n")}
`,
      );
      break;
    }
  }
  for (let i = 0; i < sortedEndSubstrings.length; i++) {
    const key = sortedEndSubstrings[i];
    const substringPages = titleSubstringsFromEnd.get(key).map((p) => {
      return `- ${p}`;
    });
    if (substringPages.length > maxSidebarEntriesWithRepetition) {
      result.push(
        `The following pages in the same sidebar section have labels that repeat the string suffix "${key}". Use the sidebar_label frontmatter field to simplify their labels:
${substringPages.join("\n")}
`,
      );
      break;
    }
  }

  return result;
};
