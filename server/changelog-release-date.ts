// Derives a version-level release date from a Teleport CHANGELOG.md. Used as a
// dateModified fallback for JSON-LD structured data, since production builds
// extract content from GitHub tarballs that carry no per-file git history.
import { existsSync, readFileSync } from "fs";
import { join } from "path";

// Matches release headings such as "## 18.11.0 (08/25/26)". Placeholders for
// unreleased versions, like "(xx/xx/26)", do not match and are skipped.
const RELEASE_HEADING =
  /^##\s+v?(\d+)\.\d+\.\d+\S*\s+\((\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\)/gm;

/**
 * Returns the newest release date (ISO 8601, UTC midnight) for the given major
 * version from CHANGELOG.md content.
 *
 * - Only headings for that major version count, so 18.x entries in the master
 *   branch changelog are not attributed to 19.x docs.
 * - Dates are MM/DD/YY (or MM/DD/YYYY). Impossible dates are ignored.
 * - Dates after `now` are ignored: they are typos or planned release dates.
 */
export function parseChangelogReleaseDate(
  changelog: string,
  major: string,
  now: Date = new Date(),
): string | undefined {
  let newest: number | undefined;

  for (const [, headingMajor, mm, dd, yy] of changelog.matchAll(
    RELEASE_HEADING,
  )) {
    if (headingMajor !== major) continue;

    const year = yy.length === 2 ? 2000 + Number(yy) : Number(yy);
    const month = Number(mm) - 1;
    const day = Number(dd);
    const time = Date.UTC(year, month, day);
    const date = new Date(time);
    const isRealDate =
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month &&
      date.getUTCDate() === day;
    if (!isRealDate || time > now.getTime()) continue;

    if (newest === undefined || time > newest) newest = time;
  }

  return newest === undefined ? undefined : new Date(newest).toISOString();
}

/** Extracts the major version from a content version name, e.g. "18.x". */
export const majorFromVersionName = (version: string): string | undefined =>
  /^(\d+)\.x$/.exec(version)?.[1];

/**
 * Reads the newest release date for a content version from
 * content/<version>/CHANGELOG.md. Returns undefined if the changelog is
 * missing or has no usable release headings for that version.
 */
export function readChangelogReleaseDate(
  contentRoot: string,
  version: string,
  now: Date = new Date(),
): string | undefined {
  const major = majorFromVersionName(version);
  const changelogPath = join(contentRoot, "CHANGELOG.md");
  if (!major || !existsSync(changelogPath)) return undefined;

  return parseChangelogReleaseDate(
    readFileSync(changelogPath, "utf8"),
    major,
    now,
  );
}
