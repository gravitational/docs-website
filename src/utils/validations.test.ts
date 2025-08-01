import { describe, expect, test } from "@jest/globals";
import { isValidCommentLength, containsPII } from "./validations";

describe("isValidCommentLength", () => {
  interface testCase {
    description: string;
    input: string;
    maxLength: number;
    expected: boolean;
  }

  const testCases: Array<testCase> = [
    {
      description: "empty string",
      input: "",
      maxLength: 100,
      expected: false,
    },
    {
      description: "whitespace only",
      input: "   \n\t   ",
      maxLength: 100,
      expected: false,
    },
    {
      description: "valid short comment",
      input: "Great docs!",
      maxLength: 100,
      expected: true,
    },
    {
      description: "valid comment at max length",
      input: "a".repeat(100),
      maxLength: 100,
      expected: true,
    },
    {
      description: "comment over max length",
      input: "a".repeat(101),
      maxLength: 100,
      expected: false,
    },
    {
      description: "whitespace around valid comment",
      input: "  Great docs!  ",
      maxLength: 100,
      expected: true,
    },
    {
      description: "different max length - valid",
      input: "Short",
      maxLength: 10,
      expected: true,
    },
    {
      description: "different max length - invalid",
      input: "This is too long",
      maxLength: 10,
      expected: false,
    },
  ];

  test.each(testCases)("$description", ({ input, maxLength, expected }) => {
    expect(isValidCommentLength(input, maxLength)).toBe(expected);
  });
});

describe("containsPII", () => {
  interface testCase {
    description: string;
    input: string;
    expected: boolean;
  }

  const testCases: Array<testCase> = [
    // Email detection
    {
      description: "detects simple email",
      input: "Contact me at test@example.com",
      expected: true,
    },
    {
      description: "detects email with subdomain",
      input: "Email: user@mail.example.com",
      expected: true,
    },
    {
      description: "detects email standalone",
      input: "admin@site.org",
      expected: true,
    },
    {
      description: "detects email with numbers",
      input: "user123@test456.net",
      expected: true,
    },
    // Phone detection
    {
      description: "detects phone with dashes",
      input: "Call 123-456-7890",
      expected: true,
    },
    {
      description: "detects phone with dots",
      input: "Phone: 123.456.7890",
      expected: true,
    },
    {
      description: "detects phone without separators",
      input: "1234567890",
      expected: true,
    },
    {
      description: "detects phone with mixed separators",
      input: "Call me at 123-456.7890",
      expected: true,
    },
    // Clean text
    {
      description: "clean feedback text",
      input: "Great documentation, very helpful!",
      expected: false,
    },
    {
      description: "text with numbers but no PII",
      input: "Version 1.2.3 is working well",
      expected: false,
    },
    {
      description: "technical reference without PII",
      input: "Check the API docs",
      expected: false,
    },
    {
      description: "URL without email format",
      input: "Visit https://example.com/docs",
      expected: false,
    },
    // Edge cases that might trigger false positives
    {
      description: "version number similar to phone",
      input: "v1.23.4567 works",
      expected: false,
    },
    {
      description: "technical identifier",
      input: "npm package version",
      expected: false,
    },
    {
      description: "partial phone number",
      input: "only 123-456 digits",
      expected: false,
    },
    {
      description: "date format",
      input: "12.34.56789 format",
      expected: false,
    },
  ];

  test.each(testCases)("$description", ({ input, expected }) => {
    expect(containsPII(input)).toBe(expected);
  });
});