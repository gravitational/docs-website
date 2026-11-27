import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "@jest/globals";

const css = readFileSync(
  join(process.cwd(), "src/theme/DocSidebarItem/Link/tag.module.css"),
  "utf8",
);

// A tagged sidebar row uses ::before for the pill and ::after for the caret.
// row-reverse puts that caret on the left, so the row looks like a child.
describe("tagged sidebar item", () => {
  test("keeps the caret on the right", () => {
    expect(css).not.toMatch(/flex-direction:\s*row-reverse/);
    expect(css).toMatch(/flex-direction:\s*row\b/);
    expect(css).toMatch(/&::after\s*\{[^}]*margin-left:\s*auto/);
  });
});
