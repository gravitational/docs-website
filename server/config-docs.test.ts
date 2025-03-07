import { describe, expect, test } from "@jest/globals";
import {
  makeDocusaurusNavigationCategory,
  NavigationCategory,
  DocusaurusCategory,
} from "./config-docs";

describe("makeDocusaurusNavigationCategory", () => {
  interface testCase {
    description: string;
    category: NavigationCategory;
    expected: DocusaurusCategory;
  }

  const testCases: Array<testCase> = [
    {
      description: "Non-generated",
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
    //TODO: category that uses generateFrom
  ];

  test.each(testCases)("$description", (c) => {
    expect(makeDocusaurusNavigationCategory(c.category, "18.x")).toEqual(
      c.expected
    );
  });
});
