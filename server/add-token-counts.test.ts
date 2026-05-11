import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { mkdtemp, writeFile, readFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import addTokenCounts from "./add-token-counts";

let tempFolder: string;
let buildFolder: string;
const originalCwd = process.cwd();

// Create a fresh temp build folder before each test. This allows testing the addTokenCounts plugin in isolation
// by simulating the post-build environment with generated markdown files containing frontmatter.
beforeEach(async () => {
  tempFolder = await mkdtemp(join(tmpdir(), "add-token-counts-"));
  buildFolder = join(tempFolder, "build");
  await mkdir(buildFolder);
  process.chdir(tempFolder);
});

// Clean up after each test.
afterEach(async () => {
  process.chdir(originalCwd);
  await rm(tempFolder, { recursive: true });
});

const writeToMarkdown = (name: string, content: string) =>
  writeFile(join(buildFolder, name), content, "utf-8");

const readFromMarkdown = (name: string) =>
  readFile(join(buildFolder, name), "utf-8");

describe("addTokenCounts", () => {
  it("skips files without frontmatter in the start", async () => {
    const content = "# No frontmatter here";
    await writeToMarkdown("page.md", content);

    await addTokenCounts().postBuild();

    expect(await readFromMarkdown("page.md")).toBe(content);
  });

  it("skips files without a token_count field in the frontmatter", async () => {
    const content = "---\ntitle: My Page\n---\n# Content";
    await writeToMarkdown("page.md", content);

    await addTokenCounts().postBuild();

    expect(await readFromMarkdown("page.md")).toBe(content);
  });

  it("updates the token_count value in files with a valid frontmatter block", async () => {
    await writeToMarkdown(
      "page.md",
      "---\ntitle: My Page\ntoken_count:\n---\n# Content",
    );

    await addTokenCounts().postBuild();

    const result = await readFromMarkdown("page.md");
    expect(result).toMatch(/^token_count: \d+$/m);
    expect(result).not.toMatch(/^token_count: 0$/m);
  });

  it("processes multiple files", async () => {
    await writeToMarkdown("a.md", "---\ntoken_count: 0\n---\nFile one");
    await writeToMarkdown("b.md", "---\ntoken_count: 0\n---\nFile two");

    await addTokenCounts().postBuild();

    expect(await readFromMarkdown("a.md")).toMatch(/^token_count: \d+$/m);
    expect(await readFromMarkdown("b.md")).toMatch(/^token_count: \d+$/m);
  });
});
