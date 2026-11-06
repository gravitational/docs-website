import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { ParseFrontMatter } from "@docusaurus/types";
import { fetchVideoMeta } from "./youtube-meta";

const execFileAsync = promisify(execFile);

const SITE_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// The sources of each version are in content/<version>/docs/pages. Released
// versions are built from versioned_docs/version-<version>, the unreleased
// version (the one without such a folder) from docs/.
const { versions }: { versions: { name: string }[] } = JSON.parse(
  fs.readFileSync(path.join(SITE_DIR, "config.json"), "utf8"),
);
const FOLDERS = versions.map(({ name }) => {
  const versioned = path.join(SITE_DIR, "versioned_docs", `version-${name}`);
  return {
    siteDir: fs.existsSync(versioned) ? versioned : path.join(SITE_DIR, "docs"),
    repoDir: path.join(SITE_DIR, "content", name),
  };
});

// Date of the last commit that touched the doc's source file.
async function getLastModified(filePath: string) {
  for (const { siteDir, repoDir } of FOLDERS) {
    const relativePath = path.relative(siteDir, filePath);
    if (relativePath.startsWith("..")) continue;
    const { stdout } = await execFileAsync(
      "git",
      [
        "log",
        "-1",
        "--format=%cI",
        "--",
        path.join("docs/pages", relativePath),
      ],
      { cwd: repoDir },
    );
    return stdout.trim() || undefined;
  }
}

const lastModified = new Map<string, Promise<string | undefined>>();

export const parseFrontMatter: ParseFrontMatter = async (params) => {
  const result = await params.defaultParseFrontMatter(params);

  // If we have videoBanner file in config, we load this vide data through YouTube API.
  const { videoBanner, videoBannerDescription } = result.frontMatter;
  if (typeof videoBanner === "string") {
    const videoBannerData = await fetchVideoMeta(videoBanner);
    if (videoBannerDescription) {
      videoBannerData.description = videoBannerDescription as string;
    }
    result.frontMatter.videoBanner = videoBannerData;
  }

  if (!lastModified.has(params.filePath)) {
    lastModified.set(params.filePath, getLastModified(params.filePath));
  }
  const date = await lastModified.get(params.filePath);
  if (date) {
    result.frontMatter.last_update = { date };
  }

  return result;
};
