import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { glob } from "glob";
import { estimateTokenCount } from "tokenx";

const BUILD_DIR = "build";

const files = await glob("**/*.md", { cwd: BUILD_DIR });

let pagesCount = 0;

try {
  await Promise.all(
    files.map(async (file) => {
      const fullPath = join(BUILD_DIR, file);
      const content = await readFile(fullPath, "utf-8");

      if (!content.startsWith("---\n") || !content.includes("token_count:")) {
        return;
      }

      const tokens = estimateTokenCount(content) + 1; // Add 1 to include the token_count value itself
      const updated = content.replace(
        /^token_count:.*$/m,
        `token_count: ${tokens}`,
      );

      if (updated !== content) {
        await writeFile(fullPath, updated, "utf-8");
        pagesCount++;
      }
    }),
  );

  console.log(`Inserted token counts for ${pagesCount} Markdown pages.`);
} catch (error: Error | unknown) {
  const YELLOW = "\x1b[33m";
  const RESET = "\x1b[0m";
  if (error instanceof Error) {
    console.log(
      `${YELLOW}[WARNING]${RESET} Failed inserting page token counts:`,
      error.message,
    );
  } else {
    console.log(
      `${YELLOW}[WARNING]${RESET} Failed inserting page token counts:`,
      error,
    );
  }
}
