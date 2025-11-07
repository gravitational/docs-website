import { describe, expect, test } from "@jest/globals";
import { basename, dirname } from "node:path";
import {
  orderSidebarItems,
  repetitiveSidebarSections,
  removeRedundantItems,
} from "./sidebar-order";
import type { docPage } from "./sidebar-order";
import type { NormalizedSidebarItem } from "@docusaurus/plugin-content-docs/src/sidebars/types.ts";

// makeDocPageMap takes a page ID and creates the docs page metadata that would
// have generated a sidebar item, letting us simplify tests. The page title comes
// from the ID of the page, with hyphens replaced by spaces and the first word
// capitalized. Other attributes are taken from page IDs as well.
function getDocPageForId(id: string): docPage {
  let title = basename(id).replaceAll("-", " ");
  title = title[0].toUpperCase() + title.slice(1);

  return {
    title: title,
    id: id,
    frontMatter: {
      title: title,
      description: "Provides information on Teleport functionality",
    },
    source: "@site/docs/" + id + ".mdx",
    sourceDirName: dirname(id),
  };
}

describe("orderSidebarItems", () => {
  describe("automatic ordering", () => {
    interface testCase {
      description: string;
      input: Array<NormalizedSidebarItem>;
      expected: Array<NormalizedSidebarItem>;
    }

    // To write a test case, you can print the items array returned by
    // defaultSidebarItemsGenerator in docusaurus.config.ts and find the
    // subarray of items you would like to include.
    const testCases: Array<testCase> = [
      {
        description: "Orders docs pages alphabetically by title",
        input: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "reference/my-category/page-c",
              },
              {
                type: "doc",
                id: "reference/my-category/page-a",
              },
              {
                type: "doc",
                id: "reference/my-category/page-b",
              },
            ],
          },
        ],
        expected: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "reference/my-category/page-a",
              },
              {
                type: "doc",
                id: "reference/my-category/page-b",
              },
              {
                type: "doc",
                id: "reference/my-category/page-c",
              },
            ],
          },
        ],
      },
      {
        description: "Places introduction pages first",
        input: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "reference/my-category/page-b",
              },
              {
                type: "doc",
                id: "reference/my-category/page-a",
              },
              {
                type: "doc",
                id: "reference/my-category/page-introduction",
              },
            ],
          },
        ],
        expected: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "reference/my-category/page-introduction",
              },
              {
                type: "doc",
                id: "reference/my-category/page-a",
              },
              {
                type: "doc",
                id: "reference/my-category/page-b",
              },
            ],
          },
        ],
      },
      {
        description: "Places getting started after introduction",
        input: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "reference/my-category/getting-started",
              },
              {
                type: "doc",
                id: "reference/my-category/b",
              },
              {
                type: "doc",
                id: "reference/my-category/introduction",
              },
              {
                type: "doc",
                id: "reference/my-category/a",
              },
            ],
          },
        ],
        expected: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "reference/my-category/introduction",
              },
              {
                type: "doc",
                id: "reference/my-category/getting-started",
              },
              {
                type: "doc",
                id: "reference/my-category/a",
              },
              {
                type: "doc",
                id: "reference/my-category/b",
              },
            ],
          },
        ],
      },
      {
        description: "alphabetizes introduction  and getting started pages",
        input: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "reference/my-category/b-getting-started",
              },
              {
                type: "doc",
                id: "reference/my-category/b-introduction",
              },
              {
                type: "doc",
                id: "reference/my-category/a-getting-started",
              },
              {
                type: "doc",
                id: "reference/my-category/a-introduction",
              },
              {
                type: "doc",
                id: "reference/my-category/c-introduction",
              },
            ],
          },
        ],
        expected: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "reference/my-category/a-introduction",
              },
              {
                type: "doc",
                id: "reference/my-category/b-introduction",
              },
              {
                type: "doc",
                id: "reference/my-category/c-introduction",
              },
              {
                type: "doc",
                id: "reference/my-category/a-getting-started",
              },
              {
                type: "doc",
                id: "reference/my-category/b-getting-started",
              },
            ],
          },
        ],
      },
      {
        description: "get started and getting started",
        input: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "reference/my-category/b-get-started",
              },
              {
                type: "doc",
                id: "reference/my-category/a-getting-started",
              },
              {
                type: "doc",
                id: "reference/my-category/b-getting-started",
              },
            ],
          },
        ],
        expected: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "reference/my-category/a-getting-started",
              },
              {
                type: "doc",
                id: "reference/my-category/b-get-started",
              },
              {
                type: "doc",
                id: "reference/my-category/b-getting-started",
              },
            ],
          },
        ],
      },
      {
        description: "a mix of categories and pages",
        input: [
          {
            type: "category",
            label: "Applications",
            items: [
              {
                type: "category",
                label: "Securing Access to Cloud APIs",
                items: [
                  {
                    type: "doc",
                    id: "enroll-resources/application-access/cloud-apis/aws-console",
                  },
                  {
                    type: "doc",
                    id: "enroll-resources/application-access/cloud-apis/azure-aks-workload-id",
                  },
                ],
                link: {
                  type: "doc",
                  id: "enroll-resources/application-access/cloud-apis/cloud-apis",
                },
              },
              {
                type: "doc",
                id: "enroll-resources/application-access/application-access-controls",
              },
              {
                type: "doc",
                id: "enroll-resources/application-access/getting-started",
              },
              {
                type: "category",
                label: "Application Access Guides",
                items: [
                  {
                    type: "doc",
                    id: "enroll-resources/application-access/guides/amazon-athena",
                  },
                  {
                    type: "doc",
                    id: "enroll-resources/application-access/guides/api-access",
                  },
                ],
                link: {
                  type: "doc",
                  id: "enroll-resources/application-access/guides/guides",
                },
              },
            ],
            link: {
              type: "doc",
              id: "enroll-resources/application-access/application-access",
            },
          },
        ],
        expected: [
          {
            type: "category",
            label: "Applications",
            items: [
              {
                type: "doc",
                id: "enroll-resources/application-access/getting-started",
              },
              {
                type: "doc",
                id: "enroll-resources/application-access/application-access-controls",
              },
              {
                type: "category",
                label: "Application Access Guides",
                items: [
                  {
                    type: "doc",
                    id: "enroll-resources/application-access/guides/amazon-athena",
                  },
                  {
                    type: "doc",
                    id: "enroll-resources/application-access/guides/api-access",
                  },
                ],
                link: {
                  type: "doc",
                  id: "enroll-resources/application-access/guides/guides",
                },
              },
              {
                type: "category",
                label: "Securing Access to Cloud APIs",
                items: [
                  {
                    type: "doc",
                    id: "enroll-resources/application-access/cloud-apis/aws-console",
                  },
                  {
                    type: "doc",
                    id: "enroll-resources/application-access/cloud-apis/azure-aks-workload-id",
                  },
                ],
                link: {
                  type: "doc",
                  id: "enroll-resources/application-access/cloud-apis/cloud-apis",
                },
              },
            ],
            link: {
              type: "doc",
              id: "enroll-resources/application-access/application-access",
            },
          },
        ],
      },
      {
        description: "nested category",
        input: [
          {
            type: "category",
            label: "Category A",
            items: [
              {
                type: "category",
                label: "Category B",
                items: [
                  {
                    type: "doc",
                    id: "category-a/category-b/page-b",
                  },
                  {
                    type: "doc",
                    id: "category-a/category-b/page-a",
                  },
                ],
                link: {
                  type: "doc",
                  id: "category-a/category-b/category-b",
                },
              },
              {
                type: "category",
                label: "Category C",
                items: [
                  {
                    type: "doc",
                    id: "category-a/category-b/category-c/page-b",
                  },
                  {
                    type: "doc",
                    id: "category-a/category-b/category-c/page-a",
                  },
                ],
                link: {
                  type: "doc",
                  id: "category-a/category-b/category-b/category-c/category-c",
                },
              },
              {
                type: "doc",
                id: "category-a/page-a",
              },
            ],
            link: {
              type: "doc",
              id: "category-a/category-a",
            },
          },
        ],
        expected: [
          {
            type: "category",
            label: "Category A",
            items: [
              {
                type: "category",
                label: "Category B",
                items: [
                  {
                    type: "doc",
                    id: "category-a/category-b/page-a",
                  },
                  {
                    type: "doc",
                    id: "category-a/category-b/page-b",
                  },
                ],
                link: {
                  type: "doc",
                  id: "category-a/category-b/category-b",
                },
              },
              {
                type: "category",
                label: "Category C",
                items: [
                  {
                    type: "doc",
                    id: "category-a/category-b/category-c/page-a",
                  },
                  {
                    type: "doc",
                    id: "category-a/category-b/category-c/page-b",
                  },
                ],
                link: {
                  type: "doc",
                  id: "category-a/category-b/category-b/category-c/category-c",
                },
              },
              {
                type: "doc",
                id: "category-a/page-a",
              },
            ],
            link: {
              type: "doc",
              id: "category-a/category-a",
            },
          },
        ],
      },
    ];

    test.each(testCases)("$description", (c) => {
      const actual = orderSidebarItems(c.input, getDocPageForId);
      expect(actual).toEqual(c.expected);
    });
  });

  describe("sidebar position", () => {
    const idToDocPage = {
      "page-a": {
        title: "Page A",
        id: "page-a",
        frontMatter: {
          title: "Page A",
          description: "Page A",
        },
        source: "@site/docs/page-a.mdx",
        sourceDirName: "",
      },
      "page-b": {
        title: "Page B",
        id: "page-b",
        frontMatter: {
          title: "Page B",
          description: "Page B",
        },
        source: "@site/docs/page-b.mdx",
        sourceDirName: "",
      },
      "page-c": {
        title: "Page C",
        id: "page-c",
        frontMatter: {
          title: "Page C",
          description: "Page C",
        },
        source: "@site/docs/page-c.mdx",
        sourceDirName: "",
      },
      "page-d": {
        title: "Introduction",
        id: "page-d",
        frontMatter: {
          title: "Introduction",
          description: "Introduction",
        },
        source: "@site/docs/page-d.mdx",
        sourceDirName: "",
      },
      "page-e": {
        title: "Page E",
        id: "page-e",
        frontMatter: {
          title: "Page E",
          description: "Page E",
          sidebar_position: 2,
        },
        sidebarPosition: 2,
        source: "@site/docs/page-e.mdx",
        sourceDirName: "",
      },
      "page-f": {
        title: "Getting Started",
        id: "page-f",
        frontMatter: {
          title: "Getting Started",
          description: "Getting Started",
        },
        source: "@site/docs/page-f.mdx",
        sourceDirName: "",
      },
      "page-g": {
        title: "Introduction",
        id: "page-g",
        frontMatter: {
          title: "Introduction",
          description: "Introduction",
        },
        source: "@site/docs/page-g.mdx",
        sourceDirName: "",
        sidebarPosition: 3,
      },
    };

    interface testCase {
      description: string;
      input: Array<NormalizedSidebarItem>;
      expected: Array<NormalizedSidebarItem>;
    }

    const testCases: Array<testCase> = [
      {
        description: "pages ordered with fixed sidebar position",
        input: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "page-c",
              },
              {
                type: "doc",
                id: "page-a",
              },
              {
                type: "doc",
                id: "page-b",
              },
              {
                type: "doc",
                id: "page-e",
              },
            ],
          },
        ],
        // Page E has a sidebar position of 2, so it must occupy that position.
        expected: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "page-a",
              },
              {
                type: "doc",
                id: "page-e",
              },
              {
                type: "doc",
                id: "page-b",
              },
              {
                type: "doc",
                id: "page-c",
              },
            ],
          },
        ],
      },
      {
        description: "getting started and introduction",
        input: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "page-f",
              },
              {
                type: "doc",
                id: "page-a",
              },
              {
                type: "doc",
                id: "page-d",
              },
              {
                type: "doc",
                id: "page-e",
              },
            ],
          },
        ],
        // Page E has a sidebar position of 2, so it must occupy that position.
        // We order the other pages around that one, starting with Introduction,
        // then Getting Started, then Page A.
        expected: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "page-d",
              },
              {
                type: "doc",
                id: "page-e",
              },
              {
                type: "doc",
                id: "page-f",
              },
              {
                type: "doc",
                id: "page-a",
              },
            ],
          },
        ],
      },
      {
        description: "intro page with sidebar position",
        input: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "page-g",
              },
              {
                type: "doc",
                id: "page-e",
              },
              {
                type: "doc",
                id: "page-a",
              },
              {
                type: "doc",
                id: "page-b",
              },
            ],
          },
        ],
        // Page E has a sidebar position of 2, so it must occupy that position.
        // The Introduction page (page-g) has a sidebar position of 3, which
        // supersedes the Introduction title. We order Page A and Page B separately,
        // around the fixed-position pages.
        expected: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "page-a",
              },
              {
                type: "doc",
                id: "page-e",
              },
              {
                type: "doc",
                id: "page-g",
              },
              {
                type: "doc",
                id: "page-b",
              },
            ],
          },
        ],
      },
    ];

    test.each(testCases)("$description", (c) => {
      const actual = orderSidebarItems(c.input, (id: string): docPage => {
        return idToDocPage[id];
      });
      expect(actual).toEqual(c.expected);
    });
  });

  describe("sidebar label", () => {
    const idToDocPage = {
      "page-a": {
        title: "Page A",
        id: "page-a",
        frontMatter: {
          title: "Page A",
          sidebar_label: "Page Z",
          description: "Page A",
        },
        source: "@site/docs/page-a.mdx",
        sourceDirName: "",
      },
      "page-b": {
        title: "Page B",
        id: "page-b",
        frontMatter: {
          title: "Page B",
          sidebar_label: "Page W",
          description: "Page B",
        },
        source: "@site/docs/page-b.mdx",
        sourceDirName: "",
      },
      "page-c": {
        title: "Page C",
        id: "page-c",
        frontMatter: {
          title: "Page C",
          sidebar_label: "Page X",
          description: "Page C",
        },
        source: "@site/docs/page-c.mdx",
        sourceDirName: "",
      },
      "page-d": {
        title: "Page D",
        id: "page-d",
        frontMatter: {
          title: "Page D",
          description: "Page D",
        },
        source: "@site/docs/page-d.mdx",
        sourceDirName: "",
      },
    };

    interface testCase {
      description: string;
      input: Array<NormalizedSidebarItem>;
      expected: Array<NormalizedSidebarItem>;
    }

    const testCases: Array<testCase> = [
      {
        description: "all pages use sidebar_label",
        input: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "page-a",
              },
              {
                type: "doc",
                id: "page-b",
              },
              {
                type: "doc",
                id: "page-c",
              },
            ],
          },
        ],
        expected: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "page-b",
              },
              {
                type: "doc",
                id: "page-c",
              },
              {
                type: "doc",
                id: "page-a",
              },
            ],
          },
        ],
      },
      {
        description: "one page uses title",
        input: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "page-d",
              },
              {
                type: "doc",
                id: "page-b",
              },
              {
                type: "doc",
                id: "page-c",
              },
            ],
          },
        ],
        expected: [
          {
            type: "category",
            label: "My Docs Category",
            items: [
              {
                type: "doc",
                id: "page-d",
              },
              {
                type: "doc",
                id: "page-b",
              },
              {
                type: "doc",
                id: "page-c",
              },
            ],
          },
        ],
      },
    ];

    test.each(testCases)("$description", (c) => {
      const actual = orderSidebarItems(c.input, (id: string): docPage => {
        return idToDocPage[id];
      });
      expect(actual).toEqual(c.expected);
    });
  });

  describe("ordering category index pages", () => {
    const idToDocPage = {
      "section-a/section-a": {
        title: "Section A",
        id: "section-a/section-a",
        frontMatter: {
          title: "Section A",
          description: "Section A",
        },
        source: "@site/docs/section-a/section-a.mdx",
        sourceDirName: "section-a",
      },
      "section-a/page-a": {
        title: "Section A Page A",
        id: "section-a/page-a",
        frontMatter: {
          title: "Section A Page A",
          description: "Page A",
        },
        source: "@site/docs/section-a/page-a.mdx",
        sourceDirName: "",
      },
      "section-a/page-b": {
        title: "Section A Page B",
        id: "section-a/page-b",
        frontMatter: {
          title: "Section A Page B",
          description: "Page B",
        },
        source: "@site/docs/section-a/page-b.mdx",
        sourceDirName: "",
      },
      "section-b/section-b": {
        title: "Section B",
        id: "section-b/section-b",
        frontMatter: {
          title: "Section B",
          description: "Section B",
        },
        source: "@site/docs/section-b/section-b.mdx",
        sourceDirName: "section-b",
        sidebarPosition: 2,
      },
      "section-b/page-a": {
        title: "Section B Page A",
        id: "section-b/page-a",
        frontMatter: {
          title: "Section B Page A",
          description: "Page A",
        },
        source: "@site/docs/section-b/page-a.mdx",
        sourceDirName: "section-b",
        sidebarPosition: 2,
      },
      "section-b/page-b": {
        title: "Section B Page B",
        id: "section-b/page-b",
        frontMatter: {
          title: "Section B Page B",
          description: "Page B",
        },
        source: "@site/docs/section-b/page-b.mdx",
        sourceDirName: "section-b",
      },
      intro: {
        title: "Introduction",
        id: "intro",
        frontMatter: {
          title: "Introduction",
          description: "Introduction",
        },
        source: "@site/docs/intro.mdx",
        sourceDirName: "",
      },
    };

    const input: Array<NormalizedSidebarItem> = [
      {
        type: "category",
        label: "Section A",
        link: {
          type: "doc",
          id: "section-a/section-a",
        },
        items: [
          {
            type: "doc",
            id: "section-a/page-a",
          },
          {
            type: "doc",
            id: "section-a/page-b",
          },
        ],
      },
      {
        type: "category",
        label: "Section B",
        link: {
          type: "doc",
          id: "section-b/section-b",
        },
        items: [
          {
            type: "doc",
            id: "section-b/page-a",
          },
          {
            type: "doc",
            id: "section-b/page-b",
          },
        ],
      },
      {
        type: "doc",
        id: "intro",
      },
    ];

    // The index page in Section B has a sidebar position of 2, so we sort
    // Introduction and Section A around it.
    const expected: Array<NormalizedSidebarItem> = [
      {
        type: "doc",
        id: "intro",
      },
      {
        type: "category",
        label: "Section B",
        link: {
          type: "doc",
          id: "section-b/section-b",
        },
        items: [
          // Page B has a sidebar position
          {
            type: "doc",
            id: "section-b/page-b",
          },
          {
            type: "doc",
            id: "section-b/page-a",
          },
        ],
      },
      {
        type: "category",
        label: "Section A",
        link: {
          type: "doc",
          id: "section-a/section-a",
        },
        items: [
          {
            type: "doc",
            id: "section-a/page-a",
          },
          {
            type: "doc",
            id: "section-a/page-b",
          },
        ],
      },
    ];

    const actual = orderSidebarItems(input, (id: string): docPage => {
      return idToDocPage[id];
    });
    expect(actual).toEqual(expected);
  });

  test("identical sidebar positions", () => {
    const idToDocPage = {
      "page-a": {
        title: "Page A",
        id: "page-a",
        frontMatter: {
          title: "Page A",
          description: "Page A",
        },
        source: "@site/docs/page-a.mdx",
        sourceDirName: "",
        sidebarPosition: 2,
      },
      "page-b": {
        title: "Page B",
        id: "page-b",
        frontMatter: {
          title: "Page B",
          description: "Page B",
        },
        source: "@site/docs/page-b.mdx",
        sourceDirName: "",
        sidebarPosition: 2,
      },
    };

    const input: Array<NormalizedSidebarItem> = [
      {
        type: "category",
        label: "My docs category",
        items: [
          {
            type: "doc",
            id: "page-b",
          },
          {
            type: "doc",
            id: "page-a",
          },
        ],
      },
    ];

    expect(() => {
      orderSidebarItems(input, (id: string): docPage => {
        return idToDocPage[id];
      });
    }).toThrow(
      "page with ID page-a has the same sidebar_position frontmatter value as the page with ID page-b in the same sidebar section",
    );
  });

  test("sidebar position out of bounds", () => {
    const idToDocPage = {
      "page-a": {
        title: "Page A",
        id: "page-a",
        frontMatter: {
          title: "Page A",
          description: "Page A",
        },
        source: "@site/docs/page-a.mdx",
        sourceDirName: "",
        sidebarPosition: 5,
      },
      "page-b": {
        title: "Page B",
        id: "page-b",
        frontMatter: {
          title: "Page B",
          description: "Page B",
        },
        source: "@site/docs/page-b.mdx",
        sourceDirName: "",
      },
    };

    const input: Array<NormalizedSidebarItem> = [
      {
        type: "category",
        label: "My docs category",
        items: [
          {
            type: "doc",
            id: "page-b",
          },
          {
            type: "doc",
            id: "page-a",
          },
        ],
      },
    ];

    expect(() => {
      orderSidebarItems(input, (id: string): docPage => {
        return idToDocPage[id];
      });
    }).toThrow(
      "page with ID page-a has a sidebar position (5) that exceeds the number of items in the sidebar section (2)",
    );
  });
});

