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
  it("inserts the token_count value to each markdown file", async () => {
    await writeToMarkdown("page.md", "# Content");

    await addTokenCounts().postBuild();

    const result = await readFromMarkdown("page.md");
    expect(result).toMatch(/^\{"token_count": \d+\}/m);
    expect(result).not.toMatch(/^\{"token_count": 0\}/m);
  });

  it("processes multiple files", async () => {
    await writeToMarkdown("a.md", "# File one");
    await writeToMarkdown("b.md", "# File two");

    await addTokenCounts().postBuild();

    expect(await readFromMarkdown("a.md")).toMatch(/^\{"token_count": \d+\}/m);
    expect(await readFromMarkdown("b.md")).toMatch(/^\{"token_count": \d+\}/m);
  });
});
