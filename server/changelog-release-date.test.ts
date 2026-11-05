import { describe, expect, test } from "@jest/globals";
import {
  majorFromVersionName,
  parseChangelogReleaseDate,
} from "./changelog-release-date";

const now = new Date("2026-11-05T12:00:00Z");

describe("parseChangelogReleaseDate", () => {
  test("returns the newest release date for the major version", () => {
    const changelog = [
      "# Changelog",
      "",
      "## 18.11.0 (08/25/26)",
      "",
      "Notes.",
      "",
      "## 18.10.7 (08/19/26)",
    ].join("\n");
    expect(parseChangelogReleaseDate(changelog, "18", now)).toBe(
      "2026-08-25T00:00:00.000Z",
    );
  });

  test("ignores other major versions", () => {
    // The master branch changelog lists 18.x releases below the 19.0.0 entry.
    const changelog = ["## 19.0.0 (xx/xx/26)", "## 18.5.0 (12/04/25)"].join(
      "\n",
    );
    expect(parseChangelogReleaseDate(changelog, "19", now)).toBeUndefined();
  });

  test("ignores placeholder, impossible, and future dates", () => {
    const changelog = [
      "## 17.7.28 (08/19/27)", // future (typo)
      "## 17.7.27 (02/30/26)", // impossible
      "## 17.7.26 (06/xx/26)", // placeholder
      "## 17.7.25 (06/09/26)",
    ].join("\n");
    expect(parseChangelogReleaseDate(changelog, "17", now)).toBe(
      "2026-06-09T00:00:00.000Z",
    );
  });

  test("uses the newest date regardless of heading order", () => {
    const changelog = ["## 16.5.1 (01/02/25)", "## 16.5.2 (03/04/25)"].join(
      "\n",
    );
    expect(parseChangelogReleaseDate(changelog, "16", now)).toBe(
      "2025-03-04T00:00:00.000Z",
    );
  });

  test("accepts four-digit years and v-prefixed versions", () => {
    expect(
      parseChangelogReleaseDate("## v15.4.0 (10/10/2024)", "15", now),
    ).toBe("2024-10-10T00:00:00.000Z");
  });

  test("ignores headings without dates", () => {
    const changelog = ["## 16.0.0", "## VNet for SSH", "## 16.0"].join("\n");
    expect(parseChangelogReleaseDate(changelog, "16", now)).toBeUndefined();
  });
});

describe("majorFromVersionName", () => {
  test.each([
    ["18.x", "18"],
    ["current", undefined],
    ["18", undefined],
  ])("%s -> %s", (version, expected) => {
    expect(majorFromVersionName(version)).toBe(expected);
  });
});
