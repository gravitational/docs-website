import { describe, expect, test } from "@jest/globals";
import {
  makeDocusaurusNavigationCategory,
  getIndexPageID,
  NavigationCategory,
  DocusaurusCategory,
} from "./config-docs";

describe("getIndexPageID with valid entries", () => {
  interface testCase {
    description: string;
    category: NavigationCategory;
    expected: string;
  }

  const testCases: Array<testCase> = [
    {
      description: "non-generated",
      category: {
        icon: "connect",
        title: "User Guides",
        entries: [
          {
            title: "Introduction",
            slug: "/ver/18.x/connect-your-client/introduction/",
          },
          {
            title: "Using tsh",
            slug: "/ver/18.x/connect-your-client/tsh/",
          },
        ],
      },
      expected: "connect-your-client/connect-your-client",
    },
    {
      description: "includes root index page with versioned path",
      category: {
        icon: "home",
        title: "Get Started",
        entries: [
          {
            title: "Docs Home",
            slug: "/ver/18.x/",
          },
          {
            title: "Installation",
            slug: "/ver/18.x/installation/",
          },
        ],
      },
      expected: "index",
    },
    {
      description: "includes root index page with root path",
      category: {
        icon: "home",
        title: "Get Started",
        entries: [
          {
            title: "Docs Home",
            slug: "/",
          },
          {
            title: "Installation",
            slug: "/installation/",
          },
        ],
      },
      expected: "index",
    },
    {
      description: "generated",
      category: {
        icon: "wrench",
        title: "Admin Guides",
        entries: [],
        generateFrom: "admin-guides",
      },
      expected: "admin-guides/admin-guides",
    },
  ];

  test.each(testCases)("$description", (c) => {
    expect(getIndexPageID(c.category)).toEqual(c.expected);
  });
});

describe("getIndexPageID with invalid entries", () => {
  interface testCase {
    description: string;
    category: NavigationCategory;
    errorSubstring: string;
  }

  const testCases: Array<testCase> = [
    {
      description: "non-generated with malformed slugs",
      category: {
        icon: "connect",
        title: "User Guides",
        entries: [
          {
            title: "Introduction",
            slug: "",
          },
          {
            title: "Using tsh",
            slug: "/docs/connect-your-client/tsh/",
          },
        ],
      },
      errorSubstring: `malformed slug in docs sidebar configuration: ""`,
    },
    {
      description: "slugs with different top-level segments",
      category: {
        icon: "connect",
        title: "User Guides",
        entries: [
          {
            title: "Introduction",
            slug: "/ver/12.x/enroll-resources/introduction/",
          },
          {
            title: "Using tsh",
            slug: "/ver/12.x/connect-your-client/tsh/",
          },
        ],
      },
      errorSubstring: `cannot determine a category index page ID for top-level category User Guides because not all of its entries are in the same first-level directory`,
    },
  ];

  test.each(testCases)("$description", (c) => {
    expect(() => {
      getIndexPageID(c.category);
    }).toThrow(c.errorSubstring);
  });
});

describe("makeDocusaurusNavigationCategory", () => {
  interface testCase {
    description: string;
    category: NavigationCategory;
    expected: DocusaurusCategory;
  }

  const testCases: Array<testCase> = [
    {
      description: "non-generated",
      category: {
        icon: "connect",
        title: "User Guides",
        entries: [
          {
            title: "Introduction",
            slug: "/ver/18.x/connect-your-client/introduction/",
          },
          {
            title: "Using tsh",
            slug: "/ver/18.x/connect-your-client/tsh/",
          },
        ],
      },
      expected: {
        collapsible: true,
        link: { type: "doc", id: "connect-your-client/connect-your-client" },
        items: [
          {
            id: "connect-your-client/introduction",
            label: "Introduction",
            type: "doc",
          },
          {
            id: "connect-your-client/tsh",
            label: "Using tsh",
            type: "doc",
          },
        ],
        label: "User Guides",
        type: "category",
      },
    },
    {
      description: "generated",
      category: {
        icon: "wrench",
        title: "Admin Guides",
        entries: [],
        generateFrom: "admin-guides",
      },
      expected: {
        items: [
          {
            dirName: "admin-guides",
            type: "autogenerated",
          },
        ],
        label: "Admin Guides",
        link: {
          id: "admin-guides/admin-guides",
          type: "doc",
        },
        type: "category",
      },
    },
  ];

  test.each(testCases)("$description", (c) => {
    expect(makeDocusaurusNavigationCategory(c.category, "18.x")).toEqual(
      c.expected
    );
  });
});
