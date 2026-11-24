import { VFile } from "vfile";
import { remark } from "remark";
import remarkMdx from "remark-mdx";
import remarkGFM from "remark-gfm";
import remarkIncludes from "../server/remark-includes";
import { updatePathsInIncludesTests } from "../server/asset-path-helpers";
import { describe, expect, test } from "@jest/globals";

function render(value: string): string {
  const file = new VFile({
    value,
    path: "/content/4.0/docs/pages/filename.mdx",
  });
  return remark()
    .use(remarkMdx as any)
    .use(remarkGFM)
    .use(remarkIncludes as any, {
      rootDir: "server/fixtures/includes/",
      resolve: true,
      updatePaths: updatePathsInIncludesTests,
    })
    .processSync(file as any)
    .toString();
}

describe("nested partials", () => {
  test("a partial that starts with a partial renders the inner body", () => {
    const result = render("(!nested-outer-starts.mdx!)\n");
    expect(result).toContain("The nested body is visible.");
    expect(result).toContain("Teleport uses the nested note.");
    expect(result).not.toContain("(!nested-inner.mdx!)");
  });

  test("a partial inside a TabItem renders the inner body", () => {
    const result = render("(!nested-outer-tab.mdx!)\n");
    expect(result).toContain("The nested body is visible.");
    expect(result).not.toContain("(!nested-inner.mdx!)");
  });

  test("a partial that includes itself does not recurse forever", () => {
    const result = render("(!nested-cycle.mdx!)\n");
    expect(result).toContain("(!nested-cycle.mdx!)");
  });
});