describe("removeRedundantItems", () => {
  interface testCase {
    description: string;
    input: Array<NormalizedSidebarItem>;
    dirname: string;
    expected: Array<NormalizedSidebarItem>;
  }

  // To write a test case, you can print the items array returned by
  // defaultSidebarItemsGenerator in docusaurus.config.ts and find the
  // subarray of items you would like to include.
  const testCases: Array<testCase> = [
    {
      description: "Removes top-level category index pages",
      dirname: "reference",
      input: [
        {
          type: "doc",
          id: "reference/reference",
        },
        {
          type: "category",
          label: "My Docs Category",
          items: [
            {
              type: "doc",
              id: "reference/my-category/page-c",
            },
            {
              type: "doc",
              id: "reference/my-category/page-a",
            },
            {
              type: "doc",
              id: "reference/my-category/page-b",
            },
          ],
        },
      ],
      expected: [
        {
          type: "category",
          label: "My Docs Category",
          items: [
            {
              type: "doc",
              id: "reference/my-category/page-c",
            },
            {
              type: "doc",
              id: "reference/my-category/page-a",
            },
            {
              type: "doc",
              id: "reference/my-category/page-b",
            },
          ],
        },
      ],
    },
  ];

  test.each(testCases)("$description", (c) => {
    const actual = removeRedundantItems(c.input, c.dirname);
    expect(actual).toEqual(c.expected);
  });
});

