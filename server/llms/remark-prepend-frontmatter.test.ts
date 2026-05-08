import { describe, expect, test } from "@jest/globals";
import { unified } from "unified";
import remarkInsertFrontmatter from "./remark-insert-frontmatter";

describe("server/llms/remark-insert-frontmatter", () => {
  const transformer = remarkInsertFrontmatter.call(unified()) as unknown as (
    tree: object,
  ) => void;

  const getFrontmatterValue = (tree: { children: unknown[] }): string =>
    (tree.children[0] as { value: string }).value;

  test("inserts a frontmatter html node at the beginning of the tree", () => {
    const tree = { type: "root" as const, children: [] };

    transformer(tree);

    expect(tree.children[0]).toMatchObject({ type: "html" });
    expect(getFrontmatterValue(tree)).toMatch(
      /^---\ntitle: .*\ntoken_count:\n---$/,
    );
  });

  test("extracts the page title from the first h1 heading", () => {
    const tree = {
      type: "root" as const,
      children: [
        {
          type: "heading" as const,
          depth: 1 as const,
          children: [{ type: "text" as const, value: "Page Title" }],
        },
      ],
    };

    transformer(tree);

    expect(getFrontmatterValue(tree)).toContain("title: Page Title");
    expect(tree.children[1]).toMatchObject({ type: "heading" });
  });

  test("leaves token_count empty so the add-token-counts script can populate it", () => {
    const tree = {
      type: "root" as const,
      children: [
        {
          type: "paragraph" as const,
          children: [{ type: "text" as const, value: "Some content here." }],
        },
      ],
    };

    transformer(tree);

    expect(getFrontmatterValue(tree)).toContain("token_count:\n");
  });
});
