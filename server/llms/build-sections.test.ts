import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import fs from "fs";

import { buildSections } from "./build-sections";

// This helper generates a frontmatter string with the given fields, followed by a dummy body content.
// It is used to mock the contents of .mdx files in the tests below.
function frontmatter(fields: Record<string, string>): string {
  const lines = Object.entries(fields).map(
    ([key, value]) => `${key}: "${value}"`,
  );
  return `---\n${lines.join("\n")}\n---\nBody content of the page goes here.`;
}

describe("buildSections", () => {
  let readFileSyncSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    readFileSyncSpy = jest.spyOn(fs, "readFileSync");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Set up the readFileSync mock to return the given sidebars JSON and any specified .mdx file contents.
  function mockFiles(sidebars: unknown, mdxFiles: Record<string, string> = {}) {
    readFileSyncSpy.mockImplementation((filePath: unknown): string => {
      const p = String(filePath);
      if (p.endsWith("sidebars.json")) {
        return JSON.stringify(sidebars);
      }
      for (const [suffix, content] of Object.entries(mdxFiles)) {
        if (p.endsWith(suffix)) {
          return content;
        }
      }
      // The filePath doesn't match sidebars.json or any of the specified .mdx files
      return "no frontmatter";
    }) as typeof readFileSyncSpy;
  }

  describe("single-sidebar format", () => {
    it("builds a llms.txt section from a doc item with title and description", () => {
      mockFiles(
        { docs: [{ type: "doc", id: "section1/index" }] }, // sidebars.json
        {
          // .mdx file contents
          "section1/index.mdx": frontmatter({
            title: "My Section",
            description: "A great section",
          }),
        },
      );

      const sections = buildSections();

      expect(sections).toHaveLength(1);
      expect(sections[0]).toMatchObject({
        id: "section1",
        name: "My Section",
        description: "A great section",
        routes: [{ route: "/docs/section1/**" }],
        position: 0,
      });
    });

    it("dismisses description when frontmatter has none", () => {
      mockFiles(
        { docs: [{ type: "doc", id: "section1/index" }] },
        { "section1/index.mdx": frontmatter({ title: "Only title" }) },
      );

      const sections = buildSections();

      expect(sections[0].name).toBe("Only title");
      expect(sections[0]).not.toHaveProperty("description");
    });

    it("falls back to sectionDir as the name when frontmatter has no title", () => {
      mockFiles({ docs: [{ type: "doc", id: "section1/index" }] });

      const sections = buildSections();

      expect(sections[0].name).toBe("section1");
    });

    it("falls back to doc label as the name when set and frontmatter has no title", () => {
      mockFiles({
        docs: [{ type: "doc", id: "section1/index", label: "Custom Label" }],
      });

      const sections = buildSections();

      expect(sections[0].name).toBe("Custom Label");
    });

    it("uses docId directly as sectionDir when id has no subdirectory", () => {
      mockFiles(
        { docs: [{ type: "doc", id: "faq" }] },
        { "faq.mdx": frontmatter({ title: "FAQ" }) },
      );

      const sections = buildSections();

      expect(sections[0]).toMatchObject({
        id: "faq",
        routes: [{ route: "/docs/faq/**" }],
      });
    });

    it("builds a llms.txt section from a category item with a link", () => {
      mockFiles(
        {
          docs: [
            {
              type: "category",
              label: "Category Label",
              link: { type: "doc", id: "cat/overview" },
            },
          ],
        },
        {
          "cat/overview.mdx": frontmatter({
            title: "Category Title",
            description: "Category description",
          }),
        },
      );

      const sections = buildSections();

      expect(sections).toHaveLength(1);
      expect(sections[0]).toMatchObject({
        id: "cat",
        name: "Category Title",
        description: "Category description",
        routes: [{ route: "/docs/cat/**" }],
      });
    });

    it("falls back to category label as the name when frontmatter title is absent", () => {
      mockFiles({
        docs: [
          {
            type: "category",
            label: "My Category",
            link: { type: "doc", id: "cat/overview" },
          },
        ],
      });

      const sections = buildSections();

      expect(sections[0].name).toBe("My Category");
    });

    it("skips a category item without a link", () => {
      mockFiles({
        docs: [{ type: "category", label: "No Link" }],
      });

      expect(buildSections()).toHaveLength(0);
    });

    it("skips item with an unknown type", () => {
      mockFiles({
        docs: [{ type: "link", href: "/external" }],
      });

      expect(buildSections()).toHaveLength(0);
    });

    it("assigns consecutive positions to multiple llms.txt sections", () => {
      mockFiles({
        docs: [
          { type: "doc", id: "a/index" },
          { type: "doc", id: "b/index" },
          { type: "doc", id: "c/index" },
        ],
      });

      const sections = buildSections();

      expect(sections).toHaveLength(3);
      expect(sections.map((s) => s.position)).toEqual([0, 1, 2]);
    });

    it("skips items without a docId while maintaining positions for valid items", () => {
      mockFiles(
        {
          docs: [
            { type: "doc", id: "first/page" },
            { type: "category", label: "No Link Category" }, // no link = skipped
            {
              type: "category",
              label: "Category with Link",
              link: { type: "doc", id: "second/page" },
            },
          ],
        },
        {
          "first/page.mdx": frontmatter({ title: "First" }),
          "second/page.mdx": frontmatter({ title: "Second" }),
        },
      );

      const sections = buildSections();

      expect(sections).toHaveLength(2);
      expect(sections[0].id).toBe("first");
      expect(sections[1].id).toBe("second");
      expect(sections[0].position).toBe(0);
      expect(sections[1].position).toBe(1);
    });
  });

  describe("multi-sidebar format", () => {
    it("uses the first item of each sidebar as a llms.txt section", () => {
      mockFiles(
        {
          sidebarA: [
            { type: "doc", id: "alpha/index" },
            { type: "doc", id: "alpha/other" },
          ],
          sidebarB: [
            {
              type: "category",
              label: "Beta",
              link: { type: "doc", id: "beta/overview" },
            },
          ],
        },
        {
          "alpha/index.mdx": frontmatter({ title: "Alpha" }),
          "beta/overview.mdx": frontmatter({ title: "Beta Title" }),
        },
      );

      const sections = buildSections();

      expect(sections).toHaveLength(2);
      expect(sections.map((s) => s.id)).toEqual(["alpha", "beta"]);
    });

    it("sidebar arrays whose first item has no docId are skipped", () => {
      mockFiles({
        sidebarA: [{ type: "doc", id: "alpha/index" }],
        sidebarB: [{ type: "category", label: "No Link" }], // first item has no link = skipped
      });

      const sections = buildSections();

      expect(sections).toHaveLength(1);
      expect(sections[0].id).toBe("alpha");
    });
  });

  describe("handling errors", () => {
    it("throws when readFileSync fails reading sidebars.json", () => {
      readFileSyncSpy.mockImplementation(() => {
        throw new Error("ENOENT: no such file");
      });

      expect(() => buildSections()).toThrow("ENOENT: no such file");
    });

    it("still creates a section even if reading the .mdx file fails", () => {
      readFileSyncSpy.mockImplementation((filePath: unknown): string => {
        const p = String(filePath);
        if (p.endsWith("sidebars.json")) {
          return JSON.stringify({
            docs: [{ type: "doc", id: "section1/index" }],
          });
        }
        throw new Error("ENOENT: mdx file missing");
      });

      const sections = buildSections();

      expect(sections).toHaveLength(1);
      expect(sections[0].name).toBe("section1");
      expect(sections[0]).not.toHaveProperty("description");
    });
    it("still creates a section even if the .mdx file has invalid YAML frontmatter", () => {
      readFileSyncSpy.mockImplementation((filePath: unknown): string => {
        const p = String(filePath);
        if (p.endsWith("sidebars.json")) {
          return JSON.stringify({
            docs: [{ type: "doc", id: "section1/index" }],
          });
        }
        // Return invalid YAML frontmatter
        return "---\ntitle: \"Valid Title\"\ndescription: \"Missing closing quote\n---\nBody content";
      });

      const sections = buildSections();

      expect(sections).toHaveLength(1);
      expect(sections[0].name).toBe("section1");
      expect(sections[0]).not.toHaveProperty("description");
    });
  });
});
