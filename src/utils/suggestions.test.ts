import { describe, expect, test } from "@jest/globals";
import {
  DocsVersion,
  DocPathInfo,
  possibleMovedPages,
  nearestAvailableCategoryIndex,
} from "./suggestions";

describe("possibleMovedPages", () => {
  interface testCase {
    description: string;
    slug: string;
    versions: Array<DocsVersion>;
    expected: Array<DocPathInfo>;
  }

  const testCases: Array<testCase> = [
    {
      description: "regular docs pages, one version",
      slug: "/ver/18.x/application-access/get-started/",
      versions: [
        {
          name: "current",
          label: "18.x (unreleased)",
          isLast: false,
          path: "/ver/18.x",
          mainDocId: "index",
          docs: [
            {
              id: "enroll-resources/application-access/get-started",
              path: "/ver/18.x/enroll-resources/application-access/get-started/",
              sidebar: "docs",
            },
            {
              id: "enroll-resources/database-access/get-started",
              path: "/ver/18.x/enroll-resources/database-access/get-started/",
              sidebar: "docs",
            },
            {
              id: "enroll-resources/database-access/postgres",
              path: "/ver/18.x/enroll-resources/database-access/postgres/",
              sidebar: "docs",
            },
          ],
        },
      ],
      expected: [
        {
          id: "enroll-resources/application-access/get-started",
          path: "/ver/18.x/enroll-resources/application-access/get-started/",
          sidebar: "docs",
        },
        {
          id: "enroll-resources/database-access/get-started",
          path: "/ver/18.x/enroll-resources/database-access/get-started/",
          sidebar: "docs",
        },
      ],
    },
    {
      description: "regular docs pages, multiple versions",
      slug: "/application-access/get-started/",
      versions: [
        {
          name: "current",
          label: "18.x (unreleased)",
          isLast: false,
          path: "/ver/18.x",
          mainDocId: "index",
          docs: [
            {
              id: "enroll-resources/application-access/get-started",
              path: "/ver/18.x/enroll-resources/application-access/get-started/",
              sidebar: "docs",
            },
            {
              id: "enroll-resources/application-access/grafana",
              path: "/ver/18.x/enroll-resources/application-access/grafana",
              sidebar: "docs",
            },
          ],
        },
        {
          name: "latest",
          label: "17.x",
          isLast: true,
          path: "/",
          mainDocId: "index",
          docs: [
            {
              id: "enroll-resources/application-access/get-started",
              path: "/enroll-resources/application-access/get-started/",
              sidebar: "docs",
            },
            {
              id: "enroll-resources/application-access/grafana",
              path: "/enroll-resources/application-access/grafana",
              sidebar: "docs",
            },
          ],
        },
      ],
      expected: [
        {
          id: "enroll-resources/application-access/get-started",
          path: "/enroll-resources/application-access/get-started/",
          sidebar: "docs",
        },
      ],
    },
    {
      description: "category index page",
      slug: "/ver/18.x/application-access/",
      versions: [
        {
          name: "current",
          label: "18.x (unreleased)",
          isLast: false,
          path: "/ver/18.x",
          mainDocId: "index",
          docs: [
            {
              id: "enroll-resources/application-access/application-access",
              path: "/ver/18.x/enroll-resources/application-access/",
              sidebar: "docs",
            },
            {
              id: "enroll-resources/application-access/get-started",
              path: "/ver/18.x/enroll-resources/aplication-access/get-started/",
              sidebar: "docs",
            },
          ],
        },
      ],
      expected: [
        {
          id: "enroll-resources/application-access/application-access",
          path: "/ver/18.x/enroll-resources/application-access/",
          sidebar: "docs",
        },
      ],
    },
  ];

  test.each(testCases)("$description", (c) => {
    expect(possibleMovedPages(c.slug, c.versions)).toEqual(c.expected);
  });
});

describe("nearestAvailableCategoryIndex", () => {
  interface testCase {
    description: string;
    slug: string;
    versions: Array<DocsVersion>;
    expected: DocPathInfo;
  }

  const testCases: Array<testCase> = [
    {
      description: "one version, base section",
      slug: "/ver/18.x/enroll-resources/application-access/get-started/",
      versions: [
        {
          name: "current",
          label: "18.x (unreleased)",
          isLast: false,
          path: "/ver/18.x",
          mainDocId: "index",
          docs: [
            {
              id: "enroll-resources/application-access/application-access",
              path: "/ver/18.x/enroll-resources/application-access/",
              sidebar: "docs",
            },
            {
              id: "enroll-resources/application-access/grafana",
              path: "/ver/18.x/enroll-resources/aplication-access/grafana/",
              sidebar: "docs",
            },
          ],
        },
      ],
      expected: {
        id: "enroll-resources/application-access/application-access",
        path: "/ver/18.x/enroll-resources/application-access/",
        sidebar: "docs",
      },
    },
    {
      description: "multiple versions, base section",
      slug: "/ver/18.x/enroll-resources/application-access/get-started/",
      versions: [
        {
          name: "current",
          label: "18.x (unreleased)",
          isLast: false,
          path: "/ver/18.x",
          mainDocId: "index",
          docs: [
            {
              id: "enroll-resources/application-access/application-access",
              path: "/ver/18.x/enroll-resources/application-access/",
              sidebar: "docs",
            },
          ],
        },
        {
          name: "19.x",
          label: "19.x",
          isLast: false,
          path: "/ver/19.x.x",
          mainDocId: "index",
          docs: [
            {
              id: "enroll-resources/application-access/application-access",
              path: "/ver/19.x/enroll-resources/application-access/",
              sidebar: "docs",
            },
          ],
        },
      ],
      expected: {
        id: "enroll-resources/application-access/application-access",
        path: "/ver/18.x/enroll-resources/application-access/",
        sidebar: "docs",
      },
    },
    {
      description: "one version, base-1 section",
      slug: "/ver/18.x/enroll-resources/application-access/get-started/",
      versions: [
        {
          name: "current",
          label: "18.x (unreleased)",
          isLast: false,
          path: "/ver/18.x",
          mainDocId: "index",
          docs: [
            {
              id: "enroll-resources/enroll-resources",
              path: "/ver/18.x/enroll-resources/",
              sidebar: "docs",
            },
            {
              id: "enroll-resources/get-started",
              path: "/ver/18.x/enroll-resources/get-started/",
              sidebar: "docs",
            },
          ],
        },
      ],
      expected: {
        id: "enroll-resources/enroll-resources",
        path: "/ver/18.x/enroll-resources/",
        sidebar: "docs",
      },
    },
    {
      description: "no match",
      slug: "/ver/18.x/enroll-resources/application-access/get-started/",
      versions: [
        {
          name: "current",
          label: "18.x (unreleased)",
          isLast: false,
          path: "/ver/18.x",
          mainDocId: "index",
          docs: [
            {
              id: "get-started/get-started",
              path: "/ver/18.x/get-started/",
              sidebar: "docs",
            },
          ],
        },
      ],
      expected: undefined,
    },
  ];

  test.each(testCases)("$description", (c) => {
    expect(nearestAvailableCategoryIndex(c.slug, c.versions)).toEqual(
      c.expected,
    );
  });
});
