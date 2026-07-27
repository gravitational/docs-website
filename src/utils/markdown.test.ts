import { describe, expect, it } from "@jest/globals";

import { markdownAlternatePath, normalizeMarkdownPathname } from "./markdown";

describe("normalizeMarkdownPathname", () => {
  it("returns /index.md for the root path", () => {
    expect(normalizeMarkdownPathname("/")).toBe("/index.md");
  });

  it("replaces a trailing slash with .md", () => {
    expect(normalizeMarkdownPathname("/core-concepts/")).toBe(
      "/core-concepts.md",
    );
  });

  it("appends .md when there is no trailing slash", () => {
    expect(normalizeMarkdownPathname("/core-concepts")).toBe(
      "/core-concepts.md",
    );
  });

  it("handles nested and versioned paths", () => {
    expect(normalizeMarkdownPathname("/get-started/agent-skills/")).toBe(
      "/get-started/agent-skills.md",
    );
    expect(normalizeMarkdownPathname("/ver/17.x/core-concepts/")).toBe(
      "/ver/17.x/core-concepts.md",
    );
  });
});

describe("markdownAlternatePath", () => {
  it("normalizes a page pathname to its .md path", () => {
    expect(markdownAlternatePath("/core-concepts/")).toBe("/core-concepts.md");
  });

  it("maps the root path to index.md", () => {
    expect(markdownAlternatePath("/")).toBe("/index.md");
  });

  it("maps the site root under a baseUrl prefix to index.md", () => {
    expect(markdownAlternatePath("/docs/", "/docs/")).toBe("/docs/index.md");
    expect(markdownAlternatePath("/docs", "/docs/")).toBe("/docs/index.md");
  });

  it("leaves non-root pages under a baseUrl prefix unchanged", () => {
    expect(markdownAlternatePath("/docs/installation/", "/docs/")).toBe(
      "/docs/installation.md",
    );
  });
});
