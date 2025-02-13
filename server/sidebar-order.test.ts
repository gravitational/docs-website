import { describe, expect, test } from "@jest/globals";
import { basename, dirname } from "node:path";
import { orderSidebarItems } from "./sidebar-order";
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
    frontmatter: {
      title: title,
      description: "Provides information on Teleport functionality",
    },
    source: "@site/docs/" + id + ".mdx",
    sourceDirName: dirname(id),
  };
}

describe.only("orderSidebarItems", () => {
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
