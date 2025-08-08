import { describe, expect, test } from "@jest/globals";
import { CustomRedirect, validateRedirects } from "./redirects";

describe("validateRedirects", () => {
  interface testCase {
    description: string;
    input: Array<CustomRedirect>;
    shouldThrow: boolean;
    errorSubstring: string;
  }
  const testCases: Array<testCase> = [
    {
      description: "incorrect index page source",
      input: [
        {
          source: "/enroll-resources/applications/applications/",
          destination: "/enroll-resources/apps/",
          permanent: true,
        },
      ],
      shouldThrow: true,
      errorSubstring:
        "redirect source includes an incorrect category index page path - remove the final path segment: /enroll-resources/applications/applications/",
    },
    {
      description: "incorrect index page destination",
      input: [
        {
          source: "/enroll-resources/apps/",
          destination: "/enroll-resources/applications/applications/",
          permanent: true,
        },
      ],
      shouldThrow: true,
      errorSubstring:
        "redirect destination includes an incorrect category index page path - remove the final path segment: /enroll-resources/applications/applications/",
    },
    {
      description: "no leading slash in a source",
      input: [
        {
          source: "enroll-resources/apps/",
          destination: "/enroll-resources/applications/applications/",
          permanent: true,
        },
      ],
      shouldThrow: true,
      errorSubstring:
        "redirect source must start with a trailing slash: enroll-resources/apps/",
    },
    {
      description: "no leading slash in a destination",
      input: [
        {
          source: "/enroll-resources/apps/",
          destination: "enroll-resources/applications/applications/",
          permanent: true,
        },
      ],
      shouldThrow: true,
      errorSubstring:
        "redirect destination includes an incorrect category index page path - remove the final path segment: enroll-resources/applications/applications/",
    },
    {
      description: "valid case",
      input: [
        {
          source: "/enroll-resources/apps/",
          destination: "/enroll-resources/applications/",
          permanent: true,
        },
      ],
      shouldThrow: false,
      errorSubstring: "",
    },
    {
      description: "multiple redirects with the same source",
      input: [
        {
          source: "/enroll-resources/apps/",
          destination: "/enroll-resources/applications/",
          permanent: true,
        },
        {
          source: "/enroll-resources/apps/",
          destination: "/enroll-resources/apps/",
          permanent: true,
        },
      ],
      shouldThrow: true,
      errorSubstring: "same source",
    },
  ];

  test.each(testCases)("$description", (c) => {
    if (c.shouldThrow) {
      expect(() => {
        validateRedirects(c.input);
      }).toThrow(c.errorSubstring);
    } else {
      expect(() => {
        validateRedirects(c.input);
      }).not.toThrow();
    }
  });
});