describe("repetitiveSidebarSections", () => {
  describe("sidebar label", () => {
    const idToDocPage = {
      "my-section/page-a": {
        title: "Page A",
        id: "my-section/page-a",
        frontMatter: {
          title: "Page A",
          sidebar_label: "Page Z",
          description: "Page A",
        },
        source: "@site/docs/my-section/page-a.mdx",
        sourceDirName: "",
      },
      "my-section/page-b": {
        title: "Page B",
        id: "my-section/page-b",
        frontMatter: {
          title: "Page B",
          sidebar_label: "Page W",
          description: "Page B",
        },
        source: "@site/docs/my-section/page-b.mdx",
        sourceDirName: "",
      },
      "my-section/page-c": {
        title: "Page C",
        id: "my-section/page-c",
        frontMatter: {
          title: "Page C",
          sidebar_label: "Page X",
          description: "Page C",
        },
        source: "@site/docs/my-section/page-c.mdx",
        sourceDirName: "",
      },
      "my-section/page-d": {
        title: "D Docs Page",
        id: "my-section/page-d",
        frontMatter: {
          title: "D Docs Page",
          description: "D Docs Page",
        },
        source: "@site/docs/my-section/page-d.mdx",
        sourceDirName: "",
      },
      "my-section/page-e": {
        title: "E Docs Page",
        id: "my-section/page-e",
        frontMatter: {
          title: "E Docs Page",
          description: "E Docs Page",
        },
        source: "@site/docs/my-section/page-e.mdx",
        sourceDirName: "",
      },
      "my-section/page-f": {
        title: "F Docs Page",
        id: "my-section/page-f",
        frontMatter: {
          title: "F Docs Page",
          description: "F Docs Page",
        },
        source: "@site/docs/my-section/page-d.mdx",
        sourceDirName: "",
      },
    };

    interface testCase {
      description: string;
      input: Array<NormalizedSidebarItem>;
      expected: Array<string>;
    }

    const testCases: Array<testCase> = [
      {
        description: "one word at the beginning of each item",
        input: [
          {
            type: "doc",
            id: "my-section/page-a",
          },
          {
            type: "doc",
            id: "my-section/page-b",
          },
          {
            type: "doc",
            id: "my-section/page-c",
          },
        ],
        expected: [
          `The following pages in the same sidebar section have labels that repeat the string prefix "Page":
- my-section/page-a
- my-section/page-b
- my-section/page-c
`,
        ],
      },
      {
        description: "two words at the end of each item",
        input: [
          {
            type: "doc",
            id: "my-section/page-d",
          },
          {
            type: "doc",
            id: "my-section/page-e",
          },
          {
            type: "doc",
            id: "my-section/page-f",
          },
        ],
        expected: [
          `The following pages in the same sidebar section have labels that repeat the string suffix "Docs Page":
- my-section/page-d
- my-section/page-e
- my-section/page-f
`,
        ],
      },
      {
        description: "repetition in inner and outer sections",
        input: [
          {
            type: "category",
            label: "Page C",
            items: [
              {
                type: "doc",
                id: "my-section/page-d",
              },
              {
                type: "doc",
                id: "my-section/page-e",
              },
              {
                type: "doc",
                id: "my-section/page-f",
              },
            ],
            link: {
              type: "doc",
              id: "my-section/page-c",
            },
          },
          {
            type: "doc",
            id: "my-section/page-a",
          },
          {
            type: "doc",
            id: "my-section/page-b",
          },
        ],
        expected: [
          `The following pages in the same sidebar section have labels that repeat the string suffix "Docs Page":
- my-section/page-d
- my-section/page-e
- my-section/page-f
`,
          `The following pages in the same sidebar section have labels that repeat the string prefix "Page":
- my-section/page-c
- my-section/page-a
- my-section/page-b
`,
        ],
      },
      {
        description: "no repetition",
        input: [
          {
            type: "doc",
            id: "my-section/page-a",
          },
          {
            type: "doc",
            id: "my-section/page-f",
          },
        ],
        expected: [],
      },
      {
        description: "single page",
        input: [
          {
            type: "doc",
            id: "my-section/page-a",
          },
        ],
        expected: [],
      },
      {
        description: "two repeating pages",
        input: [
          {
            type: "doc",
            id: "my-section/page-a",
          },
          {
            type: "doc",
            id: "my-section/page-b",
          },
          {
            type: "doc",
            id: "my-section/page-f",
          },
        ],
        expected: [
          `The following pages in the same sidebar section have labels that repeat the string prefix "Page":
- my-section/page-a
- my-section/page-b
`,
        ],
      },
    ];

    test.each(testCases)("$description", (c) => {
      const actual = repetitiveSidebarSections(
        c.input,
        (id: string): docPage => {
          return idToDocPage[id];
        },
      );
      expect(actual).toEqual(c.expected);
    });
  });
});
